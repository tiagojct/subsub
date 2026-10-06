/**
 * Settings for Sub-Sub. Everything has a default; an optional JSON file
 * (~/.config/subsub/config.json, or SUBSUB_CONFIG) overrides it.
 *
 * {
 *   "profile": "scholar",
 *   "userName": "Ana", "about": "a master's student in health informatics", "language": "English",
 *   "vault": "~/Documents/Sub-Sub",
 *   "models": { "librarian": "opencode-go/glm-5.3-flash", "researcher": "opencode-go/mimo-v2.6-pro" },
 *   "defaultMode": "researcher"
 * }
 *
 * `subsub init` writes this file. Without "serverDir" (or when that folder does
 * not exist), the Zotero servers run from PyPI with uv.
 *
 * Add-ons: "addons": ["starbuck"] starts Starbuck (reference checks) as a third
 * server, "verify". It runs from "starbuckDir" when that folder has a
 * pyproject.toml, otherwise from the pinned PyPI release (STARBUCK_SOURCE).
 * `subsub init` and the web view turn it on and off.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { isObsidianVault, settingsFile } from "./layout.ts";

export type Mode = "librarian" | "researcher";
export type Profile = "reader" | "scholar" | "author" | "editor";
export const PROFILES: Profile[] = ["reader", "scholar", "author", "editor"];

/** The Zotero server release that this Sub-Sub version runs when there is no local server folder. */
export const SERVER_VERSION = "0.5.0";

/** The Starbuck release (PyPI) that this Sub-Sub version runs when there is no local Starbuck folder. */
export const STARBUCK_VERSION = "0.2.0";
export const STARBUCK_SOURCE = `starbuck==${STARBUCK_VERSION}`;

export interface SubsubConfig {
	/** The settings file (written by `subsub init` and `/profile`). */
	configFile: string;
	/** How much Sub-Sub does for the user: reader, scholar, author or editor. */
	profile: Profile;
	/** How the prompts name the user ("the user" when not set). */
	userName?: string;
	/** One line about the user, e.g. "a master's student in health informatics". */
	about?: string;
	/** Language of replies and notes. "auto": the language the user writes in. */
	language: string;
	/** "fmup" when set up with the FMUP / U.Porto option. */
	setup?: string;
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
	/** Path to uv when it is not on PATH (for example when pi starts from a GUI). */
	uvPath?: string;
	/** Banner, status line and themes when Sub-Sub runs as its own command (default true). */
	look?: boolean;
	/** A line from Moby-Dick under the banner (default true). */
	quotes?: boolean;
	/** Theme per mode, without -dark/-light; false keeps your pi theme. */
	themes?: Partial<Record<Mode, string>> | false;
	/** Optional servers to start, e.g. ["starbuck"]. */
	addons?: string[];
	/** Local Starbuck folder (used when it has a pyproject.toml). */
	starbuckDir?: string;
}

