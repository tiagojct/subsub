/**
 * Sub-Sub: a Zotero librarian and research assistant for pi.
 *
 * - Two modes: the Librarian manages the library (Zotero tools only); the
 *   Researcher does the same and also searches PubMed, Europe PMC and OpenAlex
 *   and writes notes. Each mode can have its own model.
 * - An approval gate: every library change is previewed by the server (dry run)
 *   and shown to the user; nothing is applied without a yes.
 * - Profiles (reader, scholar, author, editor) set what Sub-Sub writes and which
 *   tools it offers; /profile changes it.
 * - Commands: /librarian, /researcher, /profile, /subsub, /history, /undo.
 * - Add-on: with "addons": ["starbuck"], Starbuck runs as a third server
 *   ("verify") for reference checks.
 *
 * The Python servers start in session_start (not in the factory) and stop in
 * session_shutdown. Tools are registered once and use the current bridge.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Bridge, type ServerSpec } from "./bridge.ts";
import {
	expand,
	findUv,
	isProfile,
	loadConfig,
	parseEnvFile,
	type Profile,
	type Mode,
	saveConfig,
	serverCommand,
	starbuckCommand,
	starbuckEnabled,
	type SubsubConfig,
	who,
} from "./config.ts";
import { profileList, profileSpec, promptBlocked } from "./profiles.ts";
import { coerceArgs, loosenArrays, resolvePathArgs } from "./args.ts";
import { applyEdits, checkLiteratureNote } from "./notes.ts";
import { buildPolicy, judgePath, normalizeToolPath, realish, within } from "./paths.ts";
import { describeArgs, formatPreview } from "./preview.ts";
import { headerLines, type LibraryState, paintPreview, QUOTES, type Scheme, schemeFromAnsi, themeName } from "./look.ts";
import { systemAddition } from "./prompt.ts";
import { gateKind, SERVER_PREFIXES, toolsFor, unavailableReason } from "./roles.ts";

const MODE_ENTRY = "subsub-mode";

export interface SubsubDeps {
	config?: SubsubConfig;
	/** A ready bridge (tests). When given, Sub-Sub does not start or stop servers. */
	bridge?: Bridge;
	specs?: ServerSpec[];
}

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const BENCH_ENTRY = "subsub-bench";

function ownVersion(): string {
	try {
		return JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")).version ?? "";
	} catch {
		return "";
	}
}

export { findUv };

export function serverSpecs(cfg: SubsubConfig, processEnv: NodeJS.ProcessEnv = process.env): ServerSpec[] {
	const env: Record<string, string> = cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {};
	const specs: ServerSpec[] = [
		{ name: "zotero", ...serverCommand(cfg, "zotero-local-mcp", [], processEnv), env },
		{ name: "scholar", ...serverCommand(cfg, "zotero-scholar-mcp", [], processEnv), env },
	];
	if (starbuckEnabled(cfg)) specs.push({ name: "verify", ...starbuckCommand(cfg, processEnv), env: starbuckEnv(cfg, processEnv) });
	return specs;
}

/**
 * Starbuck reads its contact address and API keys from the environment. Sub-Sub keeps
 * them in the zotero-local-mcp env file, so they are passed on (the environment wins).
 */
export function starbuckEnv(cfg: Pick<SubsubConfig, "envFile">, processEnv: NodeJS.ProcessEnv = process.env): Record<string, string> {
	const file = cfg.envFile ? parseEnvFile(cfg.envFile) : {};
	const out: Record<string, string> = {};
	const email = processEnv.STARBUCK_EMAIL || file.STARBUCK_EMAIL || processEnv.ZOTERO_CONTACT_EMAIL || file.ZOTERO_CONTACT_EMAIL;
	if (email) out.STARBUCK_EMAIL = email;
	for (const key of ["NCBI_API_KEY", "OPENALEX_API_KEY"]) {
		const v = processEnv[key] || file[key];
		if (v) out[key] = v;
	}
	return out;
}

