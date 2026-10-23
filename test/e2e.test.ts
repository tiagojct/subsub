/**
 * End to end: real pi (RPC mode) + Sub-Sub + the real Python servers
 * (zotero-local-mcp) + a fake Zotero + a scripted fake model.
 *
 * Needs ZLM_DIR (default ~/Projects/zotero-local-mcp) with a synced uv environment.
 */

import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer, request as httpRequest, type Server } from "node:http";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ZLM = process.env.ZLM_DIR ?? join(homedir(), "Projects", "zotero-local-mcp");
const PI_CLI = join(ROOT, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");

const VOCAB = `---
required_facets: topic, status
single_facets: status
---
## topic
- \`topic/spirometry\` Spirometry.
- \`topic/asthma\` Asthma.
## status
- \`status/to-read\`
- \`status/read\`
`;

// ---------------------------------------------------------------- fake model

type Turn = { tool?: { name: string; args: Record<string, unknown> }; text?: string };
let script: Turn[] = [];
const requests: Array<Record<string, any>> = [];

function sse(res: any, chunks: unknown[]) {
	res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
	for (const c of chunks) res.write(`data: ${JSON.stringify(c)}\n\n`);
	res.write("data: [DONE]\n\n");
	res.end();
}

function startModel(): Promise<{ server: Server; url: string }> {
	return new Promise((resolve) => {
		const server = createServer((req, res) => {
			let body = "";
			req.on("data", (c) => (body += c));
			req.on("end", () => {
				const json = JSON.parse(body || "{}");
				requests.push(json);
				const turn = script.shift() ?? { text: "Done." };
				const base = { id: `c${requests.length}`, object: "chat.completion.chunk", created: 0, model: "fake-model" };
				const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
				if (turn.tool) {
					sse(res, [
						{ ...base, choices: [{ index: 0, delta: { role: "assistant", content: null, tool_calls: [{ index: 0, id: `call_${requests.length}`, type: "function", function: { name: turn.tool.name, arguments: JSON.stringify(turn.tool.args) } }] }, finish_reason: null }] },
						{ ...base, choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }], usage },
					]);
				} else {
					sse(res, [
						{ ...base, choices: [{ index: 0, delta: { role: "assistant", content: turn.text ?? "Done." }, finish_reason: null }] },
						{ ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage },
					]);
				}
			});
		});
		server.listen(0, "127.0.0.1", () => {
			const a = server.address() as { port: number };
			resolve({ server, url: `http://127.0.0.1:${a.port}/v1` });
		});
	});
}

// ---------------------------------------------------------------- fake Zotero

let zotero: ChildProcess;
let zoteroUrl = "";

function startZotero(): Promise<string> {
	return new Promise((resolve, reject) => {
		const python = process.platform === "win32" ? join(ZLM, ".venv", "Scripts", "python.exe") : join(ZLM, ".venv", "bin", "python");
		zotero = spawn(python, [join(HERE, "fixtures", "fake_zotero_server.py"), join(ZLM, "tests")]);
		zotero.stdout!.once("data", (d) => resolve(d.toString().trim()));
		zotero.once("error", reject);
	});
}

async function state(): Promise<Record<string, any>> {
	const r = await fetch(`${zoteroUrl}/__state`, { headers: { "User-Agent": "test" } });
	return (await r.json()) as Record<string, any>;
}

// ---------------------------------------------------------------- pi in RPC mode

class Pi {
	proc: ChildProcess;
	events: any[] = [];
	private buf = "";
	private waiters: Array<{ pred: (e: any) => boolean; resolve: (e: any) => void }> = [];
	confirmAnswer = true;
	confirms: any[] = [];
	stderr = "";

	constructor(env: NodeJS.ProcessEnv, cwd: string, args: string[], cli: string = PI_CLI) {
		this.proc = spawn(process.execPath, [cli, "--mode", "rpc", "--no-session", ...args], { cwd, env });
		this.proc.stderr!.on("data", (d) => (this.stderr += d.toString()));
		this.proc.stdout!.on("data", (d) => {
			this.buf += d.toString();
			let i;
			while ((i = this.buf.indexOf("\n")) >= 0) {
				const line = this.buf.slice(0, i).replace(/\r$/, "");
				this.buf = this.buf.slice(i + 1);
				if (!line.trim()) continue;
				const ev = JSON.parse(line);
				this.events.push(ev);
				if (ev.type === "extension_ui_request" && ev.method === "confirm") {
					this.confirms.push(ev);
					this.send({ type: "extension_ui_response", id: ev.id, confirmed: this.confirmAnswer });
				}
				this.waiters = this.waiters.filter((w) => (w.pred(ev) ? (w.resolve(ev), false) : true));
			}
		});
	}

	send(obj: unknown) {
		this.proc.stdin!.write(`${JSON.stringify(obj)}\n`);
	}

	wait(pred: (e: any) => boolean, ms = 60_000): Promise<any> {
		const hit = this.events.find(pred);
		if (hit) return Promise.resolve(hit);
		return new Promise((resolve, reject) => {
			const t = setTimeout(() => reject(new Error(`timeout; stderr:\n${this.stderr.slice(-2000)}`)), ms);
			this.waiters.push({ pred, resolve: (e) => (clearTimeout(t), resolve(e)) });
		});
	}

	async prompt(message: string) {
		const start = this.events.length;
		this.send({ id: `p${start}`, type: "prompt", message });
		await this.wait((e) => e.type === "agent_end" && this.events.indexOf(e) >= start, 120_000);
	}

	kill() {
		this.proc.kill();
	}
}

let model: { server: Server; url: string };
let work: string;
let vault: string;
let baseEnv: NodeJS.ProcessEnv;

