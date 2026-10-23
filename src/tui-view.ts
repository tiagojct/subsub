/**
 * The screen of `subsub tui`, in parts that know nothing about processes: the colours (read from the themes in themes/, since a client of pi's RPC
 * mode has no pi theme), the transcript, the side panel and the footer. The controller in src/tui.ts feeds them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getTerminalColorMode, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { cut, evidenceLine, rule, toolDetail, toolLine, type ToolState } from "./chrome.ts";
import { headerLines, type LibraryState, type Paint } from "./look.ts";
import { type Glyphs, UNICODE } from "./skin.ts";
import type { Words } from "./words.ts";

type Lang = "en" | "pt";
export type Scheme = "dark" | "light";

// ---------------------------------------------------------------- colours

/** A Sub-Sub theme file, read as a table of foreground colours. */
export class Palette {
	private readonly vars: Record<string, string | number>;
	private readonly colors: Record<string, string | number>;
	private readonly mode: "truecolor" | "256color";
	readonly name: string;

	constructor(file: { name?: string; vars?: Record<string, string | number>; colors: Record<string, string | number> }, mode: "truecolor" | "256color") {
		this.name = file.name ?? "";
		this.vars = file.vars ?? {};
		this.colors = file.colors;
		this.mode = mode;
	}

	/** The colour of a theme role (accent, text, muted, dim, success, warning, mdLink, ...) as an SGR foreground sequence, or "" for the terminal's own. */
	private ansi(role: string): string {
		let v: string | number | undefined = this.colors[role];
		if (typeof v === "string" && v in this.vars) v = this.vars[v];
		if (v === undefined || v === "") return "";
		if (typeof v === "number") return `\x1b[38;5;${v}m`;
		const [r, g, b] = [1, 3, 5].map((i) => parseInt((v as string).slice(i, i + 2), 16));
		return this.mode === "truecolor" ? `\x1b[38;2;${r};${g};${b}m` : `\x1b[38;5;${rgbTo256(r, g, b)}m`;
	}

	fg(role: string, text: string): string {
		const on = this.ansi(role);
		return on ? `${on}${text}\x1b[39m` : text;
	}

	bold = (t: string) => `\x1b[1m${t}\x1b[22m`;
	italic = (t: string) => `\x1b[3m${t}\x1b[23m`;
	underline = (t: string) => `\x1b[4m${t}\x1b[24m`;
	strikethrough = (t: string) => `\x1b[9m${t}\x1b[29m`;

	/** The paint roles of the screens (see Paint in look.ts). */
	paint(): Paint {
		return {
			mark: (x) => this.fg("accent", x),
			text: (x) => this.fg("text", x),
			muted: (x) => this.fg("muted", x),
			dim: (x) => this.fg("dim", x),
			ok: (x) => this.fg("success", x),
			pend: (x) => this.fg("warning", x),
			strike: (x) => this.strikethrough(this.fg("muted", x)),
		};
	}

	/** For pi-tui's Markdown component. */
	markdownTheme() {
		return {
			heading: (t: string) => this.bold(this.fg("mdHeading", t)),
			link: (t: string) => this.underline(this.fg("mdLink", t)),
			linkUrl: (t: string) => this.fg("mdLinkUrl", t),
			code: (t: string) => this.fg("mdCode", t),
			codeBlock: (t: string) => this.fg("mdCodeBlock", t),
			codeBlockBorder: (t: string) => this.fg("mdCodeBlockBorder", t),
			quote: (t: string) => this.italic(this.fg("mdQuote", t)),
			quoteBorder: (t: string) => this.fg("mdQuoteBorder", t),
			hr: (t: string) => this.fg("mdHr", t),
			listBullet: (t: string) => this.fg("mdListBullet", t),
			bold: this.bold,
			italic: this.italic,
			strikethrough: this.strikethrough,
			underline: this.underline,
		};
	}

	/** For pi-tui's Editor. */
	editorTheme() {
		return {
			borderColor: (t: string) => this.fg("borderMuted", t),
			selectList: {
				selectedPrefix: (t: string) => this.fg("accent", t),
				selectedText: (t: string) => this.fg("text", t),
				description: (t: string) => this.fg("muted", t),
				scrollInfo: (t: string) => this.fg("dim", t),
				noMatch: (t: string) => this.fg("muted", t),
			},
		};
	}
}