export async function createSubsub(pi: ExtensionAPI, deps: SubsubDeps = {}): Promise<void> {
	const cfg = deps.config ?? loadConfig();
	let bridge: Bridge | undefined = deps.bridge;
	const toolNames = new Set<string>();
	/** Original input schemas, to turn "[...]" strings back into lists. */
	const schemas = new Map<string, Record<string, unknown>>();

	function current(): Bridge {
		if (!bridge) throw new Error("The Zotero servers are not running. Try /reload.");
		return bridge;
	}

	function registerTools(b: Bridge): void {
		for (const t of b.tools) {
			if (toolNames.has(t.fullName)) continue;
			toolNames.add(t.fullName);
			schemas.set(t.fullName, t.inputSchema as Record<string, unknown>);
			pi.registerTool({
				name: t.fullName,
				label: `${t.server} ${t.name}`,
				description: t.description,
				parameters: loosenArrays(t.inputSchema as Record<string, unknown>) as never,
				// One at a time, so a preview always sees the effect of earlier calls in the same message.
				executionMode: "sequential",
				async execute(_id, params, signal) {
					const args = coerceArgs(t.inputSchema as Record<string, unknown>, { ...((params ?? {}) as Record<string, unknown>) });
					const res = await current().call(t.fullName, args, signal);
					if (res.isError) throw new Error(res.text || `${t.fullName} failed`);
					return { content: [{ type: "text", text: res.text }], details: { tool: t.fullName } };
				},
			});
		}
	}

	if (deps.bridge) registerTools(deps.bridge);

	pi.registerFlag("librarian", { description: "Start Sub-Sub in the Librarian mode", type: "boolean", default: false });

	let mode: Mode = cfg.defaultMode;
	const benchRun = Boolean(process.env.SUBSUB_BENCH_OUT);
	const toolOpts = () => ({ profile, bench: benchRun });
	let profile: Profile = cfg.profile;
	const user = who(cfg);
	/** True when started with the `subsub` command (not as a package inside plain pi). */
	const standalone = process.env.SUBSUB_CLI === "1";
	const registered = () => pi.getAllTools().map((t) => t.name);

	// ---- look (only for the `subsub` command in the terminal UI)
	let scheme: Scheme | undefined;
	let modelId = "no model";
	let headerTui: { requestRender(force?: boolean): void } | undefined;
	const library: LibraryState = { zotero: "checking" };
	const quote = cfg.quotes === false ? undefined : QUOTES[Math.floor(Math.random() * QUOTES.length)];
	const lookOn = (ctx: ExtensionContext) => standalone && cfg.look !== false && ctx.mode === "tui";
	/** True under `subsub web`: pi runs in RPC mode and the web view shows the state that the terminal header shows. */
	const webView = process.env.SUBSUB_WEB === "1";
	let webCtx: ExtensionContext | undefined;
	function emitWeb(): void {
		const ctx = webCtx;
		if (!webView || !ctx || ctx.mode !== "rpc") return;
		const down = bridge ? Object.keys(bridge.errors) : ["zotero", "scholar"];
		const state = {
			mode,
			profile,
			profileLabel: profileSpec(profile).label,
			model: ctx.model ? { provider: ctx.model.provider, id: ctx.model.id } : null,
			down,
			library,
			language: cfg.language,
			userName: cfg.userName ?? null,
			vault: cfg.vault ?? null,
			starbuck: starbuckEnabled(cfg),
		};
		try {
			ctx.ui.setStatus("subsub.web", JSON.stringify(state));
		} catch {
			/* the context is gone after shutdown */
		}
	}

	function applyTheme(ctx: ExtensionContext): void {
		if (!lookOn(ctx) || cfg.themes === false) return;
		scheme ??= schemeFromAnsi(ctx.ui.theme.getFgAnsi("text"), ctx.ui.theme.name);
		const name = themeName(scheme, cfg.themes || undefined);
		const theme = name ? ctx.ui.getTheme(name) : undefined;
		// A Theme object (not a name) changes the theme for this run only; the saved setting stays.
		if (theme) ctx.ui.setTheme(theme);
	}

	function paintFor(ctx: ExtensionContext) {
		return (text: string) =>
			ctx.mode === "tui"
				? paintPreview(
						text,
						(x) => ctx.ui.theme.fg("success", x),
						(x) => ctx.ui.theme.fg("error", x),
						(x) => ctx.ui.theme.fg("text", x),
					)
				: text;
	}

	async function refreshLibrary(): Promise<void> {
		try {
			const st = await current().call("zotero_status", {});
			const d = (st.data ?? {}) as Record<string, unknown>;
			if (d.zotero !== "reachable") {
				Object.assign(library, { zotero: "down", error: String(d.error ?? "") });
			} else {
				const ov = await current().call("zotero_library_overview", {});
				const o = (ov.data ?? {}) as Record<string, unknown>;
				Object.assign(library, { zotero: "reachable", items: o.items as number, toReview: o.awaiting_review as number });
			}
		} catch {
			library.zotero = "down";
		}
		headerTui?.requestRender();
		emitWeb();
	}

	function setHeader(ctx: ExtensionContext): void {
		if (!lookOn(ctx)) return;
		const version = ownVersion();
		ctx.ui.setHeader((tui) => {
			headerTui = tui;
			return {
				render: (width: number) => {
					const th = ctx.ui.theme;
					return headerLines({
						version,
						mode,
						profile: profileSpec(profile).label,
						model: modelId,
						library,
						quote,
						width,
						paint: {
							mark: (x) => th.fg("accent", x),
							text: (x) => th.fg("text", x),
							muted: (x) => th.fg("muted", x),
							dim: (x) => th.fg("dim", x),
							warn: (x) => th.fg("warning", x),
						},
					});
				},
				invalidate() {},
			};
		});
	}

	function status(ctx: ExtensionContext): void {
		modelId = ctx.model ? `${ctx.model.id}` : "no model";
		const down = bridge ? Object.keys(bridge.errors) : ["zotero", "scholar"];
		ctx.ui.setStatus("subsub", `Sub-Sub: ${mode} | ${profileSpec(profile).label} | ${modelId}${down.length ? ` | not running: ${down.join(", ")}` : ""}`);
		if (standalone) ctx.ui.setTitle(`Sub-Sub: ${mode}`);
		headerTui?.requestRender();
		webCtx = ctx;
		emitWeb();
	}

	async function applyMode(ctx: ExtensionContext, next: Mode, remember: boolean): Promise<void> {
		mode = next;
		pi.setActiveTools(toolsFor(mode, registered(), toolOpts()));
		const spec = cfg.models[mode];
		if (spec) {
			const i = spec.indexOf("/");
			const model = i > 0 ? ctx.modelRegistry.find(spec.slice(0, i), spec.slice(i + 1)) : undefined;
			const ok = model ? await pi.setModel(model) : false;
			if (!ok) ctx.ui.notify(`Sub-Sub: cannot use ${spec} (unknown model or no key); keeping the current model.`, "warning");
		}
		if (remember) pi.appendEntry(MODE_ENTRY, { mode });
		status(ctx);
	}

	pi.on("session_start", async (_event, ctx) => {
		if (!bridge) {
			const b = new Bridge();
			await b.start(deps.specs ?? serverSpecs(cfg), cfg.startTimeout * 1000);
			bridge = b;
			registerTools(b);
		}
		let restored: Mode | undefined;
		for (const e of ctx.sessionManager.getBranch() as Array<{ customType?: string; data?: { mode?: unknown } }>) {
			const m = e.customType === MODE_ENTRY ? e.data?.mode : undefined;
			if (m === "librarian" || m === "researcher") restored = m;
		}
		// Judge light or dark before Sub-Sub changes the theme.
		if (lookOn(ctx)) scheme ??= schemeFromAnsi(ctx.ui.theme.getFgAnsi("text"), ctx.ui.theme.name);
		applyTheme(ctx);
		await applyMode(ctx, restored ?? (pi.getFlag("librarian") ? "librarian" : cfg.defaultMode), false);
		if (lookOn(ctx)) {
			setHeader(ctx);
			void refreshLibrary();
		} else if (webView) {
			void refreshLibrary();
		}
		for (const [name, err] of Object.entries(bridge.errors)) {
			ctx.ui.notify(`Sub-Sub: the ${name} server did not start: ${err.split("\n")[0]}`, "error");
		}
	});

	pi.on("session_shutdown", async () => {
		if (deps.bridge) return;
		const b = bridge;
		bridge = undefined;
		await b?.close();
	});

	pi.on("model_select", async (_event, ctx) => status(ctx));

	// Prompt commands that the profile does not run (/lit for Reader, /review for Reader and Scholar).
	// The input event comes before pi expands a prompt template.
	pi.on("input", async (event, ctx) => {
		const why = promptBlocked(event.text, profile);
		if (!why) return { action: "continue" };
		ctx.ui.notify(`Sub-Sub: ${why}`, "warning");
		return { action: "handled" };
	});

	pi.on("before_agent_start", async (event, ctx) => ({
		systemPrompt: `${event.systemPrompt}\n\n${systemAddition(mode, { ...cfg, profile }, ctx.cwd)}`,
	}));

	/** Model test (subsub-bench): record every change instead of asking, and apply none. */
	const benchOut = process.env.SUBSUB_BENCH_OUT ? expand(process.env.SUBSUB_BENCH_OUT) : undefined;
	const record = (data: Record<string, unknown>) => pi.appendEntry(BENCH_ENTRY, data);

	pi.on("tool_call", async (event, ctx) => {
		const name = event.toolName;
		const input = (event.input ?? {}) as Record<string, unknown>;
		// Previews and the real call must see the same, repaired arguments.
		const schema = schemas.get(name);
		if (schema) coerceArgs(schema, input);
		resolvePathArgs(name, input, (p) => normalizeToolPath(p, ctx.cwd));
		if (SERVER_PREFIXES.some((p) => name.startsWith(p))) {
			const why = unavailableReason(name, mode, registered(), toolOpts());
			if (why) {
				if (benchOut) record({ kind: "wrong_mode", tool: name, input });
				return { block: true, reason: why };
			}
		}
		if (name.startsWith("verify_")) return verifyGate(name, input, ctx);
		const kind = benchOut && name === "scholar_queue_imports" ? "confirm" : gateKind(name, input);
		if (!kind) return undefined;
		if (benchOut) return benchGate(name, input, kind, ctx.cwd, ctx.signal);
		if (kind === "path") {
			const target = normalizeToolPath(String(input.path ?? ""), ctx.cwd);
			const noteProblem = literatureNoteProblem(name, target, input);
			if (noteProblem) return { block: true, reason: noteProblem };
			const verdict = judgePath(target, buildPolicy({ vault: cfg.vault, cwd: ctx.cwd, serverDir: cfg.serverDir, packageDir: PACKAGE_DIR }));
			if (verdict.ok) return undefined;
			if (!ctx.hasUI) return { block: true, reason: `Writing ${target} needs ${user}'s approval: ${verdict.why}.` };
			const ok = await ctx.ui.confirm(`Sub-Sub: ${name} ${target}?`, `Asking because ${verdict.why}.`);
			return ok ? undefined : { block: true, reason: `${user} did not allow writing to that file.` };
		}
		if (!ctx.hasUI) {
			return { block: true, reason: `Library changes need ${user}'s approval, which needs an interactive session.` };
		}
		if (kind === "confirm") {
			const ok = await ctx.ui.confirm(`Sub-Sub: run ${name}?`, describeArgs(input));
			return ok ? undefined : { block: true, reason: `${user} did not approve. Ask what to change.` };
		}
		// kind === "preview": the server computes the change first, then the user decides.
		// Normalise dry_run so that what runs is exactly what was previewed and approved.
		input.dry_run = false;
		let preview;
		try {
			preview = await current().call(name, { ...input, dry_run: true }, ctx.signal);
		} catch (err) {
			return { block: true, reason: `Preview failed: ${(err as Error).message}` };
		}
		if (preview.isError) return { block: true, reason: preview.text };
		const ok = await ctx.ui.confirm(
			`Sub-Sub: apply ${name.replace(/^(zotero|scholar)_/, "")}?`,
			paintFor(ctx)(formatPreview(name, preview.data ?? preview.text)),
		);
		return ok ? undefined : { block: true, reason: `${user} did not approve this change. Ask what to change; do not retry the same call.` };
	});

	/** A literature note (front matter with a citekey) must state its evidence; see notes.ts. */
	function literatureNoteProblem(name: string, target: string, input: Record<string, unknown>): string | undefined {
		if (!target.toLowerCase().endsWith(".md")) return undefined;
		if (name === "write") return checkLiteratureNote(String(input.content ?? ""));
		if (name === "edit" && Array.isArray(input.edits) && existsSync(target)) {
			const current = readFileSync(target, "utf8");
			return checkLiteratureNote(applyEdits(current, input.edits as Array<{ oldText?: unknown; newText?: unknown }>));
		}
		return undefined;
	}

	/**
	 * Starbuck writes its reports into a folder: report_dir, or _starbuck next to the
	 * manuscript. Inside the vault or the working folder that needs no approval; elsewhere
	 * Sub-Sub asks, as for any file write. record_claims gets the current model's name.
	 */
	async function verifyGate(name: string, input: Record<string, unknown>, ctx: ExtensionContext) {
		if (name === "verify_record_claims") {
			input.judged_by = ctx.model ? [ctx.model.provider, ctx.model.id].filter(Boolean).join("/") : "the agent's model";
		}
		if (name === "verify_check_references") return undefined;
		const dir = input.report_dir
			? normalizeToolPath(String(input.report_dir), ctx.cwd)
			: input.path
				? join(dirname(normalizeToolPath(String(input.path), ctx.cwd)), "_starbuck")
				: undefined;
		if (!dir) return undefined;
		const verdict = judgePath(dir, buildPolicy({ vault: cfg.vault, cwd: ctx.cwd, serverDir: cfg.serverDir, packageDir: PACKAGE_DIR }));
		if (verdict.ok) return undefined;
		if (benchOut) {
			record({ kind: "path_blocked", tool: name, path: dir });
			return { block: true, reason: `Model test: Starbuck reports only inside the vault or ${benchOut}.` };
		}
		if (!ctx.hasUI) return { block: true, reason: `Writing a Starbuck report to ${dir} needs ${user}'s approval: ${verdict.why}.` };
		const ok = await ctx.ui.confirm(`Sub-Sub: write the Starbuck report to ${dir}?`, `Asking because ${verdict.why}.`);
		return ok ? undefined : { block: true, reason: `${user} did not allow writing the report there. Ask where to put it (report_dir).` };
	}

	async function benchGate(name: string, input: Record<string, unknown>, kind: string, cwd: string, signal?: AbortSignal) {
		if (kind === "path") {
			const target = normalizeToolPath(String(input.path ?? ""), cwd);
			const noteProblem = literatureNoteProblem(name, target, input);
			if (noteProblem) {
				record({ kind: "note_blocked", tool: name, path: target, reason: noteProblem });
				return { block: true, reason: noteProblem };
			}
			if (within(target, realish(benchOut!))) return undefined;
			record({ kind: "path_blocked", tool: name, path: target });
			return { block: true, reason: `Model test: write only inside ${benchOut}.` };
		}
		let preview: unknown;
		if (kind === "preview") {
			try {
				const p = await current().call(name, { ...input, dry_run: true }, signal);
				preview = p.isError ? { error: p.text } : (p.data ?? p.text);
			} catch (err) {
				preview = { error: (err as Error).message };
			}
		}
		record({ kind: "change", tool: name, input, preview });
		const shown = preview === undefined ? "" : ` What the change would do (server preview): ${JSON.stringify(preview).slice(0, 4000)}`;
		return {
			block: true,
			reason:
				"Model test: this change was recorded and not applied. Continue as if it had been applied: make any other " +
				"changes the task needs, do not repeat this call, do not ask for approval, and finish with a short summary " +
				`for ${user}.${shown}`,
		};
	}

	pi.registerCommand("librarian", {
		description: "Sub-Sub: switch to the Librarian (manages the library: tags, imports, metadata, PDFs)",
		handler: async (_args, ctx) => {
			await applyMode(ctx, "librarian", true);
			ctx.ui.notify("Sub-Sub: Librarian mode. For searches and notes, switch to /researcher.", "info");
		},
	});

	pi.registerCommand("researcher", {
		description: "Sub-Sub: switch to the Researcher (searches, notes, reviews, and everything the Librarian does)",
		handler: async (_args, ctx) => {
			await applyMode(ctx, "researcher", true);
			ctx.ui.notify("Sub-Sub: Researcher mode. It searches, writes notes and also changes the library, with a preview.", "info");
		},
	});

	pi.registerCommand("profile", {
		description: "Sub-Sub: show or change the profile (reader, scholar, author, editor)",
		handler: async (args, ctx) => {
			const want = args.trim().toLowerCase();
			if (!want) {
				ctx.ui.notify(`Profile: ${profileSpec(profile).label}. To change it, type /profile <name>.\n${profileList(profile)}`, "info");
				return;
			}
			if (!isProfile(want)) {
				ctx.ui.notify(`Unknown profile "${want}". Choose one of:\n${profileList(profile)}`, "warning");
				return;
			}
			profile = want;
			let saved = "";
			try {
				saved = ` Saved in ${saveConfig({ profile })}.`;
			} catch (err) {
				saved = ` Not saved: ${(err as Error).message}`;
			}
			await applyMode(ctx, mode, false);
			ctx.ui.notify(`Sub-Sub: ${profileSpec(profile).label} profile (${profileSpec(profile).summary}).${saved}`, "info");
		},
	});

	pi.registerCommand("subsub", {
		description: "Sub-Sub: Zotero connection and library overview",
		handler: async (_args, ctx) => {
			const lines = [`Mode: ${mode}. Profile: ${profileSpec(profile).label}. Model: ${ctx.model?.id ?? "none"}.`];
			if (!bridge) {
				ctx.ui.notify(`${lines[0]}\nThe Zotero servers are not running. Try /reload.`, "warning");
				return;
			}
			for (const [name, err] of Object.entries(bridge.errors)) lines.push(`${name} server not running: ${err.split("\n")[0]}`);
			if (bridge.has("zotero_status")) {
				const st = await bridge.call("zotero_status", {});
				const d = (st.data ?? {}) as Record<string, unknown>;
				lines.push(`Zotero: ${d.zotero ?? "?"}${d.error ? ` (${d.error})` : ""}. Write key remembered: ${d.write_key_remembered ?? "?"}.`);
				library.zotero = d.zotero === "reachable" ? "reachable" : "down";
				if (d.zotero === "reachable") {
					const ov = await bridge.call("zotero_library_overview", {});
					const o = (ov.data ?? {}) as Record<string, unknown>;
					if (!ov.isError) Object.assign(library, { items: o.items as number, toReview: o.awaiting_review as number });
					lines.push(
						ov.isError
							? ov.text
							: `Items: ${o.items}. Without tags: ${o.without_manual_tags}. Missing facets: ${JSON.stringify(o.missing_facet)}. Awaiting review (_agent): ${o.awaiting_review}.`,
					);
				}
			}
			headerTui?.requestRender();
			emitWeb();
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("subsub-refresh", {
		description: "Sub-Sub: refresh the library counts shown in the web view",
		handler: async (_args, ctx) => {
			webCtx = ctx;
			await refreshLibrary();
		},
	});

	pi.registerCommand("history", {
		description: "Sub-Sub: recent library changes",
		handler: async (_args, ctx) => {
			let res;
			try {
				res = await current().call("zotero_history", { limit: 10 });
			} catch (err) {
				ctx.ui.notify((err as Error).message, "warning");
				return;
			}
			if (res.isError) {
				ctx.ui.notify(res.text, "warning");
				return;
			}
			const rows = (res.data as Array<Record<string, unknown>>) ?? [];
			const text = rows.length
				? rows.map((r) => `${r.id}  ${r.op}  ${r.items} item(s)${r.fully_undone ? "  (undone)" : ""}`).join("\n")
				: "No changes yet.";
			ctx.ui.notify(text, "info");
		},
	});

	pi.registerCommand("undo", {
		description: "Sub-Sub: revert the last library change (asks first)",
		handler: async (args, ctx) => {
			const input: Record<string, unknown> = args.trim() ? { journal_id: args.trim() } : {};
			let preview;
			try {
				preview = await current().call("zotero_undo", { ...input, dry_run: true });
			} catch (err) {
				ctx.ui.notify((err as Error).message, "warning");
				return;
			}
			if (preview.isError) {
				ctx.ui.notify(preview.text, "warning");
				return;
			}
			const ok = await ctx.ui.confirm("Sub-Sub: undo?", paintFor(ctx)(formatPreview("zotero_undo", preview.data)));
			if (!ok) return;
			const res = await current().call("zotero_undo", { ...input, dry_run: false });
			const d = (res.data ?? {}) as Record<string, unknown>;
			ctx.ui.notify(res.isError ? res.text : `Undone: ${d.applied} item(s).`, res.isError ? "error" : "info");
		},
	});
}

