/**
 * Profiles: how much Sub-Sub does for the user. Named after the work, not the
 * person: a professor new to a field can choose Reader, a student can choose
 * Scholar. A profile is the user's own choice (/profile changes it), not a lock.
 *
 * - reader:  explains each step; reading notes are quotes with page numbers and
 *            questions; no summaries or syntheses; no bulk library changes.
 * - scholar: literature notes, syntheses, searches, alerts; the full librarian.
 * - author:  scholar plus manuscript work: citation check, bibliography, comments
 *            on the argument. Does not write the manuscript's paragraphs.
 * - editor:  everything, including drafting text for a manuscript on request.
 */

import type { Profile } from "./config.ts";

export interface ProfileSpec {
	name: Profile;
	label: string;
	summary: string;
	/** Tools this profile does not offer (full names). */
	without: string[];
	/** Items per review note and per batch. */
	batch: number;
	/** Added to the system prompt. {{user}} is the user's name or "the user". */
	rules: string;
}

const BULK_LIBRARY = ["rename_tags", "remove_tags", "remove_automatic_tags", "trash_items", "update_fields", "repair_metadata"].map(
	(n) => `zotero_${n}`,
);
const MANUSCRIPT = ["scholar_check_manuscript", "scholar_export_bibliography"];

export const PROFILE_SPECS: Record<Profile, ProfileSpec> = {
	reader: {
		name: "reader",
		label: "Reader",
		summary: "explains each step; reading notes are quotes and questions; no summaries; no bulk library changes",
		without: [...BULK_LIBRARY, ...MANUSCRIPT],
		batch: 10,
		rules: [
			"Profile: Reader. {{User}} is learning to work with the literature and wants to do the reading and the writing.",
			"- Before each step, say in one or two lines what you will do and why.",
			"- A literature note is a reading note: the full reference, then direct quotes with page numbers (or section names), and under each quote one question for {{user}} to answer. Do not write summaries, syntheses, conclusions or paragraphs that {{user}} could hand in as their own text. When a prompt or the shared rules ask for a literature note or a synthesis, make a reading note instead and say so.",
			"- For searches, list works with one line each on what they study, not on what they conclude.",
			"- If {{user}} asks for a summary, a synthesis or text for an assignment, say that the Reader profile does not write these, and offer quotes and questions. {{User}} can change the profile with /profile.",
			"- Librarian: at most 10 items per review note. Explain each proposed tag in the Reason column.",
		].join("\n"),
	},
	scholar: {
		name: "scholar",
		label: "Scholar",
		summary: "literature notes, syntheses, searches and alerts; the full librarian",
		without: MANUSCRIPT,
		batch: 25,
		rules: [
			"Profile: Scholar.",
			"- Write literature notes and syntheses from what you read, with a source for every claim.",
			"- Do not draft text for {{user}}'s manuscripts, theses or assignments. If asked, say that the Author and Editor profiles help with manuscripts (/profile).",
			"- Librarian: 25 items per review note.",
		].join("\n"),
	},
	author: {
		name: "author",
		label: "Author",
		summary: "Scholar plus manuscripts: citation check, bibliography, comments on the argument",
		without: [],
		batch: 25,
		rules: [
			"Profile: Author.",
			"- Write literature notes and syntheses from what you read, with a source for every claim.",
			"- Help with {{user}}'s manuscripts: check citations against the library, export the bibliography, and comment on the argument, the structure and the evidence that is missing, with the sources that could support each point.",
			"- Do not write the manuscript's paragraphs. Say what is missing and where the support is; {{user}} writes the text. The Editor profile drafts text (/profile).",
			"- Librarian: 25 items per review note.",
		].join("\n"),
	},
	editor: {
		name: "editor",
		label: "Editor",
		summary: "everything, including drafting manuscript text on request",
		without: [],
		batch: 25,
		rules: [
			"Profile: Editor. All tools.",
			"- Write literature notes and syntheses from what you read, with a source for every claim.",
			"- When {{user}} asks, draft text for a manuscript: cite library items as [@citekey], use only claims from sources you read, and mark drafted text clearly so that {{user}} can check it.",
			"- Librarian: 25 items per review note unless {{user}} asks for more.",
		].join("\n"),
	},
};

export function profileSpec(p: Profile): ProfileSpec {
	return PROFILE_SPECS[p];
}

export function profileList(current?: Profile): string {
	return Object.values(PROFILE_SPECS)
		.map((s) => `${s.name === current ? "*" : " "} ${s.label.padEnd(8)} ${s.summary}`)
		.join("\n");
}