before(async () => {
	assert.ok(existsSync(join(ZLM, ".venv")), `run uv sync in ${ZLM} first`);
	model = await startModel();
	zoteroUrl = await startZotero();
	work = mkdtempSync(join(tmpdir(), "subsub-e2e-"));
	vault = join(work, "vault");
	mkdirSync(join(vault, "Zotero"), { recursive: true });
	mkdirSync(join(vault, "Inbox"));
	writeFileSync(join(vault, "Zotero", "Zotero tags.md"), VOCAB);
	writeFileSync(join(vault, "Zotero", "Zotero agent.md"), "Shared rules: use vocabulary tags only.");
	const agentDir = join(work, "agent");
	mkdirSync(agentDir);
	writeFileSync(join(agentDir, "models.json"), JSON.stringify({
		providers: { fake: { baseUrl: model.url, api: "openai-completions", apiKey: "test", models: [{ id: "fake-model" }] } },
	}));
	writeFileSync(join(work, "subsub.json"), JSON.stringify({ serverDir: ZLM, vault, models: {}, defaultMode: "researcher" }));
	baseEnv = {
		...process.env,
		PI_CODING_AGENT_DIR: agentDir,
		PI_OFFLINE: "1",
		PI_SKIP_VERSION_CHECK: "1",
		PI_TELEMETRY: "0",
		SUBSUB_CONFIG: join(work, "subsub.json"),
		ZOTERO_MCP_ENV: join(work, "no-such.env"),
		ZOTERO_API_URL: zoteroUrl,
		ZOTERO_VOCAB: join(vault, "Zotero", "Zotero tags.md"),
		ZOTERO_VAULT: vault,
		ZOTERO_MCP_STATE: join(work, "state"),
	};
});

after(() => {
	model.server.close();
	zotero?.kill();
});

function startPi(extra: string[] = []) {
	return new Pi(baseEnv, vault, ["-e", join(ROOT, "extensions", "subsub.ts"), "--provider", "fake", "--model", "fake-model", ...extra]);
}

test("the Researcher makes a library change: previewed, approved and applied", { timeout: 180_000 }, async () => {
	const pi = startPi();
	try {
		script = [
			{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "AAAA2222", add: ["topic/spirometry"] }], dry_run: false } } },
			{ text: "Tagged." },
		];
		requests.length = 0;
		await pi.prompt("Tag AAAA2222 with topic/spirometry");
		// The model saw the library and search tools together, and the Sub-Sub prompt
		const sys = JSON.stringify(requests[0].messages[0]);
		assert.match(sys, /# Sub-Sub: Researcher mode\\n\\nYou are Sub-Sub/);
		assert.match(sys, /Shared rules: use vocabulary tags only/);
		const toolNames = requests[0].tools.map((t: any) => t.function.name);
		assert.ok(toolNames.includes("zotero_tag_items") && toolNames.includes("scholar_search_pubmed"));
		assert.ok(!toolNames.includes("bash"));
		// Tiago saw the server preview
		assert.equal(pi.confirms.length, 1);
		assert.match(pi.confirms[0].message, /1 item\(s\) would change[\s\S]*topic\/spirometry/);
		const items = await state();
		assert.ok(items.AAAA2222.tags.some((t: any) => t.tag === "topic/spirometry"));
		assert.ok(items.AAAA2222.tags.some((t: any) => t.tag === "_agent"));
	} finally {
		pi.kill();
	}
});

test("declined change is not applied and the model is told", { timeout: 180_000 }, async () => {
	const pi = startPi(["--librarian"]);
	pi.confirmAnswer = false;
	try {
		script = [
			{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "BBBB3333", add: ["topic/asthma"] }], dry_run: false } } },
			{ text: "OK, what should I change?" },
		];
		requests.length = 0;
		await pi.prompt("Tag BBBB3333");
		assert.equal(pi.confirms.length, 1);
		const items = await state();
		assert.ok(!items.BBBB3333.tags.some((t: any) => t.tag === "topic/asthma"));
		const toolMsg = requests[1].messages.find((m: any) => m.role === "tool");
		assert.match(JSON.stringify(toolMsg), /did not approve/);
	} finally {
		pi.kill();
	}
});

test("the Librarian has the library tools and no search tools; reads work", { timeout: 180_000 }, async () => {
	const pi = startPi(["--librarian"]);
	try {
		script = [{ tool: { name: "zotero_find_items", args: { query: "asthma" } } }, { text: "Found one." }];
		requests.length = 0;
		await pi.prompt("What do I have on asthma?");
		const toolNames = requests[0].tools.map((t: any) => t.function.name);
		assert.ok(toolNames.includes("zotero_find_items") && toolNames.includes("zotero_tag_items") && !toolNames.includes("scholar_search_pubmed"));
		const toolMsg = requests[1].messages.find((m: any) => m.role === "tool");
		assert.match(JSON.stringify(toolMsg), /BBBB3333/);
		assert.equal(pi.confirms.length, 0);
	} finally {
		pi.kill();
	}
});

const STARBUCK = process.env.STARBUCK_DIR ?? join(homedir(), "Projects", "starbuck");

