/**
 * `subsub init`: set Sub-Sub up for a new user, or change the settings of an
 * existing one. Press Enter to keep the value in brackets.
 *
 * Writes:
 * - the settings file (~/.config/subsub/config.json): profile, name, language,
 *   notes folder, models;
 * - the server settings file (~/.config/zotero-local-mcp/env, or the one that
 *   already exists): notes folder, tag list, contact email. Other lines stay;
 * - in the notes folder: Inbox/, Systems/Zotero tags.md (a starter list) and
 *   Systems/Zotero agent.md (note formats). Existing files are never replaced.
 *
 * Flags (for scripts and tests): --yes (take every default), --setup
 * standard|fmup, --name, --about, --language, --notes, --profile, --tags
 * health-sciences|health-informatics|any-field, --email, --starbuck on|off,
 * --models keep|later|opencode-go.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
	configPath,
	expand,
	isProfile,
	loadConfig,
	parseEnvFile,
	PROFILES,
	readConfigFile,
	saveConfig,
	starbuckEnabled,
	type SubsubConfig,
	withStarbuck,
} from "./config.ts";
import { defaultRunner, starbuckCheck } from "./doctor.ts";
import { PROFILE_SPECS } from "./profiles.ts";

const TEMPLATES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "templates");

export const STARTER_TAGS: Record<string, string> = {
	"health-sciences": "Health sciences: clinical areas, public health, methods and study designs",
	"health-informatics": "Health informatics: information systems, data, AI, digital health",
	"any-field": "Any field: methods and document types only; the librarian proposes topics from your library",
};

export const TESTED_MODELS = { librarian: "opencode-go/glm-5.3-flash", researcher: "opencode-go/mimo-v2.6-pro" };

export interface InitIO {
	ask(question: string, def: string): Promise<string>;
	choose(question: string, options: Array<{ value: string; label: string }>, def: string): Promise<string>;
	say(line: string): void;
}

export interface InitResult {
	configFile: string;
	envFile: string;
	notes: string;
	created: string[];
	zotero: boolean;
}

/** Set KEY=VALUE lines in an env file text; other lines and comments stay. */
export function upsertEnv(text: string, values: Record<string, string | undefined>): string {
	const lines = text ? text.replace(/\n$/, "").split("\n") : [];
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === "") continue;
		const i = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
		const line = `${key}=${value}`;
		if (i >= 0) lines[i] = line;
		else lines.push(line);
	}
	return `${lines.join("\n")}\n`;
}

/** True when pi's credentials (auth.json in the agent folder) name a provider that starts with prefix. */
export function hasProvider(agentDir: string, prefix: string): boolean {
	try {
		const data = JSON.parse(readFileSync(join(agentDir, "auth.json"), "utf8"));
		return Object.keys(data ?? {}).some((k) => k.startsWith(prefix));
	} catch {
		return false;
	}
}

export async function zoteroReachable(fetchFn: typeof fetch = fetch): Promise<boolean> {
	try {
		const res = await fetchFn("http://127.0.0.1:23119/api/", { signal: AbortSignal.timeout(2000) });
		return res.ok;
	} catch {
		return false;
	}
}

