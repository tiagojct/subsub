/**
 * The plain words of the web view (actions, suggestions, names of tools, in English and Portuguese), for the terminal screens.
 * web/i18n.js is a browser module with no imports; it is loaded here as it is, so the two views never differ.
 */

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PACKAGE_DIR } from "./cli.ts";

export interface Action {
	cmd: string;
	en: string;
	pt: string;
	/** Send the command at once instead of filling the box. */
	send?: boolean;
	/** The command takes a library item. */
	item?: boolean;
	/** Needs an add-on, for example "starbuck". */
	needs?: string;
}

export interface Words {
	ACTIONS: { research: Action[]; library: Action[] };
	SUGGESTIONS: Record<"researcher" | "librarian", Array<{ en: string; pt: string }>>;
	TOOLS: { en: Record<string, string>; pt: Record<string, string> };
}

let words: Promise<Words> | undefined;

/** A dynamic import: a static one would pull a file outside src/ into the TypeScript build. */
export function loadWords(): Promise<Words> {
	words ??= import(pathToFileURL(join(PACKAGE_DIR, "web", "i18n.js")).href) as Promise<Words>;
	return words;
}

/** What a tool is called while it runs ("zotero_find_items" is "search the library"); unknown tools keep their name. */
export function toolWord(w: Words, lang: "en" | "pt", name: string): string {
	const short = name.replace(/^(zotero|scholar)_/, "");
	return w.TOOLS[lang][short] ?? w.TOOLS.en[short] ?? name;
}