test("starbuck add-on: the verify server starts and checks a manuscript without asking", {
	timeout: 180_000,
	skip: !existsSync(join(STARBUCK, ".venv")) && `run uv sync in ${STARBUCK} first`,
}, async () => {
	const cf = join(work, "subsub-starbuck.json");
	writeFileSync(cf, JSON.stringify({ serverDir: ZLM, vault, models: {}, defaultMode: "researcher", addons: ["starbuck"], starbuckDir: STARBUCK }));
	mkdirSync(join(vault, "Drafts"), { recursive: true });
	// No reference needs the network: the cited key has no entry, the one entry is not cited.
	writeFileSync(join(vault, "Drafts", "refs.json"), JSON.stringify([{ id: "miller", title: "Standardisation of spirometry", type: "article-journal" }]));
	const ms = join(vault, "Drafts", "paper.md");
	writeFileSync(ms, "---\nbibliography: refs.json\n---\n\nSpirometry needs standards [@absent].\n");
	const pi = new Pi({ ...baseEnv, SUBSUB_CONFIG: cf }, vault, ["-e", join(ROOT, "extensions", "subsub.ts"), "--provider", "fake", "--model", "fake-model"]);
	try {
		script = [{ tool: { name: "verify_check_manuscript", args: { path: ms, formats: [] } } }, { text: "Checked." }];
		requests.length = 0;
		await pi.prompt("Check the references of Drafts/paper.md");
		const toolNames = requests[0].tools.map((t: any) => t.function.name);
		assert.ok(["verify_check_manuscript", "verify_check_references", "verify_prepare_claims", "verify_record_claims"].every((n) => toolNames.includes(n)));
		assert.match(JSON.stringify(requests[0].messages[0]), /Reference checks \(Starbuck/);
		const toolMsg = JSON.stringify(requests[1].messages.find((m: any) => m.role === "tool"));
		assert.match(toolMsg, /missing_entries/);
		assert.match(toolMsg, /absent/);
		assert.equal(pi.confirms.length, 0);
		assert.ok(existsSync(join(vault, "Drafts", "_starbuck", "paper-references.json")));
	} finally {
		pi.kill();
	}
});

test("the subsub command: own agent folder, package, prompts, vault as start folder, English", { timeout: 180_000 }, async () => {
	const home = join(work, "home");
	const agentDir = join(home, ".subsub", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(join(agentDir, "models.json"), readFileSync(join(work, "agent", "models.json")));
	const env: NodeJS.ProcessEnv = { ...baseEnv, HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir };
	delete env.PI_CODING_AGENT_DIR;
	const pi = new Pi(env, home, ["--provider", "fake", "--model", "fake-model"], join(ROOT, "bin", "subsub.js"));
	try {
		script = [{ text: "Hello." }];
		requests.length = 0;
		await pi.prompt("/lit-note jacinto2026");
		const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
		assert.deepEqual(settings.packages, [realpathSync(ROOT)]);
		const sys = JSON.stringify(requests[0].messages[0]);
		assert.match(sys, /# Sub-Sub: Researcher mode\\n\\nYou are Sub-Sub/);
		assert.match(sys, /Always reply in English/);
		// Compare paths with / and in lower case: the prompt is JSON (backslashes doubled), and on
		// Windows the folder may appear with / or \\, in its short 8.3 form (RUNNER~1) or in full.
		const norm = (s: string) => s.toLowerCase().replace(/\\\\/g, "/").replace(/\\/g, "/");
		const forms = [vault, realpathSync(vault), realpathSync.native(vault)].map(norm);
		const text = norm(sys);
		const at = text.indexOf("working directory");
		assert.ok(forms.some((f) => text.includes(f)), `started in the vault; prompt: ${at >= 0 ? text.slice(at, at + 200) : text.slice(0, 200)}; vault: ${forms.join(" | ")}`);
		const user = JSON.stringify(requests[0].messages.at(-1));
		assert.match(user, /Make a literature note for jacinto2026/);
		assert.doesNotMatch(user, /^"\/lit-note/);
		requests.length = 0;
		await pi.prompt("/verify Drafts/paper.md");
		assert.match(JSON.stringify(requests[0].messages.at(-1)), /Check the references of Drafts\/paper.md with Starbuck/);
		requests.length = 0;
		await pi.prompt("/lit FeNO in children");
		assert.match(JSON.stringify(requests[0].messages.at(-1)), /Do a literature review on: FeNO in children/);
	} finally {
		pi.kill();
	}
});

test("subsub-bench: changes are recorded and blocked, writes stay in the run folder, scoring", { timeout: 240_000 }, async () => {
	const { runOne, scoreRun } = await import("../src/bench.ts");
	const home = join(work, "bench-home");
	const agentDir = join(home, ".subsub", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(join(agentDir, "models.json"), readFileSync(join(work, "agent", "models.json")));
	const env: NodeJS.ProcessEnv = { HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir, PI_CODING_AGENT_DIR: "" };
	const cf = join(work, "bench-config.json");
	writeFileSync(cf, JSON.stringify({ serverDir: ZLM, vault, models: { librarian: "fake/fake-model", researcher: "fake/fake-model" } }));
	const base = { ...baseEnv, ...env };
	delete base.PI_CODING_AGENT_DIR;
	const tasks: any = {
		tagging: { keys: [] },
		facet_fix: { missing_topic: ["BBBB3333"], missing_status: [] },
		import: { in_library: null, new: [] },
		lit_note: { key: "AAAA2222", citekey: "x2020", title: "X" },
		synthesis: null,
		search: { topic: null, description: "", year_from: 2024 },
	};
	const before = await state();

	// librarian: a tag change is previewed, recorded and not applied
	script = [
		{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "BBBB3333", add: ["topic/spirometry"] }], dry_run: false } } },
		{ text: "Proposed topic/spirometry for BBBB3333." },
	];
	const out1 = join(work, "bench", "M1", "facet_fix");
	const s1 = await runOne({ role: "librarian", task: "facet_fix", code: "M1", model: "fake-model", provider: "fake", prompt: "fix", out: out1, cwd: vault, configFile: cf, timeoutSec: 120, extraEnv: { ...base, SUBSUB_CONFIG: cf } });
	assert.equal(s1.settled, true, JSON.stringify(s1));
	assert.equal(s1.finalText, "Proposed topic/spirometry for BBBB3333.");
	assert.ok(s1.stats?.tokens);
	const after = await state();
	assert.deepEqual(after.BBBB3333.tags, before.BBBB3333.tags);
	const sc1 = scoreRun("facet_fix", out1, tasks, [], {});
	assert.equal(sc1.expected, 1);
	assert.equal(sc1.fixed, 1);
	assert.equal(sc1.change_calls, 1);
	assert.equal(sc1.preview_errors, 0);

	// researcher: a note in the run folder is written; a write elsewhere is blocked
	const out2 = join(work, "bench", "M1", "lit_note");
	script = [
		{ tool: { name: "write", args: { path: join(out2, "x2020.md"), content: "# X\n\nSee [[x2020]] and [[nobody1999]].\n" } } },
		{ tool: { name: "write", args: { path: join(vault, "Inbox", "stray.md"), content: "no" } } },
		{ text: "Note written." },
	];
	const s2 = await runOne({ role: "researcher", task: "lit_note", code: "M1", model: "fake-model", provider: "fake", prompt: "note", out: out2, cwd: vault, configFile: cf, timeoutSec: 120, extraEnv: { ...base, SUBSUB_CONFIG: cf } });
	assert.equal(s2.settled, true, JSON.stringify(s2));
	assert.ok(existsSync(join(out2, "x2020.md")));
	assert.ok(!existsSync(join(vault, "Inbox", "stray.md")));
	const sc2 = scoreRun("lit_note", out2, tasks, [{ key: "AAAA2222", citekey: "x2020", doi: null, pmid: null, title: "X", year: "2020" }], {});
	assert.equal(sc2.written, true);
	assert.equal(sc2.path_blocked, 1);
	assert.equal(sc2.cites_itself, true);
	assert.deepEqual(sc2.citekeys_unknown, ["nobody1999"]);
});

test("lists sent as strings work; misnamed fields are refused with a clear error", { timeout: 180_000 }, async () => {
	const pi = startPi(["--librarian"]);
	try {
		script = [
			{ tool: { name: "zotero_find_items", args: { tags: '["status/read"]' } } },
			{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "AAAA2222", topics: ["topic/asthma"] }], dry_run: false } } },
			{ text: "Done." },
		];
		requests.length = 0;
		await pi.prompt("find and tag");
		const tools = requests.at(-1)!.messages.filter((m: any) => m.role === "tool");
		const found = JSON.stringify(tools[0]);
		assert.match(found, /BBBB3333/, found.slice(0, 400));
		assert.doesNotMatch(found, /Validation failed/);
		const refused = JSON.stringify(tools[1]);
		assert.match(refused, /topics/);
		assert.equal(pi.confirms.length, 0); // refused before any preview
	} finally {
		pi.kill();
	}
});

