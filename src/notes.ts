/**
 * Checks on the literature notes the researcher writes (a note whose front matter has a
 * citekey). Each note must say what it was written from (evidence: full text, abstract
 * or metadata), and only a note written from the full text may give page numbers.
 * The write gate calls these before a write or edit runs; a failed check blocks the call
 * with a reason, so the model corrects the note.
 */

export const EVIDENCE = ["full text", "abstract", "metadata"] as const;

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const PAGES = /\b(?:pp?\.|pages?)\s?\d+/i;

export function frontMatter(text: string): string | undefined {
	return FRONT.exec(text)?.[1];
}

export function field(front: string, name: string): string | undefined {
	const m = new RegExp(`^${name}:[ \\t]*(.*)$`, "m").exec(front);
	return m ? m[1].trim().replace(/^["']|["']$/g, "").trim() : undefined;
}

/** Why a new literature note cannot be written as it is, or undefined when it can. */
export function checkLiteratureNote(text: string): string | undefined {
	const m = FRONT.exec(text);
	if (!m || !field(m[1], "citekey")) return undefined;
	const evidence = field(m[1], "evidence")?.toLowerCase();
	if (!evidence || !(EVIDENCE as readonly string[]).includes(evidence)) {
		return 'A literature note needs "evidence:" in its front matter, with one of: full text, abstract, metadata (what you read to write it). Add it and write the note again.';
	}
	const body = text.slice(m[0].length);
	if (evidence !== "full text" && PAGES.test(body)) {
		return `This note says evidence: ${evidence}, but it gives page numbers. Page numbers come only from the full text: remove them, or read the full text and set evidence: full text.`;
	}
	return undefined;
}

/** The text of a file after pi's edit tool applies edits[] (each oldText matched against the original). */
export function applyEdits(current: string, edits: Array<{ oldText?: unknown; newText?: unknown }>): string {
	let out = current;
	for (const e of edits) {
		const oldText = String(e.oldText ?? "");
		if (oldText && out.includes(oldText)) out = out.replace(oldText, () => String(e.newText ?? ""));
	}
	return out;
}

// ---------------------------------------------------------------- quotes against the full text

/** The Zotero item key in a note's front matter (zotero: zotero://select/library/items/KEY). */
export function itemKeyOf(text: string): string | undefined {
	const front = frontMatter(text);
	const z = front ? field(front, "zotero") : undefined;
	return z ? /items\/([A-Z0-9]{8})\b/.exec(z)?.[1] : undefined;
}

/**
 * Direct quotes in a note: text in double quotes, and blockquote lines, of 25 characters or more.
 * Shorter quotes are usually terms, not passages, and are not checked.
 */
export function quotesIn(text: string): string[] {
	const body = text.replace(FRONT, "");
	const out = new Set<string>();
	// An opening mark follows a space or a bracket and a closing mark precedes one, so the text
	// between one quote and the next ("a" (p. 3); then "b") is not taken for a quote.
	for (const m of body.matchAll(/(?:^|[\s(\[—–])"([^"\s][^"\n]{23,598}[^"\s])"(?=[\s.,;:)\]!?]|$)/gm)) out.add(m[1].trim());
	for (const m of body.matchAll(/“([^“”\n]{25,600})”/g)) out.add(m[1].trim());
	for (const m of body.matchAll(/^>[ \t]*(.{25,})$/gm)) {
		// A blockquote may end with its source: "... (p. 12)" or "... [@smith2026, p. 12]".
		const q = m[1].replace(/\s*(?:\((?:p|pp)\.[^)]*\)|\[@[^\]]*\]|[-—–]\s*p\.?\s*\d+.*)\s*$/i, "").replace(/^["“]|["”]$/g, "").trim();
		if (q.length >= 25) out.add(q);
	}
	return [...out];
}

/** Letters and digits only, lower case: PDF text breaks lines, hyphenates words and changes quote marks. */
export function matchable(s: string): string {
	return s
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/(\w)-\s*\n\s*(\w)/g, "$1$2")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, "");
}

/** The full text as matchable pages joined by "|": Zotero marks a page break with a form feed. */
export function sourceOf(fullText: string): string {
	return fullText.split("\f").map(matchable).join("|");
}

