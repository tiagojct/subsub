/**
 * Sub-Sub: a Zotero librarian and research assistant for pi.
 *
 * - Two modes with different tool sets: librarian (changes the library, no web)
 *   and researcher (reads the library, searches PubMed/OpenAlex, writes vault notes).
 * - An approval gate: every library change is previewed by the server (dry run)
 *   and shown to Tiago; nothing is applied without his yes.
 * - Commands: /librarian, /researcher, /subsub, /history, /undo.
 *
 * The Python servers start in session_start (not in the factory) and stop in
 * session_shutdown. Tools are registered once and use the current bridge.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Bridge, type ServerSpec } from "./bridge.ts";
import { expand, loadConfig, type Mode, type SubsubConfig } from "./config.ts";
import { buildPolicy, judgePath, normalizeToolPath, realish, within } from "./paths.ts";
import { describeArgs, formatPreview } from "./preview.ts";
import { headerLines, type LibraryState, paintPreview, QUOTES, type Scheme, schemeFromAnsi, themeName } from "./look.ts";
import { systemAddition } from "./prompt.ts";
import { gateKind, otherMode, toolsFor } from "./roles.ts";

export interface SubsubDeps {
	config?: SubsubConfig;
	/** A ready bridge (tests). When given, Sub-Sub does not start or stop servers. */
	bridge?: Bridge;
	specs?: ServerSpec[];
}

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODE_ENTRY = "subsub-mode";
const BENCH_ENTRY = "subsub-bench";

function ownVersion(): string {
	try {
		return JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")).version ?? "";
	} catch {
		return "";
	}
}

/** uv is often missing from PATH when pi is started outside a login shell. */
export function findUv(cfg: SubsubConfig, env: NodeJS.ProcessEnv = process.env): string {
	const candidates = [cfg.uvPath, env.SUBSUB_UV, "~/.local/bin/uv", "/opt/homebrew/bin/uv", "/usr/local/bin/uv", "~/.cargo/bin/uv"]
		.filter((x): x is string => Boolean(x))
		.map(expand);
	return candidates.find((p) => existsSync(p)) ?? "uv";
}

export function serverSpecs(cfg: SubsubConfig): ServerSpec[] {
	const env: Record<string, string> = cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {};
	const uv = findUv(cfg);
	return [
		{ name: "zotero", command: uv, args: ["run", "--directory", cfg.serverDir, "zotero-local-mcp"], env },
		{ name: "scholar", command: uv, args: ["run", "--directory", cfg.serverDir, "zotero-scholar-mcp"], env },
	];
}

