/**
 * /ai-statement: a draft of the statement on the use of AI that journals ask for (ICMJE and
 * most publishers), with the facts Sub-Sub knows: its version, the models of each mode and their
 * providers, and the checks the program makes. The authors complete the bracketed parts.
 */

export const SUBSUB_DOI = "10.5281/zenodo.23238602";

export interface StatementFacts {
	version: string;
	models: Partial<Record<"librarian" | "researcher", string>>;
	uses?: string;
	date: string;
	starbuck: boolean;
}

/** "opencode-go/mimo-v2.6-pro" -> "mimo-v2.6-pro (OpenCode Go)". */
export function modelLabel(spec: string): string {
	const i = spec.indexOf("/");
	if (i < 0) return spec;
	const provider = spec.slice(0, i);
	const names: Record<string, string> = { "opencode-go": "OpenCode Go", google: "Google", mistral: "Mistral AI", openai: "OpenAI", anthropic: "Anthropic", openrouter: "OpenRouter", deepseek: "DeepSeek" };
	return `${spec.slice(i + 1)} (${names[provider] ?? provider})`;
}

export function aiStatement(f: StatementFacts): string {
	const models = [...new Set(Object.values(f.models).filter(Boolean) as string[])].map(modelLabel);
	const modelText = models.length ? `the language model${models.length > 1 ? "s" : ""} ${models.join(" and ")}` : "[the language model and its provider]";
	const uses = f.uses?.trim() || "[the tasks: for example, literature searches, screening of search results, reading notes on included studies, checks of the references]";
	return [
		"## Use of AI tools",
		"",
		`We used Sub-Sub ${f.version} (Jacinto T., doi:${SUBSUB_DOI}), an open-source research assistant that works from a Zotero reference library, with ${modelText}, in [month and year]. We used it for ${uses}.`,
		"",
		"Sub-Sub records in each note whether it was written from the full text, the abstract or the bibliographic record, checks that quotations are in the full text, and makes no change to the reference library without the authors' approval." +
			(f.starbuck ? " The cited works were checked for existence, bibliographic accuracy and retraction with Starbuck." : ""),
		"",
		"[Choose one: No text of this manuscript was written by an AI tool. | Sub-Sub drafted [which parts]; the authors revised and rewrote this text.]",
		"",
		"The authors checked every reference and every statement taken from the sources against the original publications, and take full responsibility for the content of this article.",
		"",
		"<!-- Draft made by Sub-Sub on " + f.date + ". Complete the parts in brackets, delete this line, and follow the journal's instructions on where the statement goes (often the Methods or the Acknowledgements). -->",
		"",
	].join("\n");
}
