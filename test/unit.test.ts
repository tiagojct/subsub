import assert from "node:assert/strict";
import { existsSync, mkdtempSync, writeFileSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import type { Bridge, BridgeTool, CallResult } from "../src/bridge.ts";
import { agentDirFor, chooseCwd, ensureSettings, isSelfUpdate, reviewCommand, shareAuth } from "../src/cli.ts";
import { findUv, loadConfig as loadCfg, SERVER_VERSION } from "../src/config.ts";
import { profileSpec } from "../src/profiles.ts";
import { fill, languageRule } from "../src/prompt.ts";
import { unavailableReason } from "../src/roles.ts";
import { runInit, upsertEnv } from "../src/init.ts";
import { formatChecks, runChecks } from "../src/doctor.ts";
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
	configFile: "/nonexistent/subsub.json", profile: "editor", language: "English",
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
	assert.equal(cfg.vault, resolve("/Users/t/Notes"));
	assert.equal(cfg.sharedRules, join(resolve("/Users/t/Notes"), "Systems", "Zotero agent.md"));
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
	assert.equal(agentDirFor({ SUBSUB_AGENT_DIR: "/x/y" }, home), resolve("/x/y"));

	assert.equal(ensureSettings(agent, pkg), "created");
	assert.equal(ensureSettings(agent, pkg), "present");
	writeFileSync(join(agent, "settings.json"), JSON.stringify({ theme: "dark", packages: ["npm:other"] }));
	assert.equal(ensureSettings(agent, pkg), "added");
	const st = JSON.parse(readFileSync(join(agent, "settings.json"), "utf8"));
	assert.equal(st.theme, "dark");
	assert.equal(st.packages.length, 2);
	assert.equal(st.quietStartup, true);
	writeFileSync(join(agent, "settings.json"), JSON.stringify({ quietStartup: false, packages: [pkg] }));
	assert.equal(ensureSettings(agent, pkg), "present"); // an explicit false is kept
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

test("bench: prompts, tag scoring, identifiers and citekeys", async () => {
	const { promptFor, scoreTags, normId, citekeysIn, DOI_RE } = await import("../src/bench.ts");
	const t: any = {
		tagging: { keys: ["A", "B"] },
		facet_fix: {},
		import: { in_library: { id: "10.1/old", key: "K", citekey: "old2020" }, new: [{ id: "10.2/new", kind: "doi", title: "" }, { id: "PMID:123", kind: "pmid", title: "" }] },
		lit_note: { key: "K", citekey: "smith2020", title: "" },
		synthesis: { topic: "topic/asthma", description: "Asthma.", keys: [], citekeys: [] },
		search: { topic: "topic/asthma", description: "Asthma.", year_from: 2024 },
	};
	assert.match(promptFor("tagging", t, "M123", "/o")!, /label "M123"/);
	assert.equal(promptFor("import", t, "M1", "/o"), "Import these into Zotero: 10.2/new, 10.1/old, PMID:123.");
	assert.match(promptFor("lit_note", t, "M1", "/o")!, /[\\/]o[\\/]smith2020\.md/);
	assert.match(promptFor("search", t, "M1", "/o")!, /from 2024 onwards on Asthma \(topic\/asthma\)/);
	const s = scoreTags({ A: ["topic/asthma", "type/cohort", "status/read"], B: ["topic/copd"] }, { A: ["topic/asthma", "type/cohort"], B: ["topic/asthma"], C: ["topic/x"] });
	assert.deepEqual([s.exact, s.missing, s.edits], [1, 1, 3]);
	assert.equal(normId("https://doi.org/10.1183/ABC"), "10.1183/abc");
	assert.equal(normId("PMID: 123"), "pmid:123");
	assert.deepEqual(citekeysIn("See [[smith2020]], [[Notes|alias]] and @jones2019a."), ["smith2020", "Notes", "jones2019a"]);
	const { normDoi } = await import("../src/bench.ts");
	const found = "(doi 10.1164/rccm.202205-0963OC). Lancet 10.1016/S0140-6736(20)30183-5.".match(DOI_RE)!.map(normDoi);
	assert.deepEqual(found, ["10.1164/rccm.202205-0963oc", "10.1016/s0140-6736(20)30183-5"]);
});

test("look: banner, narrow terminal, scheme, theme names, coloured preview", async () => {
	const { headerLines, schemeFromAnsi, themeName, paintPreview, BANNER, QUOTES } = await import("../src/look.ts");
	const wide = headerLines({ version: "0.3.0", mode: "researcher", model: "mimo-v2.6-pro", library: { zotero: "reachable", items: 990, toReview: 975 }, quote: QUOTES[4], width: 100 });
	assert.equal(wide[1], BANNER[0]);
	assert.match(wide[3], /0\.3\.0$/);
	assert.ok(wide.some((l) => l === "Researcher  mimo-v2.6-pro  |  Zotero: 990 items, 975 to review"));
	assert.ok(wide.some((l) => l === '"Very like a whale." (Hamlet, in the Extracts)'));
	const narrow = headerLines({ version: "0.3.0", mode: "librarian", model: "glm-5.3-flash", library: { zotero: "down" }, width: 18 });
	assert.equal(narrow.length, 3);
	assert.ok(narrow.every((l) => [...l].length <= 18));
	const down = headerLines({ version: "0.3.0", mode: "librarian", model: "m", library: { zotero: "down" }, width: 60 });
	assert.ok(down.some((l) => /Zotero is not running/.test(l)));
	assert.ok(headerLines({ version: "1", mode: "librarian", model: "m", library: { zotero: "checking" }, width: 40 }).every((l) => [...l].length <= 40));
	assert.equal(schemeFromAnsi("\x1b[38;2;232;238;242m"), "dark");
	assert.equal(schemeFromAnsi("\x1b[38;2;22;34;42m"), "light");
	assert.equal(schemeFromAnsi("", "subsub-glauca-light"), "light");
	assert.equal(themeName("librarian", "dark"), "subsub-try-works-dark");
	assert.equal(themeName("researcher", "light"), "subsub-glauca-light");
	assert.equal(themeName("researcher", "light", { librarian: "x" }), undefined);
	const painted = paintPreview("Smith 2020: + topic/asthma, type/cohort; - topic/copd", (x) => `<${x}>`, (x) => `[${x}]`);
	assert.equal(painted, "Smith 2020: <+ topic/asthma, type/cohort>; [- topic/copd]");
	const based = paintPreview("2 item(s) would change.\nSmith 2020: Title: + a; - b\n- c", (x) => `<${x}>`, (x) => `[${x}]`, (x) => `{${x}}`);
	assert.equal(based, "{2 item(s) would change.}\n{Smith 2020: Title: }<+ a>{; }[- b]\n[- c]");
});

test("themes: all four load and name every required colour", async () => {
	const { readdirSync, readFileSync } = await import("node:fs");
	const dir = join(import.meta.dirname, "..", "themes");
	const schema = JSON.parse(readFileSync(join(import.meta.dirname, "..", "node_modules", "@earendil-works", "pi-coding-agent", "dist", "modes", "interactive", "theme", "theme-schema.json"), "utf8"));
	const required: string[] = schema.properties.colors.required;
	const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
	assert.deepEqual(files.sort(), ["subsub-glauca-dark.json", "subsub-glauca-light.json", "subsub-try-works-dark.json", "subsub-try-works-light.json"]);
	for (const f of files) {
		const t = JSON.parse(readFileSync(join(dir, f), "utf8"));
		assert.equal(`${t.name}.json`, f);
		for (const c of required) {
			const v = t.colors[c];
			assert.ok(v !== undefined, `${f}: ${c}`);
			if (typeof v === "string" && !v.startsWith("#") && v !== "") assert.ok(v in t.vars, `${f}: ${c} -> ${v}`);
		}
	}
});

test("args: lists sent as strings are accepted and repaired", async () => {
	const { loosenArrays, coerceArgs, toList } = await import("../src/args.ts");
	const schema = {
		type: "object",
		properties: {
			tags: { anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }], default: null },
			keys: { type: "array", items: { type: "string" }, description: "Item keys" },
			changes: { type: "array", items: { type: "object" } },
			limit: { type: "integer" },
		},
	};
	const loose = loosenArrays(schema);
	assert.deepEqual(loose.properties.tags.anyOf.at(-1), { type: "string" });
	assert.deepEqual(loose.properties.keys, { anyOf: [{ type: "array", items: { type: "string" } }, { type: "string" }], description: "Item keys" });
	assert.deepEqual(loose.properties.changes, schema.properties.changes); // lists of objects are left alone
	assert.deepEqual(schema.properties.keys.type, "array"); // the original is not changed
	const input: Record<string, unknown> = { tags: '["topic/eu-regulation"]', keys: "ABCD2345, EFGH6789", limit: 5 };
	coerceArgs(schema, input);
	assert.deepEqual(input, { tags: ["topic/eu-regulation"], keys: ["ABCD2345", "EFGH6789"], limit: 5 });
	assert.deepEqual(toList("topic/asthma"), ["topic/asthma"]);
	assert.deepEqual(toList("[topic/a, 'topic/b']"), ["topic/a", "topic/b"]);
});

