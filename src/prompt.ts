/**
 * The Sub-Sub part of the system prompt: role text for the current mode, the
 * profile rules, the shared Zotero rules from the Sub-Sub folder, the vault
 * conventions when pi runs inside the Sub-Sub folder, and the language rule.
 *
 * Role and profile texts use placeholders: {{user}} / {{User}} (the user's name,
 * or "the user"), {{about}} (one line about the user) and {{batch}}.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Mode, type SubsubConfig, who } from "./config.ts";
import { profileSpec } from "./profiles.ts";

const ROLE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "roles");

function readIf(path: string | undefined): string | undefined {
	if (!path || !existsSync(path)) return undefined;
	try {
		return readFileSync(path, "utf8").trim();
	} catch {
		return undefined;
	}
}

export function languageRule(language: string, user = "the user"): string {
	if (language.toLowerCase() === "auto") {
		return `Reply in the language ${user} writes in. Write notes in the language of ${user}'s other notes; if unsure, ask once. Keep quotations, titles of works and proper names in their original language.`;
	}
	return `Always reply in ${language}, even when ${user} writes in another language and even when the sources or notes you read are in another language. Write the notes you create in ${language} too, including their titles. Keep quotations, titles of works and proper names in their original language.`;
}

export function inside(child: string, parent: string | undefined): boolean {
	if (!parent) return false;
	const rel = relative(resolve(parent), resolve(child));
	return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function capital(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fill(text: string, cfg: Pick<SubsubConfig, "userName" | "about" | "profile">): string {
	const user = who(cfg);
	const about = cfg.about ? `${capital(user)} is ${cfg.about}.` : "";
	return text
		.replaceAll("{{User}}", capital(user))
		.replaceAll("{{user}}", user)
		.replaceAll("{{about}}", about)
		.replaceAll("{{batch}}", String(profileSpec(cfg.profile).batch))
		.replace(/[ \t]+\n/g, "\n");
}

export function roleText(mode: Mode, cfg?: Pick<SubsubConfig, "userName" | "about" | "profile">): string {
	const raw = readIf(join(ROLE_DIR, `${mode}.md`)) ?? `You are Sub-Sub, the ${mode}.`;
	return cfg ? fill(raw, cfg) : raw;
}

export function systemAddition(mode: Mode, cfg: SubsubConfig, cwd: string): string {
	const user = who(cfg);
	const parts = [`# Sub-Sub: ${mode === "librarian" ? "Librarian" : "Researcher"} mode`, roleText(mode, cfg)];
	if (cfg.vault) {
		parts.push(
			"# The Sub-Sub folder",
			`The Sub-Sub folder is ${cfg.vault}. Folder names in these instructions (Inbox/, Literature/, Syntheses/, Research/, Zotero/) are inside it. Write notes there with absolute paths, even when the working folder is somewhere else.`,
		);
	}
	const shared = readIf(cfg.sharedRules);
	if (shared) {
		parts.push(
			"# Shared Zotero rules (from the Sub-Sub folder)",
			shared,
			`Sub-Sub note: in Sub-Sub you do not need a separate dry run before a change. Call the write tool with dry_run=false; Sub-Sub shows ${user} the server's preview and applies it only on approval. This replaces the dry-run steps above.`,
		);
	}
	if (inside(cwd, cfg.vault)) {
		for (const f of cfg.vaultContext) {
			const t = readIf(f);
			if (t) parts.push(`# Vault conventions (${f})`, t);
		}
	}
	if (cfg.setup === "fmup") {
		parts.push(
			"# U.Porto",
			`${capital(user)} works at the University of Porto. Papers that are not open access often open through the university's subscriptions when ${user} uses Sub-Sub on the U.Porto network: say so when a work is not open access.`,
		);
	}
	// The profile and the language rule come last, so they win over the shared rules and the vault conventions.
	parts.push("# Profile", fill(profileSpec(cfg.profile).rules, cfg));
	parts.push("# Language", languageRule(cfg.language, user));
	return parts.join("\n\n");
}
