/**
 * `subsub web`: Sub-Sub in the browser.
 *
 * - pi runs as a child process in RPC mode, with the Sub-Sub extension, exactly
 *   as `subsub` would run it. Approvals are the extension's own confirm
 *   dialogs, forwarded to the page; the page only answers them.
 * - The server listens on 127.0.0.1 only. The first request must carry a
 *   random key (?t=...), which becomes an HttpOnly, SameSite=Strict cookie.
 *   Every other request needs that cookie, the right Host header and, for
 *   POST, a same-origin JSON request. Other websites and other computers
 *   cannot read the conversation or answer a dialog.
 * - One server per user: a second `subsub web` opens the running one.
 * - Without an open page for a while (and with nothing waiting), the server
 *   stops by itself, so a shortcut can start it without a terminal.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { homedir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { agentDirFor, chooseCwd, PACKAGE_DIR, packageVersion } from "./cli.ts";
import { configPath, expand, loadConfig, RECOMMENDED_MODELS, readConfigFile, saveConfig, type SubsubConfig, withStarbuck } from "./config.ts";
import { TESTED_MODELS } from "./init.ts";
import { KEY_PROVIDERS, saveApiKey } from "./keys.ts";
import { obsidianRoot } from "./layout.ts";
import { realish, within } from "./paths.ts";

// ---------------------------------------------------------------- options

export interface WebOptions {
	port: number;
	open: boolean;
	librarian: boolean;
	here: boolean;
	/** Minutes without an open page before the server stops; 0 = never. */
	idleMinutes: number;
	/** Extra arguments for pi (for example --provider and --model in tests). */
	piArgs: string[];
}

export function parseWebArgs(args: string[]): WebOptions {
	const o: WebOptions = { port: 0, open: true, librarian: false, here: false, idleMinutes: 10, piArgs: [] };
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === "--port") o.port = Number(args[++i] ?? 0) || 0;
		else if (a === "--no-open") o.open = false;
		else if (a === "--librarian") o.librarian = true;
		else if (a === "--here") o.here = true;
		else if (a === "--stay") o.idleMinutes = 0;
		else if (a === "--idle") o.idleMinutes = Math.max(0, Number(args[++i] ?? 10));
		else o.piArgs.push(a);
	}
	return o;
}

/** "pt" when the language setting is Portuguese, else "en". */
export function uiLanguage(language: string | undefined): "pt" | "en" {
	return /portug|^pt\b|^pt-/i.test(language ?? "") ? "pt" : "en";
}

// ---------------------------------------------------------------- providers (API keys)

export { KEY_PROVIDERS, saveApiKey } from "./keys.ts";

// ---------------------------------------------------------------- pi in RPC mode

type Listener = (ev: any) => void;

/** pi as a child process in RPC mode. Strict JSONL: records end at LF only. */
export class Agent {
	proc?: ChildProcess;
	private decoder = new StringDecoder("utf8");
	private buf = "";
	private n = 0;
	private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
	private listeners = new Set<Listener>();
	stderr = "";
	onExit?: (code: number | null) => void;

	private readonly command: string;
	private readonly args: string[];
	private readonly cwd: string;
	private readonly env: NodeJS.ProcessEnv;

	constructor(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
		this.command = command;
		this.args = args;
		this.cwd = cwd;
		this.env = env;
	}

