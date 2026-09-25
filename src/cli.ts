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
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expand, loadConfig } from "./config.ts";

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
	if (has) return "present";
	packages.push(want);
	settings.packages = packages;
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

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
	const env = process.env;
	const home = homedir();
	const here = argv.includes("--here");
	const args = argv.filter((a) => a !== "--here");

	if (args[0] === "--version" || args[0] === "-v") {
		const piPkg = join(dirname(fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"))), "..");
		console.log(`subsub ${packageVersion()} (pi ${packageVersion(piPkg)})`);
		return;
	}
	if (isSelfUpdate(args)) {
		console.log(`Sub-Sub is not updated with "update". Its code is in ${PACKAGE_DIR}; after new code arrives, run "npm install" there.`);
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

	process.argv = [process.argv[0], process.argv[1], ...args];
	const index = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
	await import(pathToFileURL(join(dirname(index), "bundle", "cli.js")).href);
}
