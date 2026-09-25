import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import type { Bridge, BridgeTool, CallResult } from "../src/bridge.ts";
import { agentDirFor, chooseCwd, ensureSettings, isSelfUpdate, shareAuth } from "../src/cli.ts";
import { loadConfig, parseEnvFile, type SubsubConfig } from "../src/config.ts";
import { formatPreview } from "../src/preview.ts";
import { systemAddition } from "../src/prompt.ts";
import { gateKind, toolsFor } from "../src/roles.ts";
import { createSubsub } from "../src/subsub.ts";

// ---------------------------------------------------------------- fakes

const TOOL_NAMES = [
	"zotero_status", "zotero_find_items", "zotero_get_item", "zotero_history", "zotero_tag_items",
	"zotero_undo", "zotero_trash_items", "zotero_library_overview", "zotero_bakeoff_submit",
	"scholar_search_pubmed", "scholar_attach_note", "scholar_export_bibliography", "scholar_queue_imports",
];

class FakeBridge {
	tools: BridgeTool[] = TOOL_NAMES.map((fullName) => ({
		server: fullName.split("_")[0], name: fullName.split("_").slice(1).join("_"), fullName,
		description: `desc ${fullName}`, inputSchema: { type: "object", properties: { dry_run: { type: "boolean", default: true } } },
	}));
	errors: Record<string, string> = {};
	calls: Array<{ name: string; args: Record<string, unknown> }> = [];
	responses: Record<string, CallResult> = {};
	has(n: string) { return TOOL_NAMES.includes(n); }
	async call(name: string, args: Record<string, unknown>): Promise<CallResult> {
		this.calls.push({ name, args });
		return this.responses[name] ?? { isError: false, text: "{}", data: { dry_run: args.dry_run, would_change: 2, changes: [{ key: "K1", item: "Jacinto 2026: FeNO", added: ["topic/feno"], removed: [] }] } };
	}
	async close() {}
}

function fakePi() {
	const handlers: Record<string, Function[]> = {};
	const tools: Array<{ name: string; execute: Function; parameters: unknown }> = [];
	const commands: Record<string, { handler: Function }> = {};
	let active: string[] = [];
	const entries: unknown[] = [];
	const pi = {
		registerTool: (t: any) => tools.push(t),
		registerFlag: () => {},
		getFlag: () => false,
		registerCommand: (n: string, c: any) => { commands[n] = c; },
		on: (ev: string, h: Function) => { (handlers[ev] ??= []).push(h); },
		getAllTools: () => [...tools.map((t) => ({ name: t.name })), ...["read", "edit", "write", "grep", "find", "ls", "bash"].map((name) => ({ name }))],
		setActiveTools: (names: string[]) => { active = names; },
		getActiveTools: () => active,
		setModel: async (m: unknown) => { (pi as any).model = m; return true; },
		appendEntry: (type: string, data: unknown) => entries.push({ customType: type, data }),
	};
	return { pi, handlers, tools, commands, entries, get active() { return active; } };
}

function fakeCtx(opts: { hasUI?: boolean; confirm?: boolean; cwd?: string; branch?: unknown[] } = {}) {
	const asked: Array<{ title: string; message: string }> = [];
	const notes: string[] = [];
	return {
		asked, notes,
		ctx: {
			cwd: opts.cwd ?? "/vault",
			hasUI: opts.hasUI ?? true,
			model: { id: "glm-5.3-flash" },
			modelRegistry: { find: (p: string, id: string) => ({ provider: p, id }) },
			sessionManager: { getEntries: () => [], getBranch: () => (opts as any).branch ?? [] },
			ui: {
				confirm: async (title: string, message: string) => { asked.push({ title, message }); return opts.confirm ?? true; },
				notify: (m: string) => notes.push(m),
				setStatus: () => {},
			},
		} as any,
	};
}

const CFG: SubsubConfig = {
	serverDir: "/x", vault: "/vault", models: { librarian: "opencode-go/glm-5.3-flash", researcher: "opencode-go/mimo-v2.6-pro" },
	defaultMode: "researcher", vaultContext: [], startTimeout: 5,
};

async function setup(confirm = true, hasUI = true) {
	const fp = fakePi();
	const bridge = new FakeBridge();
	await createSubsub(fp.pi as any, { config: CFG, bridge: bridge as unknown as Bridge });
	const { ctx, asked, notes } = fakeCtx({ confirm, hasUI });
	for (const h of fp.handlers.session_start) await h({ reason: "startup" }, ctx);
	const toolCall = (toolName: string, input: Record<string, unknown>) => fp.handlers.tool_call[0]({ toolName, input }, ctx);
	return { fp, bridge, ctx, asked, notes, toolCall };
}