test("cli: subsub review runs zotero-review with Sub-Sub's server folder and settings", () => {
	const srv = mkdtempSync(join(tmpdir(), "zlm-"));
	writeFileSync(join(srv, "pyproject.toml"), "");
	const cfg = { serverDir: srv, envFile: "/cfg/zotero.env", uvPath: "/nonexistent/uv" } as any;
	const r = reviewCommand(["apply", "13-31"], cfg, { PATH: "/bin" });
	assert.deepEqual(r.args, ["run", "--quiet", "--directory", srv, "zotero-review", "apply", "13-31"]);
	assert.equal(r.env.ZOTERO_MCP_ENV, "/cfg/zotero.env");
	assert.equal(r.env.PATH, "/bin");
	// without a server folder: the pinned release from PyPI
	const r2 = reviewCommand(["preview", "13"], { ...cfg, serverDir: "/nonexistent" }, {});
	assert.deepEqual(r2.args.slice(0, 5), ["tool", "run", "--quiet", "--from", `zotero-local-mcp==${SERVER_VERSION}`]);
	assert.deepEqual(r2.args.slice(5), ["zotero-review", "preview", "13"]);
});

test("preview: already applied notes and tags changed since the note", () => {
	const t = formatPreview("zotero_apply_tag_review", {
		would_change: 1,
		changes: [{ key: "K", item: "Smith 2020: T", added: ["topic/asthma"], removed: [] }],
		already_applied: ["2026-09-26 (23 items)"],
		changed_since_note: { count: 1, items: { K: { item: "Smith 2020: T", in_note: ["topic/copd"], now: ["topic/copd", "topic/asthma"] } } },
	});
	assert.match(t, /^ALREADY APPLIED: 2026-09-26 \(23 items\)/);
	assert.match(t, /1 item\(s\) changed after the note was written[\s\S]*K now: topic\/copd, topic\/asthma/);
});


