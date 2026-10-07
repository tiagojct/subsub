/**
 * `subsub init`: set Sub-Sub up for a new user, or change the settings of an
 * existing one. Press Enter to keep the value in brackets.
 *
 * Writes:
 * - the settings file (~/.config/subsub/config.json): profile, name, language,
 *   Sub-Sub folder, models;
 * - the server settings file (~/.config/zotero-local-mcp/env, or the one that
 *   already exists): the Sub-Sub folder, tag list, alerts file, contact email.
 *   Other lines stay;
 * - the Sub-Sub folder (see layout.ts): Inbox/, Literature/, Syntheses/,
 *   Research/, and Zotero/ with Zotero tags.md (a starter list) and Zotero
 *   agent.md (note formats). Existing files are never replaced.
 *
 * An Obsidian vault given as the folder becomes <vault>/Sub-Sub. Files of the old
 * layout (Systems/, or Sub-Sub's notes in the Inbox/ of a whole vault) are moved
 * when the user agrees.
 *
 * Flags (for scripts and tests): --yes (take every default), --setup
 * standard|fmup, --name, --about, --language, --folder (or --notes), --move
 * yes|no, --profile, --tags health-sciences|health-informatics|any-field,
 * --email, --starbuck on|off, --models keep|later|opencode-go|mistral-eu|google-free.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
	configPath,
	DEFAULT_MODELS,
	EU_MODELS,
	FREE_MODELS,
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
import { applyMoves, FOLDER_NAME, leftBehind, NOTE_DIRS, planMoves, SETTINGS_DIR, SETTINGS_FILES, subsubFolder } from "./layout.ts";
import { KEY_PROVIDERS, saveApiKey } from "./keys.ts";
import { PROFILE_SPECS } from "./profiles.ts";

const TEMPLATES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "templates");

export const STARTER_TAGS: Record<string, string> = {
	"health-sciences": "Health sciences: clinical areas, public health, methods and study designs",
	"health-informatics": "Health informatics: information systems, data, AI, digital health",
	"any-field": "Any field: methods and document types only; Sub-Sub proposes topics from your library",
};

export const TESTED_MODELS = DEFAULT_MODELS;

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
	moved: number;
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

	const first = !existsSync(configFile);
	io.say(
		first
			? "Sub-Sub setup. A few questions; press Enter to take the value in brackets. To change an answer later, type subsub init again."
			: `Sub-Sub settings (${configFile}). Press Enter to keep the value in brackets.`,
	);
	const explain = (title: string, text: string) => {
		io.say("");
		io.say(`${title}. ${text}`);
	};

	explain("About you", "Sub-Sub uses your name and one line about you in its replies. Both are optional and stay on this computer, except in the messages to the model provider.");
	const userName = (await io.ask("Your name (Enter for none)", flags.name ?? existing.userName ?? "")).trim();
	const about = (await io.ask('One line about you, e.g. "a master\'s student in health informatics" (optional)', flags.about ?? existing.about ?? "")).trim();
	const language = (await io.ask("Language for replies and notes (a language, or auto for the language you write in)", flags.language ?? existing.language ?? "English")).trim() || "English";

	explain(
		"Sub-Sub folder",
		`Sub-Sub keeps everything it writes in one folder: Inbox/ (review notes, the import queue, alerts), Literature/, Syntheses/, Research/, and ${SETTINGS_DIR}/ (your tag list and note formats). If you use Obsidian, give the vault folder: Sub-Sub then works in a ${FOLDER_NAME} folder inside the vault and leaves the rest of the vault alone.`,
	);
	const oldFolder = current.vault;
	// Without questions (--yes), an existing folder stays exactly as it is.
	const keepAsIs = Boolean(flags.yes) && !flags.folder && !flags.notes && oldFolder !== undefined;
	const folderDefault = flags.folder ?? flags.notes ?? (oldFolder ? (keepAsIs ? oldFolder : subsubFolder(oldFolder)) : join(home, "Documents", FOLDER_NAME));
	const answer = expand(cleanPath(await io.ask("Sub-Sub folder (or an Obsidian vault)", folderDefault)) || folderDefault, home);
	let notes = keepAsIs && answer === oldFolder ? answer : subsubFolder(answer);
	if (notes !== answer) io.say(`That is an Obsidian vault. Sub-Sub will use ${notes}.`);
	else if (notes !== folderDefault) io.say(`Sub-Sub folder: ${notes}`);

	// ---- files of the old layout
	const from = oldFolder && existsSync(oldFolder) ? oldFolder : notes;
	const moves = planMoves(from, notes);
	let move = "no";
	if (moves.length) {
		explain(
			"Earlier files",
			`${moves.length} file(s) from an earlier Sub-Sub layout can move into ${notes}: the settings files go to ${SETTINGS_DIR}/, and Sub-Sub's review notes, alerts and import queue go to Inbox/. Nothing is replaced.`,
		);
		for (const m of moves.slice(0, 6)) io.say(`  ${m.from}`);
		if (moves.length > 6) io.say(`  and ${moves.length - 6} more`);
		move = await io.choose(
			"Move them",
			[
				{ value: "yes", label: "Move them (recommended)" },
				// In a new folder, files left behind would not be read: then "no" means keeping the old folder.
				{ value: "no", label: from === notes ? "Leave them; Sub-Sub still reads them from Systems/" : flags.folder || flags.notes ? "Leave them where they are" : `Leave them, and keep using ${from}` },
			],
			flags.move ?? (flags.yes ? "no" : "yes"),
		);
		// A folder given on the command line (--folder, --notes) is a deliberate choice and stays.
		if (move === "no" && from !== notes && !flags.folder && !flags.notes) {
			notes = from;
			io.say(`Sub-Sub keeps using ${notes}.`);
		}
	}

	// Asked here, not first: it only changes the defaults of the next two questions.
	explain("Faculty of Medicine, Porto", "Sub-Sub has a set-up for the Faculty of Medicine of the University of Porto (FMUP): health-sciences tags and the Reader profile. Everyone else keeps the standard set-up.");
	const setup = await io.choose(
		"Set-up",
		[
			{ value: "standard", label: "Standard (any field, any institution)" },
			{ value: "fmup", label: "FMUP / U.Porto: health-sciences tags, Reader profile (the FMUP model service is coming soon)" },
		],
		flags.setup ?? existing.setup ?? "standard",
	);
	const fmup = setup === "fmup";

	// Students start in Reader: Sub-Sub helps them read and does not write syntheses for them unless asked.
	let student = fmup;
	if (!flags.profile && !existing.profile && !fmup) {
		explain("Who you are", "Students start with the Reader profile: Sub-Sub helps you read (notes with quotations, page numbers and questions) and does not write summaries or syntheses unless you ask. You can change the profile at any time.");
		student = (await io.choose(
			"You are",
			[
				{ value: "student", label: "A student" },
				{ value: "researcher", label: "A researcher, teacher or clinician" },
			],
			flags.student === "no" ? "researcher" : "student",
		)) === "student";
	}

	explain("Profile", "The profile sets how much Sub-Sub writes for you and which tools it offers. Change it at any time with /profile.");
	const profileDefault = flags.profile ?? existing.profile ?? (student ? "reader" : "scholar");
	const profile = await io.choose(
		"Profile",
		PROFILES.map((p) => ({ value: p, label: `${PROFILE_SPECS[p].label}: ${PROFILE_SPECS[p].summary}` })),
		isProfile(profileDefault) ? profileDefault : "scholar",
	);

	// The tag list: a custom path in the server settings stays; otherwise Zotero/Zotero tags.md (moved, kept or new).
	const vocabTarget = join(notes, SETTINGS_DIR, SETTINGS_FILES.tags);
	const oldDefaults = new Set([join(from, "Systems", SETTINGS_FILES.tags), join(from, SETTINGS_DIR, SETTINGS_FILES.tags)]);
	const envVocab = envValues.ZOTERO_VOCAB ? expand(envValues.ZOTERO_VOCAB, home) : undefined;
	const customVocab = envVocab && existsSync(envVocab) && !oldDefaults.has(envVocab) && envVocab !== vocabTarget ? envVocab : undefined;
	const movingVocab = move === "yes" && moves.some((m) => m.to === vocabTarget);
	// An old tag list counts only in the same folder; a new folder gets the moved list or a new one.
	const legacyVocab = !movingVocab && from === notes && [...oldDefaults].find((p) => existsSync(p));
	const vocab = customVocab ?? (movingVocab || existsSync(vocabTarget) ? vocabTarget : legacyVocab || vocabTarget);
	let tags = "keep";
	if (existsSync(vocab) || movingVocab) {
		io.say("");
		io.say(`Tag list: keeping ${vocab}.`);
	} else {
		explain("Tag list", `Sub-Sub tags items only with the tags in this list. Pick a start; you edit the list later in ${SETTINGS_DIR}/${SETTINGS_FILES.tags}.`);
		tags = await io.choose(
			"Starter tag list",
			Object.entries(STARTER_TAGS).map(([value, label]) => ({ value, label })),
			flags.tags ?? (fmup ? "health-sciences" : "any-field"),
		);
	}

	explain("Contact email", "Unpaywall needs an email address to find open-access PDFs. Sub-Sub sends it with its requests to PubMed, Europe PMC, OpenAlex, Crossref and Unpaywall, as they ask, and to nobody else.");
	const email = (await io.ask("Email (optional)", flags.email ?? envValues.ZOTERO_CONTACT_EMAIL ?? "")).trim();

	explain("Reference checks (Starbuck)", "An optional add-on for manuscripts: it checks that each cited work exists, matches its citation and was not retracted. Sub-Sub then has /verify.");
	const starbuck = await io.choose(
		"Reference checks",
		[
			{ value: "off", label: "Off" },
			{ value: "on", label: "On (downloads Starbuck now; uses the email above)" },
		],
		flags.starbuck ?? (starbuckEnabled(current) ? "on" : "off"),
	);

	explain(
		"Usage log for the pilot",
		"If you take part in the Sub-Sub pilot, Sub-Sub can keep a log on this computer: when you used it, which commands, how long it worked and how many library changes you approved. Never what you wrote or what it replied. Nothing is sent; subsub usage shows the log, and you decide whether to send it.",
	);
	const usage = await io.choose(
		"Usage log",
		[
			{ value: "off", label: "Off" },
			{ value: "on", label: "On (for the pilot)" },
		],
		flags.usage ?? (existing.usageLog === true ? "on" : "off"),
	);

	explain(
		"Models",
		"Sub-Sub needs an account with a model provider. Each mode can use its own model: the Librarian a fast, cheap one for tags and imports, the Researcher a stronger one for reading. You can connect a provider later in Sub-Sub with the model button (or /login in the terminal).",
	);
	const hadModel = "model" in existing || "models" in existing;
	const show = (m: Partial<Record<string, string>>) => (Object.keys(m).length ? Object.entries(m).map(([k, v]) => `${k} ${v}`).join(", ") : "choose in Sub-Sub");
	const modelOptions = [
		...(hadModel ? [{ value: "keep", label: `Keep: ${show(current.models)}` }] : []),
		{ value: "later", label: "Choose later in Sub-Sub" },
		{ value: "opencode-go", label: `OpenCode Go, tested: ${TESTED_MODELS.librarian} for the Librarian, ${TESTED_MODELS.researcher} for the Researcher` },
		{ value: "mistral-eu", label: `Mistral, servers in the EU (GDPR): ${EU_MODELS.researcher} in both modes; about six times the cost of OpenCode Go` },
		{ value: "google-free", label: `Free, to try Sub-Sub: Google AI Studio, ${FREE_MODELS.researcher} in both modes (a free key, no card; limits per minute and per day; 18 or older)` },
	];
	const agentDir = initEnv.SUBSUB_AGENT_DIR ? expand(initEnv.SUBSUB_AGENT_DIR, home) : join(home, ".subsub", "agent");
	const modelDefault = hadModel ? "keep" : hasProvider(agentDir, "opencode") ? "opencode-go" : "later";
	const models = await io.choose("Models", modelOptions, flags.models ?? modelDefault);
	let googleKey = "";
	if (models === "google-free" && !hasProvider(agentDir, "google")) {
		const url = KEY_PROVIDERS.find((p) => p.id === "google")?.url;
		explain(
			"Free Google key",
			`Open ${url}, sign in with a Google account, and select "Create API key". Copy the key and paste it here. Sub-Sub saves it in ${join(agentDir, "auth.json")}, readable only by you. In the EU, the UK and Switzerland, Google does not use your prompts to improve its products; elsewhere, on the free tier, it may. When a limit is reached, Sub-Sub says so.`,
		);
		googleKey = (await io.ask("Google API key (Enter to add it later with the model button or /login)", "")).trim();
	}

	// ---- write
	if (move === "yes") applyMoves(moves);
	for (const dir of [notes, ...NOTE_DIRS.map((d) => join(notes, d)), join(notes, SETTINGS_DIR)]) {
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
	const rulesTarget = join(notes, SETTINGS_DIR, SETTINGS_FILES.rules);
	const legacyRules = join(notes, "Systems", SETTINGS_FILES.rules);
	if (!existsSync(rulesTarget) && !existsSync(legacyRules)) {
		copyFileSync(join(TEMPLATES, "Zotero agent.md"), rulesTarget);
		created.push(rulesTarget);
	}
	const alertsTarget = join(notes, SETTINGS_DIR, SETTINGS_FILES.alerts);
	const legacyAlerts = join(notes, "Systems", SETTINGS_FILES.alerts);
	const alerts = !existsSync(alertsTarget) && existsSync(legacyAlerts) ? legacyAlerts : alertsTarget;
	mkdirSync(dirname(envFile), { recursive: true });
	const before = existsSync(envFile) ? readFileSync(envFile, "utf8") : "# Settings for the Sub-Sub Zotero servers (zotero-local-mcp). Written by subsub init.\n";
	writeFileSync(envFile, upsertEnv(before, { ZOTERO_VAULT: notes, ZOTERO_VOCAB: vocab, ZOTERO_ALERTS: alerts, ZOTERO_CONTACT_EMAIL: email || undefined }));

	const patch: Record<string, unknown> = {
		profile,
		userName: userName || undefined,
		about: about || undefined,
		language,
		setup: fmup ? "fmup" : undefined,
		vault: notes,
		envFile,
		libraryChanges: undefined,
		addons: withStarbuck(current.addons, starbuck === "on"),
		usageLog: usage === "on" ? true : undefined,
	};
	// A model per mode; "model" (0.10, one for both) is replaced.
	patch.model = undefined;
	if (models === "keep") patch.models = current.models;
	if (models === "later") patch.models = {};
	if (models === "opencode-go") patch.models = TESTED_MODELS;
	if (models === "google-free") patch.models = FREE_MODELS;
	if (models === "mistral-eu") patch.models = EU_MODELS;
	saveConfig(patch, initEnv);
	let keyNote = "";
	if (googleKey) {
		try {
			saveApiKey(agentDir, "google", googleKey);
			keyNote = `Saved: the Google key, in ${join(agentDir, "auth.json")}`;
		} catch (err) {
			keyNote = `The Google key was not saved (${(err as Error).message}). Add it in Sub-Sub with the model button or /login.`;
		}
	} else if (models === "mistral-eu" && !hasProvider(agentDir, "mistral")) {
		keyNote = `No Mistral key yet. Get one at ${KEY_PROVIDERS.find((p) => p.id === "mistral")?.url}, then add it in Sub-Sub with the model button (subsub web) or /login (in the terminal).`;
	} else if (models === "google-free" && !hasProvider(agentDir, "google")) {
		keyNote = "No Google key yet. Add it in Sub-Sub with the model button (subsub web) or /login (in the terminal), with the provider Google Gemini.";
	}

	const zotero = await zoteroReachable(deps.fetch);
	const starbuckNote = starbuck === "on" && deps.prepareStarbuck ? deps.prepareStarbuck(loadConfig(initEnv)) : "";
	io.say("");
	io.say(`Saved: ${configFile}`);
	io.say(`Saved: ${envFile}`);
	for (const c of created) io.say(`Created: ${c}`);
	if (keyNote) io.say(keyNote);
	if (move === "yes") io.say(`Moved: ${moves.length} file(s) into ${notes}`);
	for (const d of leftBehind(from, notes)) io.say(`Not moved: ${d}. If Sub-Sub wrote these notes, move them into ${notes} yourself.`);
	io.say(
		zotero
			? "Zotero: reachable."
			: "Zotero: not reachable. Start Zotero 10, then in Zotero open Settings > Advanced and turn on \"Allow other applications on this computer to communicate with Zotero\".",
	);
	if (starbuck === "on") io.say(starbuckNote || "Reference checks: on. The first start downloads Starbuck.");
	if (fmup) io.say("FMUP / U.Porto: the FMUP model service will come in a later version. Until then, connect a model provider yourself.");
	io.say("Next: type subsub web to open Sub-Sub in your browser (or subsub for the terminal). Connect a model provider with the model button (or /login in the terminal). To check the setup, type subsub doctor.");
	if (tags === "any-field") io.say('The tag list has no topics yet. Before you tag, ask Sub-Sub: "propose topics for my tag list".');
	return { configFile, envFile, notes, created, moved: move === "yes" ? moves.length : 0, zotero };
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
	if (!process.stdin.isTTY && flags.yes === undefined) {
		flags.yes = "true";
		console.log("Not a terminal: Sub-Sub takes the default answers (as with --yes).");
	}
	const io = flags.yes ? defaultsIO((l) => console.log(l)) : terminalIO();
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

/** A path as typed, dragged from Finder (spaces escaped) or copied from Explorer (in quotes). */
export function cleanPath(raw: string): string {
	let p = raw.trim();
	if (p.length > 1 && (p[0] === '"' || p[0] === "'") && p.at(-1) === p[0]) return p.slice(1, -1);
	if (process.platform !== "win32") p = p.replace(/\\([ '"()&])/g, "$1");
	return p;
}