// ---------------------------------------------------------------- pure parts

test("tool sets per mode", () => {
	const all = [...TOOL_NAMES, "read", "edit", "write", "grep", "find", "ls", "bash"];
	const lib = toolsFor("librarian", all);
	const res = toolsFor("researcher", all);
	assert.ok(lib.includes("zotero_tag_items") && !lib.some((n) => n.startsWith("scholar_")));
	assert.ok(res.includes("scholar_search_pubmed") && res.includes("zotero_find_items"));
	assert.ok(!res.includes("zotero_tag_items") && !res.includes("zotero_bakeoff_submit"));
	assert.ok(!lib.includes("bash") && !res.includes("bash"));
});

test("gate kinds", () => {
	assert.equal(gateKind("zotero_tag_items", { dry_run: false }), "preview");
	assert.equal(gateKind("zotero_tag_items", {}), null);
	assert.equal(gateKind("zotero_tag_items", { dry_run: true }), null);
	assert.equal(gateKind("scholar_attach_note", { dry_run: false }), "preview");
	assert.equal(gateKind("scholar_export_bibliography", {}), "confirm");
	assert.equal(gateKind("scholar_queue_imports", {}), null);
	assert.equal(gateKind("write", { path: "x" }), "path");
	assert.equal(gateKind("zotero_find_items", {}), null);
	// Anything that is not clearly a dry run is gated (the server might coerce it to false)
	for (const v of ["false", 0, "0", null, "no"]) assert.equal(gateKind("zotero_trash_items", { dry_run: v }), "preview");
	assert.equal(gateKind("zotero_trash_items", { dry_run: "true" }), null);
});

test("gate normalises dry_run before the real call", async () => {
	const { fp, ctx, bridge } = await setup(true);
	await fp.commands.librarian.handler("", ctx);
	const input: Record<string, unknown> = { keys: ["K"], dry_run: "false" };
	assert.equal(await fp.handlers.tool_call[0]({ toolName: "zotero_trash_items", input }, ctx), undefined);
	assert.equal(input.dry_run, false);
	assert.equal(bridge.calls.at(-1)!.args.dry_run, true);
});

test("preview text", () => {
	const t = formatPreview("zotero_tag_items", {
		dry_run: true, would_change: 20,
		changes: Array.from({ length: 20 }, (_, i) => ({ key: `K${i}`, item: `Item ${i}`, added: ["topic/feno"], removed: ["Asthma"] })),
		skipped: { ZZZ: "not found" },
	});
	assert.match(t, /20 item\(s\) would change/);
	assert.match(t, /Item 0: \+ topic\/feno; - Asthma/);
	assert.match(t, /\.\.\. and 6 more/);
	assert.match(t, /Skipped: 1/);
	const f = formatPreview("zotero_update_fields", { would_change: 1, changes: [{ key: "K", item: "A 2019: T", date: { before: "", after: "2019-05" } }] });
	assert.match(f, /date: \(empty\) -> 2019-05/);
	const imp = formatPreview("zotero_import_identifiers", { would_import: [{ citekey: "jacinto2026", item: "Jacinto 2026: FeNO", has_abstract: false }] });
	assert.match(imp, /jacinto2026  Jacinto 2026: FeNO  \(no abstract\)/);
	const note = formatPreview("scholar_attach_note", { item: "Jacinto 2026: FeNO", summary: "Cohort.", link: "obsidian://open?x" });
	assert.match(note, /Note on: Jacinto 2026: FeNO\nCohort\.\nLink: obsidian/);
});