test("subsub init and subsub doctor from the command line", { timeout: 180_000 }, async () => {
	const { spawnSync } = await import("node:child_process");
	const home = mkdtempSync(join(tmpdir(), "subsub-init-e2e-"));
	const env: NodeJS.ProcessEnv = {
		...baseEnv,
		SUBSUB_CONFIG: join(home, "config.json"),
		ZOTERO_MCP_ENV: join(home, "zotero.env"),
		SUBSUB_AGENT_DIR: join(home, "agent"),
	};
	const cli = join(ROOT, "bin", "subsub.js");
	const init = spawnSync(process.execPath, [cli, "init", "--yes", "--notes", join(home, "Notes"), "--tags", "health-informatics", "--name", "Ana"], { env, encoding: "utf8" });
	assert.equal(init.status, 0, init.stderr);
	assert.match(init.stdout, /Created: .*Zotero tags\.md/);
	assert.ok(existsSync(join(home, "Notes", "Zotero", "Zotero agent.md")));
	const cfg = JSON.parse(readFileSync(join(home, "config.json"), "utf8"));
	assert.equal(cfg.userName, "Ana");
	assert.equal(cfg.profile, undefined, "no profiles");
	// run the server from this checkout, not from PyPI
	writeFileSync(join(home, "config.json"), JSON.stringify({ ...cfg, serverDir: ZLM }));
	const doc = spawnSync(process.execPath, [cli, "doctor"], { env, encoding: "utf8", timeout: 120_000 });
	assert.match(doc.stdout, /ok +Zotero server +from /);
	assert.match(doc.stdout, /ok +Zotero +reachable/);
	assert.match(doc.stdout, /FIX +Model login[\s\S]*\/login/);
	assert.equal(doc.status, 1);
});

// ---------------------------------------------------------------- the web view

type Reply = { status: number; headers: Record<string, any>; body: string };

function call(port: number, method: string, path: string, opts: { headers?: Record<string, string>; body?: unknown } = {}): Promise<Reply> {
	return new Promise((resolve, reject) => {
		const data = opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
		const r = httpRequest({ host: "127.0.0.1", port, method, path, headers: { Host: `127.0.0.1:${port}`, ...(data ? { "Content-Type": "application/json" } : {}), ...opts.headers } }, (res) => {
			let body = "";
			res.on("data", (c) => (body += c));
			res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
		});
		r.on("error", reject);
		if (data) r.write(data);
		r.end();
	});
}

