/**
 * The `subsub` command: pi, set up as Sub-Sub.
 *
 * - Own pi folder (~/.subsub/agent, or SUBSUB_AGENT_DIR): settings, sessions
 *   and packages are separate from plain pi.
 * - The Sub-Sub package is declared in that folder's settings.json, so pi
 *   loads the extension and the prompt templates in the normal way.
 * - Credentials: if pi already has an auth.json and Sub-Sub has none, Sub-Sub
 *   links to it, so one /login serves both.
 * - Folder: started from the home folder, Sub-Sub moves to the vault.
 *   `--here` keeps the current folder.
 * - `subsub review preview|apply NOTE...` runs zotero-review (tag review notes,
 *   several at a time) with Sub-Sub's server folder and settings.
 * - `subsub init` sets Sub-Sub up; `subsub doctor` checks the setup.
 * - `subsub web` (or `subsub serve`) opens Sub-Sub in the browser;
 *   `subsub shortcut` adds a Sub-Sub shortcut that does the same.
 */

import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expand, loadConfig, serverCommand, type SubsubConfig } from "./config.ts";

export const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function packageVersion(dir: string = PACKAGE_DIR): string {
	try {
		return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

export function agentDirFor(env: NodeJS.ProcessEnv, home: string = homedir()): string {
	return env.SUBSUB_AGENT_DIR ? expand(env.SUBSUB_AGENT_DIR) : join(home, ".subsub", "agent");
}

function real(p: string): string {
	try {
		return realpathSync(p);
	} catch {
		return resolve(p);
	}
}

function sourceOf(entry: unknown): string | undefined {
	if (typeof entry === "string") return entry;
	if (entry && typeof entry === "object" && typeof (entry as { source?: unknown }).source === "string") {
		return (entry as { source: string }).source;
	}
	return undefined;
}

/**
 * Make sure settings.json in the agent folder declares the Sub-Sub package.
 * Other settings are kept. Returns what happened, for tests and messages.
 */
export function ensureSettings(agentDir: string, packageDir: string = PACKAGE_DIR): "created" | "added" | "present" | "unreadable" {
	mkdirSync(agentDir, { recursive: true });
	const file = join(agentDir, "settings.json");
	let settings: Record<string, unknown> = {};
	let existed = false;
	if (existsSync(file)) {
		existed = true;
		try {
			settings = JSON.parse(readFileSync(file, "utf8"));
		} catch {
			return "unreadable";
		}
	}
	const packages = Array.isArray(settings.packages) ? [...settings.packages] : [];
	const want = real(packageDir);
	const has = packages.some((p) => {
		const src = sourceOf(p);
		return src !== undefined && real(resolve(agentDir, expand(src))) === want;
	});
	// Sub-Sub draws its own header; pi's list of loaded resources is noise here. Set once, so it can be changed.
	const quiet = settings.quietStartup === undefined;
	if (has && !quiet) return "present";
	if (!has) packages.push(want);
	settings.packages = packages;
	if (quiet) settings.quietStartup = true;
	writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
	return existed ? "added" : "created";
}

function isEmptyAuth(file: string): boolean {
	try {
		const data = JSON.parse(readFileSync(file, "utf8"));
		return data && typeof data === "object" && Object.keys(data).length === 0;
	} catch {
		return false;
	}
}

/** Link Sub-Sub's auth.json to pi's, when pi has one and Sub-Sub has none. */
export function shareAuth(agentDir: string, piAgentDir: string): boolean {
	const mine = join(agentDir, "auth.json");
	const theirs = join(piAgentDir, "auth.json");
	if (!existsSync(theirs)) return false;
	try {
		const st = lstatSync(mine);
		// pi writes an empty "{}" on first start; that one may be replaced.
		if (st.isSymbolicLink() || !isEmptyAuth(mine)) return false;
		renameSync(mine, `${mine}.empty`);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
	}
	mkdirSync(agentDir, { recursive: true });
	symlinkSync(theirs, mine);
	return true;
}

/** Folder to start in: the vault when started from the home folder, unless --here. */
export function chooseCwd(cwd: string, home: string, vault: string | undefined, here: boolean): string {
	if (here || !vault || !existsSync(vault)) return cwd;
	return real(cwd) === real(home) ? vault : cwd;
}

/** `pi update` with no package source updates pi itself; here that must not happen. */
export function isSelfUpdate(args: string[]): boolean {
	if (args[0] !== "update") return false;
	const rest = args.slice(1).filter((a) => a !== "--force" && a !== "-a" && a !== "--approve");
	return rest.length === 0 || rest.some((a) => ["--self", "self", "pi", "--all"].includes(a));
}

/** The command line for `subsub review ...`: zotero-review in the server folder, with the same settings file. */
export function reviewCommand(args: string[], cfg: SubsubConfig, env: NodeJS.ProcessEnv = process.env): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
	return {
		...serverCommand(cfg, "zotero-review", args, env),
		env: { ...env, ...(cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {}) },
	};
}

const HELP = `Sub-Sub: your research assistant, working from your own Zotero library.

Usage:
  subsub                 Start Sub-Sub in the terminal
  subsub --librarian     Start in the Librarian, which only manages the library
  subsub web             Open Sub-Sub in the browser
  subsub init            Set up or change the settings (folder, tag list, profile, models)
  subsub doctor          Check the set-up; each line marked FIX says what to do
  subsub shortcut        Add a Sub-Sub shortcut (--remove takes it away)
  subsub review preview|apply <note>
                         Check or apply a tag review note from Inbox/
  subsub --version       Show the versions

Options:
  --here                 Work in the current folder, not in the Sub-Sub folder

In Sub-Sub, type /subsub for the state, /researcher or /librarian to switch modes,
/profile to change the profile, /undo to undo the last change, and / for all commands.
Sub-Sub runs on pi: pi's options (for example --model, --resume) also work.

Docs: https://subsub.tiagojacinto.eu`;

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
	const env = process.env;
	const home = homedir();
	const here = argv.includes("--here");
	const args = argv.filter((a) => a !== "--here");

	if (args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
		console.log(HELP);
		return;
	}
	if (args[0] === "--version" || args[0] === "-v") {
		const piPkg = join(dirname(fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"))), "..");
		console.log(`subsub ${packageVersion()} (pi ${packageVersion(piPkg)})`);
		return;
	}
	if (args[0] === "init") {
		const { initMain } = await import("./init.ts");
		process.exitCode = await initMain(args.slice(1), env);
		return;
	}
	if (args[0] === "web" || args[0] === "serve") {
		const { webMain } = await import("./web.ts");
		process.exitCode = await webMain([...args.slice(1), ...(here ? ["--here"] : [])], env);
		return;
	}
	if (args[0] === "shortcut") {
		const { shortcutMain } = await import("./shortcut.ts");
		process.exitCode = shortcutMain(args.slice(1), env);
		return;
	}
	if (args[0] === "doctor") {
		const { doctorMain } = await import("./doctor.ts");
		process.exitCode = await doctorMain(env);
		return;
	}
	if (args[0] === "review") {
		const r = reviewCommand(args.slice(1), loadConfig(env), env);
		const res = spawnSync(r.command, r.args, { env: r.env, stdio: "inherit" });
		if (res.error) console.error(`Sub-Sub: cannot run ${r.command}: ${res.error.message}`);
		process.exitCode = res.status ?? 1;
		return;
	}
	if (isSelfUpdate(args)) {
		if (PACKAGE_DIR.split(/[\\/]/).includes("node_modules")) {
			console.log("Sub-Sub is not updated with \"update\". To update it, run the installer again (https://subsub.tiagojacinto.eu/install/);");
			console.log("if you installed it with npm, type: npm install -g @tiagojct/subsub");
		} else {
			console.log(`Sub-Sub is not updated with "update". Its code is in ${PACKAGE_DIR}; after new code arrives, run "npm install" there.`);
		}
		console.log('To update packages added to Sub-Sub, use "subsub update --extensions".');
		process.exitCode = 1;
		return;
	}

	const agentDir = agentDirFor(env, home);
	const piAgentDir = env.PI_CODING_AGENT_DIR ? expand(env.PI_CODING_AGENT_DIR) : join(home, ".pi", "agent");
	const settings = ensureSettings(agentDir);
	if (settings === "unreadable") {
		console.error(`Sub-Sub: ${join(agentDir, "settings.json")} is not valid JSON. Fix it, or move it away and start again.`);
		process.exitCode = 1;
		return;
	}
	try {
		shareAuth(agentDir, piAgentDir);
	} catch {
		/* not important: /login in Sub-Sub also works */
	}

	let vault: string | undefined;
	try {
		vault = loadConfig(env).vault;
	} catch {
		vault = undefined; // the extension reports config errors when it starts
	}
	const cwd = chooseCwd(process.cwd(), home, vault, here);
	if (cwd !== process.cwd()) process.chdir(cwd);

	env.PI_CODING_AGENT_DIR = agentDir;
	env.SUBSUB_CLI = "1";
	// pi's update notice would point to the global pi, not to this copy.
	env.PI_SKIP_VERSION_CHECK ??= "1";
	// pi reports a first install to pi.dev and names itself to some providers; Sub-Sub sends no usage data.
	env.PI_TELEMETRY ??= "0";

	process.argv = [process.argv[0], process.argv[1], ...args];
	const index = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
	await import(pathToFileURL(join(dirname(index), "bundle", "cli.js")).href);
}