export function expand(p: string, home?: string): string {
	const base = home ?? process.env.HOME ?? homedir();
	return resolve(p.replace(/^~(?=$|\/)/, base));
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

export function configPath(env: NodeJS.ProcessEnv = process.env): string {
	return expand(env.SUBSUB_CONFIG ?? "~/.config/subsub/config.json", env.HOME);
}

export function readConfigFile(file: string): Record<string, unknown> {
	if (!existsSync(file)) return {};
	try {
		return JSON.parse(readFileSync(file, "utf8"));
	} catch (err) {
		throw new Error(`Sub-Sub: cannot read ${file}: ${(err as Error).message}`);
	}
}

/** Merge settings into the settings file; other settings stay. */
export function saveConfig(patch: Record<string, unknown>, env: NodeJS.ProcessEnv = process.env): string {
	const file = configPath(env);
	const merged = { ...readConfigFile(file), ...patch };
	for (const [k, v] of Object.entries(merged)) if (v === undefined) delete merged[k];
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
	return file;
}

export function isProfile(x: unknown): x is Profile {
	return typeof x === "string" && (PROFILES as string[]).includes(x);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SubsubConfig {
	const home = env.HOME;
	const file = configPath(env);
	let user: Partial<SubsubConfig> = {};
	if (existsSync(file)) {
		try {
			user = JSON.parse(readFileSync(file, "utf8"));
		} catch (err) {
			throw new Error(`Sub-Sub: cannot read ${file}: ${(err as Error).message}`);
		}
	}
	const explicitEnv = user.envFile ?? env.ZOTERO_MCP_ENV;
	const envFile = explicitEnv
		? expand(explicitEnv, home)
		: [
				"~/.config/zotero-local-mcp/env",
				"~/.config/opencode/zotero.env",
		  ]
				.map((p) => expand(p, home))
				.find((p) => existsSync(p));
	const envValues = envFile && existsSync(envFile) ? parseEnvFile(envFile) : {};
	const vaultRaw = user.vault ?? env.ZOTERO_VAULT ?? envValues.ZOTERO_VAULT;
	const vault = vaultRaw ? expand(vaultRaw, home) : undefined;
	const mode = user.defaultMode === "librarian" ? "librarian" : "researcher";
	return {
		configFile: file,
		profile: isProfile(user.profile) ? user.profile : "scholar",
		userName: typeof user.userName === "string" && user.userName.trim() ? user.userName.trim() : undefined,
		about: typeof user.about === "string" && user.about.trim() ? user.about.trim() : undefined,
		language: typeof user.language === "string" && user.language.trim() ? user.language.trim() : "English",
		setup: user.setup,
		serverDir: expand(user.serverDir ?? "~/Projects/zotero-local-mcp", home),
		envFile,
		vault,
		models: user.models ?? {
			librarian: "opencode-go/glm-5.3-flash",
			researcher: "opencode-go/mimo-v2.6-pro",
		},
		defaultMode: mode,
		// A Sub-Sub folder inside an Obsidian vault also reads the vault's context file.
		vaultContext: (
			user.vaultContext ??
			(vault ? [join(vault, ".claude", "CLAUDE.md"), ...(isObsidianVault(dirname(vault)) ? [join(dirname(vault), ".claude", "CLAUDE.md")] : [])] : [])
		).map((p) => expand(p, home)),
		sharedRules: user.sharedRules
			? expand(user.sharedRules, home)
			: vault
				? settingsFile(vault, "rules")
				: undefined,
		startTimeout: user.startTimeout ?? 45,
		uvPath: user.uvPath ? expand(user.uvPath, home) : undefined,
		look: user.look,
		quotes: user.quotes,
		themes: user.themes,
		addons: Array.isArray(user.addons) ? user.addons.filter((a): a is string => typeof a === "string") : [],
		starbuckDir: expand(user.starbuckDir ?? "~/Projects/starbuck", home),
	};
}

/** uv is often missing from PATH when pi is started outside a login shell. */
export function findUv(cfg: Pick<SubsubConfig, "uvPath">, env: NodeJS.ProcessEnv = process.env, platform: string = process.platform): string {
	const home = env.HOME;
	const unix = ["~/.local/bin/uv", "/opt/homebrew/bin/uv", "/usr/local/bin/uv", "~/.cargo/bin/uv"];
	const windows = ["~/.local/bin/uv.exe", "~/.cargo/bin/uv.exe", env.LOCALAPPDATA ? join(env.LOCALAPPDATA, "uv", "uv.exe") : ""];
	const candidates = [cfg.uvPath, env.SUBSUB_UV, ...(platform === "win32" ? windows : unix)]
		.filter((x): x is string => Boolean(x))
		.map((p) => expand(p, home));
	return candidates.find((p) => existsSync(p)) ?? "uv";
}

/**
 * How to start one of the Python programs (zotero-local-mcp, zotero-scholar-mcp,
 * zotero-review): from the local server folder when it exists, otherwise the
 * pinned release from PyPI through `uv tool run`.
 */
export function serverCommand(
	cfg: Pick<SubsubConfig, "serverDir" | "uvPath">,
	program: string,
	args: string[] = [],
	env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[] } {
	const uv = findUv(cfg, env);
	if (existsSync(join(cfg.serverDir, "pyproject.toml"))) {
		return { command: uv, args: ["run", "--quiet", "--directory", cfg.serverDir, program, ...args] };
	}
	return { command: uv, args: ["tool", "run", "--quiet", "--from", `zotero-local-mcp==${SERVER_VERSION}`, program, ...args] };
}

export function starbuckEnabled(cfg: Pick<SubsubConfig, "addons">): boolean {
	return (cfg.addons ?? []).includes("starbuck");
}

/** How to start Starbuck's MCP server: from the local folder when it exists, otherwise the pinned release. */
export function starbuckCommand(
	cfg: Pick<SubsubConfig, "starbuckDir" | "uvPath">,
	env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[] } {
	const uv = findUv(cfg, env);
	if (cfg.starbuckDir && existsSync(join(cfg.starbuckDir, "pyproject.toml"))) {
		return { command: uv, args: ["run", "--quiet", "--directory", cfg.starbuckDir, "starbuck-mcp"] };
	}
	return { command: uv, args: ["tool", "run", "--quiet", "--from", STARBUCK_SOURCE, "starbuck-mcp"] };
}

/** The addons setting with Starbuck turned on or off; other add-ons stay. Undefined (no setting) when empty. */
export function withStarbuck(addons: string[] | undefined, on: boolean): string[] | undefined {
	const rest = (addons ?? []).filter((a) => a !== "starbuck");
	const out = on ? [...rest, "starbuck"] : rest;
	return out.length ? out : undefined;
}

/** How prompts name the user. */
export function who(cfg: Pick<SubsubConfig, "userName">): string {
	return cfg.userName ?? "the user";
}
