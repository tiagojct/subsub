/**
 * pi in RPC mode, for the clients that show Sub-Sub: the web view (src/web.ts) and the full-screen terminal client (src/tui.ts). One child
 * process, strict JSONL (records end at LF only), requests answered by id, every other record handed to the listeners. Sub-Sub's extension
 * tells its clients what pi's RPC protocol has no place for through two status texts: the state of the library ("subsub.web") and the
 * answer to a library search ("subsub.find").
 */

import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { field, frontMatter } from "./notes.ts";


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


/** The dialogs that wait for an answer (extension_ui_response): the rest of the extension UI requests are notices. */
export function isDialog(ev: any): boolean {
	return ev?.type === "extension_ui_request" && ["select", "confirm", "input", "editor"].includes(ev.method);
}

export interface LibrarySearch {
	q?: string;
	items?: unknown[];
	error?: string;
}

/** What the extension sends as status texts: the state of the library and the answer to the last library search. */
export class Side {
	state: unknown = null;
	find: LibrarySearch | null = null;

	/** Decode an extension_ui_request; tells which of the two it was, or undefined. */
	take(ev: any): "state" | "find" | undefined {
		if (ev?.type !== "extension_ui_request" || ev.method !== "setStatus") return undefined;
		const decode = (): any => {
			try {
				return ev.statusText ? JSON.parse(ev.statusText) : null;
			} catch {
				return null;
			}
		};
		if (ev.statusKey === "subsub.web") {
			this.state = decode();
			return "state";
		}
		if (ev.statusKey === "subsub.find") {
			this.find = decode();
			return "find";
		}
		return undefined;
	}
}

/** Search the library through the extension (the hidden /subsub-find command); the answer comes back as a status text. */
export async function findLibrary(agent: Agent, side: Side, q: string): Promise<LibrarySearch> {
	if (!q) return { q, items: [] };
	await agent.request({ type: "prompt", message: `/subsub-find ${q}` });
	return side.find?.q === q ? side.find : { q, items: [] };
}

function readText(path: string): string {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return "";
	}
}

/** RPC has no argument hints: read them from the front matter of the prompt files. */
export function withHints(commands: Array<Record<string, any>>): Array<Record<string, any>> {
	return commands.map((c) => {
		const front = c.source === "prompt" && c.sourceInfo?.path ? frontMatter(readText(c.sourceInfo.path)) : undefined;
		const hint = front && field(front, "argument-hint");
		return hint ? { ...c, hint } : c;
	});
}
