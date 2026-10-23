/**
 * The notes and library screens of the terminal look, as pi-tui components for `ctx.ui.custom()`. Each has a pure function that draws it as
 * lines (snapshots at 40, 80 and 120 columns) and a class that holds the state and the keys. The notes screen has two columns from 100 columns
 * up (the list, and the note under the cursor); below that it is a list, and Enter opens a note.
 */

import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { cut, evidenceLine, fill, rule } from "./chrome.ts";
import type { Paint } from "./look.ts";
import { frontMatter, field } from "./notes.ts";
import { type Glyphs, UNICODE } from "./skin.ts";

type Lang = "en" | "pt";

export const SCREEN_WORDS = {
	en: {
		notes: "Notes", of: "of", filter: "filter", none: "No notes yet. Sub-Sub writes them in Literature/, Research/ and Syntheses/.", noMatch: "No note matches.", empty: "(empty note)",
		hintNotes: "up and down: choose   type: filter   PgUp PgDn: scroll   ctrl+o: open   Esc: close", hintRead: "up and down: scroll   ctrl+o: open   Esc: back",
		library: "Library", typeToSearch: "Type to search your library.", searching: "Searching...", noItems: "Nothing found.", failed: "The search failed",
		hintLibrary: "up and down: choose   Enter: read   ctrl+n: note   Esc: close", hintLibrarian: "up and down: choose   Enter: copy the key   Esc: close",
		hintChoice: "up and down: choose   Enter: select   type: filter   Esc: cancel", noChoice: "Nothing matches.",
	},
	pt: {
		notes: "Notas", of: "de", filter: "filtro", none: "Ainda não há notas. O Sub-Sub escreve-as em Literature/, Research/ e Syntheses/.", noMatch: "Nenhuma nota corresponde.", empty: "(nota vazia)",
		hintNotes: "cima e baixo: escolher   escrever: filtrar   PgUp PgDn: deslocar   ctrl+o: abrir   Esc: fechar", hintRead: "cima e baixo: deslocar   ctrl+o: abrir   Esc: voltar",
		library: "Biblioteca", typeToSearch: "Escreva para pesquisar na biblioteca.", searching: "A pesquisar...", noItems: "Nada encontrado.", failed: "A pesquisa falhou",
		hintLibrary: "cima e baixo: escolher   Enter: ler   ctrl+n: nota   Esc: fechar", hintLibrarian: "cima e baixo: escolher   Enter: copiar a chave   Esc: fechar",
		hintChoice: "cima e baixo: escolher   Enter: selecionar   escrever: filtrar   Esc: cancelar", noChoice: "Nada corresponde.",
	},
};

const LEFT = 36;
const WIDE = 100;

function pad(s: string, width: number): string {
	return s + " ".repeat(Math.max(0, width - visibleWidth(s)));
}

/** A key that types text (a letter, a digit, a pasted string), not a control or escape sequence. */
export function printable(data: string): boolean {
	return data.length > 0 && !/[\x00-\x1f\x7f]/.test(data);
}

// ---------------------------------------------------------------- notes

export interface NotesLayout {
	width: number;
	/** Lines for the whole screen. */
	rows: number;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	mode: "list" | "read";
	/** Paths of the notes that match the filter, relative to the Sub-Sub folder. */
	entries: string[];
	total: number;
	selected: number;
	filter: string;
	evidence?: string;
	/** The chosen note as lines, for a width. */
	renderBody: (width: number) => string[];
	bodyScroll: number;
}

