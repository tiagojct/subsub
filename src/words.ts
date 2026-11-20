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
	/** The texts of the web view; the dialog titles come from here. */
	STRINGS?: Record<"en" | "pt", Record<string, unknown>>;
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

/**
 * The title of an approval dialog in plain words, as the web view shows it (dialogTitle in web/app.js): "Sub-Sub: apply import_identifiers?"
 * is "Import?". A note in brackets at the end ("(the library changed; ...)") stays. A title with no known form keeps its words, without "Sub-Sub:".
 */
export function dialogTitle(w: Words | undefined, lang: "en" | "pt", title: string): string {
	const all = String(title ?? "").replace(/^Sub-Sub:\s*/, "");
	const note = all.match(/^(.*\?)( \(.+\))$/);
	const raw = note ? note[1] : all;
	const s = w?.STRINGS?.[lang];
	if (!w || !s) return all;
	const t = (key: string, x: string) => (typeof s[key] === "string" ? (s[key] as string).replace("{x}", x) : undefined);
	const upper = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
	let m: RegExpMatchArray | null;
	let out: string | undefined;
	// The tool labels are actions ("tag items", "apply a tag review note"): the English title is the action itself.
	if ((m = raw.match(/^(?:apply|aplicar) (\S+)\?$/))) out = t("apply", toolWord(w, lang, m[1]));
	else if ((m = raw.match(/^(?:run|executar) (\S+)\?$/))) out = t("run", toolWord(w, lang, m[1]));
	else if (raw === "undo?" || raw === "anular?") out = typeof s.undoAsk === "string" ? s.undoAsk : undefined;
	else if ((m = raw.match(/^(?:write the Starbuck report to|escrever o relatório do Starbuck em) (.+)\?$/))) out = t("starbuckReport", m[1]);
	else if ((m = raw.match(/^(write|edit) (.+)\?$/))) out = t("write", m[2]);
	return out ? upper(out) + (note ? note[2] : "") : all;
}
