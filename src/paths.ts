/**
 * Path gate for pi's write and edit tools.
 *
 * Paths are normalised the way pi's file tools read them (leading "@", "~/",
 * file:// URLs), and symlinks are resolved through the nearest existing parent,
 * so a link inside the vault that points elsewhere is judged by its target.
 */

import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { settingsPaths } from "./layout.ts";

export function normalizeToolPath(raw: string, cwd: string): string {
	let p = String(raw ?? "").trim();
	if (p.startsWith("@")) p = p.slice(1);
	if (p.startsWith("file://")) {
		try {
			p = fileURLToPath(p);
		} catch {
			/* keep as is */
		}
	}
	if (p === "~" || p.startsWith("~/")) p = join(homedir(), p.slice(1));
	return realish(resolve(cwd, p));
}

/** realpath of the nearest existing ancestor, plus the part that does not exist yet. */
export function realish(abs: string): string {
	let head = abs;
	const tail: string[] = [];
	while (!existsSync(head)) {
		const parent = dirname(head);
		if (parent === head) break;
		tail.unshift(basename(head));
		head = parent;
	}
	let real = head;
	try {
		real = realpathSync(head);
	} catch {
		/* keep */
	}
	return tail.length ? join(real, ...tail) : real;
}

/** macOS and Windows file systems ignore case: ~/.SSH is ~/.ssh. */
const FOLD_CASE = process.platform === "darwin" || process.platform === "win32";

export function within(child: string, parent: string | undefined): boolean {
	if (!parent) return false;
	// NFC: a name typed with combining accents is the same file as the precomposed one.
	const [c, p] = [child.normalize("NFC"), parent.normalize("NFC")];
	const rel = FOLD_CASE ? relative(p.toLowerCase(), c.toLowerCase()) : relative(p, c);
	return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

export interface PathPolicy {
	/** Folders where writes need no question. */
	allowed: string[];
	/** Files and folders that always need a question (rules, config, code). */
	protectedPaths: string[];
}

export function buildPolicy(opts: { vault?: string; cwd: string; serverDir: string; packageDir: string }): PathPolicy {
	const home = realish(homedir());
	const cwd = realish(opts.cwd);
	const allowed: string[] = [];
	if (opts.vault) allowed.push(realish(opts.vault));
	// The working folder counts only if it is a specific folder, not the home folder or above it.
	if (cwd !== home && within(cwd, home) && !within(home, cwd)) allowed.push(cwd);
	const protectedPaths = [
		join(home, ".pi"),
		join(home, ".subsub"),
		join(home, ".config"),
		join(home, ".ssh"),
		join(home, ".zshrc"),
		join(home, ".bashrc"),
		realish(opts.serverDir),
		realish(opts.packageDir),
	];
	if (opts.vault) {
		const v = realish(opts.vault);
		protectedPaths.push(
			join(v, ".claude"),
			join(v, ".opencode"),
			join(v, ".obsidian"),
			...settingsPaths(v),
		);
	}
	return { allowed, protectedPaths };
}

export type PathVerdict = { ok: true } | { ok: false; why: string };

export function judgePath(target: string, policy: PathPolicy): PathVerdict {
	const hit = policy.protectedPaths.find((p) => within(target, p));
	if (hit) return { ok: false, why: `it changes a protected file or folder (${hit})` };
	const root = policy.allowed.find((a) => within(target, a));
	if (!root) return { ok: false, why: "it is outside the vault and the working folder" };
	// Notes never live in hidden folders; .git/hooks, .obsidian/plugins or .vscode can run code.
	// Only the part inside the folder counts, so a vault under ~/.something still works.
	const hidden = relative(root, target).split(/[\\/]/).find((part) => part.startsWith(".") && part !== "." && part !== "..");
	if (hidden) return { ok: false, why: `it is in a hidden folder or file (${hidden})` };
	return { ok: true };
}

/** Files with keys and passwords: the model may not read them, even when you ask. */
export function secretPaths(): string[] {
	const home = realish(homedir());
	return [
		join(home, ".subsub", "agent", "auth.json"),
		...[process.env.SUBSUB_AGENT_DIR, process.env.PI_CODING_AGENT_DIR].filter((d): d is string => !!d).map((d) => join(realish(d.replace(/^~(?=$|[\\/])/, home)), "auth.json")),
		join(home, ".pi", "agent", "auth.json"),
		join(home, ".config", "zotero-local-mcp", "env"),
		join(home, ".ssh"),
		join(home, ".aws"),
		join(home, ".netrc"),
	];
}

/** True if reading `target` would read a secret; for grep, also a folder that holds one. */
export function isSecret(target: string, recursive = false, envFile?: string): boolean {
	return [...secretPaths(), ...(envFile ? [realish(envFile)] : [])].some((p) => within(target, p) || (recursive && within(p, target)));
}