export function notesLines(o: NotesLayout): { lines: string[]; bodyMax: number } {
	const g = o.glyphs ?? UNICODE;
	const p = o.paint;
	const w = Math.max(20, o.width);
	const words = SCREEN_WORDS[o.lang];
	const rows = Math.max(3, o.rows - 5);
	const wide = w >= WIDE && o.mode === "list";
	const count = o.entries.length === o.total ? `${o.total}` : `${o.entries.length} ${words.of} ${o.total}`;
	const out = [p.mark(cut(` ${words.notes}`, w)) + p.muted(cut(` (${count})${o.filter ? `   ${words.filter}: ${o.filter}` : ""}`, Math.max(0, w - words.notes.length - 1))), rule(w, "solid", p.muted, g)];
	let bodyMax = 0;
	const hint = (text: string) => wrapTextWithAnsi(` ${text}`, w).map((l) => p.muted(l));
	if (o.total === 0 || o.entries.length === 0) {
		out.push(p.muted(cut(`  ${o.total === 0 ? words.none : words.noMatch}`, w)), rule(w, "solid", p.muted, g), ...hint(words.hintNotes));
		return { lines: out, bodyMax };
	}
	const list = (width: number): string[] => {
		const start = Math.max(0, Math.min(o.selected - Math.floor(rows / 2), o.entries.length - rows));
		return o.entries.slice(start, start + rows).map((rel, k) => {
			const chosen = start + k === o.selected;
			return chosen ? `${p.mark(g.pointer)} ${p.text(cut(rel, width - 2))}` : `  ${p.muted(cut(rel, width - 2))}`;
		});
	};
	const body = (width: number): string[] => {
		const lines = o.renderBody(Math.max(10, width));
		const head = o.evidence ? [evidenceLine(o.evidence, o.lang, width, p, g), ""] : [];
		const room = Math.max(1, rows - head.length);
		bodyMax = Math.max(0, lines.length - room);
		const from = Math.min(o.bodyScroll, bodyMax);
		const shown = lines.slice(from, from + room).map((l) => truncateToWidth(l, width));
		return [...head, ...(shown.length ? shown : [p.dim(words.empty)])];
	};
	if (wide) {
		const right = w - LEFT - 3;
		const left = list(LEFT);
		const detail = body(right);
		for (let i = 0; i < rows; i++) out.push(`${pad(left[i] ?? "", LEFT)} ${p.muted(g.vertical)} ${detail[i] ?? ""}`);
		out.push(rule(w, "solid", p.muted, g), ...hint(words.hintNotes));
	} else if (o.mode === "list") {
		out.push(...list(w), rule(w, "solid", p.muted, g), ...hint(words.hintNotes));
	} else {
		out.push(...body(w), rule(w, "solid", p.muted, g), ...hint(words.hintRead));
	}
	return { lines: out, bodyMax };
}

export interface NotesOptions {
	/** The notes, newest first. */
	notes: Array<{ path: string; rel: string }>;
	read: (path: string) => string;
	/** The text of a note as lines, for a width (pi's Markdown component in the terminal). */
	markdown: (text: string, width: number) => string[];
	open: (path: string) => void;
	done: () => void;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	rows?: () => number;
	redraw?: () => void;
}

export class NotesView {
	private readonly o: NotesOptions;
	private filter = "";
	private selected = 0;
	private mode: "list" | "read" = "list";
	private bodyScroll = 0;
	private bodyMax = 0;
	private lastWidth = 80;
	private readonly texts = new Map<string, string>();
	constructor(o: NotesOptions) {
		this.o = o;
	}

	private entries() {
		const f = this.filter.toLowerCase();
		return f ? this.o.notes.filter((n) => n.rel.toLowerCase().includes(f)) : this.o.notes;
	}

	private text(): string {
		const n = this.entries()[this.selected];
		if (!n) return "";
		let t = this.texts.get(n.path);
		if (t === undefined) {
			try {
				t = this.o.read(n.path);
			} catch {
				t = "";
			}
			this.texts.set(n.path, t);
		}
		return t;
	}

	render(width: number): string[] {
		this.lastWidth = width;
		const text = this.text();
		const front = frontMatter(text);
		const evidence = front ? field(front, "evidence") : undefined;
		const body = front ? text.slice(text.indexOf("\n---", 3) + 4).replace(/^\r?\n/, "") : text;
		const entries = this.entries();
		const view = notesLines({
			width, rows: this.height(), lang: this.o.lang, paint: this.o.paint, glyphs: this.o.glyphs, mode: this.mode, entries: entries.map((n) => n.rel), total: this.o.notes.length,
			selected: this.selected, filter: this.filter, evidence, renderBody: (w) => this.o.markdown(body, w), bodyScroll: this.bodyScroll,
		});
		this.bodyMax = view.bodyMax;
		this.bodyScroll = Math.min(this.bodyScroll, this.bodyMax);
		return fill(view.lines, width, this.height());
	}

	/** The screen covers the terminal, but for one line. */
	private height(): number {
		return Math.max(8, (this.o.rows?.() ?? 24) - 1);
	}

	invalidate(): void {}

	private move(by: number): void {
		const n = this.entries().length;
		if (!n) return;
		this.selected = Math.min(n - 1, Math.max(0, this.selected + by));
		this.bodyScroll = 0;
	}