/** The nearest xterm-256 index of an RGB colour (cube or grey ramp). */
function rgbTo256(r: number, g: number, b: number): number {
	const cube = [0, 95, 135, 175, 215, 255];
	const near = (v: number) => cube.reduce((best, c, i) => (Math.abs(c - v) < Math.abs(cube[best] - v) ? i : best), 0);
	const [ri, gi, bi] = [near(r), near(g), near(b)];
	const grey = Math.round((r + g + b) / 3);
	const greyIndex = Math.min(255, Math.max(232, 232 + Math.round((grey - 8) / 10)));
	const cubeDist = (cube[ri] - r) ** 2 + (cube[gi] - g) ** 2 + (cube[bi] - b) ** 2;
	const greyValue = 8 + (greyIndex - 232) * 10;
	const greyDist = (greyValue - r) ** 2 + (greyValue - g) ** 2 + (greyValue - b) ** 2;
	return greyDist < cubeDist ? greyIndex : 16 + 36 * ri + 6 * gi + bi;
}

/** Dark or light terminal: from COLORFGBG ("15;0" is light text on black), else dark. */
export function schemeFromEnv(env: NodeJS.ProcessEnv = process.env): Scheme {
	const bg = Number((env.COLORFGBG ?? "").split(";").at(-1));
	if (!Number.isFinite(bg) || (env.COLORFGBG ?? "") === "") return "dark";
	return bg === 7 || bg >= 9 ? "light" : "dark";
}

/** The palette of a theme (glauca for the Researcher, try-works for the Librarian) in the colour mode of the terminal. */
export function loadPalette(themesDir: string, base: string, scheme: Scheme, mode: "truecolor" | "256color" = getTerminalColorMode() === "256color" ? "256color" : "truecolor"): Palette {
	const name = `${base}-${scheme}${mode === "256color" ? "-256" : ""}`;
	return new Palette(JSON.parse(readFileSync(join(themesDir, `${name}.json`), "utf8")), mode);
}

// ---------------------------------------------------------------- transcript

export type Entry =
	| { kind: "user"; text: string }
	| { kind: "assistant"; text: string }
	| { kind: "tool"; id: string; name: string; args: unknown; state: ToolState; error?: string; output?: string }
	| { kind: "notice"; level: "info" | "warning" | "error"; text: string }
	| { kind: "evidence"; text: string };

export interface TranscriptContext {
	paint: Paint;
	glyphs?: Glyphs;
	lang: Lang;
	/** Markdown as lines for a width. */
	markdown: (text: string, width: number) => string[];
	words?: Words;
	/** Show the output of the tool rows. */
	expanded?: boolean;
}

/** The text of a message's content: a string, or the text blocks of a list. */
export function messageText(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content.filter((b: any) => b?.type === "text").map((b: any) => b.text ?? "").join("\n\n");
}

const toolWordOf = (w: Words | undefined, lang: Lang, name: string) => {
	const short = name.replace(/^(zotero|scholar)_/, "");
	return w ? (w.TOOLS[lang][short] ?? w.TOOLS.en[short] ?? name) : name;
};

/** One entry as lines, without the empty line that separates entries. */
export function entryLines(e: Entry, width: number, c: TranscriptContext): string[] {
	const g = c.glyphs ?? UNICODE;
	const p = c.paint;
	const w = Math.max(10, width);
	switch (e.kind) {
		case "user": {
			const lines = wrapTextWithAnsi(e.text, w - 2);
			return lines.map((l, i) => `${i === 0 ? p.mark(g.pointer) : " "} ${p.text(l)}`);
		}
		case "assistant":
			return c.markdown(e.text, w);
		case "tool": {
			const head = toolLine({ state: e.state, word: toolWordOf(c.words, c.lang, e.name), detail: toolDetail(e.args), error: e.error, lang: c.lang, width: w }, p, g);
			if (!c.expanded || !e.output?.trim()) return [head];
			return [head, ...e.output.split("\n").slice(0, 40).map((l) => p.muted(cut(`  ${l}`, w)))];
		}
		case "notice": {
			const text = e.level === "info" ? p.muted(cut(e.text, w)) : p.text(cut(`${g.hollow} ${e.text}`, w));
			return [text];
		}
		case "evidence":
			return [evidenceLine(e.text, c.lang, w, p, g)];
	}
}