class Stream {
	events: any[] = [];
	private waiters: Array<{ pred: (e: any) => boolean; resolve: (e: any) => void }> = [];
	private req: ReturnType<typeof httpRequest>;
	constructor(port: number, cookie: string) {
		let buf = "";
		this.req = httpRequest({ host: "127.0.0.1", port, path: "/api/events", headers: { Host: `127.0.0.1:${port}`, Cookie: cookie } }, (res) => {
			res.setEncoding("utf8");
			res.on("data", (c: string) => {
				buf += c;
				let i;
				while ((i = buf.indexOf("\n\n")) >= 0) {
					const chunk = buf.slice(0, i);
					buf = buf.slice(i + 2);
					const line = chunk.split("\n").find((l) => l.startsWith("data: "));
					if (!line) continue;
					const ev = JSON.parse(line.slice(6));
					this.events.push(ev);
					this.waiters = this.waiters.filter((w) => (w.pred(ev) ? (w.resolve(ev), false) : true));
				}
			});
		});
		this.req.end();
	}
	wait(pred: (e: any) => boolean, ms = 90_000, from = 0): Promise<any> {
		const hit = this.events.slice(from).find(pred);
		if (hit) return Promise.resolve(hit);
		return new Promise((resolve, reject) => {
			const t = setTimeout(() => reject(new Error(`timeout; events: ${this.events.map((e) => e.type).join(",")}`)), ms);
			this.waiters.push({ pred, resolve: (e) => (clearTimeout(t), resolve(e)) });
		});
	}
	close() {
		this.req.destroy();
	}
}