export async function runInit(
	io: InitIO,
	flags: Record<string, string>,
	env: NodeJS.ProcessEnv = process.env,
	deps: { fetch?: typeof fetch; home?: string; prepareStarbuck?: (cfg: SubsubConfig) => string } = {},
): Promise<InitResult> {
	const home = deps.home ?? env.HOME ?? homedir();
	const initEnv: NodeJS.ProcessEnv = { ...env, HOME: home };
	const configFile = configPath(initEnv);
	const existing = readConfigFile(configFile) as Record<string, any>;
	const current = loadConfig(initEnv);
	const envFile = current.envFile ?? expand(initEnv.ZOTERO_MCP_ENV ?? join(home, ".config", "zotero-local-mcp", "env"), home);
	const envValues = existsSync(envFile) ? parseEnvFile(envFile) : {};
	const created: string[] = [];

	io.say(existsSync(configFile) ? `Sub-Sub settings (${configFile}). Press Enter to keep the value in brackets.` : "Sub-Sub setup. Press Enter to take the value in brackets.");

	const setup = await io.choose(
		"Setup",
		[
			{ value: "standard", label: "Standard" },
			{ value: "fmup", label: "FMUP / U.Porto: health-sciences tags, Reader profile (the FMUP model service is coming soon)" },
		],
		flags.setup ?? existing.setup ?? "standard",
	);
	const fmup = setup === "fmup";
	const userName = (await io.ask("Your name, for Sub-Sub's replies (Enter for none)", flags.name ?? existing.userName ?? "")).trim();
	const about = (await io.ask('One line about you, e.g. "a master\'s student in health informatics" (optional)', flags.about ?? existing.about ?? "")).trim();
	const language = (await io.ask("Language for replies and notes (a language, or auto for the language you write in)", flags.language ?? existing.language ?? "English")).trim() || "English";
	const notes = expand(
		(await io.ask("Notes folder (Markdown files; an Obsidian vault works)", flags.notes ?? current.vault ?? envValues.ZOTERO_VAULT ?? join(home, "Documents", "Sub-Sub"))).trim(),
		home,
	);
	const profileDefault = flags.profile ?? existing.profile ?? (fmup ? "reader" : "scholar");
	const profile = await io.choose(
		"Profile (change it later with /profile)",
		PROFILES.map((p) => ({ value: p, label: `${PROFILE_SPECS[p].label}: ${PROFILE_SPECS[p].summary}` })),
		isProfile(profileDefault) ? profileDefault : "scholar",
	);

	const vocab = envValues.ZOTERO_VOCAB ? expand(envValues.ZOTERO_VOCAB, home) : join(notes, "Systems", "Zotero tags.md");
	let tags = "keep";
	if (existsSync(vocab)) {
		io.say(`Tag list: keeping ${vocab}.`);
	} else {
		tags = await io.choose(
			"Starter tag list (edit it later in the notes folder)",
			Object.entries(STARTER_TAGS).map(([value, label]) => ({ value, label })),
			flags.tags ?? (fmup ? "health-sciences" : "any-field"),
		);
	}
	const email = (
		await io.ask("Email for Unpaywall and Crossref, to find open-access PDFs (optional)", flags.email ?? envValues.ZOTERO_CONTACT_EMAIL ?? "")
	).trim();
	const starbuck = await io.choose(
		"Reference checks (Starbuck): check that cited works exist, match their citation and were not retracted",
		[
			{ value: "off", label: "Off" },
			{ value: "on", label: "On (the researcher gets /verify; uses the email above)" },
		],
		flags.starbuck ?? (starbuckEnabled(current) ? "on" : "off"),
	);
	const modelOptions = [
		...(existing.models ? [{ value: "keep", label: `Keep: ${JSON.stringify(existing.models)}` }] : []),
		{ value: "later", label: "Choose later in Sub-Sub (/login, then /model)" },
		{ value: "opencode-go", label: `OpenCode Go, tested: ${TESTED_MODELS.librarian} for the librarian, ${TESTED_MODELS.researcher} for the researcher` },
	];
	const agentDir = initEnv.SUBSUB_AGENT_DIR ? expand(initEnv.SUBSUB_AGENT_DIR, home) : join(home, ".subsub", "agent");
	const modelDefault = existing.models ? "keep" : hasProvider(agentDir, "opencode") ? "opencode-go" : "later";
	const models = await io.choose("Models", modelOptions, flags.models ?? modelDefault);

	// ---- write
	for (const dir of [notes, join(notes, "Inbox"), join(notes, "Systems")]) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
			created.push(dir);
		}
	}
	if (tags !== "keep" && STARTER_TAGS[tags] && !existsSync(vocab)) {
		mkdirSync(dirname(vocab), { recursive: true });
		copyFileSync(join(TEMPLATES, "vocabularies", `${tags}.md`), vocab);
		created.push(vocab);
	}
	const rules = join(notes, "Systems", "Zotero agent.md");
	if (!existsSync(rules)) {
		copyFileSync(join(TEMPLATES, "Zotero agent.md"), rules);
		created.push(rules);
	}
	mkdirSync(dirname(envFile), { recursive: true });
	const before = existsSync(envFile) ? readFileSync(envFile, "utf8") : "# Settings for the Sub-Sub Zotero servers (zotero-local-mcp). Written by subsub init.\n";
	writeFileSync(envFile, upsertEnv(before, { ZOTERO_VAULT: notes, ZOTERO_VOCAB: vocab, ZOTERO_CONTACT_EMAIL: email || undefined }));

	const patch: Record<string, unknown> = {
		profile,
		userName: userName || undefined,
		about: about || undefined,
		language,
		setup: fmup ? "fmup" : undefined,
		vault: notes,
		envFile,
		addons: withStarbuck(current.addons, starbuck === "on"),
	};
	if (models === "later") patch.models = {};
	if (models === "opencode-go") patch.models = TESTED_MODELS;
	saveConfig(patch, initEnv);

	const zotero = await zoteroReachable(deps.fetch);
	const starbuckNote = starbuck === "on" && deps.prepareStarbuck ? deps.prepareStarbuck(loadConfig(initEnv)) : "";
	io.say("");
	io.say(`Saved: ${configFile}`);
	io.say(`Saved: ${envFile}`);
	for (const c of created) io.say(`Created: ${c}`);
	io.say(
		zotero
			? "Zotero: reachable."
			: "Zotero: not reachable. Start Zotero 10, then in Zotero open Settings > Advanced and turn on \"Allow other applications on this computer to communicate with Zotero\".",
	);
	if (starbuck === "on") io.say(starbuckNote || "Reference checks: on. The first start downloads Starbuck.");
	if (fmup) io.say("FMUP / U.Porto: the FMUP model service will come in a later version. Until then, connect a model provider yourself.");
	io.say("Next: type subsub web to open Sub-Sub in your browser (or subsub for the terminal). Connect a model provider with the model button (or /login in the terminal). To check the setup, type subsub doctor.");
	return { configFile, envFile, notes, created, zotero };
}