test("config defaults and env file", () => {
	const dir = mkdtempSync(join(tmpdir(), "subsub-"));
	const env = join(dir, "zotero.env");
	writeFileSync(env, "# c\nZOTERO_VAULT=/Users/t/Notes\nZOTERO_VOCAB=/Users/t/Notes/Systems/Zotero tags.md\n");
	assert.equal(parseEnvFile(env).ZOTERO_VOCAB, "/Users/t/Notes/Systems/Zotero tags.md");
	const cfg = loadConfig({ SUBSUB_CONFIG: join(dir, "none.json"), ZOTERO_MCP_ENV: env } as any);
	assert.equal(cfg.envFile, env);
	assert.equal(cfg.vault, "/Users/t/Notes");
	assert.equal(cfg.sharedRules, "/Users/t/Notes/Systems/Zotero agent.md");
	assert.equal(cfg.models.researcher, "opencode-go/mimo-v2.6-pro");
	writeFileSync(join(dir, "c.json"), JSON.stringify({ defaultMode: "librarian", models: {} }));
	const c2 = loadConfig({ SUBSUB_CONFIG: join(dir, "c.json"), ZOTERO_MCP_ENV: env } as any);
	assert.equal(c2.defaultMode, "librarian");
	assert.deepEqual(c2.models, {});
});

