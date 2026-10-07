/**
 * `subsub doctor`: check the setup and say how to fix each problem.
 *
 * Checks Node, the settings file, uv, the Zotero server (it runs
 * `zotero-local-mcp --check`), Zotero itself, the tag list, the notes folder,
 * the contact email, Starbuck (when the add-on is on) and the model login. Exit
 * code 1 when something needs a fix.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	findUv,
	loadConfig,
	SERVER_VERSION,
	serverCommand,
	STARBUCK_SOURCE,
	starbuckCommand,
	starbuckEnabled,
	type SubsubConfig,
	refreshedArgs,
} from "./config.ts";
import { isObsidianVault, LEGACY_SETTINGS_DIR, SETTINGS_FILES, settingsFile } from "./layout.ts";
import { profileSpec } from "./profiles.ts";

export interface Check {
	name: string;
	ok: boolean;
	detail: string;
	fix?: string;
	/** A warning: works, but something is missing. */
	warn?: boolean;
}

export interface RunResult {
	status: number | null;
	stdout: string;
	stderr: string;
	error?: string;
}

export type Runner = (command: string, args: string[], env: NodeJS.ProcessEnv) => RunResult;

export const defaultRunner: Runner = (command, args, env) => {
	const r = spawnSync(command, args, { env, encoding: "utf8", timeout: 120_000 });
	return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", error: r.error?.message };
};

const ZOTERO_SETTING = 'In Zotero, open Settings > Advanced and turn on "Allow other applications on this computer to communicate with Zotero".';

function nodeOk(version: string): boolean {
	const [major, minor] = version.split(".").map(Number);
	return major > 22 || (major === 22 && minor >= 19);
}

function hasLogin(agentDir: string): boolean {
	try {
		const data = JSON.parse(readFileSync(join(agentDir, "auth.json"), "utf8"));
		return Boolean(data) && typeof data === "object" && Object.keys(data).length > 0;
	} catch {
		return false;
	}
}

export function runChecks(
	cfg: SubsubConfig,
	env: NodeJS.ProcessEnv,
	deps: { run?: Runner; nodeVersion?: string; agentDir?: string } = {},
): Check[] {
	const run = deps.run ?? defaultRunner;
	const out: Check[] = [];
	const node = deps.nodeVersion ?? process.versions.node;
	out.push(
		nodeOk(node)
			? { name: "Node", ok: true, detail: node }
			: { name: "Node", ok: false, detail: node, fix: "Install Node.js 22.19 or later (https://nodejs.org), or run the Sub-Sub installer again." },
	);
	out.push(
		existsSync(cfg.configFile)
			? { name: "Settings", ok: true, detail: `${cfg.configFile}, profile ${profileSpec(cfg.profile).label}, replies in ${cfg.language}` }
			: { name: "Settings", ok: false, detail: `no ${cfg.configFile}`, fix: "Type subsub init." },
	);

	const uv = findUv(cfg, env);
	const uvRun = run(uv, ["--version"], env);
	if (uvRun.status !== 0) {
		out.push({ name: "uv", ok: false, detail: uvRun.error ?? uvRun.stderr.trim(), fix: "Install uv (https://docs.astral.sh/uv/), or add \"uvPath\" to the settings file." });
		return out;
	}
	out.push({ name: "uv", ok: true, detail: uvRun.stdout.trim() });

	const cmd = serverCommand(cfg, "zotero-local-mcp", ["--check"], env);
	const local = cmd.args.includes("--directory");
	const serverEnv = { ...env, ...(cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {}) };
	let res = run(cmd.command, cmd.args, serverEnv);
	const retry = res.status !== 0 ? refreshedArgs(cmd.args, res.stderr) : undefined;
	if (retry) res = run(cmd.command, retry, serverEnv);
	let st: Record<string, any> | undefined;
	try {
		st = JSON.parse(res.stdout);
	} catch {
		st = undefined;
	}
	if (res.status !== 0 || !st) {
		const text = (res.error ?? res.stderr).replace(/[^\x20-\x7e\n]/g, " ");
		const first = text.trim().split("\n").slice(-3).join(" ").replace(/\s+/g, " ").trim();
		const notPublished = /not found in the package registry/.test(text);
		out.push({
			name: "Zotero server",
			ok: false,
			detail: notPublished ? `zotero-local-mcp ${SERVER_VERSION} is not on PyPI` : first || "no answer",
			fix: local
				? `Type: cd "${cfg.serverDir}" && uv sync`
				: notPublished
					? 'Set "serverDir" in the settings file to a copy of the zotero-local-mcp repository.'
					: `uv could not run zotero-local-mcp ${SERVER_VERSION} from PyPI. Check the internet connection and try again.`,
		});
		return out;
	}
	out.push({ name: "Zotero server", ok: true, detail: local ? `from ${cfg.serverDir}` : `zotero-local-mcp ${SERVER_VERSION}` });
	out.push(
		st.zotero === "reachable"
			? { name: "Zotero", ok: true, detail: `reachable, write permission ${st.write_key_remembered ? "remembered" : "asked at the first change"}` }
			: { name: "Zotero", ok: false, detail: String(st.error ?? "not reachable"), fix: `Start Zotero 10 or later. ${ZOTERO_SETTING}` },
	);
	const v = st.vocabulary ?? {};
	if (v.loaded === false || !v.tags) {
		const path = v.path && v.path !== "None" ? v.path : undefined; // the server writes Python's None when unset
		out.push({ name: "Tag list", ok: false, detail: path ? `cannot read ${path}` : "not set", fix: "Type subsub init: it creates a starter tag list." });
	} else {
		const noTopics = Array.isArray(v.facets) && !v.facets.includes("topic");
		out.push({
			name: "Tag list",
			ok: !(v.problems?.length),
			warn: noTopics,
			detail: `${v.tags} tags in ${v.path}${noTopics ? "; no topic/ tags yet" : ""}`,
			fix: v.problems?.length
				? `Fix these lines in the tag list: ${v.problems.slice(0, 3).join("; ")}`
				: noTopics
					? "In Sub-Sub, ask: propose topics for my tag list."
					: undefined,
		});
	}
	out.push(folderCheck(cfg.vault));
	out.push(
		st.contact_email_set
			? { name: "Contact email", ok: true, detail: "set" }
			: { name: "Contact email", ok: true, warn: true, detail: "not set: open-access PDFs cannot be found", fix: "Type subsub init and give an email address." },
	);
	if (starbuckEnabled(cfg)) out.push(starbuckCheck(cfg, env, run));
	const agentDir = deps.agentDir ?? (env.SUBSUB_AGENT_DIR ? env.SUBSUB_AGENT_DIR : join(homedir(), ".subsub", "agent"));
	out.push(
		hasLogin(agentDir)
			? { name: "Model login", ok: true, detail: Object.keys(cfg.models).length ? Object.entries(cfg.models).map(([m, id]) => `${m} ${id}`).join(", ") : "pi's default model" }
			: { name: "Model login", ok: false, detail: "no model provider yet", fix: "Open Sub-Sub (subsub web), select the model button and save an API key. In the terminal: type subsub, then /login." },
	);
	return out;
}

