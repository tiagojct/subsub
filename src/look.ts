/**
 * The look of the `subsub` command: banner, status line, quote, and the theme
 * per mode (try-works for the librarian, Glauca for the researcher).
 * Only used when Sub-Sub runs as its own command in the terminal UI.
 */


import { type Glyphs, UNICODE } from "./skin.ts";

export const BANNER = [
	"╔═╗╦ ╦╔╗    ╔═╗╦ ╦╔╗",
	"╚═╗║ ║╠╩╗───╚═╗║ ║╠╩╗",
	"╚═╝╚═╝╚═╝   ╚═╝╚═╝╚═╝",
];

/** The banner for terminals without box-drawing glyphs (SUBSUB_ASCII=1 or a non-UTF-8 locale). */
export const BANNER_ASCII = ["+-----------+", "|  Sub-Sub  |", "+-----------+"];

/** Short public-domain lines from Moby-Dick and its Extracts. */
export const QUOTES: Array<[string, string]> = [
	["And God created great whales.", "Genesis, in the Extracts"],
	["Leviathan maketh a path to shine after him; One would think the deep to be hoary.", "Job, in the Extracts"],
	["There go the ships; there is that Leviathan whom thou hast made to play therein.", "Psalms, in the Extracts"],
	["Now the Lord had prepared a great fish to swallow up Jonah.", "Jonah, in the Extracts"],
	["Very like a whale.", "Hamlet, in the Extracts"],
	["So fare thee well, poor devil of a Sub-Sub, whose commentator I am.", "Moby-Dick, Extracts"],
	["Give it up, Sub-Subs!", "Moby-Dick, Extracts"],
	["God keep me from ever completing anything.", "Moby-Dick, ch. 32"],
	["Call me Ishmael.", "Moby-Dick, ch. 1"],
];

/** The terminal theme, without -dark/-light. subsub-try-works is the other one shipped. */
export const DEFAULT_THEME = "subsub-glauca";
/** The theme of the Librarian: the same plate with madder as its accent. */
export const LIBRARIAN_THEME = "subsub-try-works";

export type Scheme = "dark" | "light";

/** Light or dark terminal, judged from the text colour of the current theme (dark text means a light background). */
export function schemeFromAnsi(fgAnsi: string, themeName?: string): Scheme {
	const base = themeName?.replace(/-256$/, "");
	if (base?.endsWith("-light") || base === "light") return "light";
	if (base?.endsWith("-dark") || base === "dark") return "dark";
	const rgb = fgAnsi.match(/38;2;(\d+);(\d+);(\d+)/);
	if (rgb) {
		const [r, g, b] = rgb.slice(1).map(Number);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? "light" : "dark";
	}
	const idx = fgAnsi.match(/38;5;(\d+)/);
	if (idx) {
		const n = Number(idx[1]);
		// 232-255 grey ramp, 0/16 black: dark text on a light terminal
		if (n === 0 || n === 16 || (n >= 232 && n <= 243)) return "light";
	}
	return "dark";
}

/** The 256-colour variant ("-256") when the terminal has no truecolor: its colours are picked from the xterm palette, not rounded to it. */
export function themeName(scheme: Scheme, base: string | undefined = DEFAULT_THEME, colorMode?: "truecolor" | "256color"): string | undefined {
	return base ? `${base}-${scheme}${colorMode === "256color" ? "-256" : ""}` : undefined;
}

export interface LibraryState {
	zotero: "checking" | "reachable" | "down";
	items?: number;
	toReview?: number;
	error?: string;
}

/** Paint roles. mark is the accent of the mode; ok (sap green) is applied or added, pend (gamboge) is pending or a preview; strike draws a removal. */
export interface Paint {
	mark(s: string): string;
	text(s: string): string;
	muted(s: string): string;
	dim(s: string): string;
	ok(s: string): string;
	pend(s: string): string;
	strike(s: string): string;
}

export const plain: Paint = { mark: (s) => s, text: (s) => s, muted: (s) => s, dim: (s) => s, ok: (s) => s, pend: (s) => s, strike: (s) => s };

type Lang = "en" | "pt";

