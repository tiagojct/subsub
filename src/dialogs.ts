/**
 * The approval dialog of the terminal look: a preview between two dashed rules (dashed means "not done yet"), and keys that answer it.
 * It replaces pi's confirm dialog when the look is on. Nothing is applied unless the answer is the yes key: Enter does nothing, Esc, n and
 * Ctrl+C say no, and keys pressed in the first half second are ignored, so a letter typed just before the dialog opened cannot answer it.
 */

import { matchesKey, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { cut, rule } from "./chrome.ts";
import type { Paint } from "./look.ts";
import { type Glyphs, UNICODE } from "./skin.ts";

type Lang = "en" | "pt";

export const APPROVAL_WORDS = {
	en: { yes: "y apply", no: "n leave it as it is", esc: "Esc leave it", scroll: "up and down: scroll", above: "more lines above", below: "more lines below" },
	pt: { yes: "s aplicar", no: "n deixar como está", esc: "Esc deixar", scroll: "cima e baixo: deslocar", above: "linhas acima", below: "linhas abaixo" },
};

/** The same keys as the web view: y, and s in Portuguese. */
export const YES_KEYS: Record<Lang, string[]> = { en: ["y"], pt: ["s", "y"] };

export interface ApprovalLines {
	lines: string[];
	/** Lines of the preview in all. */
	total: number;
	/** The largest scroll offset. */
	maxScroll: number;
}

/** The dialog as lines: rule, title, preview (scrolled), rule, keys. Every line fits the width. */
export function approvalLines(o: { title: string; body: string; lang: Lang; width: number; paint: Paint; glyphs?: Glyphs; scroll?: number; bodyRows?: number }): ApprovalLines {
	const g = o.glyphs ?? UNICODE;
	const w = Math.max(20, o.width);
	const words = APPROVAL_WORDS[o.lang];
	const all = wrapTextWithAnsi(o.body, w - 2);
	const rows = Math.max(3, o.bodyRows ?? 14);
	const maxScroll = Math.max(0, all.length - rows);
	const scroll = Math.min(Math.max(0, o.scroll ?? 0), maxScroll);
	const shown = all.slice(scroll, scroll + rows).map((l) => `  ${l}`);
	const below = all.length - scroll - shown.length;
	const lines = [rule(w, "dashed", o.paint.pend, g), o.paint.text(cut(` ${o.title}`, w)), ""];
	if (scroll > 0) lines.push(o.paint.dim(cut(`  ... ${scroll} ${words.above}`, w)));
	lines.push(...shown);
	if (below > 0) lines.push(o.paint.dim(cut(`  ... ${below} ${words.below} (${words.scroll})`, w)));
	lines.push("", rule(w, "dashed", o.paint.pend, g));
	lines.push(...wrapTextWithAnsi(` ${words.yes}   ${words.no}   ${words.esc}`, w).map((l) => o.paint.muted(l)));
	return { lines, total: all.length, maxScroll };
}

export interface ApprovalOptions {
	title: string;
	body: string;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	done: (yes: boolean) => void;
	/** Rows of the terminal, for the height of the preview. */
	rows?: () => number;
	/** Called after a key changed what the dialog shows. */
	redraw?: () => void;
	/** Milliseconds during which keys are ignored. */
	ignoreMs?: number;
	now?: () => number;
}

/** The pi-tui component of the dialog (see ExtensionUIContext.custom). */
export class ApprovalView {
	private scroll = 0;
	private answered = false;
	private readonly o: ApprovalOptions;
	private readonly opened: number;
	constructor(o: ApprovalOptions) {
		this.o = o;
		this.opened = (o.now ?? Date.now)();
	}

	private bodyRows(): number {
		return Math.max(3, Math.floor(((this.o.rows?.() ?? 24) * 9) / 10) - 8);
	}

	render(width: number): string[] {
		const view = approvalLines({ ...this.o, width, scroll: this.scroll, bodyRows: this.bodyRows() });
		this.scroll = Math.min(this.scroll, view.maxScroll);
		return view.lines;
	}

	invalidate(): void {}

	private answer(yes: boolean): void {
		if (this.answered) return;
		this.answered = true;
		this.o.done(yes);
	}

	handleInput(data: string): void {
		if ((this.o.now ?? Date.now)() - this.opened < (this.o.ignoreMs ?? 500)) return;
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c") || data === "n" || data === "N") return this.answer(false);
		if (data.length === 1 && YES_KEYS[this.o.lang].includes(data.toLowerCase())) return this.answer(true);
		const page = this.bodyRows() - 1;
		if (matchesKey(data, "down")) this.scroll += 1;
		else if (matchesKey(data, "up")) this.scroll = Math.max(0, this.scroll - 1);
		else if (matchesKey(data, "pageDown")) this.scroll += page;
		else if (matchesKey(data, "pageUp")) this.scroll = Math.max(0, this.scroll - page);
		else return;
		this.o.redraw?.();
	}
}
