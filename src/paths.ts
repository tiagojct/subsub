/**
 * Path gate for pi's write and edit tools.
 *
 * Paths are normalised the way pi's file tools read them (leading "@", "~/",
 * file:// URLs), and symlinks are resolved through the nearest existing parent,
 * so a link inside the vault that points elsewhere is judged by its target.
 */

import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

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

export function within(child: string, parent: string | undefined): boolean {
	if (!parent) return false;
	const rel = relative(parent, child);
	return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !rel.startsWith(sep));
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
			join(v, "Systems", "Zotero agent.md"),
			join(v, "Systems", "Zotero tags.md"),
			join(v, "Systems", "Zotero librarian.md"),
			join(v, "Systems", "Zotero researcher.md"),
			join(v, "Systems", "Literature alerts.md"),
		);
	}
	return { allowed, protectedPaths };
}

export type PathVerdict = { ok: true } | { ok: false; why: string };

export function judgePath(target: string, policy: PathPolicy): PathVerdict {
	const hit = policy.protectedPaths.find((p) => within(target, p));
	if (hit) return { ok: false, why: `it changes a protected file or folder (${hit})` };
	if (policy.allowed.some((a) => within(target, a))) return { ok: true };
	return { ok: false, why: "it is outside the vault and the working folder" };
}
