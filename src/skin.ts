/**
 * The skin of the terminal screens: the paint roles drawn from a pi theme, and the glyphs. Meaning is never carried by
 * colour alone: a rule is solid, dashed or dotted, a failure has a hollow mark and a word, and a terminal that cannot show
 * the box-drawing glyphs (a non-UTF-8 locale, or SUBSUB_ASCII=1) gets plain ASCII.
 */

import type { Paint } from "./look.ts";

export interface Glyphs {
	/** A solid rule: full text, done. */
	solid: string;
	/** A dashed rule: an abstract, a preview, pending. */
	dashed: string;
	/** A dotted rule: metadata only. */
	dotted: string;
	/** The hollow mark of a failure or of something that is not running. */
	hollow: string;
	/** A filled and an empty cell of the context meter. */
	cell: string;
	cellEmpty: string;
}

export const UNICODE: Glyphs = { solid: "─", dashed: "┄", dotted: "┈", hollow: "○", cell: "▰", cellEmpty: "▱" };
export const ASCII: Glyphs = { solid: "=", dashed: "-", dotted: ".", hollow: "o", cell: "#", cellEmpty: "-" };

/** ASCII when SUBSUB_ASCII is set, or when the locale is C, POSIX or names a character set that is not UTF-8 (pt_PT.ISO-8859-1). No locale, or one without a character set, means UTF-8. */
export function useAscii(env: NodeJS.ProcessEnv = process.env): boolean {
	if (env.SUBSUB_ASCII && env.SUBSUB_ASCII !== "0") return true;
	const locale = env.LC_ALL || env.LC_CTYPE || env.LANG;
	if (!locale || /utf-?8/i.test(locale)) return false;
	return locale === "C" || locale === "POSIX" || /\.[^.]+$/.test(locale);
}

export function glyphs(env: NodeJS.ProcessEnv = process.env): Glyphs {
	return useAscii(env) ? ASCII : UNICODE;
}

/** The part of pi's Theme that the skin uses. */
export interface ThemeLike {
	fg(role: string, text: string): string;
	strikethrough?(text: string): string;
}

/** Paint roles from the colours of a pi theme (themes/*.json): accent, text, muted, dim, success (sap) and warning (gamboge). */
export function paintFromTheme(th: ThemeLike): Paint {
	return {
		mark: (x) => th.fg("accent", x),
		text: (x) => th.fg("text", x),
		muted: (x) => th.fg("muted", x),
		dim: (x) => th.fg("dim", x),
		ok: (x) => th.fg("success", x),
		pend: (x) => th.fg("warning", x),
		// A removal has no colour of its own: muted ink, struck through, and the "-" in front stays for terminals that ignore the strike.
		strike: (x) => (th.strikethrough ? th.strikethrough(th.fg("muted", x)) : th.fg("muted", x)),
	};
}

/** Frames of the working indicator: dotted, dashed, solid, dashed. One static frame when motion is reduced (SUBSUB_REDUCE_MOTION=1). */
export function workingFrames(g: Glyphs, reduceMotion = false): string[] {
	const dashed = g.dashed.repeat(4);
	return reduceMotion ? [dashed] : [g.dotted.repeat(4), dashed, g.solid.repeat(4), dashed];
}