// ---------------------------------------------------------------- profiles, init, doctor

test("profiles: tools, reasons and prompt text", () => {
	const all = [...TOOL_NAMES, "read", "edit", "write"];
	const readerLib = toolsFor("librarian", all, "reader");
	assert.ok(readerLib.includes("zotero_tag_items") && readerLib.includes("zotero_undo"));
	assert.ok(!readerLib.includes("zotero_trash_items"));
	assert.ok(!toolsFor("researcher", all, "scholar").includes("scholar_export_bibliography"));
	assert.ok(toolsFor("researcher", all, "author").includes("scholar_export_bibliography"));
	assert.match(unavailableReason("zotero_trash_items", "librarian", all, "reader")!, /not part of the Reader profile.*\/profile/);
	assert.match(unavailableReason("zotero_tag_items", "researcher", all, "editor")!, /not available in researcher mode.*\/librarian/);
	assert.equal(unavailableReason("zotero_tag_items", "librarian", all, "reader"), undefined);
	assert.equal(profileSpec("reader").batch, 10);
	const t = fill("{{User}} edits; tell {{user}}. {{about}} limit={{batch}}", { userName: "Ana", about: "a master's student", profile: "reader" });
	assert.equal(t, "Ana edits; tell Ana. Ana is a master's student. limit=10");
	assert.equal(fill("{{User}} can undo. {{about}}", { profile: "scholar" }), "The user can undo. ");
	assert.match(languageRule("auto"), /language the user writes in/);
	assert.match(languageRule("Portuguese", "Ana"), /Always reply in Portuguese, even when Ana writes/);
	const sys = systemAddition("researcher", { ...CFG, profile: "reader", userName: "Ana", language: "auto" }, "/elsewhere");
	assert.match(sys, /research assistant for Ana/);
	assert.match(sys, /# Profile\n\nProfile: Reader[\s\S]*# Language\n\nReply in the language Ana writes in/);
	assert.doesNotMatch(sys, /Tiago|\{\{/);
});

test("profile command: changes tools and saves the setting", async () => {
	const dir = mkdtempSync(join(tmpdir(), "subsub-cfg-"));
	const file = join(dir, "config.json");
	writeFileSync(file, JSON.stringify({ language: "English", models: {} }));
	const old = process.env.SUBSUB_CONFIG;
	process.env.SUBSUB_CONFIG = file;
	try {
		const { fp, ctx, notes, toolCall } = await setup();
		assert.ok(fp.active.includes("scholar_export_bibliography"));
		await fp.commands.profile.handler("reader", ctx);
		assert.equal(JSON.parse(readFileSync(file, "utf8")).profile, "reader");
		assert.equal(JSON.parse(readFileSync(file, "utf8")).language, "English");
		assert.ok(!fp.active.includes("scholar_export_bibliography"));
		const r = await toolCall("scholar_export_bibliography", { manuscript: "/vault/x.qmd" });
		assert.match(r.reason, /Reader profile/);
		await fp.commands.profile.handler("nonsense", ctx);
		assert.match(notes.at(-1)!, /Unknown profile/);
		await fp.commands.profile.handler("", ctx);
		assert.match(notes.at(-1)!, /Profile: Reader[\s\S]*\* Reader/);
	} finally {
		if (old === undefined) delete process.env.SUBSUB_CONFIG;
		else process.env.SUBSUB_CONFIG = old;
	}
});

test("uv on Windows and the server command", () => {
	assert.equal(findUv({}, {}, "win32"), "uv");
	const home = mkdtempSync(join(tmpdir(), "uvhome-"));
	mkdirSync(join(home, "uv"), { recursive: true });
	writeFileSync(join(home, "uv", "uv.exe"), "");
	assert.equal(findUv({}, { LOCALAPPDATA: home }, "win32"), join(home, "uv", "uv.exe"));
});

test("init: new user with defaults, then again without replacing files", async () => {
	const home = mkdtempSync(join(tmpdir(), "subsub-init-"));
	const env = { SUBSUB_CONFIG: join(home, ".config", "subsub", "config.json"), ZOTERO_MCP_ENV: join(home, ".config", "zotero-local-mcp", "env") } as any;
	const said: string[] = [];
	const io = { ask: async (_q: string, d: string) => d, choose: async (_q: string, _o: unknown, d: string) => d, say: (l: string) => said.push(l) };
	const notFound = (async () => { throw new Error("no zotero"); }) as unknown as typeof fetch;
	const r = await runInit(io, { setup: "fmup", name: "Ana", email: "ana@example.org" }, env, { home, fetch: notFound });
	const cfg = JSON.parse(readFileSync(r.configFile, "utf8"));
	assert.equal(cfg.profile, "reader");
	assert.equal(cfg.userName, "Ana");
	assert.equal(cfg.setup, "fmup");
	assert.deepEqual(cfg.models, {});
	assert.equal(r.notes, join(home, "Documents", "Sub-Sub"));
	const vocab = join(r.notes, "Systems", "Zotero tags.md");
	assert.match(readFileSync(vocab, "utf8"), /topic\/cardiovascular/);
	assert.ok(existsSync(join(r.notes, "Inbox")) && existsSync(join(r.notes, "Systems", "Zotero agent.md")));
	const envText = readFileSync(r.envFile, "utf8");
	assert.match(envText, /ZOTERO_VAULT=.*Sub-Sub\nZOTERO_VOCAB=.*Zotero tags\.md\nZOTERO_CONTACT_EMAIL=ana@example\.org/);
	assert.ok(said.some((l) => /Zotero: not reachable/.test(l)) && said.some((l) => /FMUP model service/.test(l)));
	assert.equal(loadCfg(env).profile, "reader");
	// again: the tag list the user edited stays, other env lines stay, the profile changes
	writeFileSync(vocab, "MY TAGS");
	writeFileSync(r.envFile, `${envText}NCBI_API_KEY=abc\n`);
	const r2 = await runInit(io, { profile: "author", models: "opencode-go" }, env, { home, fetch: notFound });
	assert.equal(readFileSync(vocab, "utf8"), "MY TAGS");
	assert.match(readFileSync(r2.envFile, "utf8"), /NCBI_API_KEY=abc/);
	const cfg2 = JSON.parse(readFileSync(r2.configFile, "utf8"));
	assert.equal(cfg2.profile, "author");
	assert.equal(cfg2.userName, "Ana");
	assert.equal(cfg2.models.librarian, "opencode-go/glm-5.3-flash");
	assert.equal(r2.created.length, 0);
	assert.equal(upsertEnv("# c\nA=1\n", { A: "2", B: "3", C: "" }), "# c\nA=2\nB=3\n");
	// someone who already logged in to OpenCode Go gets the tested models by default
	const home3 = mkdtempSync(join(tmpdir(), "subsub-init3-"));
	mkdirSync(join(home3, "agent"));
	writeFileSync(join(home3, "agent", "auth.json"), JSON.stringify({ "opencode-go": { type: "api_key", key: "x" } }));
	const env3 = { SUBSUB_CONFIG: join(home3, "c.json"), ZOTERO_MCP_ENV: join(home3, "env"), SUBSUB_AGENT_DIR: join(home3, "agent") } as any;
	await runInit(io, {}, env3, { home: home3, fetch: notFound });
	assert.equal(JSON.parse(readFileSync(join(home3, "c.json"), "utf8")).models.researcher, "opencode-go/mimo-v2.6-pro");
});

test("doctor: checks and fixes", () => {
	const home = mkdtempSync(join(tmpdir(), "subsub-doc-"));
	const agent = join(home, "agent");
	mkdirSync(agent);
	const cfgFile = join(home, "config.json");
	writeFileSync(cfgFile, "{}");
	const cfg = { ...CFG, configFile: cfgFile, vault: home, serverDir: "/nonexistent", profile: "scholar" as const };
	const status = { zotero: "reachable", write_key_remembered: false, vocabulary: { path: "/v.md", tags: 26, facets: ["method", "type", "status"], problems: [] }, contact_email_set: false };
	const run = (cmd: string, args: string[]) =>
		args[0] === "--version" ? { status: 0, stdout: "uv 0.9.0", stderr: "" } : { status: 0, stdout: JSON.stringify(status), stderr: "" };
	const checks = runChecks(cfg, {}, { run, nodeVersion: "22.20.0", agentDir: agent });
	const by = Object.fromEntries(checks.map((c) => [c.name, c]));
	assert.ok(by.Node.ok && by.uv.ok && by.Zotero.ok && by["Zotero server"].ok);
	assert.match(by["Zotero server"].detail, new RegExp(`zotero-local-mcp ${SERVER_VERSION.replaceAll(".", "\\.")}`));
	assert.ok(by["Tag list"].warn && /propose topics/.test(by["Tag list"].fix!));
	assert.ok(by["Contact email"].warn);
	assert.equal(by["Model login"].ok, false);
	writeFileSync(join(agent, "auth.json"), JSON.stringify({ "opencode-go": { key: "x" } }));
	const down = { ...status, zotero: "unreachable", error: "connection refused" };
	const checks2 = runChecks(cfg, {}, { run: (c, a) => (a[0] === "--version" ? run(c, a) : { status: 0, stdout: JSON.stringify(down), stderr: "" }), nodeVersion: "20.1.0", agentDir: agent });
	const text = formatChecks(checks2);
	assert.match(text, /FIX +Node/);
	assert.match(text, /FIX +Zotero +connection refused\n +Start Zotero 10/);
	assert.match(text, /ok +Model login/);
	const noUv = runChecks(cfg, {}, { run: () => ({ status: null, stdout: "", stderr: "", error: "ENOENT" }), nodeVersion: "22.20.0", agentDir: agent });
	assert.equal(noUv.at(-1)!.name, "uv");
	assert.equal(noUv.at(-1)!.ok, false);
});

// ---------------------------------------------------------------- web view and shortcut

test("web: options, interface language, API keys", async () => {
	const { parseWebArgs, saveApiKey, uiLanguage } = await import("../src/web.ts");
	const o = parseWebArgs(["--no-open", "--port", "8123", "--librarian", "--provider", "fake", "--model", "m"]);
	assert.equal(o.open, false);
	assert.equal(o.port, 8123);
	assert.equal(o.librarian, true);
	assert.equal(o.idleMinutes, 10);
	assert.deepEqual(o.piArgs, ["--provider", "fake", "--model", "m"]);
	assert.equal(parseWebArgs(["--stay"]).idleMinutes, 0);
	assert.equal(uiLanguage("European Portuguese"), "pt");
	assert.equal(uiLanguage("português europeu"), "pt");
	assert.equal(uiLanguage("pt-PT"), "pt");
	assert.equal(uiLanguage("English"), "en");
	assert.equal(uiLanguage("auto"), "en");
	const dir = mkdtempSync(join(tmpdir(), "subsub-key-"));
	writeFileSync(join(dir, "auth.json"), JSON.stringify({ anthropic: { type: "oauth", access: "a" } }));
	saveApiKey(dir, "opencode-go", "  sk-test-123 ");
	const auth = JSON.parse(readFileSync(join(dir, "auth.json"), "utf8"));
	assert.deepEqual(auth["opencode-go"], { type: "api_key", key: "sk-test-123" });
	assert.equal(auth.anthropic.type, "oauth", "other credentials stay");
	assert.throws(() => saveApiKey(dir, "evil", "k"), /Unknown provider/);
	assert.throws(() => saveApiKey(dir, "openai", "two words"), /API key/);
});

test("shortcut: macOS app, Linux .desktop and Windows script quote paths safely", async () => {
	const { desktopEntry, macPlist, macScript, planFor, windowsScript } = await import("../src/shortcut.ts");
	const p = { ...planFor({ HOME: "/Users/ana" }, "darwin"), node: "/Users/ana/.subsub/node/bin/node", bin: "/Users/ana/it's here/bin/subsub.js" };
	const sh = macScript(p);
	assert.match(sh, /^#!\/bin\/sh/);
	assert.match(sh, /cd "\$HOME"/);
	assert.ok(sh.includes(`'/Users/ana/it'\\''s here/bin/subsub.js' web`));
	assert.match(macPlist("0.6.0"), /<key>LSUIElement<\/key><true\/>/);
	const lin = desktopEntry({ ...p, platform: "linux", node: "/usr/bin/node", bin: '/home/a "b"/bin/subsub.js', home: "/home/a" });
	assert.ok(lin.includes('Exec="/usr/bin/node" "/home/a \\"b\\"/bin/subsub.js" web'));
	assert.match(lin, /Terminal=false/);
	const win = windowsScript({ ...p, platform: "win32", node: "C:\\Users\\O'Neil\\node.exe", bin: "C:\\Users\\O'Neil\\subsub.js", home: "C:\\Users\\O'Neil", desktop: false });
	assert.ok(win.includes("$s.TargetPath = 'C:\\Users\\O''Neil\\node.exe'"));
	assert.ok(win.includes(`$s.Arguments = '"C:\\Users\\O''Neil\\subsub.js" web'`));
	assert.ok(!win.includes("Desktop"));
});
