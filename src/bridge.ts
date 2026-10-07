/**
 * Bridge to the Python MCP servers of zotero-local-mcp ("zotero" for the library,
 * "scholar" for searches and notes). Starts them over stdio, lists their tools, and calls them.
 * All safety logic (dry runs, version checks, journal, vocabulary, the researcher's
 * note-only client) stays in the Python servers.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { refreshedArgs } from "./config.ts";

export interface ServerSpec {
	name: string; // tool prefix: "zotero" or "scholar"
	command: string;
	args: string[];
	cwd?: string;
	env?: Record<string, string>;
}

export interface BridgeTool {
	server: string;
	name: string; // MCP tool name
	fullName: string; // prefixed name used in pi, e.g. zotero_find_items
	description: string;
	inputSchema: Record<string, unknown>;
}

export interface CallResult {
	isError: boolean;
	text: string;
	data?: unknown;
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(`${what} did not answer within ${Math.round(ms / 1000)} s`)), ms);
		p.then(
			(v) => {
				clearTimeout(t);
				resolve(v);
			},
			(e) => {
				clearTimeout(t);
				reject(e);
			},
		);
	});
}

export class Bridge {
	private clients = new Map<string, Client>();
	private owner = new Map<string, { server: string; name: string }>();
	tools: BridgeTool[] = [];
	errors: Record<string, string> = {};

	async start(specs: ServerSpec[], timeoutMs = 45_000): Promise<void> {
		await Promise.all(specs.map((s) => this.startOne(s, timeoutMs)));
	}

	private async startOne(spec: ServerSpec, timeoutMs: number): Promise<void> {
		const transport = new StdioClientTransport({
			command: spec.command,
			args: spec.args,
			cwd: spec.cwd,
			env: { ...(process.env as Record<string, string>), ...(spec.env ?? {}) },
			stderr: "pipe",
		});
		const client = new Client({ name: "subsub", version: "0.1.0" });
		let stderr = "";
		transport.stderr?.on("data", (chunk: Buffer) => {
			stderr = (stderr + chunk.toString()).slice(-2000);
		});
		try {
			await withTimeout(client.connect(transport), timeoutMs, `The ${spec.name} server`);
			const listed = await withTimeout(client.listTools(), timeoutMs, `The ${spec.name} server`);
			this.clients.set(spec.name, client);
			for (const t of listed.tools) {
				const fullName = `${spec.name}_${t.name}`;
				this.owner.set(fullName, { server: spec.name, name: t.name });
				this.tools.push({
					server: spec.name,
					name: t.name,
					fullName,
					description: t.description ?? "",
					inputSchema: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
				});
			}
		} catch (err) {
			try {
				await client.close();
			} catch {
				/* ignore */
			}
			const retry = refreshedArgs(spec.args, stderr);
			if (retry) return this.startOne({ ...spec, args: retry }, timeoutMs);
			this.errors[spec.name] = `${(err as Error).message}${stderr ? `\n${stderr.trim()}` : ""}`;
		}
	}

	has(fullName: string): boolean {
		return this.owner.has(fullName);
	}

	async call(fullName: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<CallResult> {
		const own = this.owner.get(fullName);
		if (!own) return { isError: true, text: `Unknown tool ${fullName}` };
		const client = this.clients.get(own.server);
		if (!client) return { isError: true, text: `The ${own.server} server is not running.` };
		const res = await client.callTool({ name: own.name, arguments: args }, undefined, {
			signal,
			timeout: 15 * 60_000, // authorization dialogs and PDF downloads can take minutes
			resetTimeoutOnProgress: true,
		});
		const blocks = (res.content as Array<{ type: string; text?: string }>) ?? [];
		const text = blocks
			.filter((b) => b.type === "text")
			.map((b) => b.text ?? "")
			.join("\n");
		let data: unknown = undefined;
		const sc = res.structuredContent as Record<string, unknown> | undefined;
		if (sc && typeof sc === "object") {
			data = Object.keys(sc).length === 1 && "result" in sc ? sc.result : sc;
		} else {
			try {
				data = JSON.parse(text);
			} catch {
				/* plain text */
			}
		}
		return { isError: Boolean(res.isError), text: text || JSON.stringify(data ?? ""), data };
	}

	async close(): Promise<void> {
		await Promise.all([...this.clients.values()].map((c) => c.close().catch(() => undefined)));
		this.clients.clear();
	}
}