test("the web view: the page answers Sub-Sub's approval; other sites and hosts are refused", { timeout: 240_000 }, async () => {
	const home = join(work, "web-home");
	const agentDir = join(home, ".subsub", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(join(agentDir, "models.json"), readFileSync(join(work, "agent", "models.json")));
	const env: NodeJS.ProcessEnv = { ...baseEnv, HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir };
	delete env.PI_CODING_AGENT_DIR;
	const proc = spawn(process.execPath, [join(ROOT, "bin", "subsub.js"), "web", "--no-open", "--idle", "0", "--librarian", "--provider", "fake", "--model", "fake-model"], { cwd: vault, env });
	let out = "";
	let err = "";
	proc.stderr!.on("data", (d) => (err += d.toString()));
	const url: string = await new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(`no URL; stderr: ${err}`)), 60_000);
		proc.stdout!.on("data", (d) => {
			out += d.toString();
			const m = out.match(/http:\/\/127\.0\.0\.1:\d+\/\?t=[\w-]+/);
			if (m) {
				clearTimeout(t);
				resolve(m[0]);
			}
		});
	});
	const port = Number(new URL(url).port);
	const token = new URL(url).searchParams.get("t")!;
	let stream: Stream | undefined;
	try {
		// Without the key, or with a wrong one, nothing is served.
		assert.equal((await call(port, "GET", "/")).status, 403);
		assert.equal((await call(port, "GET", "/api/ping")).status, 403);
		assert.equal((await call(port, "GET", "/?t=wrong")).status, 403);
		const first = await call(port, "GET", `/?t=${token}`);
		assert.equal(first.status, 303);
		const cookie = String(first.headers["set-cookie"][0]).split(";")[0];
		assert.match(String(first.headers["set-cookie"][0]), /HttpOnly; SameSite=Strict/);
		const ok = { Cookie: cookie };
		// The page, with a strict content policy; no files outside the web folder.
		const page = await call(port, "GET", "/", { headers: ok });
		assert.equal(page.status, 200);
		assert.match(page.headers["content-security-policy"], /script-src 'self'/);
		assert.equal((await call(port, "GET", "/..%2F..%2Fpackage.json", { headers: ok })).status, 404);
		// Another host name (DNS rebinding), another site, or a form post: refused.
		assert.equal((await call(port, "GET", "/api/ping", { headers: { ...ok, Host: "evil.example" } })).status, 403);
		assert.equal((await call(port, "POST", "/api/prompt", { headers: { ...ok, Origin: "http://evil.example" }, body: { message: "hi" } })).status, 403);
		assert.equal((await call(port, "POST", "/api/prompt", { headers: { ...ok, "Content-Type": "text/plain" }, body: "message=hi" })).status, 415);
		assert.equal((await call(port, "POST", "/api/prompt", { headers: { ...ok, "Sec-Fetch-Site": "cross-site" }, body: { message: "hi" } })).status, 403);

		// The Open button opens notes and documents in the notes folder, never programs.
		writeFileSync(join(vault, "run-me.command"), "#!/bin/sh\necho hi\n");
		assert.equal((await call(port, "POST", "/api/open", { headers: ok, body: { path: "run-me.command" } })).status, 403);
		assert.equal((await call(port, "POST", "/api/open", { headers: ok, body: { path: join(home, "..", "subsub.json") } })).status, 404);
		// A link inside the notes folder to a document outside it is refused too.
		writeFileSync(join(work, "outside.md"), "not in the notes folder");
		symlinkSync(join(work, "outside.md"), join(vault, "link-out.md"));
		assert.equal((await call(port, "POST", "/api/open", { headers: ok, body: { path: "link-out.md" } })).status, 404);

		stream = new Stream(port, cookie);
		const hello = await stream.wait((e) => e.type === "hello");
		assert.equal(hello.lang, "en");
		assert.ok(Array.isArray(hello.commands) && hello.commands.some((c: any) => c.name === "tag-batch"));
		assert.equal(hello.commands.find((c: any) => c.name === "lit-note")?.hint, "<citekey or title words>", "argument hints from the prompt files");
		await stream.wait((e) => e.type === "subsub_state" && e.state?.mode === "librarian");

		// A library change: Sub-Sub asks, the page answers, the change is made.
		script = [
			{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "BBBB3333", add: ["topic/asthma"] }], dry_run: false } } },
			{ text: "Tagged." },
		];
		requests.length = 0;
		const mark = stream.events.length;
		assert.equal((await call(port, "POST", "/api/prompt", { headers: ok, body: { message: "Tag BBBB3333 with topic/asthma" } })).status, 200);
		const ask = await stream.wait((e) => e.type === "extension_ui_request" && e.method === "confirm", 90_000, mark);
		assert.match(ask.message, /1 item\(s\) would change[\s\S]*topic\/asthma/);
		assert.ok(!(await state()).BBBB3333.tags.some((t: any) => t.tag === "topic/asthma"), "nothing changes before the answer");
		assert.equal((await call(port, "POST", "/api/dialog", { headers: ok, body: { id: "not-a-dialog", confirmed: true } })).status, 404);
		assert.equal((await call(port, "POST", "/api/dialog", { headers: ok, body: { id: ask.id, confirmed: true } })).status, 200);
		await stream.wait((e) => e.type === "agent_settled", 90_000, mark);
		assert.ok((await state()).BBBB3333.tags.some((t: any) => t.tag === "topic/asthma"));
		const texts = stream.events.slice(mark).filter((e) => e.type === "message_end" && e.message.role === "assistant").map((e) => JSON.stringify(e.message.content));
		assert.ok(texts.some((x) => x.includes("Tagged.")));

		// Mode switch through the page, and the conversation list.
		await call(port, "POST", "/api/prompt", { headers: ok, body: { message: "/researcher" } });
		await stream.wait((e) => e.type === "subsub_state" && e.state?.mode === "researcher", 30_000, mark);
		const sessions = JSON.parse((await call(port, "GET", "/api/sessions", { headers: ok })).body).sessions;
		assert.ok(sessions.length >= 1);
		assert.match(sessions[0].first, /Tag BBBB3333/);

		// /read asks why as a choice that the page answers; then the reading goes to the model under its command line.
		script = [{ text: "Read." }];
		const mark4 = stream.events.length;
		const posted = call(port, "POST", "/api/prompt", { headers: ok, body: { message: "/read jacinto2026" } });
		const why = await stream.wait((e) => e.type === "extension_ui_request" && e.method === "select", 30_000, mark4);
		assert.equal(why.options.length, 4);
		assert.equal((await call(port, "POST", "/api/dialog", { headers: ok, body: { id: why.id, value: why.options[0] } })).status, 200);
		assert.equal((await posted).status, 200);
		const reading = await stream.wait((e) => e.type === "message_start" && e.message.role === "user", 30_000, mark4);
		assert.match(JSON.stringify(reading.message.content), /\/read background jacinto2026\\n/);
		await stream.wait((e) => e.type === "agent_settled", 90_000, mark4);

		// The notes pane: notes in the Sub-Sub folder by path or by [[name]], never a file outside it.
		mkdirSync(join(vault, "Literature"), { recursive: true });
		writeFileSync(join(vault, "Literature", "jacinto2026.md"), "---\ncitekey: jacinto2026\n---\n# FeNO\n");
		const listed = JSON.parse((await call(port, "GET", "/api/notes", { headers: ok })).body);
		assert.ok(listed.notes.some((n: any) => n.rel.replaceAll("\\", "/") === "Literature/jacinto2026.md"));
		const byName = await call(port, "GET", "/api/note?path=jacinto2026", { headers: ok });
		assert.equal(byName.status, 200);
		assert.match(JSON.parse(byName.body).text, /# FeNO/);
		assert.equal((await call(port, "GET", `/api/note?path=${encodeURIComponent("Literature/jacinto2026.md")}`, { headers: ok })).status, 200);
		for (const bad of ["../outside.md", "link-out.md", "run-me.command"]) {
			assert.notEqual((await call(port, "GET", `/api/note?path=${encodeURIComponent(bad)}`, { headers: ok })).status, 200, bad);
		}

		// Images next to a note (a figure cut out of a PDF): shown from the Sub-Sub folder only.
		mkdirSync(join(vault, "Literature", "figures"), { recursive: true });
		writeFileSync(join(vault, "Literature", "figures", "fig.png"), Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex"));
		const img = await call(port, "GET", `/api/note-file?path=${encodeURIComponent(join(vault, "Literature", "figures", "fig.png"))}`, { headers: ok });
		assert.equal(img.status, 200);
		assert.equal(img.headers["content-type"], "image/png");
		assert.equal((await call(port, "GET", `/api/note-file?path=${encodeURIComponent("Literature/jacinto2026.md")}`, { headers: ok })).status, 415, "only images");
		assert.equal((await call(port, "GET", `/api/note-file?path=${encodeURIComponent("../outside.md")}`, { headers: ok })).status, 404);

		// The library search goes through the Zotero server.
		const found = JSON.parse((await call(port, "GET", "/api/library?q=Asthma", { headers: ok })).body);
		assert.ok(found.items?.some((i: any) => i.key === "BBBB3333"), JSON.stringify(found));

		// Conversations: rename; the open one cannot be deleted; another goes to the trash folder, not away.
		const cur = JSON.parse((await call(port, "GET", "/api/state", { headers: ok })).body).sessionFile;
		assert.equal((await call(port, "POST", "/api/session/name", { headers: ok, body: { path: cur, name: "FeNO reading" } })).status, 200);
		const named = JSON.parse((await call(port, "GET", "/api/sessions", { headers: ok })).body).sessions;
		assert.ok(named.some((x: any) => x.path === cur && x.name === "FeNO reading"), JSON.stringify(named));
		assert.equal((await call(port, "POST", "/api/session/trash", { headers: ok, body: { path: cur } })).status, 409);
		assert.equal((await call(port, "POST", "/api/new", { headers: ok, body: {} })).status, 200);
		script = [{ text: "Hello." }];
		const mark5 = stream.events.length;
		await call(port, "POST", "/api/prompt", { headers: ok, body: { message: "Hello" } });
		await stream.wait((e) => e.type === "agent_settled", 90_000, mark5);
		assert.equal((await call(port, "POST", "/api/session/trash", { headers: ok, body: { path: cur } })).status, 200);
		assert.ok(!JSON.parse((await call(port, "GET", "/api/sessions", { headers: ok })).body).sessions.some((x: any) => x.path === cur));
		assert.ok(existsSync(join(home, ".subsub", "trash", relative(join(agentDir, "sessions"), cur))), "same subfolder as under sessions/");

		// Reference checks: the toggle saves the setting and restarts pi with the verify server.
		if (existsSync(join(STARBUCK, ".venv"))) {
			const cf = baseEnv.SUBSUB_CONFIG!;
			const saved = readFileSync(cf, "utf8");
			writeFileSync(cf, JSON.stringify({ ...JSON.parse(saved), starbuckDir: STARBUCK }));
			try {
				assert.equal((await call(port, "POST", "/api/addons", { headers: ok, body: { starbuck: "yes" } })).status, 400);
				const mark2 = stream.events.length;
				assert.equal((await call(port, "POST", "/api/addons", { headers: ok, body: { starbuck: true } })).status, 200);
				const on = await stream.wait((e) => e.type === "subsub_state" && e.state?.starbuck === true, 90_000, mark2);
				assert.deepEqual(on.state.down, []);
				assert.deepEqual(JSON.parse(readFileSync(cf, "utf8")).addons, ["starbuck"]);
				const mark3 = stream.events.length;
				assert.equal((await call(port, "POST", "/api/addons", { headers: ok, body: { starbuck: false } })).status, 200);
				await stream.wait((e) => e.type === "subsub_state" && e.state?.starbuck === false, 90_000, mark3);
				assert.equal(JSON.parse(readFileSync(cf, "utf8")).addons, undefined);
			} finally {
				writeFileSync(cf, saved);
			}
		}
	} finally {
		stream?.close();
		proc.kill();
	}
});