	start(extra: string[] = []): void {
		this.buf = "";
		this.decoder = new StringDecoder("utf8");
		const proc = spawn(this.command, [...this.args, ...extra], { cwd: this.cwd, env: this.env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
		this.proc = proc;
		proc.stdout!.on("data", (chunk: Buffer) => this.feed(this.decoder.write(chunk)));
		proc.stderr!.on("data", (d: Buffer) => {
			this.stderr = (this.stderr + d.toString()).slice(-20_000);
		});
		proc.once("exit", (code) => {
			if (this.proc !== proc) return;
			this.proc = undefined;
			for (const p of this.pending.values()) {
				clearTimeout(p.timer);
				p.reject(new Error(`pi stopped (code ${code}). ${this.stderr.slice(-500)}`));
			}
			this.pending.clear();
			this.onExit?.(code);
		});
	}

	private feed(text: string): void {
		this.buf += text;
		let i: number;
		while ((i = this.buf.indexOf("\n")) >= 0) {
			const line = this.buf.slice(0, i).replace(/\r$/, "");
			this.buf = this.buf.slice(i + 1);
			if (!line.trim()) continue;
			let rec: any;
			try {
				rec = JSON.parse(line);
			} catch {
				continue;
			}
			if (rec.type === "response" && typeof rec.id === "string" && this.pending.has(rec.id)) {
				const p = this.pending.get(rec.id)!;
				this.pending.delete(rec.id);
				clearTimeout(p.timer);
				if (rec.success === false) p.reject(new Error(rec.error ?? `${rec.command} failed`));
				else p.resolve(rec.data);
				continue;
			}
			for (const l of this.listeners) l(rec);
		}
	}

	on(l: Listener): () => void {
		this.listeners.add(l);
		return () => this.listeners.delete(l);
	}

	write(rec: unknown): void {
		const stdin = this.proc?.stdin;
		if (!stdin || !stdin.writable) throw new Error("pi is not running");
		stdin.write(`${JSON.stringify(rec)}\n`);
	}

	request<T = any>(cmd: Record<string, unknown>, timeoutMs = 30_000): Promise<T> {
		const id = `w${++this.n}`;
		return new Promise<T>((resolvePromise, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`pi did not answer ${String(cmd.type)} in time`));
			}, timeoutMs);
			this.pending.set(id, { resolve: resolvePromise, reject, timer });
			try {
				this.write({ ...cmd, id });
			} catch (err) {
				clearTimeout(timer);
				this.pending.delete(id);
				reject(err as Error);
			}
		});
	}

	async stop(): Promise<void> {
		const proc = this.proc;
		if (!proc) return;
		this.proc = undefined;
		for (const p of this.pending.values()) {
			clearTimeout(p.timer);
			p.reject(new Error("pi was stopped"));
		}
		this.pending.clear();
		await new Promise<void>((done) => {
			const t = setTimeout(() => {
				proc.kill("SIGKILL");
				done();
			}, 3000);
			proc.once("exit", () => {
				clearTimeout(t);
				done();
			});
			proc.kill();
		});
	}
}

// ---------------------------------------------------------------- helpers

const TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
	".png": "image/png",
	".ico": "image/x-icon",
};

/** Files that the Open button may hand to the system (never programs or scripts). */
export const OPENABLE = new Set([".md", ".markdown", ".txt", ".pdf", ".bib", ".csv", ".qmd"]);

const CSP = [
	"default-src 'none'",
	"script-src 'self'",
	"style-src 'self'",
	"font-src 'self'",
	"img-src 'self' data:",
	"connect-src 'self'",
	"base-uri 'none'",
	"form-action 'none'",
	"frame-ancestors 'none'",
].join("; ");

function same(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

function cookies(req: IncomingMessage): Record<string, string> {
	const out: Record<string, string> = {};
	for (const part of (req.headers.cookie ?? "").split(";")) {
		const i = part.indexOf("=");
		if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
	}
	return out;
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
	const text = typeof body === "string" ? body : JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		...headers,
	});
	res.end(text);
}