/** The words of the library line, as in the web view (web/i18n.js: zoteroChecking, zoteroDown, items, toReview). */
export const LIBRARY_WORDS = {
	en: { checking: "Zotero: checking...", down: "Zotero is not running. Start it, then type /subsub.", items: "items", toCheck: "to check", prefix: "Zotero" },
	pt: { checking: "Zotero: a verificar...", down: "O Zotero não está aberto. Abra-o e escreva /subsub.", items: "itens", toCheck: "por verificar", prefix: "Zotero" },
};

function cut(s: string, width: number): string {
	return [...s].length > width ? `${[...s].slice(0, Math.max(0, width - 3)).join("")}...` : s;
}

/** The library line. A closed Zotero is not drawn in a warning colour: a hollow mark and the words say it. */
export function libraryLine(st: LibraryState, lang: Lang = "en", g: Glyphs = UNICODE): { text: string } {
	const w = LIBRARY_WORDS[lang];
	if (st.zotero === "checking") return { text: w.checking };
	if (st.zotero === "down") return { text: `${g.hollow} ${w.down}` };
	const parts = [`${st.items ?? "?"} ${w.items}`];
	if (st.toReview) parts.push(`${st.toReview} ${w.toCheck}`);
	return { text: `${w.prefix}: ${parts.join(", ")}` };
}

/** Header lines. Each line is cut to the width before it is coloured. */
export function headerLines(opts: {
	version: string;
	mode: "librarian" | "researcher";
	model: string;
	library: LibraryState;
	quote?: [string, string];
	width: number;
	paint?: Paint;
	lang?: Lang;
	glyphs?: Glyphs;
}): string[] {
	const p = opts.paint ?? plain;
	const banner = opts.glyphs && opts.glyphs !== UNICODE ? BANNER_ASCII : BANNER;
	const w = Math.max(10, opts.width);
	const modeLabel = opts.mode === "librarian" ? "Librarian" : "Researcher";
	const lib = libraryLine(opts.library, opts.lang, opts.glyphs);
	if (w < banner[0].length + 2) {
		return [p.mark(cut(`Sub-Sub ${opts.version}`, w)), p.text(cut(`${modeLabel} | ${opts.model}`, w)), p.muted(cut(lib.text, w))];
	}
	const out = ["", ...banner.map((l, i) => p.mark(l) + (i === 2 ? p.dim(cut(`  ${opts.version}`, w - l.length)) : "")), ""];
	const status = `${modeLabel}  ${opts.model}`;
	// The library line follows the mode and model on the same line when it fits, otherwise on a line of its own.
	if ([...status].length + 5 + [...lib.text].length <= w) out.push(p.text(status) + p.muted(`  |  ${lib.text}`));
	else out.push(p.text(cut(status, w)), p.muted(cut(lib.text, w)));
	if (opts.quote) {
		const one = `"${opts.quote[0]}" (${opts.quote[1]})`;
		if ([...one].length <= w) out.push(p.dim(one));
		else out.push(p.dim(cut(`"${opts.quote[0]}"`, w)), p.dim(cut(`  (${opts.quote[1]})`, w)));
	}
	out.push(p.dim(cut("/researcher  /librarian  /read  /notes  /library  /actions  |  / for all commands", w)), "");
	return out;
}

/**
 * Colour the "+ added" and "- removed" parts of a preview; the rest gets the
 * base colour (pi draws dialog text in the accent colour otherwise).
 */
export function paintPreview(
	text: string,
	add: (s: string) => string,
	remove: (s: string) => string,
	base: (s: string) => string = (x) => x,
): string {
	const seg = /(^|: |; )([+-] [^;]+)/g;
	return text
		.split("\n")
		.map((line) => {
			let out = "";
			let last = 0;
			for (const m of line.matchAll(seg)) {
				const start = (m.index ?? 0) + m[1].length;
				if (start > last) out += base(line.slice(last, start));
				out += (m[2].startsWith("+") ? add : remove)(m[2]);
				last = start + m[2].length;
			}
			if (last < line.length) out += base(line.slice(last));
			return out;
		})
		.join("\n");
}