	handleInput(data: string): void {
		const page = Math.max(3, this.height() - 6);
		const wideList = this.lastWidth >= WIDE && this.mode === "list";
		const scrolls = this.mode === "read" || wideList;
		if (matchesKey(data, "ctrl+c")) return this.o.done();
		if (matchesKey(data, "escape")) {
			if (this.mode === "read") this.mode = "list";
			else if (this.filter) {
				this.filter = "";
				this.selected = 0;
			} else return this.o.done();
		} else if (matchesKey(data, "ctrl+o")) {
			const n = this.entries()[this.selected];
			if (n) this.o.open(n.path);
			return;
		} else if (matchesKey(data, "enter")) {
			if (this.mode === "list" && !wideList && this.entries().length) {
				this.mode = "read";
				this.bodyScroll = 0;
			}
		} else if (matchesKey(data, "up")) {
			if (this.mode === "read") this.bodyScroll = Math.max(0, this.bodyScroll - 1);
			else this.move(-1);
		} else if (matchesKey(data, "down")) {
			if (this.mode === "read") this.bodyScroll = Math.min(this.bodyMax, this.bodyScroll + 1);
			else this.move(1);
		} else if (matchesKey(data, "pageUp")) {
			if (scrolls) this.bodyScroll = Math.max(0, this.bodyScroll - page);
			else this.move(-page);
		} else if (matchesKey(data, "pageDown")) {
			if (scrolls) this.bodyScroll = Math.min(this.bodyMax, this.bodyScroll + page);
			else this.move(page);
		} else if (this.mode === "list" && matchesKey(data, "backspace")) {
			this.filter = this.filter.slice(0, -1);
			this.selected = 0;
		} else if (this.mode === "list" && printable(data)) {
			this.filter += data;
			this.selected = 0;
			this.bodyScroll = 0;
		} else return;
		this.o.redraw?.();
	}
}

// ---------------------------------------------------------------- library

export interface LibraryItem {
	key: string;
	citekey?: string;
	title?: string;
	authors?: string;
	year?: string | number;
}

export interface LibraryLayout {
	width: number;
	rows: number;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	researcher: boolean;
	query: string;
	items: LibraryItem[];
	selected: number;
	state: "idle" | "searching" | "done" | "failed";
	error?: string;
}

export function libraryLines(o: LibraryLayout): string[] {
	const g = o.glyphs ?? UNICODE;
	const p = o.paint;
	const w = Math.max(20, o.width);
	const words = SCREEN_WORDS[o.lang];
	const room = Math.max(2, o.rows - 5);
	const out = [p.mark(cut(` ${words.library}`, w)), `${p.muted(" > ")}${p.text(cut(o.query, w - 4))}${p.mark("_")}`, rule(w, "solid", p.muted, g)];
	if (o.state === "idle" && !o.query) out.push(p.muted(cut(`  ${words.typeToSearch}`, w)));
	else if (o.state === "searching") out.push(p.muted(cut(`  ${words.searching}`, w)));
	else if (o.state === "failed") out.push(p.text(cut(`  ${g.hollow} ${words.failed}${o.error ? `: ${o.error.split("\n")[0]}` : ""}`, w)));
	else if (!o.items.length) out.push(p.muted(cut(`  ${words.noItems}`, w)));
	else {
		const per = 2;
		const fit = Math.max(1, Math.floor(room / per));
		const start = Math.max(0, Math.min(o.selected - Math.floor(fit / 2), o.items.length - fit));
		for (const [k, it] of o.items.slice(start, start + fit).entries()) {
			const chosen = start + k === o.selected;
			const meta = [it.authors, it.year, it.citekey].filter(Boolean).join(" · ");
			out.push(chosen ? `${p.mark(g.pointer)} ${p.text(cut(it.title || it.key, w - 2))}` : `  ${p.muted(cut(it.title || it.key, w - 2))}`, `  ${p.dim(cut(meta, w - 2))}`);
		}
	}
	out.push(rule(w, "solid", p.muted, g), ...wrapTextWithAnsi(` ${o.researcher ? words.hintLibrary : words.hintLibrarian}`, w).map((l) => p.muted(l)));
	return out;
}

export interface LibraryOptions {
	search: (query: string) => Promise<LibraryItem[]>;
	/** Enter: the researcher reads the item, the librarian gets its key. */
	choose: (item: LibraryItem) => void;
	note: (item: LibraryItem) => void;
	done: () => void;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	researcher: boolean;
	rows?: () => number;
	redraw?: () => void;
	/** Milliseconds to wait after the last key before searching. */
	delay?: number;
}

export class LibraryView {
	private readonly o: LibraryOptions;
	private query = "";
	private items: LibraryItem[] = [];
	private selected = 0;
	private state: LibraryLayout["state"] = "idle";
	private error: string | undefined;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private seq = 0;
	constructor(o: LibraryOptions) {
		this.o = o;
	}

	render(width: number): string[] {
		const height = Math.max(8, (this.o.rows?.() ?? 24) - 1);
		return fill(
			libraryLines({
				width, rows: height, lang: this.o.lang, paint: this.o.paint, glyphs: this.o.glyphs, researcher: this.o.researcher,
				query: this.query, items: this.items, selected: this.selected, state: this.state, error: this.error,
			}),
			width,
			height,
		);
	}

	invalidate(): void {}

	dispose(): void {
		clearTimeout(this.timer);
	}