export function parseFlags(args: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (!a.startsWith("--")) continue;
		const key = a.slice(2);
		const next = args[i + 1];
		if (next !== undefined && !next.startsWith("--")) {
			out[key] = next;
			i++;
		} else out[key] = "true";
	}
	return out;
}

function defaultsIO(say: (l: string) => void): InitIO {
	return {
		ask: async (_q, def) => def,
		choose: async (_q, _o, def) => def,
		say,
	};
}

function terminalIO(): InitIO & { close(): void } {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return {
		async ask(q, def) {
			const a = await rl.question(`${q}${def ? ` [${def}]` : ""}: `);
			return a.trim() === "" ? def : a.trim();
		},
		async choose(q, options, def) {
			console.log(`\n${q}`);
			options.forEach((o, i) => console.log(`  ${i + 1}. ${o.label}${o.value === def ? "  (default)" : ""}`));
			for (;;) {
				const a = (await rl.question(`Number [${options.findIndex((o) => o.value === def) + 1}]: `)).trim();
				if (a === "") return def;
				const n = Number(a);
				if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1].value;
				const byName = options.find((o) => o.value === a.toLowerCase());
				if (byName) return byName.value;
				console.log(`Type a number from 1 to ${options.length}.`);
			}
		},
		say: (l) => console.log(l),
		close: () => rl.close(),
	};
}

export async function initMain(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
	const flags = parseFlags(args);
	const io = flags.yes || !process.stdin.isTTY ? defaultsIO((l) => console.log(l)) : terminalIO();
	try {
		await runInit(io, flags, env, { prepareStarbuck: (cfg) => {
			// Download Starbuck now, so that the first start of Sub-Sub does not wait for it.
			const c = starbuckCheck(cfg, env, defaultRunner);
			return c.ok ? `Reference checks: on (${c.detail}).` : `Reference checks: on, but ${c.detail}. ${c.fix ?? ""}`.trim();
		} });
		return 0;
	} catch (err) {
		console.error(`Sub-Sub init: ${(err as Error).message}`);
		return 1;
	} finally {
		(io as { close?: () => void }).close?.();
	}
}
