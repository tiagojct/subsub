/**
 * The parts of the terminal screens, as pure functions: (width, paint, glyphs) => lines. They know nothing about pi; the
 * extension hands them the state and the paint. Every line fits the width, so a snapshot at 40, 80 and 120 columns is a test.
 */

import { libraryLine, LIBRARY_WORDS, type LibraryState, type Paint, plain } from "./look.ts";
import { type Glyphs, UNICODE } from "./skin.ts";

type Lang = "en" | "pt";

export const CHROME_WORDS = {
	en: { researcher: "Researcher", librarian: "Librarian", of: "of", tokens: "tokens", unknownUsage: "?", failed: "could not", evidence: "evidence" },
	pt: { researcher: "Researcher", librarian: "Librarian", of: "de", tokens: "tokens", unknownUsage: "?", failed: "não foi possível", evidence: "evidência" },
};

const len = (s: string) => [...s].length;

/** Cut to the width, with "..." when something is left out. Run it before the text is painted. */
export function cut(s: string, width: number): string {
	return len(s) > width ? `${[...s].slice(0, Math.max(0, width - 3)).join("")}...` : s;
}

/** A line of one glyph. */
export function rule(width: number, kind: "solid" | "dashed" | "dotted", paint: (s: string) => string = (s) => s, g: Glyphs = UNICODE): string {
	return paint(g[kind].repeat(Math.max(0, width)));
}

/** A context meter: `▰▰▱▱▱ 38%`. null (unknown) is drawn as an empty bar and `?`. */
export function meter(percent: number | null | undefined, cells: number, g: Glyphs = UNICODE): { bar: string; label: string } {
	if (percent === null || percent === undefined || Number.isNaN(percent)) return { bar: g.cellEmpty.repeat(cells), label: "?" };
	const p = Math.min(100, Math.max(0, percent));
	const full = Math.round((p / 100) * cells);
	return { bar: g.cell.repeat(full) + g.cellEmpty.repeat(cells - full), label: `${Math.round(p)}%` };
}

export function compactNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
	return String(n);
}

export interface FooterState {
	mode: "researcher" | "librarian";
	lang: Lang;
	library: LibraryState;
	model: string;
	/** Share of the context window in use, 0 to 100; null when pi does not know it yet. */
	percent?: number | null;
	/** The size of the context window, in tokens. */
	window?: number;
	tokens?: number | null;
	cost?: number | null;
}

/**
 * The footer, in four tiers: 100 columns and more show everything on two lines; 60 to 99 leave out tokens and cost; 40 to 59 are one line with the
 * mode, the item count and the meter; below 40 only the mode and the percentage.
 */
export function footerLines(st: FooterState, width: number, p: Paint = plain, g: Glyphs = UNICODE): string[] {
	const w = Math.max(10, width);
	const words = CHROME_WORDS[st.lang];
	const lib = LIBRARY_WORDS[st.lang];
	const mode = st.mode === "librarian" ? words.librarian : words.researcher;
	const m = meter(st.percent, w >= 100 ? 10 : 5, g);
	if (w < 40) return [p.mark(mode) + p.muted(cut(` ${m.label}`, Math.max(0, w - len(mode))))];
	const count = st.library.zotero === "reachable" ? `${st.library.items ?? "?"} ${lib.items}` : st.library.zotero === "down" ? `${g.hollow} ${lib.prefix}` : `${lib.prefix}...`;
	if (w < 60) {
		const tail = ` | ${count} | ${m.bar} ${m.label}`;
		return [p.mark(mode) + p.muted(cut(tail, Math.max(0, w - len(mode))))];
	}
	const first = libraryLine(st.library, st.lang, g).text;
	const lines = [p.mark(mode) + p.muted(cut(` | ${first}`, Math.max(0, w - len(mode))))];
	const window = st.window ? ` ${words.of} ${compactNumber(st.window)}` : "";
	let second = `${cut(st.model, Math.max(8, Math.floor(w / 3)))}   ${m.bar} ${m.label}${m.label === "?" ? "" : window}`;
	if (w >= 100) {
		const tokens = st.tokens === null || st.tokens === undefined ? words.unknownUsage : compactNumber(st.tokens);
		const cost = st.cost === null || st.cost === undefined ? "" : `   $${st.cost.toFixed(st.cost < 1 ? 3 : 2)}`;
		second += `   ${tokens} ${words.tokens}${cost}`;
	}
	lines.push(p.dim(cut(second, w)));
	return lines;
}

export type ToolState = "pending" | "done" | "failed";

/**
 * One line for a tool call, in plain words: `┄ search the library: asthma` while it runs (dashed), `─ search the library: asthma` when it is done
 * (solid), `○ could not search the library: first line of the error` when it failed (a hollow mark and a word, in ink).
 */
export function toolLine(opts: { state: ToolState; word: string; detail?: string; error?: string; lang: Lang; width: number }, p: Paint = plain, g: Glyphs = UNICODE): string {
	const w = Math.max(10, opts.width);
	const words = CHROME_WORDS[opts.lang];
	if (opts.state === "failed") {
		const why = opts.error ? `: ${opts.error.split("\n")[0]}` : "";
		return p.text(cut(`${g.hollow} ${words.failed} ${opts.word}${why}`, w));
	}
	const mark = opts.state === "pending" ? p.pend(g.dashed) : p.ok(g.solid);
	const rest = ` ${opts.word}${opts.detail ? `: ${opts.detail}` : ""}`;
	return mark + p.muted(cut(rest, w - 1));
}

/** A short detail for a tool call: the first useful argument (a query, a title, a key, a path), cut to the length. */
export function describeArgs(args: unknown, max = 40): string {
	if (!args || typeof args !== "object") return "";
	const a = args as Record<string, unknown>;
	for (const k of ["query", "q", "title", "citekey", "key", "keys", "doi", "identifier", "path", "name", "text"]) {
		const v = a[k];
		if (v === undefined || v === null || v === "") continue;
		const s = Array.isArray(v) ? v.filter((x) => typeof x !== "object").join(", ") : String(v);
		if (s) return cut(s.replace(/\s+/g, " "), max);
	}
	return "";
}

export type EvidenceKind = "full" | "abstract" | "metadata" | "other";

/** What a note was written from, from its `evidence:` field: full text is solid sap, an abstract dashed gamboge, metadata dotted muted. */
export function evidenceKind(evidence: string): EvidenceKind {
	return /full/i.test(evidence) ? "full" : /abstract/i.test(evidence) ? "abstract" : /metadata|metadados/i.test(evidence) ? "metadata" : "other";
}

export function evidenceLine(evidence: string, lang: Lang, width: number, p: Paint = plain, g: Glyphs = UNICODE): string {
	const kind = evidenceKind(evidence);
	const label = `${CHROME_WORDS[lang].evidence}: ${evidence}`;
	const lead = kind === "full" ? p.ok(g.solid.repeat(2)) : kind === "abstract" ? p.pend(g.dashed.repeat(2)) : p.muted(g.dotted.repeat(2));
	return `${lead}${p.text(cut(` ${label}`, Math.max(0, width - 2)))}`;
}
