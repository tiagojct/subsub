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

import { randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, appendFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { homedir } from "node:os";
import { basename, dirname, extname, join, normalize, relative, sep } from "node:path";
import { agentDirFor, chooseCwd, PACKAGE_DIR, packageVersion } from "./cli.ts";
import { configPath, loadConfig, RECOMMENDED_MODELS, readConfigFile, saveConfig, type SubsubConfig, uiLanguage, withStarbuck } from "./config.ts";
import { modelsAfterLogin } from "./init.ts";
import { KEY_PROVIDERS, saveApiKey } from "./keys.ts";
import { CUSTOM_DEFAULT_NAME, saveCustomProvider } from "./providers.ts";
import { writeFileSafe } from "./write.ts";

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
		if (a === "--port") {
			const p = Number(args[++i]);
			o.port = Number.isInteger(p) && p > 0 && p < 65536 ? p : 0;
		} else if (a === "--no-open") o.open = false;
		else if (a === "--librarian") o.librarian = true;
		else if (a === "--here") o.here = true;
		else if (a === "--stay") o.idleMinutes = 0;
		else if (a === "--idle") {
			// A number of minutes; anything else keeps the default, so the server still stops by itself.
			const m = Number(args[++i]);
			o.idleMinutes = Number.isFinite(m) && m >= 0 ? m : 10;
		}
		else o.piArgs.push(a);
	}
	return o;
}

export { uiLanguage } from "./config.ts";

// ---------------------------------------------------------------- providers (API keys)

export { KEY_PROVIDERS, saveApiKey } from "./keys.ts";

// ---------------------------------------------------------------- files (shared with the terminal screens)

import { allowedFile, listNotes, openExternal, openFile, OPENABLE, wikilinkTarget } from "./files.ts";
export { allowedFile, listNotes, openExternal, OPENABLE, wikilinkTarget };

// ---------------------------------------------------------------- pi in RPC mode (src/rpc.ts)

import { Agent, findLibrary, isDialog, Side, withHints } from "./rpc.ts";
export { Agent };

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

/** Files that the notes pane shows. */
const NOTE_TYPES = new Set([".md", ".markdown"]);

/** Images that a note shows (a figure cut out of a PDF, for example). */
const IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };

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

/** A request the server refuses with a 4xx status and a short reason (bad JSON, bad encoding, too large). */
export class BadRequest extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

function decode(s: string): string | undefined {
	try {
		return decodeURIComponent(s);
	} catch {
		return undefined;
	}
}

export function parseCookies(header: string | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	for (const part of (header ?? "").split(";")) {
		const i = part.indexOf("=");
		const value = i > 0 ? decode(part.slice(i + 1).trim()) : undefined;
		if (value !== undefined) out[part.slice(0, i).trim()] = value;
	}
	return out;
}

export interface RequestFacts {
	method: string;
	pathname: string;
	/** The ?t= key of the first visit, if any. */
	key: string | null;
	headers: { host?: string; cookie?: string; origin?: string; "sec-fetch-site"?: string; "content-type"?: string };
}

/**
 * What the server does with a request before routing it: refuse it, turn the first visit's key into a
 * cookie, or let it through. Pure, so the rules are unit tested.
 */
export function checkRequest(r: RequestFacts, port: number, token: string): { status: 403 | 415; text: string } | { status: 303; cookie: string } | { status: 0 } {
	const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
	if (!hosts.includes(r.headers.host ?? "")) return { status: 403, text: "Wrong host." };
	const name = `subsub_${port}`;
	if (r.method === "GET" && r.pathname === "/" && r.key) {
		if (!same(r.key, token)) return { status: 403, text: "This link is not valid. Open Sub-Sub again." };
		return { status: 303, cookie: `${name}=${token}; HttpOnly; SameSite=Strict; Path=/` };
	}
	if (!same(parseCookies(r.headers.cookie)[name] ?? "", token)) return { status: 403, text: "Open Sub-Sub with its shortcut or with: subsub web" };
	if (r.method === "POST") {
		const origin = r.headers.origin;
		if (origin && !hosts.map((h) => `http://${h}`).includes(origin)) return { status: 403, text: "Wrong origin." };
		const site = r.headers["sec-fetch-site"];
		if (site && site !== "same-origin") return { status: 403, text: "Wrong origin." };
		if (!String(r.headers["content-type"] ?? "").startsWith("application/json")) return { status: 415, text: "JSON only." };
	}
	return { status: 0 };
}