test("the npm package: installed with npm install -g, it starts pi with Sub-Sub", { timeout: 600_000, skip: process.env.SUBSUB_TEST_PACK !== "1" && "set SUBSUB_TEST_PACK=1 (packs and installs, needs the npm registry)" }, async () => {
	const { execFileSync } = await import("node:child_process");
	const tmp = mkdtempSync(join(tmpdir(), "subsub-pack-"));
	const npm = process.platform === "win32" ? "npm.cmd" : "npm";
	execFileSync(npm, ["pack", "--pack-destination", tmp], { cwd: ROOT, stdio: "ignore" });
	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
	// npm pack names a scoped package "scope-name-version.tgz"
	const tgz = join(tmp, `${pkg.name.replace(/^@/, "").replace("/", "-")}-${pkg.version}.tgz`);
	execFileSync(npm, ["install", "-g", "--prefix", join(tmp, "prefix"), tgz], { stdio: "ignore" });
	const pkgDir = process.platform === "win32" ? join(tmp, "prefix", "node_modules", ...pkg.name.split("/")) : join(tmp, "prefix", "lib", "node_modules", ...pkg.name.split("/"));
	const bin = join(pkgDir, "bin", "subsub.js");
	const home = join(work, "pack-home");
	const agentDir = join(home, ".subsub", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(join(agentDir, "models.json"), readFileSync(join(work, "agent", "models.json")));
	const env: NodeJS.ProcessEnv = { ...baseEnv, HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir };
	delete env.PI_CODING_AGENT_DIR;
	const pi = new Pi(env, home, ["--provider", "fake", "--model", "fake-model"], bin);
	try {
		script = [{ text: "Hello." }];
		requests.length = 0;
		await pi.prompt("/lit-note jacinto2026");
		const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
		assert.ok(String(settings.packages[0]).includes("node_modules"), "the installed copy is the package");
		const sys = JSON.stringify(requests[0].messages[0]);
		assert.match(sys, /# Sub-Sub: Researcher mode\\n\\nYou are Sub-Sub/);
		assert.match(sys, /# Language/);
	} finally {
		pi.kill();
	}
});

// The terminal look in a real terminal (a pseudo-terminal: macOS and Linux). The approval overlay is the gate for library changes, so it is the main check.
const PTY = { skip: process.platform === "win32" ? "no pseudo-terminal on Windows" : false, timeout: 240_000 };

async function inTerminal(steps: unknown[], cols = 100, name = "last", command: string[] = ["--here"]): Promise<{ text: string; raw: string; exit: number | null; failed: string | null }> {
	const home = join(work, "home-pty");
	const agentDir = join(home, ".subsub", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(join(agentDir, "models.json"), readFileSync(join(work, "agent", "models.json")));
	const env = { ...baseEnv, HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir, TERM: "xterm-256color", COLORTERM: "truecolor", LANG: "en_GB.UTF-8" } as Record<string, string>;
	delete env.PI_CODING_AGENT_DIR;
	const specFile = join(work, "pty-spec.json");
	writeFileSync(specFile, JSON.stringify({ argv: [process.execPath, join(ROOT, "bin", "subsub.js"), ...command, "--provider", "fake", "--model", "fake-model"], cwd: vault, env, cols, rows: 30, steps }));
	const out = await new Promise<string>((resolve, reject) => {
		const p = spawn("python3", [join(HERE, "fixtures", "pty_drive.py"), specFile]);
		let data = "";
		p.stdout.on("data", (d) => (data += d.toString()));
		p.on("error", reject);
		p.on("close", () => resolve(data));
	});
	writeFileSync(join(work, `pty-${name}.json`), out); // for a look at what the terminal showed
	return JSON.parse(out);
}

const noRed = (raw: string) => assert.doesNotMatch(raw, /\x1b\[(?:3[01]|9[01])m|\x1b\[38;5;(?:1|9)m|38;2;207;92;92/, "no red anywhere in the stream");

test("terminal look: banner, footer, mode switch, and exit", PTY, async () => {
	const r = await inTerminal([
		{ wait: "Researcher", timeout: 90 },
		{ wait: "Zotero: 2 items", timeout: 60, anywhere: true },
		{ sleep: 1 },
		{ send: "/librarian\r" },
		{ wait: "Librarian mode", timeout: 30 },
		{ send: "/researcher\r" },
		{ wait: "Researcher mode", timeout: 30 },
	], 100, "mode");
	assert.equal(r.failed, null, r.text.slice(-1500));
	assert.match(r.text, /Sub-Sub|╔═╗/);
	assert.match(r.text, /Librarian \| /, "the footer follows the mode");
	assert.match(r.text, /tokens/, "the footer shows the usage");
	noRed(r.raw);
	assert.equal(r.exit, 0, "Ctrl+C twice ends Sub-Sub");
});

test("terminal look: the approval overlay: n leaves the library as it is, y applies the change", PTY, async () => {
	const ask = (answer: string, reply: string) => [
		{ wait: "Researcher", timeout: 90 },
		{ wait: "Zotero: 2 items", timeout: 60, anywhere: true },
		{ sleep: 1 },
		{ send: "Tag AAAA2222 with status/to-read\r" },
		{ wait: "apply tag_items", timeout: 90 },
		{ sleep: 0.9 },
		{ send: "\r" }, // Enter does nothing
		{ sleep: 0.3 },
		{ send: answer },
		{ wait: reply, timeout: 90 },
	];
	script = [{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "AAAA2222", add: ["status/to-read"] }], dry_run: false } } }, { text: "Left it alone." }];
	requests.length = 0;
	const no = await inTerminal(ask("n", "Left it alone."), 100, "no");
	assert.equal(no.failed, null, no.text.slice(-1500));
	assert.match(no.text, /y apply\s+n leave it as it is/);
	assert.ok(!(await state()).AAAA2222.tags.some((t: any) => t.tag === "status/to-read"), "n changes nothing");
	assert.match(JSON.stringify(requests[1].messages.find((m: any) => m.role === "tool")), /did not approve/);
	noRed(no.raw);

	script = [{ tool: { name: "zotero_tag_items", args: { changes: [{ key: "AAAA2222", add: ["status/to-read"] }], dry_run: false } } }, { text: "Applied." }];
	requests.length = 0;
	const yes = await inTerminal(ask("y", "Applied."), 100, "yes");
	assert.equal(yes.failed, null, yes.text.slice(-1500));
	assert.ok((await state()).AAAA2222.tags.some((t: any) => t.tag === "status/to-read"), "y applies the change");
	noRed(yes.raw);
	assert.equal(yes.exit, 0, `exit ${yes.exit}`);
});

test("terminal look: ASCII glyphs and a narrow terminal", PTY, async () => {
	const prev = process.env.SUBSUB_ASCII;
	baseEnv.SUBSUB_ASCII = "1";
	try {
		const r = await inTerminal([{ wait: "Researcher", timeout: 90 }, { wait: "Zotero: 2 items", timeout: 30, anywhere: true }], 44, "ascii");
		assert.equal(r.failed, null, r.text.slice(-1500));
		// pi draws its own editor borders with box-drawing glyphs; the banner, footer and rules of Sub-Sub are ASCII.
		assert.doesNotMatch(r.text, /[▰▱┄┈╔╗╚╝╦╩╠║]/, "no box-drawing glyphs of Sub-Sub");
	} finally {
		if (prev === undefined) delete baseEnv.SUBSUB_ASCII;
		else baseEnv.SUBSUB_ASCII = prev;
	}
});

test("subsub tui: a full-screen client of pi: the approval screen applies only on y, and Ctrl+C twice quits", PTY, async () => {
	const ask = (answer: string, reply: string) => [
		{ wait: "Researcher", timeout: 90 },
		{ wait: "Zotero: 2 items", timeout: 60, anywhere: true },
		{ sleep: 1 },
		{ send: "Tag BBBB3333 with topic/spirometry\r" },
		{ wait: "apply tag_items", timeout: 90 },
		{ sleep: 0.9 },
		{ send: "\r" }, // Enter does nothing
		{ sleep: 0.3 },
		{ send: answer },
		{ wait: reply, timeout: 90 },
	];
	const tool = (key: string) => [{ tool: { name: "zotero_tag_items", args: { changes: [{ key, add: ["topic/spirometry"] }], dry_run: false } } }];
	script = [...tool("BBBB3333"), { text: "Left it alone." }];
	requests.length = 0;
	const no = await inTerminal(ask("n", "Left it alone."), 120, "tui-no", ["tui", "--here"]);
	assert.equal(no.failed, null, no.text.slice(-1500));
	assert.match(no.text, /y apply\s+n leave it as it is/);
	assert.match(no.text, /Alt\+N notes/, "the side panel shows from 110 columns");
	assert.ok(!(await state()).BBBB3333.tags.some((t: any) => t.tag === "topic/spirometry"), "n changes nothing");
	noRed(no.raw);

	script = [...tool("BBBB3333"), { text: "Applied." }];
	requests.length = 0;
	const yes = await inTerminal(ask("y", "Applied."), 120, "tui-yes", ["tui", "--here"]);
	assert.equal(yes.failed, null, yes.text.slice(-1500));
	assert.ok((await state()).BBBB3333.tags.some((t: any) => t.tag === "topic/spirometry"), "y applies the change");
	noRed(yes.raw);
	assert.equal(yes.exit, 0, `exit ${yes.exit}`);
});
