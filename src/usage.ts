/**
 * The pilot's usage log: off unless the user turns it on (subsub init, or "usageLog": true).
 * One JSON line per event in ~/.subsub/usage-log.jsonl: times, counts, commands and tool names.
 * Never what the user wrote, the replies, titles or file names. Nothing is sent anywhere; the
 * user reads it with `subsub usage` and sends the file to the pilot team if they want to.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type UsageEvent =
	| { ev: "session"; mode: string; profile: string; model?: string }
	| { ev: "ask"; kind: string; words: number }
	| { ev: "turn"; seconds: number; tools: number; error?: string }
	| { ev: "change"; tool: string; approved: boolean };

export function usageFile(env: NodeJS.ProcessEnv = process.env): string {
	return join(env.HOME ?? homedir(), ".subsub", "usage-log.jsonl");
}

export function logUsage(on: boolean | undefined, event: UsageEvent, env: NodeJS.ProcessEnv = process.env): void {
	if (!on) return;
	try {
		const file = usageFile(env);
		mkdirSync(dirname(file), { recursive: true });
		appendFileSync(file, `${JSON.stringify({ t: new Date().toISOString(), ...event })}\n`, { mode: 0o600 });
	} catch {
		/* a log must never stop the work */
	}
}

/** A plain summary of the log: days, sessions, requests, commands, time, library changes. */
export function summarizeUsage(text: string): string {
	const rows = text
		.split("\n")
		.filter(Boolean)
		.flatMap((l) => {
			try {
				return [JSON.parse(l) as UsageEvent & { t: string }];
			} catch {
				return [];
			}
		});
	if (!rows.length) return "The usage log is empty.";
	const days = new Set(rows.map((r) => r.t.slice(0, 10)));
	const count = <T extends UsageEvent["ev"]>(ev: T) => rows.filter((r) => r.ev === ev) as Array<Extract<UsageEvent, { ev: T }> & { t: string }>;
	const asks = count("ask");
	const turns = count("turn");
	const changes = count("change");
	const kinds = new Map<string, number>();
	for (const a of asks) kinds.set(a.kind, (kinds.get(a.kind) ?? 0) + 1);
	const minutes = Math.round(turns.reduce((s, r) => s + r.seconds, 0) / 60);
	const errors = turns.filter((r) => r.error).length;
	const lines = [
		`From ${rows[0].t.slice(0, 10)} to ${rows.at(-1)!.t.slice(0, 10)}: Sub-Sub used on ${days.size} day(s), in ${count("session").length} session(s).`,
		`Requests: ${asks.length} (${[...kinds].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}).`,
		`Time Sub-Sub spent working: ${minutes} minute(s), with ${turns.reduce((s, r) => s + r.tools, 0)} tool call(s) and ${errors} error(s).`,
		`Library changes: ${changes.filter((c) => c.approved).length} approved, ${changes.filter((c) => !c.approved).length} declined.`,
	];
	return lines.join("\n");
}

export function usageMain(env: NodeJS.ProcessEnv = process.env): number {
	const file = usageFile(env);
	if (!existsSync(file)) {
		console.log(`No usage log yet (${file}). To keep one for the pilot, type subsub init and turn it on, or set "usageLog": true in the settings.`);
		return 0;
	}
	console.log(summarizeUsage(readFileSync(file, "utf8")));
	console.log("");
	console.log(`The log: ${file}`);
	console.log("It holds times, counts, commands and tool names, never what you wrote or what Sub-Sub replied. To share it with the pilot team, send this file.");
	return 0;
}