async function readJson(req: IncomingMessage, limit = 1_000_000): Promise<any> {
	let size = 0;
	const chunks: Buffer[] = [];
	for await (const c of req) {
		size += (c as Buffer).length;
		if (size > limit) throw new Error("request too large");
		chunks.push(c as Buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8");
	return text ? JSON.parse(text) : {};
}

function alive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (err) {
		return (err as NodeJS.ErrnoException).code === "EPERM";
	}
}

/** Open a URL or a file with the system's default program. */
export function openExternal(target: string): void {
	const opts = { detached: true, stdio: "ignore" as const, windowsHide: true };
	let child: ChildProcess;
	if (process.platform === "darwin") child = spawn("open", [target], opts);
	// rundll32 hands the target to the default program without cmd.exe parsing it.
	else if (process.platform === "win32") child = spawn("rundll32", ["url.dll,FileProtocolHandler", target], opts);
	else child = spawn("xdg-open", [target], opts);
	child.on("error", () => {});
	child.unref();
}

// ---------------------------------------------------------------- server

interface RunningFile {
	pid: number;
	port: number;
	token: string;
}

export interface WebServer {
	url: string;
	port: number;
	token: string;
	server: Server;
	agent: Agent;
	close(): Promise<void>;
}

/**
 * Start the web server and pi. Resolves when both are listening; the caller
 * decides whether to open a browser. Used by `subsub web` and by the tests.
 */
export async function startWeb(opts: WebOptions, env: NodeJS.ProcessEnv = process.env, log: (s: string) => void = () => {}): Promise<WebServer> {
	const home = homedir();
	const cfg: SubsubConfig = loadConfig(env);
	const agentDir = agentDirFor(env, home);
	const cwd = chooseCwd(process.cwd(), home, cfg.vault, opts.here);
	const lang = uiLanguage(cfg.language);
	const token = randomBytes(24).toString("base64url");
	const webDir = join(PACKAGE_DIR, "web");
	const bin = join(PACKAGE_DIR, "bin", "subsub.js");
	env.PI_CODING_AGENT_DIR = agentDir; // for the session list below

	const childEnv: NodeJS.ProcessEnv = { ...env, SUBSUB_WEB: "1" };
	const baseArgs = [bin, "--mode", "rpc", "--here", ...opts.piArgs];
	const agent = new Agent(process.execPath, baseArgs, cwd, childEnv);

	// ---- state shared with the pages
	const clients = new Set<ServerResponse>();
	const dialogs = new Map<string, any>();
	let subsubState: unknown = null;
	let busy = false;
	let lastSeen = Date.now();
	let restarting = false;
	let switching = false; // a restart for a new model, add-on or key is under way
	let lastSession: string | undefined;
	let refreshAfterRun = false;

	/** The mode to start pi in: the one on screen, else the --librarian flag. A session's own mode still wins. */
	function modeArgs(): string[] {
		const shown = (subsubState as { mode?: string } | null)?.mode;
		if (shown === "librarian" || shown === "researcher") return [`--${shown}`];
		return opts.librarian ? ["--librarian"] : [];
	}
	function startAgent(): void {
		agent.start([...modeArgs(), ...(lastSession && existsSync(lastSession) ? ["--session", lastSession] : [])]);
	}

	function broadcast(ev: unknown): void {
		const data = `data: ${JSON.stringify(ev)}\n\n`;
		for (const c of clients) c.write(data);
	}

	agent.on((ev) => {
		if (ev.type === "extension_ui_request") {
			if (["select", "confirm", "input", "editor"].includes(ev.method)) {
				dialogs.set(ev.id, ev);
				broadcast(ev);
			} else if (ev.method === "setStatus" && ev.statusKey === "subsub.web") {
				try {
					subsubState = ev.statusText ? JSON.parse(ev.statusText) : null;
				} catch {
					subsubState = null;
				}
				broadcast({ type: "subsub_state", state: subsubState });
			} else if (ev.method === "notify") {
				broadcast(ev);
			}
			return;
		}
		if (ev.type === "agent_start") busy = true;
		if (ev.type === "agent_settled") {
			busy = false;
			if (refreshAfterRun) {
				refreshAfterRun = false;
				agent.request({ type: "prompt", message: "/subsub-refresh" }).catch(() => {});
			}
		}
		if (ev.type === "tool_execution_end" && /^zotero_/.test(String(ev.toolName)) && !ev.isError) refreshAfterRun = true;
		broadcast(ev);
	});
	agent.onExit = (code) => {
		if (restarting) return;
		busy = false;
		for (const id of dialogs.keys()) broadcast({ type: "dialog_closed", id });
		dialogs.clear();
		broadcast({ type: "agent_exit", code, stderr: agent.stderr.slice(-1500) });
		log(`pi stopped (code ${code}).\n${agent.stderr.slice(-2000)}`);
	};

	startAgent();

	async function snapshot(): Promise<Record<string, unknown>> {
		const out: Record<string, unknown> = {
			type: "hello",
			lang,
			version: packageVersion(),
			state: subsubState,
			busy,
			dialogs: [...dialogs.values()],
			providers: KEY_PROVIDERS,
		};
		try {
			out.session = await agent.request({ type: "get_state" });
			lastSession = (out.session as { sessionFile?: string }).sessionFile ?? lastSession;
			out.messages = ((await agent.request({ type: "get_messages" })) as { messages: unknown[] }).messages;
			out.commands = ((await agent.request({ type: "get_commands" })) as { commands: unknown[] }).commands;
		} catch (err) {
			out.error = (err as Error).message;
		}
		return out;
	}

	async function sessions(): Promise<unknown[]> {
		const { SessionManager } = await import("@earendil-works/pi-coding-agent");
		const list = await SessionManager.list(cwd);
		return list
			.filter((s) => s.messageCount > 0)
			.sort((a, b) => +new Date(b.modified) - +new Date(a.modified))
			.slice(0, 40)
			.map((s) => ({ path: s.path, name: s.name ?? null, first: s.firstMessage.slice(0, 140), modified: s.modified, messages: s.messageCount }));
	}

	async function restartAgent(): Promise<void> {
		try {
			lastSession = ((await agent.request({ type: "get_state" })) as { sessionFile?: string }).sessionFile ?? lastSession;
		} catch {
			/* keep the last one known */
		}
		restarting = true;
		for (const id of dialogs.keys()) broadcast({ type: "dialog_closed", id });
		dialogs.clear();
		try {
			await agent.stop();
		} finally {
			restarting = false;
		}
		busy = false;
		startAgent();
		broadcast(await snapshot());
	}

	/** Run a change that restarts pi, one at a time. */
	async function withRestart(res: ServerResponse, change: () => Promise<void> | void): Promise<void> {
		if (busy || switching) return send(res, 409, { error: "busy" });
		switching = true;
		try {
			await change();
			await restartAgent();
		} finally {
			switching = false;
		}
		return send(res, 200, { ok: true });
	}

	// ---- idle stop
	let closing = false;
	const idleTimer = setInterval(() => {
		if (clients.size > 0) lastSeen = Date.now();
		if (!opts.idleMinutes || closing) return;
		if (clients.size === 0 && !busy && dialogs.size === 0 && Date.now() - lastSeen > opts.idleMinutes * 60_000) {
			log("No open page; stopping.");
			void close().then(() => process.exit(0));
		}
	}, 15_000);
	const keepAlive = setInterval(() => {
		for (const c of clients) c.write(": keep-alive\n\n");
	}, 20_000);

	// ---- HTTP
	let port = 0;
	const hosts = () => [`127.0.0.1:${port}`, `localhost:${port}`];
	const origins = () => hosts().map((h) => `http://${h}`);
	const cookieName = () => `subsub_${port}`;

	async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
		const common = { "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
		if (!hosts().includes(req.headers.host ?? "")) return send(res, 403, "Wrong host.", common);

		// First visit: the key in the URL becomes a cookie, and the URL loses the key.
		const t = url.searchParams.get("t");
		if (req.method === "GET" && url.pathname === "/" && t) {
			if (!same(t, token)) return send(res, 403, "This link is not valid. Open Sub-Sub again.", common);
			res.writeHead(303, { ...common, Location: "/", "Set-Cookie": `${cookieName()}=${token}; HttpOnly; SameSite=Strict; Path=/`, "Cache-Control": "no-store" });
			return void res.end();
		}
		const authed = same(cookies(req)[cookieName()] ?? "", token);
		if (!authed) return send(res, 403, "Open Sub-Sub with its shortcut or with: subsub web", common);

		if (req.method === "POST") {
			const origin = req.headers.origin;
			if (origin && !origins().includes(origin)) return send(res, 403, "Wrong origin.", common);
			const site = req.headers["sec-fetch-site"];
			if (site && site !== "same-origin") return send(res, 403, "Wrong origin.", common);
			if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, "JSON only.", common);
		}

		// ---- static files
		if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
			const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
			const file = normalize(join(webDir, rel));
			if (!file.startsWith(webDir + sep) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, "Not found.", common);
			res.writeHead(200, {
				...common,
				"Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
				"Content-Security-Policy": CSP,
				"X-Content-Type-Options": "nosniff",
				"Cache-Control": "no-cache",
			});
			return void createReadStream(file).pipe(res);
		}

		// ---- API
		const route = `${req.method} ${url.pathname}`;
		try {
			switch (route) {
				case "GET /api/ping":
					return send(res, 200, { ok: true, version: packageVersion() });
				case "GET /api/state":
					return send(res, 200, await agent.request({ type: "get_state" }));
				case "GET /api/events": {
					res.writeHead(200, { ...common, "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
					res.write(": hello\n\n");
					clients.add(res);
					lastSeen = Date.now();
					req.on("close", () => {
						clients.delete(res);
						lastSeen = Date.now();
					});
					res.write(`data: ${JSON.stringify(await snapshot())}\n\n`);
					agent.request({ type: "prompt", message: "/subsub-refresh" }).catch(() => {});
					return;
				}
				case "POST /api/prompt": {
					const body = await readJson(req);
					const message = String(body.message ?? "").trim();
					if (!message) return send(res, 400, { error: "empty message" });
					try {
						await agent.request({ type: "prompt", message, ...(busy ? { streamingBehavior: "followUp" } : {}) });
					} catch (err) {
						// No provider yet: the page opens the model dialog instead of showing pi's text.
						if (/no api key|no model|no models available/i.test((err as Error).message)) return send(res, 409, { error: "nomodel" });
						throw err;
					}
					return send(res, 200, { ok: true });
				}
				case "POST /api/abort":
					await agent.request({ type: "abort" });
					return send(res, 200, { ok: true });
				case "POST /api/dialog": {
					const body = await readJson(req);
					const id = String(body.id ?? "");
					const d = dialogs.get(id);
					if (!d) return send(res, 404, { error: "no such dialog" });
					const reply: Record<string, unknown> = { type: "extension_ui_response", id };
					if (body.cancelled) reply.cancelled = true;
					else if (d.method === "confirm") reply.confirmed = body.confirmed === true;
					else if (d.method === "select") {
						if (!d.options?.includes(body.value)) return send(res, 400, { error: "not an option" });
						reply.value = body.value;
					} else reply.value = String(body.value ?? "");
					agent.write(reply);
					dialogs.delete(id);
					broadcast({ type: "dialog_closed", id });
					return send(res, 200, { ok: true });
				}
				case "POST /api/new":
					if (busy) return send(res, 409, { error: "busy" });
					await agent.request({ type: "new_session" });
					broadcast(await snapshot());
					return send(res, 200, { ok: true });
				case "GET /api/sessions":
					return send(res, 200, { sessions: await sessions() });
				case "POST /api/session": {
					if (busy) return send(res, 409, { error: "busy" });
					const body = await readJson(req);
					const known = (await sessions()) as Array<{ path: string }>;
					if (!known.some((s) => s.path === body.path)) return send(res, 404, { error: "no such session" });
					await agent.request({ type: "switch_session", sessionPath: body.path });
					broadcast(await snapshot());
					return send(res, 200, { ok: true });
				}
				case "GET /api/models": {
					const data = (await agent.request({ type: "get_available_models" })) as { models?: unknown[] } | unknown[];
					return send(res, 200, { models: Array.isArray(data) ? data : (data.models ?? []), recommended: RECOMMENDED_MODELS });
				}
				case "POST /api/model": {
					if (busy || switching) return send(res, 409, { error: "busy" });
					const body = await readJson(req);
					const spec = `${String(body.provider)}/${String(body.id)}`;
					// Remember the model for the current mode (or both), then restart pi so the extension reads it.
					const mode = (subsubState as { mode?: string } | null)?.mode === "librarian" ? "librarian" : "researcher";
					// Start from what the file says, not from the built-in defaults, so a model the user never chose is not saved.
					const raw = readConfigFile(configPath(env));
					const saved = raw.models && typeof raw.models === "object" ? (raw.models as Record<string, string>) : typeof raw.model === "string" && raw.model ? { librarian: raw.model, researcher: raw.model } : {};
					const models: Record<string, string> = { ...saved, [mode]: spec };
					if (body.both) models[mode === "librarian" ? "researcher" : "librarian"] = spec;
					return withRestart(res, async () => {
						saveConfig({ models, model: undefined }, env);
						// The open conversation records the new model, so it keeps it after the restart.
						await agent.request({ type: "set_model", provider: String(body.provider), modelId: String(body.id) }).catch(() => {});
					});
				}
				case "POST /api/addons": {
					// Turn an add-on on or off, then restart pi so the extension starts or stops its server.
					if (busy || switching) return send(res, 409, { error: "busy" });
					const body = await readJson(req);
					if (typeof body.starbuck !== "boolean") return send(res, 400, { error: "starbuck must be true or false" });
					return withRestart(res, () => {
						saveConfig({ addons: withStarbuck(loadConfig(env).addons, body.starbuck) }, env);
					});
				}
				case "POST /api/restart":
					if (agent.proc || switching) return send(res, 200, { ok: true });
					startAgent();
					broadcast(await snapshot());
					return send(res, 200, { ok: true });
				case "POST /api/login": {
					if (busy || switching) return send(res, 409, { error: "busy" });
					const body = await readJson(req);
					return withRestart(res, () => {
						saveApiKey(agentDir, String(body.provider ?? ""), String(body.key ?? ""));
						const current = loadConfig(env);
						if (body.provider === "opencode-go" && Object.keys(current.models).length === 0) saveConfig({ models: TESTED_MODELS, model: undefined }, env);
					});
				}
				case "POST /api/open": {
					const body = await readJson(req);
					const target = resolve(cwd, expand(String(body.path ?? "")));
					const vault = cfg.vault;
					// Judge the real file, so a link inside the Sub-Sub folder cannot open a document outside it.
					const real = realish(target);
					const inside = within(real, realish(cwd)) || Boolean(vault && within(real, realish(vault)));
					if (!inside || !existsSync(target)) return send(res, 404, { error: "not found in the Sub-Sub folder" });
					// Documents only: a file that the model wrote must never be run.
					if (!OPENABLE.has(extname(target).toLowerCase())) return send(res, 403, { error: "Sub-Sub opens only notes and documents (.md, .txt, .pdf, .bib, .csv, .qmd)." });
					if (vault && within(target, vault) && obsidianRoot(vault)) openExternal(`obsidian://open?path=${encodeURIComponent(target)}`);
					else openExternal(target);
					return send(res, 200, { ok: true });
				}
				case "POST /api/quit":
					send(res, 200, { ok: true });
					setTimeout(() => void close().then(() => process.exit(0)), 100);
					return;
				default:
					return send(res, 404, { error: "not found" });
			}
		} catch (err) {
			return send(res, 500, { error: (err as Error).message });
		}
	}

	const server = createServer((req, res) => {
		handle(req, res).catch((err) => send(res, 500, { error: (err as Error).message }));
	});
	await new Promise<void>((ok, fail) => {
		server.once("error", fail);
		server.listen(opts.port, "127.0.0.1", () => ok());
	});
	port = (server.address() as { port: number }).port;

	async function close(): Promise<void> {
		if (closing) return;
		closing = true;
		clearInterval(idleTimer);
		clearInterval(keepAlive);
		for (const c of clients) c.end();
		clients.clear();
		await agent.stop();
		await new Promise<void>((ok) => server.close(() => ok()));
	}

	return { url: `http://127.0.0.1:${port}/?t=${token}`, port, token, server, agent, close };
}

// ---------------------------------------------------------------- command

function runningFile(env: NodeJS.ProcessEnv): string {
	return join(agentDirFor(env, homedir()), "..", "web.json");
}

async function findRunning(env: NodeJS.ProcessEnv): Promise<RunningFile | undefined> {
	const file = runningFile(env);
	if (!existsSync(file)) return undefined;
	try {
		const r = JSON.parse(readFileSync(file, "utf8")) as RunningFile;
		if (!alive(r.pid)) return undefined;
		const res = await fetch(`http://127.0.0.1:${r.port}/api/ping`, {
			headers: { Cookie: `subsub_${r.port}=${r.token}` },
			signal: AbortSignal.timeout(1500),
		});
		return res.ok ? r : undefined;
	} catch {
		return undefined;
	}
}

export async function webMain(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
	const opts = parseWebArgs(args);
	const logFile = join(agentDirFor(env, homedir()), "..", "web.log");
	mkdirSync(join(logFile, ".."), { recursive: true });
	try {
		if (existsSync(logFile) && statSync(logFile).size > 1_000_000) renameSync(logFile, `${logFile}.old`);
	} catch {
		/* not important */
	}
	const log = (s: string) => {
		try {
			appendFileSync(logFile, `${new Date().toISOString()} ${s}\n`);
		} catch {
			/* not important */
		}
		if (process.stderr.isTTY) process.stderr.write(`${s}\n`);
	};

	const running = opts.port === 0 ? await findRunning(env) : undefined;
	if (running) {
		const url = `http://127.0.0.1:${running.port}/?t=${running.token}`;
		console.log(`Sub-Sub is already open: ${url}`);
		if (opts.open) openExternal(url);
		return 0;
	}

	let web: WebServer;
	try {
		web = await startWeb(opts, env, log);
	} catch (err) {
		log(`Sub-Sub could not start the web view: ${(err as Error).message}`);
		console.error(`Sub-Sub could not start the web view: ${(err as Error).message}`);
		return 1;
	}
	const file = runningFile(env);
	writeFileSync(file, JSON.stringify({ pid: process.pid, port: web.port, token: web.token }), { mode: 0o600 });
	log(`Sub-Sub web view on port ${web.port}.`);
	const minutes = `${opts.idleMinutes} minute${opts.idleMinutes === 1 ? "" : "s"}`;
	const stopHint = `To stop Sub-Sub, press Ctrl+C${opts.idleMinutes ? `; it also stops ${minutes} after you close the page` : ""}.`;
	console.log(opts.open ? `Sub-Sub is open in your browser. If it did not open, go to:\n${web.url}\n${stopHint}` : `Sub-Sub is running. Open:\n${web.url}\n${stopHint}`);
	if (opts.open) openExternal(web.url);

	const stop = () => {
		void web.close().then(() => process.exit(0));
	};
	process.on("SIGINT", stop);
	process.on("SIGTERM", stop);
	return await new Promise<number>(() => {});
}