/** The file of the web view that a GET path names, or undefined (outside the folder, missing, a folder, bad encoding). */
export function staticFile(webDir: string, pathname: string): string | undefined {
	const rel = pathname === "/" ? "index.html" : decode(pathname.slice(1));
	if (rel === undefined || rel.includes("\0")) return undefined;
	const file = normalize(join(webDir, rel));
	return file.startsWith(webDir + sep) && existsSync(file) && statSync(file).isFile() ? file : undefined;
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

/** The body of a POST as a JSON object ({} when empty); anything else is a BadRequest. */
export async function readJson(req: AsyncIterable<unknown>, limit = 1_000_000): Promise<Record<string, any>> {
	let size = 0;
	const chunks: Buffer[] = [];
	for await (const c of req) {
		size += (c as Buffer).length;
		if (size > limit) throw new BadRequest(413, "request too large");
		chunks.push(c as Buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8");
	if (!text.trim()) return {};
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new BadRequest(400, "not valid JSON");
	}
	if (!data || typeof data !== "object" || Array.isArray(data)) throw new BadRequest(400, "a JSON object only");
	return data as Record<string, any>;
}

function alive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (err) {
		return (err as NodeJS.ErrnoException).code === "EPERM";
	}
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
	const notesRoot = cfg.vault ?? cwd;
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
	const side = new Side();
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
			if (isDialog(ev)) {
				dialogs.set(ev.id, ev);
				broadcast(ev);
			} else if (side.take(ev) === "state") {
				subsubState = side.state;
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
			out.commands = withHints(((await agent.request({ type: "get_commands" })) as { commands: Array<Record<string, any>> }).commands);
		} catch (err) {
			out.error = (err as Error).message;
		}
		return out;
	}

	async function currentSession(): Promise<string | undefined> {
		return ((await agent.request({ type: "get_state" })) as { sessionFile?: string }).sessionFile;
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

	async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const common = { "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
		let url: URL;
		try {
			url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
		} catch {
			return send(res, 400, "Bad address.", common);
		}
		const h = req.headers;
		const verdict = checkRequest(
			{
				method: req.method ?? "GET",
				pathname: url.pathname,
				key: url.searchParams.get("t"),
				headers: { host: h.host, cookie: h.cookie, origin: h.origin, "sec-fetch-site": h["sec-fetch-site"] as string | undefined, "content-type": h["content-type"] },
			},
			port,
			token,
		);
		// First visit: the key in the URL becomes a cookie, and the URL loses the key.
		if (verdict.status === 303) {
			res.writeHead(303, { ...common, Location: "/", "Set-Cookie": verdict.cookie, "Cache-Control": "no-store" });
			return void res.end();
		}
		if (verdict.status !== 0) return send(res, verdict.status, verdict.text, common);

		// ---- static files
		if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
			const file = staticFile(webDir, url.pathname);
			if (!file) return send(res, 404, "Not found.", common);
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
						// A command answers only after its dialogs close (/read, /undo), so wait longer than the default.
						await agent.request({ type: "prompt", message, ...(busy ? { streamingBehavior: "followUp" } : {}) }, 60 * 60_000);
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
						if (body.provider === CUSTOM_DEFAULT_NAME) {
							// Another provider (OpenAI API): models.json; its model becomes the default when none is set.
							const [spec] = saveCustomProvider(agentDir, { name: CUSTOM_DEFAULT_NAME, baseUrl: String(body.baseUrl ?? ""), apiKey: String(body.key ?? ""), models: [String(body.model ?? "")] });
							return modelsAfterLogin(env, CUSTOM_DEFAULT_NAME, spec);
						}
						saveApiKey(agentDir, String(body.provider ?? ""), String(body.key ?? ""));
						modelsAfterLogin(env, String(body.provider ?? ""));
					});
				}
				case "GET /api/notes":
					return send(res, 200, { root: notesRoot, notes: listNotes(notesRoot) });
				case "GET /api/note": {
					const raw = url.searchParams.get("path") ?? "";
					const wiki = !/[\\/]/.test(raw) && !/\.\w+$/.test(raw) ? wikilinkTarget(raw, notesRoot) : undefined;
					// A relative path is tried in the working folder, then in the Sub-Sub folder (Literature/x.md).
					const file = allowedFile(wiki ?? raw, cwd, cfg.vault) ?? allowedFile(raw, notesRoot, cfg.vault);
					if (!file) return send(res, 404, { error: "not found in the Sub-Sub folder" });
					if (!NOTE_TYPES.has(extname(file).toLowerCase())) return send(res, 415, { error: "not a note" });
					if (statSync(file).size > 2_000_000) return send(res, 413, { error: "too large to show" });
					return send(res, 200, { path: file, name: basename(file), text: readFileSync(file, "utf8") });
				}
				case "GET /api/note-file": {
					const raw = url.searchParams.get("path") ?? "";
					const file = allowedFile(raw, cwd, cfg.vault) ?? allowedFile(raw, notesRoot, cfg.vault);
					if (!file) return send(res, 404, { error: "not found in the Sub-Sub folder" });
					const type = IMAGE_TYPES[extname(file).toLowerCase()];
					if (!type) return send(res, 415, { error: "not an image" });
					if (statSync(file).size > 20_000_000) return send(res, 413, { error: "too large to show" });
					res.writeHead(200, { ...common, "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
					return void createReadStream(file).pipe(res);
				}
				case "GET /api/library": {
					const q = (url.searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
					if (!q) return send(res, 200, { q, items: [] });
					return send(res, 200, await findLibrary(agent, side, q));
				}
				case "POST /api/session/name": {
					const body = await readJson(req);
					const name = String(body.name ?? "").replace(/\s+/g, " ").trim();
					if (!name || name.length > 120) return send(res, 400, { error: "a name of 1 to 120 characters" });
					const known = (await sessions()) as Array<{ path: string }>;
					if (!known.some((x) => x.path === body.path)) return send(res, 404, { error: "no such session" });
					if (body.path === (await currentSession())) await agent.request({ type: "set_session_name", name });
					else {
						const { SessionManager } = await import("@earendil-works/pi-coding-agent");
						SessionManager.open(String(body.path)).appendSessionInfo(name);
					}
					return send(res, 200, { ok: true });
				}
				case "POST /api/session/trash": {
					const body = await readJson(req);
					const known = (await sessions()) as Array<{ path: string }>;
					if (!known.some((x) => x.path === body.path)) return send(res, 404, { error: "no such session" });
					if (body.path === (await currentSession())) return send(res, 409, { error: "the open conversation" });
					// Nothing is deleted: the file moves to a trash folder next to the agent folder, in the same
					// subfolder as under sessions/, so that moving it back is one step.
					const rel = relative(join(agentDir, "sessions"), String(body.path));
					const to = join(dirname(agentDir), "trash", rel.startsWith("..") ? basename(rel) : rel);
					mkdirSync(dirname(to), { recursive: true });
					renameSync(String(body.path), to);
					return send(res, 200, { ok: true });
				}
				case "POST /api/open": {
					const body = await readJson(req);
					const vault = cfg.vault;
					// Judge the real file, so a link inside the Sub-Sub folder cannot open a document outside it.
					const target = allowedFile(String(body.path ?? ""), cwd, vault);
					if (!target) return send(res, 404, { error: "not found in the Sub-Sub folder" });
					// Documents only: a file that the model wrote must never be run.
					if (!OPENABLE.has(extname(target).toLowerCase())) return send(res, 403, { error: "Sub-Sub opens only notes and documents (.md, .txt, .pdf, .bib, .csv, .qmd)." });
					openFile(target, vault);
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
			if (err instanceof BadRequest) return send(res, err.status, { error: err.message });
			return send(res, 500, { error: (err as Error).message });
		}
	}

	const server = createServer((req, res) => {
		handle(req, res).catch((err) => {
			// An event stream has sent its headers already: close it; the page reconnects.
			if (res.headersSent) return void res.end();
			send(res, 500, { error: (err as Error).message });
		});
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
	writeFileSafe(file, JSON.stringify({ pid: process.pid, port: web.port, token: web.token }), { private: true });
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
