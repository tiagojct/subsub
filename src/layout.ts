/**
 * The Sub-Sub folder: everything Sub-Sub writes lives in one folder, by default
 * "Sub-Sub" (~/Documents/Sub-Sub, or <vault>/Sub-Sub inside an Obsidian vault):
 *
 *   Sub-Sub/
 *     Inbox/        tag review notes, the import queue, alerts, drafts
 *     Literature/   one note per item
 *     Syntheses/    notes on several items
 *     Research/     literature reviews, comparisons, digests (.plans/ for plans and logs)
 *     Zotero/       Zotero tags.md, Zotero agent.md, Literature alerts.md
 *
 * Before 0.9, the settings files were in Systems/ and the folder could be a whole
 * vault. Those files are still found there until they are moved (subsub init).
 */

import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export const FOLDER_NAME = "Sub-Sub";
export const SETTINGS_DIR = "Zotero";
export const LEGACY_SETTINGS_DIR = "Systems";
export const NOTE_DIRS = ["Inbox", "Literature", "Syntheses", "Research"];

/** The files in Zotero/ that Sub-Sub and the Zotero server read. */
export const SETTINGS_FILES = { tags: "Zotero tags.md", rules: "Zotero agent.md", alerts: "Literature alerts.md" } as const;
type SettingsFile = keyof typeof SETTINGS_FILES;

/** True when the folder is the root of an Obsidian vault. */
export function isObsidianVault(dir: string): boolean {
	return existsSync(join(dir, ".obsidian"));
}

/** The folder that a user's answer means: a vault root becomes <vault>/Sub-Sub. */
export function subsubFolder(answer: string): string {
	return isObsidianVault(answer) && basename(answer) !== FOLDER_NAME ? join(answer, FOLDER_NAME) : answer;
}

/** The path of a settings file: Zotero/<file>, or Systems/<file> while only the old one exists. */
export function settingsFile(folder: string, which: SettingsFile): string {
	const name = SETTINGS_FILES[which];
	const current = join(folder, SETTINGS_DIR, name);
	const legacy = join(folder, LEGACY_SETTINGS_DIR, name);
	return !existsSync(current) && existsSync(legacy) ? legacy : current;
}

/** Every place a settings file may be, for the write gate. */
export function settingsPaths(folder: string): string[] {
	return Object.values(SETTINGS_FILES).flatMap((n) => [join(folder, SETTINGS_DIR, n), join(folder, LEGACY_SETTINGS_DIR, n)]);
}

export interface Move {
	from: string;
	to: string;
}

/** Inbox notes that Sub-Sub and the Zotero server write. */
const SUBSUB_INBOX = /^(Zotero |Literature alerts|Copy request )/;

/**
 * What to move from the old layout (`from`: the old notes folder) to the new one
 * (`to`: the Sub-Sub folder). Only files that Sub-Sub made, and never over an
 * existing file:
 * - the settings files, from Systems/ to Zotero/;
 * - when the Sub-Sub folder is new (the old folder was a whole vault): Sub-Sub's
 *   notes in Inbox/. Literature/, Syntheses/ and Research/ of a vault may hold the
 *   user's own notes, so they stay; the user moves them.
 */
export function planMoves(from: string, to: string): Move[] {
	const moves: Move[] = [];
	const add = (src: string, dest: string) => {
		if (existsSync(src) && !existsSync(dest) && !moves.some((m) => m.to === dest)) moves.push({ from: src, to: dest });
	};
	for (const name of Object.values(SETTINGS_FILES)) {
		add(join(from, LEGACY_SETTINGS_DIR, name), join(to, SETTINGS_DIR, name));
		if (from !== to) add(join(from, SETTINGS_DIR, name), join(to, SETTINGS_DIR, name));
	}
	if (from !== to) {
		const inbox = join(from, "Inbox");
		if (existsSync(inbox)) {
			for (const f of readdirSync(inbox).sort()) {
				if (SUBSUB_INBOX.test(f) && statSync(join(inbox, f)).isFile()) add(join(inbox, f), join(to, "Inbox", f));
			}
		}
	}
	return moves;
}

/** Folders of the old layout that may hold Sub-Sub's notes but are left for the user. */
export function leftBehind(from: string, to: string): string[] {
	if (from === to) return [];
	return ["Literature", "Syntheses", "Research"].map((d) => join(from, d)).filter((d) => existsSync(d) && readdirSync(d).length > 0);
}

/** Do the moves. An old Systems/ folder that is now empty is removed. */
export function applyMoves(moves: Move[]): void {
	for (const m of moves) {
		mkdirSync(dirname(m.to), { recursive: true });
		renameSync(m.from, m.to);
	}
	for (const dir of new Set(moves.map((m) => dirname(m.from)))) {
		if (basename(dir) === LEGACY_SETTINGS_DIR && existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
	}
}