export async function createSubsub(pi: ExtensionAPI, deps: SubsubDeps = {}): Promise<void> {
	const cfg = deps.config ?? loadConfig();
	let bridge: Bridge | undefined = deps.bridge;
	const toolNames = new Set<string>();

	function current(): Bridge {
		if (!bridge) throw new Error("The Zotero servers are not running. Try /reload.");
		return bridge;
	}

	function registerTools(b: Bridge): void {
		for (const t of b.tools) {
			if (toolNames.has(t.fullName)) continue;
			toolNames.add(t.fullName);
			pi.registerTool({
				name: t.fullName,
				label: `${t.server} ${t.name}`,
				description: t.description,
				parameters: t.inputSchema as never,
				// One at a time, so a preview always sees the effect of earlier calls in the same message.
				executionMode: "sequential",
				async execute(_id, params, signal) {
					const res = await current().call(t.fullName, (params ?? {}) as Record<string, unknown>, signal);
					if (res.isError) throw new Error(res.text || `${t.fullName} failed`);
					return { content: [{ type: "text", text: res.text }], details: { tool: t.fullName } };
				},
			});
		}
	}

	if (deps.bridge) registerTools(deps.bridge);

	pi.registerFlag("librarian", { description: "Start Sub-Sub in librarian mode", type: "boolean", default: false });

	let mode: Mode = cfg.defaultMode;
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

	function applyTheme(ctx: ExtensionContext): void {
		if (!lookOn(ctx) || cfg.themes === false) return;
		scheme ??= schemeFromAnsi(ctx.ui.theme.getFgAnsi("text"), ctx.ui.theme.name);
		const name = themeName(mode, scheme, cfg.themes);
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
		ctx.ui.setStatus("subsub", `Sub-Sub: ${mode} | ${modelId}${down.length ? ` | not running: ${down.join(", ")}` : ""}`);
		if (standalone) ctx.ui.setTitle(`Sub-Sub: ${mode}`);
		headerTui?.requestRender();
	}

	async function applyMode(ctx: ExtensionContext, next: Mode, remember: boolean): Promise<void> {
		mode = next;
		pi.setActiveTools(toolsFor(mode, registered()));
		const spec = cfg.models[mode];
		if (spec) {
			const i = spec.indexOf("/");
			const model = i > 0 ? ctx.modelRegistry.find(spec.slice(0, i), spec.slice(i + 1)) : undefined;
			const ok = model ? await pi.setModel(model) : false;
			if (!ok) ctx.ui.notify(`Sub-Sub: cannot use ${spec} (unknown model or no key); keeping the current model.`, "warning");
		}
		if (remember) pi.appendEntry(MODE_ENTRY, { mode });
		applyTheme(ctx);
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
		await applyMode(ctx, restored ?? (pi.getFlag("librarian") ? "librarian" : cfg.defaultMode), false);
		if (lookOn(ctx)) {
			setHeader(ctx);
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

	pi.on("before_agent_start", async (event, ctx) => ({
		systemPrompt: `${event.systemPrompt}\n\n${systemAddition(mode, cfg, ctx.cwd)}`,
	}));

	/** Model test (subsub-bench): record every change instead of asking, and apply none. */
	const benchOut = process.env.SUBSUB_BENCH_OUT ? expand(process.env.SUBSUB_BENCH_OUT) : undefined;
	const record = (data: Record<string, unknown>) => pi.appendEntry(BENCH_ENTRY, data);

	pi.on("tool_call", async (event, ctx) => {
		const name = event.toolName;
		const input = (event.input ?? {}) as Record<string, unknown>;
		if ((name.startsWith("zotero_") || name.startsWith("scholar_")) && !toolsFor(mode, registered()).includes(name)) {
			if (benchOut) record({ kind: "wrong_mode", tool: name, input });
			return {
				block: true,
				reason: `${name} is not available in ${mode} mode. Ask Tiago to switch with /${otherMode(mode)}.`,
			};
		}
		const kind = benchOut && name === "scholar_queue_imports" ? "confirm" : gateKind(name, input);
		if (!kind) return undefined;
		if (benchOut) return benchGate(name, input, kind, ctx.cwd, ctx.signal);
		if (kind === "path") {
			const target = normalizeToolPath(String(input.path ?? ""), ctx.cwd);
			const verdict = judgePath(target, buildPolicy({ vault: cfg.vault, cwd: ctx.cwd, serverDir: cfg.serverDir, packageDir: PACKAGE_DIR }));
			if (verdict.ok) return undefined;
			if (!ctx.hasUI) return { block: true, reason: `Writing ${target} needs Tiago's approval: ${verdict.why}.` };
			const ok = await ctx.ui.confirm(`Sub-Sub: ${name} ${target}?`, `Asking because ${verdict.why}.`);
			return ok ? undefined : { block: true, reason: "Tiago did not allow writing to that file." };
		}
		if (!ctx.hasUI) {
			return { block: true, reason: "Library changes need Tiago's approval, which needs an interactive session." };
		}
		if (kind === "confirm") {
			const ok = await ctx.ui.confirm(`Sub-Sub: run ${name}?`, describeArgs(input));
			return ok ? undefined : { block: true, reason: "Tiago did not approve. Ask him what to change." };
		}
		// kind === "preview": the server computes the change first, then Tiago decides.
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
		return ok ? undefined : { block: true, reason: "Tiago did not approve this change. Ask him what to change; do not retry the same call." };
	});

	async function benchGate(name: string, input: Record<string, unknown>, kind: string, cwd: string, signal?: AbortSignal) {
		if (kind === "path") {
			const target = normalizeToolPath(String(input.path ?? ""), cwd);
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
				`for Tiago.${shown}`,
		};
	}

	pi.registerCommand("librarian", {
		description: "Sub-Sub: switch to the librarian (changes the library, no web)",
		handler: async (_args, ctx) => {
			await applyMode(ctx, "librarian", true);
			ctx.ui.notify("Sub-Sub: librarian mode", "info");
		},
	});

	pi.registerCommand("researcher", {
		description: "Sub-Sub: switch to the researcher (search, notes; library read-only)",
		handler: async (_args, ctx) => {
			await applyMode(ctx, "researcher", true);
			ctx.ui.notify("Sub-Sub: researcher mode", "info");
		},
	});

	pi.registerCommand("subsub", {
		description: "Sub-Sub: Zotero connection and library overview",
		handler: async (_args, ctx) => {
			const lines = [`Mode: ${mode}. Model: ${ctx.model?.id ?? "none"}.`];
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
			ctx.ui.notify(lines.join("\n"), "info");
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

