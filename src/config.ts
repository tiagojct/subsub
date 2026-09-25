/**
 * Settings for Sub-Sub. Everything has a default; an optional JSON file
 * (~/.config/subsub/config.json, or SUBSUB_CONFIG) overrides it.
 *
 * {
 *   "serverDir": "~/Projects/zotero-local-mcp",
 *   "envFile": "~/.config/opencode/zotero.env",
 *   "models": { "librarian": "opencode-go/glm-5.3-flash", "researcher": "opencode-go/mimo-v2.6-pro" },
 *   "defaultMode": "researcher"
 * }
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export type Mode = "librarian" | "researcher";

export interface SubsubConfig {
	serverDir: string;
	envFile?: string;
	vault?: string;
	models: Partial<Record<Mode, string>>;
	defaultMode: Mode;
	/** Extra context files added to the system prompt when pi runs inside the vault. */
	vaultContext: string[];
	/** Shared rules file (tag system, citekeys, note formats). */
	sharedRules?: string;
	/** Seconds to wait for the Python servers to start. */
	startTimeout: number;
}

export function expand(p: string): string {
	return resolve(p.replace(/^~(?=$|\/)/, homedir()));
}

export function parseEnvFile(path: string): Record<string, string> {
	const out: Record<string, string> = {};
	let text: string;
	try {
		text = readFileSync(path, "utf8");
	} catch {
		return out;
	}
	for (const raw of text.split("\n")) {
		const line = raw.trim();
		if (!line || line.startsWith("#") || !line.includes("=")) continue;
		const i = line.indexOf("=");
		out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
	}
	return out;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SubsubConfig {
	const file = expand(env.SUBSUB_CONFIG ?? "~/.config/subsub/config.json");
	let user: Partial<SubsubConfig> = {};
	if (existsSync(file)) {
		try {
			user = JSON.parse(readFileSync(file, "utf8"));
		} catch (err) {
			throw new Error(`Sub-Sub: cannot read ${file}: ${(err as Error).message}`);
		}
	}
	const envCandidates = [
		user.envFile,
		env.ZOTERO_MCP_ENV,
		"~/.config/zotero-local-mcp/env",
		"~/.config/opencode/zotero.env",
	].filter((x): x is string => Boolean(x));
	const envFile = envCandidates.map(expand).find((p) => existsSync(p));
	const envValues = envFile ? parseEnvFile(envFile) : {};
	const vaultRaw = user.vault ?? env.ZOTERO_VAULT ?? envValues.ZOTERO_VAULT;
	const vault = vaultRaw ? expand(vaultRaw) : undefined;
	const mode = user.defaultMode === "librarian" ? "librarian" : "researcher";
	return {
		serverDir: expand(user.serverDir ?? "~/Projects/zotero-local-mcp"),
		envFile,
		vault,
		models: user.models ?? {
			librarian: "opencode-go/glm-5.3-flash",
			researcher: "opencode-go/mimo-v2.6-pro",
		},
		defaultMode: mode,
		vaultContext: (user.vaultContext ?? (vault ? [join(vault, ".claude", "CLAUDE.md")] : [])).map(expand),
		sharedRules: user.sharedRules
			? expand(user.sharedRules)
			: vault
				? join(vault, "Systems", "Zotero agent.md")
				: undefined,
		startTimeout: user.startTimeout ?? 45,
	};
}
