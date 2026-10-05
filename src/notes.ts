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
