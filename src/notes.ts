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

/**
 * The quotes that are not in the full text. A quote with an ellipsis is checked in parts;
 * square brackets (an editor's insertion) are left out of the comparison.
 */
export function missingQuotes(note: string, fullText: string, already: string[] = []): string[] {
	const source = matchable(fullText);
	const old = new Set(already);
	return quotesIn(note)
		.filter((q) => !old.has(q))
		.filter((q) => {
			const parts = q.split(/\s*(?:\.\.\.|…|\[\s*(?:\.\.\.|…)\s*\])\s*/).map((p) => p.replace(/\[[^\]]*\]/g, " "));
			return parts.filter((p) => matchable(p).length >= 12).some((p) => !appearsIn(source, p));
		});
}

/**
 * Whether a passage is in the (matchable) source: whole, or as groups of three words in order with
 * short gaps, because a PDF's running header or footer can fall in the middle of a sentence.
 */
export function appearsIn(source: string, passage: string, gap = 300): boolean {
	if (source.includes(matchable(passage))) return true;
	const words = passage.split(/\s+/).map(matchable).filter(Boolean);
	const groups: string[] = [];
	for (let i = 0; i < words.length; i += 3) groups.push(words.slice(i, i + 3).join(""));
	if (groups.length < 2) return false;
	for (let start = source.indexOf(groups[0]), tries = 0; start >= 0 && tries < 50; start = source.indexOf(groups[0], start + 1), tries++) {
		let end = start + groups[0].length;
		let ok = true;
		for (const g of groups.slice(1)) {
			const at = source.indexOf(g, end);
			if (at < 0 || at - end > gap) {
				ok = false;
				break;
			}
			end = at + g.length;
		}
		if (ok) return true;
	}
	return false;
}

export function quoteProblem(missing: string[]): string | undefined {
	if (!missing.length) return undefined;
	const shown = missing.slice(0, 5).map((q) => `- "${q.length > 160 ? `${q.slice(0, 160)}...` : q}"`);
	return [
		`${missing.length} quote(s) in this note are not in the item's full text:`,
		...shown,
		"Copy each quote word for word from the full text (zotero_get_fulltext), or remove the quote marks and say it in your own words. Then write the note again.",
	].join("\n");
}
