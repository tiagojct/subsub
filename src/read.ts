/**
 * /read: guided reading of one paper, for people who are learning to read the literature.
 * Sub-Sub asks why the user reads the paper and reads only as deep as that reason needs. It finds
 * the passages (quotes with their place) and asks questions; the user writes the answers. It states
 * no results: /lit-note is the note that Sub-Sub writes for you.
 */

/** The reasons to read, with the labels of the choice (English, Portuguese). */
export const PURPOSES = {
	background: ["Background: is it worth reading? (title and abstract, keep or drop)", "Contexto: vale a pena ler? (título e resumo, manter ou pôr de parte)"],
	fact: ["One fact: find a specific detail", "Um dado: encontrar um pormenor concreto"],
	extract: ["Extraction: one row for my review (question, design, population, setting, finding)", "Extração: uma linha para a minha revisão (pergunta, desenho, população, contexto, resultado)"],
	critique: ["Critique: read it closely (peer review, the paper closest to mine)", "Crítica: ler com atenção (revisão por pares, o artigo mais próximo do meu)"],
} as const;

export type Purpose = keyof typeof PURPOSES;

export interface ReadRequest {
	ref: string;
	purpose: Purpose;
	date: string;
	/** fact: what the user looks for. */
	fact?: string;
	/** extract: an existing sheet, relative to the Sub-Sub folder. */
	sheet?: string;
	/** extract: the review question of a new sheet. */
	question?: string;
}

/** "/read extract smith2026" -> purpose and reference; the first word is a purpose only when it is one exactly. */
export function readArgs(args: string): { purpose?: Purpose; ref: string } {
	const words = args.trim().split(/\s+/).filter(Boolean);
	const first = words[0]?.toLowerCase();
	if (first && Object.hasOwn(PURPOSES, first)) return { purpose: first as Purpose, ref: words.slice(1).join(" ") };
	return { ref: words.join(" ") };
}

const GUIDELINES =
	"CONSORT for randomised trials, STROBE for observational studies, PRISMA for systematic reviews, STARD for diagnostic accuracy, TRIPOD or TRIPOD+AI for prediction models, CHEERS for economic evaluations, SRQR or COREQ for qualitative research";

function depth(r: ReadRequest): string[] {
	switch (r.purpose) {
		case "background":
			return [
				"Depth: the title and the abstract only. Do not read the full text.",
				'Under "## The paper at a glance":',
				"- What it asks: the sentence of the title or abstract that states the question or aim, quoted.",
				"- How: the sentence that names the design and the population, quoted.",
				'Under "## Keep or drop": the question "Does this paper fit your reason? Look at the population, the design and the outcome.", then the lines "- [ ] Keep", "- [ ] Drop" and "Reason:", empty for the user.',
			];
		case "fact":
			return [
				`The user looks for: ${r.fact}`,
				"Depth: only the passages that hold this fact. Get the section list first and read only the sections you need.",
				'Under "## Where the paper says it": each passage, quoted, with its place. Under each passage, one question that makes the user read it closely (for example: what exactly does it say, for which population, at what time?) and an empty line "Your answer:".',
				"If the paper does not say it, write that you did not find it and where you looked.",
			];
		case "extract": {
			const sheet = r.sheet
				? `the sheet ${r.sheet}: read it first for its columns, then add the row under its table with edit.`
				: `a new sheet Research/<slug> extraction.md (slug: the review question in lower case with hyphens, at most five words; do not overwrite an existing file). Front matter: title, question: "${r.question}", type: extraction-sheet, created: ${r.date}. Then a table with the columns | Study | Question | Design | Population | Setting | Outcome | Main finding |.`;
			return [
				"Depth: the methods and the results (the full text when there is one).",
				'Under "## Extraction": for each field below, the passage that answers it, quoted with its place, then an empty line "Your answer:".',
				"- The question or aim",
				"- The design",
				"- The population (who, how many)",
				"- The setting (where, when)",
				"- The outcome and how it was measured",
				"- The main finding: quote the sentence of the results that answers the question. Do not restate it.",
				`Then add one row for this paper to ${sheet}`,
				"The row: [[citekey]] in the Study column, and in every other column only where the user finds it (the page or the section). Leave the content of the cells for the user.",
			];
		}
		case "critique":
			return [
				"Depth: the whole paper, section by section. A critique needs the full text: if you can read only the abstract, say so, write what the abstract allows, and offer /request-copy to ask the authors for the paper.",
				'Under "## Methods", "## Results" and "## Discussion": the passages that matter to judge the study, quoted with their place, each with one question for the user (for example: how were the participants selected? what was compared? what else could explain the result?).',
				`Under "## Appraisal": name the design and the reporting guideline that applies (${GUIDELINES}), and tell the user to check the paper against it item by item. Do not copy the checklist. Then five to eight questions on the risk of bias for this design (selection, confounding, measurement, missing data, selective reporting), each with the passage to look at.`,
				"If the zotero_get_figure tool is available, show the table or figure with the main result: call it with the label of its caption and put the Markdown line it returns under the passage that cites it, with the page link, and a question about what the user sees in it.",
			];
	}
}

/**
 * The instruction for the model. The first line is the command itself: the chat shows a long
 * message folded under its first line, so the user sees what they asked for.
 */
export function readInstruction(r: ReadRequest): string {
	return [
		`/read ${r.purpose} ${r.ref}`,
		"",
		`Guided reading of ${r.ref}. The user is learning to read papers: you find the passages and ask; the user reads and writes the answers.`,
		"",
		"1. Find the work: zotero_find_items first. For a DOI or PMID that is not in the library, scholar_get_work, and offer to import it.",
		"2. Read only what the depth below needs: zotero_get_fulltext for a library item; otherwise scholar_read_oa_fulltext (the section list first, then only the sections you need); otherwise scholar_get_work for the abstract.",
		"3. Write the reading note as described below.",
		"4. Give the user the path of the note and the first question to answer. Do not answer the questions.",
		"",
		"Rules:",
		"- State no results, effect sizes, summaries or conclusions, in the note or in the chat. Quote the paper and ask; the user writes the answers.",
		"- Copy quotes word for word from what you read, and mark every omission with [...]. After each quote give its place: (p. N) only with evidence: full text (Sub-Sub links it to that page of the PDF), otherwise the section (Abstract, Methods, Results).",
		`- The note is Literature/<citekey>.md in the Sub-Sub folder, with the front matter of a literature note from the shared rules plus type: reading-note and purpose: ${r.purpose}; evidence says what you read. If the note exists, do not overwrite it: add a section "## Reading ${r.date}: ${r.purpose}" at the end with edit, with the content below one heading level lower.`,
		'- Start with "## Why I am reading this" (the reason, in the user\'s words when they gave them) and end with one line "Next step:" (what to read or do next).',
		"",
		...depth(r),
	].join("\n");
}