/** The Starbuck add-on: can uv start it? (`starbuck --version`, from the local folder or the pinned release) */
export function starbuckCheck(cfg: SubsubConfig, env: NodeJS.ProcessEnv, run: Runner): Check {
	const cmd = starbuckCommand(cfg, env);
	const local = cmd.args.includes("--directory");
	const args = cmd.args.slice(0, -1).concat(["starbuck", "--version"]);
	const res = run(cmd.command, args, env);
	if (res.status === 0) {
		return { name: "Starbuck", ok: true, detail: `${res.stdout.trim()} ${local ? `from ${cfg.starbuckDir}` : `from ${STARBUCK_SOURCE}`}` };
	}
	return {
		name: "Starbuck",
		ok: false,
		detail: local ? `cannot start from ${cfg.starbuckDir}` : `cannot install ${STARBUCK_SOURCE} with uv`,
		fix: local
			? `Type: cd "${cfg.starbuckDir}" && uv sync`
			: "Check the internet connection and run subsub doctor again. To turn reference checks off, type subsub init.",
	};
}

export function formatChecks(checks: Check[]): string {
	return checks
		.map((c) => {
			const tag = !c.ok ? "FIX " : c.warn ? "NOTE" : "ok  ";
			return `${tag}  ${c.name.padEnd(14)} ${c.detail}${c.fix && (!c.ok || c.warn) ? `\n      ${" ".repeat(14)} ${c.fix}` : ""}`;
		})
		.join("\n");
}

export async function doctorMain(env: NodeJS.ProcessEnv = process.env): Promise<number> {
	let cfg: SubsubConfig;
	try {
		cfg = loadConfig(env);
	} catch (err) {
		console.log(`FIX   Settings       ${(err as Error).message}\n                     Fix the JSON, or move the file away and type subsub init.`);
		return 1;
	}
	const checks = runChecks(cfg, env);
	console.log(formatChecks(checks));
	const bad = checks.filter((c) => !c.ok).length;
	console.log(bad ? `\n${bad} problem(s) to fix.` : "\nEverything needed is in place.");
	return bad ? 1 : 0;
}

/** The Sub-Sub folder: it exists, it is not a whole vault, and its settings files are in Zotero/. */
export function folderCheck(folder: string | undefined): Check {
	const name = "Sub-Sub folder";
	if (!folder || !existsSync(folder)) {
		return { name, ok: false, detail: folder ? `${folder} does not exist` : "not set", fix: "Type subsub init." };
	}
	if (isObsidianVault(folder)) {
		return { name, ok: true, warn: true, detail: `${folder} is a whole Obsidian vault`, fix: "Type subsub init: it moves Sub-Sub's files into a Sub-Sub folder inside the vault." };
	}
	const legacy = (["rules", "tags", "alerts"] as const).some((w) => settingsFile(folder, w) === join(folder, LEGACY_SETTINGS_DIR, SETTINGS_FILES[w]));
	if (legacy) {
		return { name, ok: true, warn: true, detail: `${folder}; the settings files are still in ${LEGACY_SETTINGS_DIR}/`, fix: "Type subsub init: it moves them to Zotero/." };
	}
	return { name, ok: true, detail: folder };
}
