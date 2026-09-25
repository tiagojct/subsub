/**
 * The Sub-Sub part of the system prompt: role text for the current mode, the
 * shared Zotero rules from the vault, and the vault conventions when pi runs
 * inside the vault.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Mode, SubsubConfig } from "./config.ts";

const ROLE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "roles");

function readIf(path: string | undefined): string | undefined {
	if (!path || !existsSync(path)) return undefined;
	try {
		return readFileSync(path, "utf8").trim();
	} catch {
		return undefined;
	}
}

export function inside(child: string, parent: string | undefined): boolean {
	if (!parent) return false;
	const rel = relative(resolve(parent), resolve(child));
	return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}

export function roleText(mode: Mode): string {
	return readIf(join(ROLE_DIR, `${mode}.md`)) ?? `You are the ${mode}.`;
}

export function systemAddition(mode: Mode, cfg: SubsubConfig, cwd: string): string {
	const parts = [`# Sub-Sub: ${mode} mode`, roleText(mode)];
	const shared = readIf(cfg.sharedRules);
	if (shared) {
		parts.push(
			"# Shared Zotero rules (from the vault)",
			shared,
			"Sub-Sub note: in Sub-Sub you do not need a separate dry run before a change. Call the write tool with dry_run=false; Sub-Sub shows Tiago the server's preview and applies it only if he approves. This replaces the dry-run steps above.",
		);
	}
	if (inside(cwd, cfg.vault)) {
		for (const f of cfg.vaultContext) {
			const t = readIf(f);
			if (t) parts.push(`# Vault conventions (${f})`, t);
		}
	}
	return parts.join("\n\n");
}