	private schedule(): void {
		clearTimeout(this.timer);
		const q = this.query.replace(/\s+/g, " ").trim();
		const mine = ++this.seq;
		if (!q) {
			this.items = [];
			this.state = "idle";
			return;
		}
		this.state = "searching";
		this.timer = setTimeout(async () => {
			try {
				const items = await this.o.search(q);
				if (mine !== this.seq) return; // a newer search is on its way
				this.items = items;
				this.state = "done";
				this.selected = 0;
			} catch (err) {
				if (mine !== this.seq) return;
				this.state = "failed";
				this.error = (err as Error).message;
			}
			this.o.redraw?.();
		}, this.o.delay ?? 250);
	}

	handleInput(data: string): void {
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) return this.o.done();
		const item = this.items[this.selected];
		if (matchesKey(data, "enter")) {
			if (item) this.o.choose(item);
			return;
		}
		if (matchesKey(data, "ctrl+n")) {
			if (item && this.o.researcher) this.o.note(item);
			return;
		}
		if (matchesKey(data, "up")) this.selected = Math.max(0, this.selected - 1);
		else if (matchesKey(data, "down")) this.selected = Math.min(Math.max(0, this.items.length - 1), this.selected + 1);
		else if (matchesKey(data, "backspace")) {
			this.query = this.query.slice(0, -1);
			this.schedule();
		} else if (printable(data)) {
			this.query += data;
			this.schedule();
		} else return;
		this.o.redraw?.();
	}
}

// ---------------------------------------------------------------- a list to choose from

export interface Choice {
	label: string;
	/** Dim text after the label (a command, a date). */
	hint?: string;
	value: string;
}

export interface ChoiceLayout {
	title: string;
	choices: Choice[];
	selected: number;
	filter: string;
	width: number;
	rows: number;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
}

export function choiceLines(o: ChoiceLayout): string[] {
	const g = o.glyphs ?? UNICODE;
	const p = o.paint;
	const w = Math.max(20, o.width);
	const words = SCREEN_WORDS[o.lang];
	const room = Math.max(1, o.rows - 4);
	const out = [p.mark(cut(` ${o.title}`, w)) + (o.filter ? p.muted(cut(`   ${words.filter}: ${o.filter}`, Math.max(0, w - o.title.length - 1))) : ""), rule(w, "solid", p.muted, g)];
	if (!o.choices.length) out.push(p.muted(cut(`  ${words.noChoice}`, w)));
	const start = Math.max(0, Math.min(o.selected - Math.floor(room / 2), o.choices.length - room));
	for (const [k, c] of o.choices.slice(start, start + room).entries()) {
		const chosen = start + k === o.selected;
		const hint = c.hint ? `  ${c.hint}` : "";
		const label = cut(c.label, Math.max(8, w - 2 - hint.length));
		out.push(`${chosen ? p.mark(g.pointer) : " "} ${chosen ? p.text(label) : p.muted(label)}${p.dim(cut(hint, Math.max(0, w - 2 - label.length)))}`);
	}
	out.push(rule(w, "solid", p.muted, g), ...wrapTextWithAnsi(` ${words.hintChoice}`, w).map((l) => p.muted(l)));
	return out;
}

export interface ChoiceOptions {
	title: string;
	choices: Choice[];
	choose: (value: string) => void;
	cancel: () => void;
	lang: Lang;
	paint: Paint;
	glyphs?: Glyphs;
	rows?: () => number;
	redraw?: () => void;
}

export class ChoiceView {
	private readonly o: ChoiceOptions;
	private filter = "";
	private selected = 0;
	private answered = false;
	constructor(o: ChoiceOptions) {
		this.o = o;
	}

	private shown(): Choice[] {
		const f = this.filter.toLowerCase();
		return f ? this.o.choices.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(f)) : this.o.choices;
	}

	render(width: number): string[] {
		const rows = Math.max(8, Math.floor(((this.o.rows?.() ?? 24) * 8) / 10));
		return fill(choiceLines({ title: this.o.title, choices: this.shown(), selected: this.selected, filter: this.filter, width, rows, lang: this.o.lang, paint: this.o.paint, glyphs: this.o.glyphs }), width);
	}

	invalidate(): void {}

	handleInput(data: string): void {
		if (this.answered) return;
		const list = this.shown();
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
			this.answered = true;
			return this.o.cancel();
		}
		if (matchesKey(data, "enter")) {
			const c = list[this.selected];
			if (!c) return;
			this.answered = true;
			return this.o.choose(c.value);
		}
		if (matchesKey(data, "up")) this.selected = Math.max(0, this.selected - 1);
		else if (matchesKey(data, "down")) this.selected = Math.min(Math.max(0, list.length - 1), this.selected + 1);
		else if (matchesKey(data, "backspace")) {
			this.filter = this.filter.slice(0, -1);
			this.selected = 0;
		} else if (printable(data)) {
			this.filter += data;
			this.selected = 0;
		} else return;
		this.o.redraw?.();
	}
}