/** The whole transcript: the entries one after another, an empty line between them. */
export function transcriptLines(entries: Entry[], width: number, c: TranscriptContext): string[] {
	const out: string[] = [];
	let previous: Entry | undefined;
	for (const e of entries) {
		const lines = entryLines(e, width, c);
		if (!lines.length) continue;
		// Tool rows and notices belong together; every other change of speaker gets an empty line.
		if (out.length && !(previous?.kind === "tool" && e.kind === "tool")) out.push("");
		out.push(...lines);
		previous = e;
	}
	return out;
}

/** The messages of an earlier conversation (get_messages) as entries. */
export function entriesFromMessages(messages: any[]): Entry[] {
	const out: Entry[] = [];
	const tools = new Map<string, Extract<Entry, { kind: "tool" }>>();
	for (const m of messages) {
		if (m.role === "user") {
			const text = messageText(m.content).trim();
			if (text && !text.startsWith("/subsub-")) out.push({ kind: "user", text });
		} else if (m.role === "assistant") {
			for (const b of Array.isArray(m.content) ? m.content : []) {
				if (b.type === "text" && b.text?.trim()) out.push({ kind: "assistant", text: b.text });
				else if (b.type === "toolCall") {
					const t: Extract<Entry, { kind: "tool" }> = { kind: "tool", id: b.id, name: b.name, args: b.arguments, state: "done" };
					tools.set(b.id, t);
					out.push(t);
				}
			}
		} else if (m.role === "toolResult") {
			const t = tools.get(m.toolCallId);
			if (t) {
				t.output = messageText(m.content);
				if (m.isError) {
					t.state = "failed";
					t.error = t.output.trim().split("\n")[0];
				}
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------- side panel and header

export interface SideState {
	version: string;
	mode: "researcher" | "librarian";
	lang: Lang;
	library: LibraryState;
	model: string;
	/** Earlier conversations, newest first; the open one is marked. */
	conversations: Array<{ title: string; open?: boolean }>;
}

export const SIDE_WIDTH = 30;

const SIDE_WORDS = {
	en: { notes: "notes", library: "library", actions: "actions", mode: "mode", conversations: "Conversations", none: "none yet" },
	pt: { notes: "notas", library: "biblioteca", actions: "ações", mode: "modo", conversations: "Conversas", none: "ainda não há" },
};

/** The side panel as lines of exactly `width` visible columns are not needed: the layout pads them. */
export function sideLines(s: SideState, width: number, rows: number, p: Paint, g: Glyphs = UNICODE): string[] {
	const w = Math.max(16, width);
	const words = SIDE_WORDS[s.lang];
	const mode = s.mode === "librarian" ? "Librarian" : "Researcher";
	const lib = s.library.zotero === "reachable" ? `${s.library.items ?? "?"} ${s.lang === "pt" ? "itens" : "items"}` : s.library.zotero === "down" ? `${g.hollow} Zotero` : "Zotero...";
	const lines = [p.mark(cut(` Sub-Sub ${s.version}`, w)), p.text(cut(` ${mode}`, w)), p.muted(cut(` ${lib}`, w)), p.dim(cut(` ${s.model}`, w)), rule(w, "solid", p.muted, g)];
	for (const [key, word] of [["Alt+N", words.notes], ["Alt+L", words.library], ["Alt+A", words.actions], ["Alt+M", words.mode]] as const) lines.push(p.muted(cut(` ${key.padEnd(6)}${word}`, w)));
	lines.push(rule(w, "solid", p.muted, g), p.text(cut(` ${words.conversations}`, w)));
	if (!s.conversations.length) lines.push(p.dim(cut(`  ${words.none}`, w)));
	for (const c of s.conversations) {
		if (lines.length >= rows) break;
		lines.push(c.open ? `${p.mark(g.pointer)}${p.text(cut(` ${c.title}`, w - 1))}` : ` ${p.muted(cut(` ${c.title}`, w - 1))}`);
	}
	return lines.slice(0, Math.max(rows, 1));
}

/** The top of the transcript at the start: the banner and the quote (the same as the header of `subsub`). */
export function bannerLines(o: { version: string; mode: "researcher" | "librarian"; model: string; library: LibraryState; width: number; paint: Paint; lang: Lang; glyphs?: Glyphs; quote?: [string, string] }): string[] {
	return headerLines({ ...o, quote: o.quote });
}