test("system prompt addition", () => {
	const dir = mkdtempSync(join(tmpdir(), "subsub-"));
	mkdirSync(join(dir, "Systems"));
	mkdirSync(join(dir, ".claude"));
	writeFileSync(join(dir, "Systems", "Zotero agent.md"), "SHARED RULES");
	writeFileSync(join(dir, ".claude", "CLAUDE.md"), "VAULT CONVENTIONS");
	const cfg = { ...CFG, vault: dir, sharedRules: join(dir, "Systems", "Zotero agent.md"), vaultContext: [join(dir, ".claude", "CLAUDE.md")] };
	const inVault = systemAddition("librarian", cfg, join(dir, "Inbox"));
	assert.match(inVault, /Sub-Sub: librarian mode/);
	assert.match(inVault, /You are Sub-Sub, the librarian/);
	assert.match(inVault, /SHARED RULES[\s\S]*Sub-Sub note/);
	assert.match(inVault, /VAULT CONVENTIONS/);
	assert.doesNotMatch(systemAddition("researcher", cfg, "/elsewhere"), /VAULT CONVENTIONS/);
	// The English rule comes last, after the vault conventions.
	assert.match(inVault, /VAULT CONVENTIONS[\s\S]*# Language\n\nAlways reply in English/);
	assert.doesNotMatch(inVault, /in the language he uses/);
});

test("cli: settings, shared auth, start folder, self-update guard", () => {
	const home = mkdtempSync(join(tmpdir(), "subsub-home-"));
	const agent = join(home, ".subsub", "agent");
	const pkg = join(home, "Projects", "subsub");
	mkdirSync(pkg, { recursive: true });
	assert.equal(agentDirFor({}, home), agent);
	assert.equal(agentDirFor({ SUBSUB_AGENT_DIR: "/x/y" }, home), "/x/y");

	assert.equal(ensureSettings(agent, pkg), "created");
	assert.equal(ensureSettings(agent, pkg), "present");
	writeFileSync(join(agent, "settings.json"), JSON.stringify({ theme: "dark", packages: ["npm:other"] }));
	assert.equal(ensureSettings(agent, pkg), "added");
	const st = JSON.parse(readFileSync(join(agent, "settings.json"), "utf8"));
	assert.equal(st.theme, "dark");
	assert.equal(st.packages.length, 2);
	writeFileSync(join(agent, "settings.json"), "{ broken");
	assert.equal(ensureSettings(agent, pkg), "unreadable");

	const piAgent = join(home, ".pi", "agent");
	assert.equal(shareAuth(agent, piAgent), false); // pi has no auth.json
	mkdirSync(piAgent, { recursive: true });
	writeFileSync(join(piAgent, "auth.json"), '{"opencode-go":{}}');
	writeFileSync(join(agent, "auth.json"), "{ }"); // the empty file pi writes on first start
	assert.equal(shareAuth(agent, piAgent), true);
	assert.equal(realpathSync(join(agent, "auth.json")), realpathSync(join(piAgent, "auth.json")));
	assert.equal(shareAuth(agent, piAgent), false); // already there
	const own = mkdtempSync(join(tmpdir(), "subsub-own-"));
	writeFileSync(join(own, "auth.json"), '{"x":{}}');
	assert.equal(shareAuth(own, piAgent), false); // Sub-Sub's own credentials are kept

	const vault = join(home, "Vault");
	mkdirSync(vault);
	assert.equal(chooseCwd(home, home, vault, false), vault);
	assert.equal(chooseCwd(home, home, vault, true), home);
	assert.equal(chooseCwd(pkg, home, vault, false), pkg);
	assert.equal(chooseCwd(home, home, join(home, "missing"), false), home);

	assert.ok(isSelfUpdate(["update"]));
	assert.ok(isSelfUpdate(["update", "--all"]));
	assert.ok(isSelfUpdate(["update", "--force"]));
	assert.ok(!isSelfUpdate(["update", "--extensions"]));
	assert.ok(!isSelfUpdate(["update", "npm:foo"]));
	assert.ok(!isSelfUpdate(["hello"]));
});

// ---------------------------------------------------------------- extension wiring

test("registers bridge tools, commands and starts in researcher mode", async () => {
	const { fp } = await setup();
	assert.equal(fp.tools.length, TOOL_NAMES.length);
	assert.ok(["librarian", "researcher", "subsub", "history", "undo"].every((c) => c in fp.commands));
	assert.ok(fp.active.includes("scholar_search_pubmed") && !fp.active.includes("zotero_tag_items"));
	assert.deepEqual((fp.pi as any).model, { provider: "opencode-go", id: "mimo-v2.6-pro" });
});

test("mode switch changes tools, model and is remembered", async () => {
	const { fp, ctx } = await setup();
	await fp.commands.librarian.handler("", ctx);
	assert.ok(fp.active.includes("zotero_tag_items") && !fp.active.includes("scholar_search_pubmed"));
	assert.deepEqual((fp.pi as any).model, { provider: "opencode-go", id: "glm-5.3-flash" });
	assert.deepEqual(fp.entries.at(-1), { customType: "subsub-mode", data: { mode: "librarian" } });
});

test("tools of the other mode are blocked", async () => {
	const { toolCall } = await setup();
	const r = await toolCall("zotero_tag_items", { dry_run: false });
	assert.equal(r.block, true);
	assert.match(r.reason, /not available in researcher mode.*\/librarian/);
});

test("preview gate asks with the server's preview and applies on yes", async () => {
	const { fp, ctx, bridge, asked } = await setup(true);
	await fp.commands.librarian.handler("", ctx);
	const r = await fp.handlers.tool_call[0]({ toolName: "zotero_tag_items", input: { changes: [{ key: "K1", add: ["topic/feno"] }], dry_run: false } }, ctx);
	assert.equal(r, undefined);
	assert.deepEqual(bridge.calls.at(-1), { name: "zotero_tag_items", args: { changes: [{ key: "K1", add: ["topic/feno"] }], dry_run: true } });
	assert.match(asked.at(-1)!.title, /apply tag_items/);
	assert.match(asked.at(-1)!.message, /2 item\(s\) would change[\s\S]*Jacinto 2026: FeNO: \+ topic\/feno/);
});

test("declined, no UI and failed previews block", async () => {
	const no = await setup(false);
	await no.fp.commands.librarian.handler("", no.ctx);
	let r = await no.fp.handlers.tool_call[0]({ toolName: "zotero_trash_items", input: { keys: ["K"], dry_run: false } }, no.ctx);
	assert.equal(r.block, true);
	assert.match(r.reason, /did not approve/);

	const head = await setup(true, false);
	await head.fp.commands.librarian.handler("", head.ctx);
	r = await head.fp.handlers.tool_call[0]({ toolName: "zotero_trash_items", input: { keys: ["K"], dry_run: false } }, head.ctx);
	assert.match(r.reason, /interactive session/);
	assert.equal(head.bridge.calls.length, 0);

	const bad = await setup(true);
	await bad.fp.commands.librarian.handler("", bad.ctx);
	bad.bridge.responses.zotero_tag_items = { isError: true, text: "'made-up' is not in the vocabulary" };
	r = await bad.fp.handlers.tool_call[0]({ toolName: "zotero_tag_items", input: { dry_run: false } }, bad.ctx);
	assert.equal(r.block, true);
	assert.match(r.reason, /not in the vocabulary/);
	assert.equal(bad.asked.length, 0);
});

test("dry runs and reads pass without asking", async () => {
	const { fp, ctx, asked } = await setup(true);
	await fp.commands.librarian.handler("", ctx);
	assert.equal(await fp.handlers.tool_call[0]({ toolName: "zotero_tag_items", input: { dry_run: true } }, ctx), undefined);
	assert.equal(await fp.handlers.tool_call[0]({ toolName: "zotero_find_items", input: {} }, ctx), undefined);
	assert.equal(asked.length, 0);
});

test("researcher: attach_note previews, export asks, queue passes", async () => {
	const { toolCall, asked } = await setup(true);
	assert.equal(await toolCall("scholar_attach_note", { key: "K", summary: "s", note_path: "a.md", dry_run: false }), undefined);
	assert.match(asked.at(-1)!.title, /apply attach_note/);
	assert.equal(await toolCall("scholar_export_bibliography", { output_path: "/vault/refs.json" }), undefined);
	assert.match(asked.at(-1)!.message, /output_path: \/vault\/refs\.json/);
	const n = asked.length;
	assert.equal(await toolCall("scholar_queue_imports", { entries: [] }), undefined);
	assert.equal(asked.length, n);
});

test("file writes outside the vault need a yes; tricks do not escape", async () => {
	const dir = mkdtempSync(join(tmpdir(), "subsub-vault-"));
	mkdirSync(join(dir, "Inbox"));
	mkdirSync(join(dir, "Systems"));
	const outside = mkdtempSync(join(tmpdir(), "subsub-out-"));
	symlinkSync(outside, join(dir, "Inbox", "link"));
	const fp = fakePi();
	await createSubsub(fp.pi as any, { config: { ...CFG, vault: dir }, bridge: new FakeBridge() as unknown as Bridge });
	const { ctx, asked } = fakeCtx({ confirm: false, cwd: dir });
	for (const h of fp.handlers.session_start) await h({ reason: "startup" }, ctx);
	const call = (toolName: string, path: string) => fp.handlers.tool_call[0]({ toolName, input: { path } }, ctx);
	assert.equal(await call("write", join(dir, "Inbox", "x.md")), undefined);
	assert.equal(await call("edit", "Inbox/y.md"), undefined);
	assert.equal(await call("write", `@${join(dir, "Inbox", "z.md")}`), undefined);
	const blocked = [
		"/Users/t/.zshrc",
		`@${join(outside, "a.txt")}`,
		`file://${join(outside, "b.txt")}`,
		"~/c.txt",
		"Inbox/link/d.txt",
		"../escape.txt",
		"Systems/Zotero agent.md",
		".claude/CLAUDE.md",
	];
	for (const p of blocked) {
		const r = await call("write", p);
		assert.equal(r?.block, true, `expected a question for ${p}`);
	}
	assert.equal(asked.length, blocked.length);
	assert.match(asked.at(-1)!.message, /protected/);
});

test("mode is restored from the session branch", async () => {
	const fp = fakePi();
	await createSubsub(fp.pi as any, { config: CFG, bridge: new FakeBridge() as unknown as Bridge });
	const { ctx } = fakeCtx({ branch: [{ customType: "subsub-mode", data: { mode: "librarian" } }, { customType: "subsub-mode", data: { mode: "bogus" } }] } as any);
	for (const h of fp.handlers.session_start) await h({ reason: "resume" }, ctx);
	assert.ok(fp.active.includes("zotero_tag_items"));
});

test("setModel failure is reported", async () => {
	const fp = fakePi();
	(fp.pi as any).setModel = async () => false;
	await createSubsub(fp.pi as any, { config: CFG, bridge: new FakeBridge() as unknown as Bridge });
	const { ctx, notes } = fakeCtx();
	for (const h of fp.handlers.session_start) await h({ reason: "startup" }, ctx);
	assert.match(notes.join("\n"), /cannot use opencode-go\/mimo-v2.6-pro/);
});

test("MCP tools run sequentially", async () => {
	const { fp } = await setup();
	assert.ok(fp.tools.every((t: any) => t.executionMode === "sequential"));
});

test("system prompt hook appends the Sub-Sub part", async () => {
	const { fp, ctx } = await setup();
	const out = await fp.handlers.before_agent_start[0]({ systemPrompt: "BASE" }, ctx);
	assert.match(out.systemPrompt, /^BASE\n\n# Sub-Sub: researcher mode/);
});

test("/undo previews, confirms and applies", async () => {
	const { fp, ctx, bridge, asked, notes } = await setup(true);
	bridge.responses.zotero_undo = { isError: false, text: "", data: { dry_run: true, would_change: 1, changes: [], undoing: { op: "tag_items", summary: "tag 1 items" } } };
	await fp.commands.undo.handler("", ctx);
	assert.match(asked.at(-1)!.message, /Undo tag_items: tag 1 items/);
	assert.deepEqual(bridge.calls.map((c) => c.args.dry_run), [true, false]);
	assert.ok(notes.at(-1)!.startsWith("Undone"));
});