/**
 * The quotes that are not in the full text. A quote with an ellipsis is checked in parts;
 * square brackets (an editor's insertion) are left out of the comparison.
 */
export function missingQuotes(note: string, fullText: string, already: string[] = []): string[] {
	const source = sourceOf(fullText);
	const old = new Set(already);
	return quotesIn(note)
		.filter((q) => !old.has(q))
		.filter((q) => {
			const parts = q.split(/\s*(?:\.\.\.|…|\[\s*(?:\.\.\.|…)\s*\])\s*/).map((p) => p.replace(/\[[^\]]*\]/g, " "));
			return parts.filter((p) => matchable(p).length >= 12).some((p) => !appearsIn(source, p));
		});
}

/**
 * Where a passage starts in the source (from sourceOf), or -1. It must be there word for word.
 * The only gap allowed is a page break with the running footer and header around it (groups of
 * three words in order, at most `gap` characters apart), so that a quote cannot join two passages
 * of one page without marking the omission.
 */
export function locate(source: string, passage: string, gap = 300): number {
	const whole = source.indexOf(matchable(passage));
	if (whole >= 0) return whole;
	const words = passage.split(/\s+/).map(matchable).filter(Boolean);
	const groups: string[] = [];
	for (let i = 0; i < words.length; i += 3) groups.push(words.slice(i, i + 3).join(""));
	if (groups.length < 2) return -1;
	for (let start = source.indexOf(groups[0]), tries = 0; start >= 0 && tries < 50; start = source.indexOf(groups[0], start + 1), tries++) {
		let end = start + groups[0].length;
		let ok = true;
		for (const g of groups.slice(1)) {
			const at = source.indexOf(g, end);
			if (at < 0 || (at > end && (at - end > gap || !source.slice(end, at).includes("|")))) {
				ok = false;
				break;
			}
			end = at + g.length;
		}
		if (ok) return start;
	}
	return -1;
}

export function appearsIn(source: string, passage: string, gap = 300): boolean {
	return locate(source, passage, gap) >= 0;
}

/** The page of the PDF (1-based, as Zotero's reader counts) where a passage starts, or undefined. */
export function pageOf(source: string, passage: string): number | undefined {
	const at = locate(source, passage);
	return at < 0 ? undefined : source.slice(0, at).split("|").length;
}

/**
 * Each "(p. N)" after a quote becomes a link that opens the PDF in Zotero at the page where the quote
 * is. The label stays as written (the page printed on the paper may differ from the PDF's count).
 */
export function withPageLinks(text: string, source: string, attachment: string): string {
	const link = (quote: string, label: string) => {
		const page = pageOf(source, quote.split(/\s*(?:\.\.\.|…|\[\s*(?:\.\.\.|…)\s*\])\s*/)[0]);
		return page ? `([${label}](zotero://open-pdf/library/items/${attachment}?page=${page}))` : `(${label})`;
	};
	const PAGE = String.raw`\((pp?\.\s?\d+(?:\s?[-–]\s?\d+)?)\)`;
	return text
		.replace(new RegExp(String.raw`(")([^"\n]{25,600})("\s*)${PAGE}`, "g"), (_m, o, q, c, label) => `${o}${q}${c}${link(q, label)}`)
		.replace(new RegExp(String.raw`(“)([^“”\n]{25,600})(”\s*)${PAGE}`, "g"), (_m, o, q, c, label) => `${o}${q}${c}${link(q, label)}`)
		.replace(new RegExp(String.raw`^(>[ \t]*)(.{25,}?)(\s*)${PAGE}[ \t]*$`, "gm"), (_m, o, q, c, label) => `${o}${q}${c}${link(q.replace(/^["“]|["”]$/g, ""), label)}`);
}

export function quoteProblem(missing: string[]): string | undefined {
	if (!missing.length) return undefined;
	const shown = missing.slice(0, 5).map((q) => `- "${q.length > 160 ? `${q.slice(0, 160)}...` : q}"`);
	return [
		`${missing.length} quote(s) in this note are not in the item's full text:`,
		...shown,
		"Copy each quote word for word from the full text (zotero_get_fulltext). Mark every omission with [...]: two passages joined without that mark are not a quote. Or remove the quote marks and say it in your own words. Then write the note again.",
	].join("\n");
}
