/**
 * The look of the `subsub` command: banner, status line, quote, and the theme
 * per mode (try-works for the librarian, Glauca for the researcher).
 * Only used when Sub-Sub runs as its own command in the terminal UI.
 */

import type { Mode } from "./config.ts";

export const BANNER = [
	"╔═╗╦ ╦╔╗    ╔═╗╦ ╦╔╗",
	"╚═╗║ ║╠╩╗───╚═╗║ ║╠╩╗",
	"╚═╝╚═╝╚═╝   ╚═╝╚═╝╚═╝",
];

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

export const MODE_THEMES: Record<Mode, string> = { librarian: "subsub-try-works", researcher: "subsub-glauca" };

export type Scheme = "dark" | "light";

/** Light or dark terminal, judged from the text colour of the current theme (dark text means a light background). */
export function schemeFromAnsi(fgAnsi: string, themeName?: string): Scheme {
	if (themeName?.endsWith("-light") || themeName === "light") return "light";
	if (themeName?.endsWith("-dark") || themeName === "dark") return "dark";
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

export function themeName(mode: Mode, scheme: Scheme, map: Partial<Record<Mode, string>> = MODE_THEMES): string | undefined {
	const base = map[mode];
	return base ? `${base}-${scheme}` : undefined;
}

export interface LibraryState {
	zotero: "checking" | "reachable" | "down";
	items?: number;
	toReview?: number;
	error?: string;
}

export interface Paint {
	mark(s: string): string;
	text(s: string): string;
	muted(s: string): string;
	dim(s: string): string;
	warn(s: string): string;
}

const plain: Paint = { mark: (s) => s, text: (s) => s, muted: (s) => s, dim: (s) => s, warn: (s) => s };

function cut(s: string, width: number): string {
	return [...s].length > width ? `${[...s].slice(0, Math.max(0, width - 3)).join("")}...` : s;
}

export function libraryLine(st: LibraryState): { text: string; warn: boolean } {
	if (st.zotero === "checking") return { text: "Zotero: checking...", warn: false };
	if (st.zotero === "down") return { text: "Zotero is not running. Start it, then type /subsub.", warn: true };
	const parts = [`${st.items ?? "?"} items`];
	if (st.toReview) parts.push(`${st.toReview} to review`);
	return { text: `Zotero: ${parts.join(", ")}`, warn: false };
}

/** Header lines. Each line is cut to the width before it is coloured. */
export function headerLines(opts: {
	version: string;
	mode: Mode;
	model: string;
	library: LibraryState;
	quote?: [string, string];
	width: number;
	paint?: Paint;
}): string[] {
	const p = opts.paint ?? plain;
	const w = Math.max(10, opts.width);
	const modeLabel = opts.mode === "librarian" ? "Librarian" : "Researcher";
	const lib = libraryLine(opts.library);
	if (w < BANNER[0].length + 2) {
		return [p.mark(cut(`Sub-Sub ${opts.version}`, w)), p.text(cut(`${modeLabel} | ${opts.model}`, w)), (lib.warn ? p.warn : p.muted)(cut(lib.text, w))];
	}
	const out = ["", ...BANNER.map((l, i) => p.mark(l) + (i === 2 ? p.dim(cut(`  ${opts.version}`, w - l.length)) : "")), ""];
	const status = `${modeLabel}  ${opts.model}`;
	out.push(p.text(cut(status, w)) + (lib.warn ? p.warn : p.muted)(cut(`  |  ${lib.text}`, Math.max(0, w - status.length))));
	if (opts.quote) {
		const one = `"${opts.quote[0]}" (${opts.quote[1]})`;
		if ([...one].length <= w) out.push(p.dim(one));
		else out.push(p.dim(cut(`"${opts.quote[0]}"`, w)), p.dim(cut(`  (${opts.quote[1]})`, w)));
	}
	out.push(p.dim(cut("/researcher  /librarian  /subsub  /history  /undo  |  / for all commands", w)), "");
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
