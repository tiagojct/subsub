/**
 * Sub-Sub: a Zotero librarian and research assistant for pi.
 *
 * - Two modes with different tool sets: librarian (changes the library, no web)
 *   and researcher (reads the library, searches PubMed/OpenAlex, writes vault notes).
 * - An approval gate: every library change is previewed by the server (dry run)
 *   and shown to Tiago; nothing is applied without his yes.
 * - Commands: /librarian, /researcher, /subsub, /history, /undo.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";
import { Bridge, type ServerSpec } from "./bridge.ts";
import { loadConfig, type Mode, type SubsubConfig } from "./config.ts";
import { describeArgs, formatPreview } from "./preview.ts";
import { inside, systemAddition } from "./prompt.ts";
import { gateKind, otherMode, toolsFor } from "./roles.ts";

export interface SubsubDeps {
	config?: SubsubConfig;
	bridge?: Bridge;
	specs?: ServerSpec[];
}

export function serverSpecs(cfg: SubsubConfig): ServerSpec[] {
	const env: Record<string, string> = cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {};
	return [
		{ name: "zotero", command: "uv", args: ["run", "--directory", cfg.serverDir, "zotero-local-mcp"], env },
		{ name: "scholar", command: "uv", args: ["run", "--directory", cfg.serverDir, "zotero-scholar-mcp"], env },
	];
}

const MODE_ENTRY = "subsub-mode";

export async function createSubsub(pi: ExtensionAPI, deps: SubsubDeps = {}): Promise<void> {
	const cfg = deps.config ?? loadConfig();
	const bridge = deps.bridge ?? new Bridge();
	if (!deps.bridge) await bridge.start(deps.specs ?? serverSpecs(cfg), cfg.startTimeout * 1000);

	for (const t of bridge.tools) {
		pi.registerTool({
			name: t.fullName,
			label: `${t.server} ${t.name}`,
			description: t.description,
			parameters: t.inputSchema as never,
			async execute(_id, params, signal) {
				const res = await bridge.call(t.fullName, (params ?? {}) as Record<string, unknown>, signal);
				if (res.isError) throw new Error(res.text || `${t.fullName} failed`);
				return { content: [{ type: "text", text: res.text }], details: { tool: t.fullName } };
			},
		});
	}

	pi.registerFlag("librarian", { description: "Start Sub-Sub in librarian mode", type: "boolean", default: false });

	let mode: Mode = cfg.defaultMode;
	const registered = () => pi.getAllTools().map((t) => t.name);

	function status(ctx: ExtensionContext): void {
		const model = ctx.model ? `${ctx.model.id}` : "no model";
		const down = Object.keys(bridge.errors);
		ctx.ui.setStatus("subsub", `Sub-Sub: ${mode} | ${model}${down.length ? ` | not running: ${down.join(", ")}` : ""}`);
	}

	async function applyMode(ctx: ExtensionContext, next: Mode, remember: boolean): Promise<void> {
		mode = next;
		pi.setActiveTools(toolsFor(mode, registered()));
		const spec = cfg.models[mode];
		if (spec) {
			const i = spec.indexOf("/");
			const model = i > 0 ? ctx.modelRegistry.find(spec.slice(0, i), spec.slice(i + 1)) : undefined;
			if (model) await pi.setModel(model);
			else ctx.ui.notify(`Sub-Sub: model ${spec} not found; keeping the current model.`, "warning");
		}
		if (remember) pi.appendEntry(MODE_ENTRY, { mode });
		status(ctx);
	}

	pi.on("session_start", async (_event, ctx) => {
		let restored: Mode | undefined;
		for (const e of ctx.sessionManager.getEntries() as Array<{ type?: string; customType?: string; data?: { mode?: Mode } }>) {
			if (e.customType === MODE_ENTRY && e.data?.mode) restored = e.data.mode;
		}
		const start = restored ?? (pi.getFlag("librarian") ? "librarian" : cfg.defaultMode);
		await applyMode(ctx, start, false);
		for (const [name, err] of Object.entries(bridge.errors)) {
			ctx.ui.notify(`Sub-Sub: the ${name} server did not start: ${err.split("\n")[0]}`, "error");
		}
	});

	pi.on("model_select", async (_event, ctx) => status(ctx));

	pi.on("before_agent_start", async (event, ctx) => ({
		systemPrompt: `${event.systemPrompt}\n\n${systemAddition(mode, cfg, ctx.cwd)}`,
	}));

	pi.on("tool_call", async (event, ctx) => {
		const name = event.toolName;
		const input = (event.input ?? {}) as Record<string, unknown>;
		if ((name.startsWith("zotero_") || name.startsWith("scholar_")) && !toolsFor(mode, registered()).includes(name)) {
			return {
				block: true,
				reason: `${name} is not available in ${mode} mode. Ask Tiago to switch with /${otherMode(mode)}.`,
			};
		}
		const kind = gateKind(name, input);
		if (!kind) return undefined;
		if (kind === "path") {
			const target = resolve(ctx.cwd, String(input.path ?? ""));
			if (inside(target, cfg.vault) || inside(target, ctx.cwd)) return undefined;
			if (!ctx.hasUI) return { block: true, reason: `Writing outside the vault and the working folder needs Tiago's approval: ${target}` };
			const ok = await ctx.ui.confirm("Sub-Sub: write outside the vault?", target);
			return ok ? undefined : { block: true, reason: "Tiago did not allow writing to that file." };
		}
		if (!ctx.hasUI) {
			return { block: true, reason: "Library changes need Tiago's approval, which needs an interactive session." };
		}
		if (kind === "confirm") {
			const ok = await ctx.ui.confirm(`Sub-Sub: run ${name}?`, describeArgs(input));
			return ok ? undefined : { block: true, reason: "Tiago did not approve. Ask him what to change." };
		}
		// kind === "preview": let the server compute the change first, then ask.
		let preview;
		try {
			preview = await bridge.call(name, { ...input, dry_run: true }, ctx.signal);
		} catch (err) {
			return { block: true, reason: `Preview failed: ${(err as Error).message}` };
		}
		if (preview.isError) return { block: true, reason: preview.text };
		const ok = await ctx.ui.confirm(`Sub-Sub: apply ${name.replace(/^(zotero|scholar)_/, "")}?`, formatPreview(name, preview.data ?? preview.text));
		return ok ? undefined : { block: true, reason: "Tiago did not approve this change. Ask him what to change; do not retry the same call." };
	});

	pi.on("session_shutdown", async (event) => {
		if ((event as { reason?: string }).reason !== "reload") await bridge.close();
	});

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
			for (const [name, err] of Object.entries(bridge.errors)) lines.push(`${name} server not running: ${err.split("\n")[0]}`);
			if (bridge.has("zotero_status")) {
				const st = await bridge.call("zotero_status", {});
				const d = (st.data ?? {}) as Record<string, unknown>;
				lines.push(`Zotero: ${d.zotero ?? "?"}${d.error ? ` (${d.error})` : ""}. Write key remembered: ${d.write_key_remembered ?? "?"}.`);
				if (d.zotero === "reachable") {
					const ov = (await bridge.call("zotero_library_overview", {})).data as Record<string, unknown>;
					lines.push(
						`Items: ${ov.items}. Without tags: ${ov.without_manual_tags}. Missing facets: ${JSON.stringify(ov.missing_facet)}. Awaiting review (_agent): ${ov.awaiting_review}.`,
					);
				}
			}
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("history", {
		description: "Sub-Sub: recent library changes",
		handler: async (_args, ctx) => {
			const res = await bridge.call("zotero_history", { limit: 10 });
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
			const preview = await bridge.call("zotero_undo", { ...input, dry_run: true });
			if (preview.isError) {
				ctx.ui.notify(preview.text, "warning");
				return;
			}
			const ok = await ctx.ui.confirm("Sub-Sub: undo?", formatPreview("zotero_undo", preview.data));
			if (!ok) return;
			const res = await bridge.call("zotero_undo", { ...input, dry_run: false });
			const d = (res.data ?? {}) as Record<string, unknown>;
			ctx.ui.notify(res.isError ? res.text : `Undone: ${d.applied} item(s).`, res.isError ? "error" : "info");
		},
	});
}
