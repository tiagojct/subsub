/**
 * /feedback: a draft bug report or idea in the Inbox, for the user to read and post on GitHub.
 * Sub-Sub sends nothing: the user decides what to share. The home and Sub-Sub folders, email
 * addresses and keys are taken out before the draft is written.
 */

export const ISSUES_URL = "https://github.com/tiagojct/subsub/issues/new";

export interface FeedbackFacts {
	what: string;
	date: string;
	/** For example "Sub-Sub 0.17.0, pi 1.0.4, Node v24.1.0, darwin arm64". */
	versions: string;
	/** Mode, model, language, add-ons, Zotero. */
	setup: string[];
	/** The output of subsub doctor. */
	checks: string;
	lastError?: string;
	home: string;
	vault?: string;
}

/** Text made safe to post: the Sub-Sub and home folders, email addresses and keys taken out. */
export function redact(text: string, home: string, vault?: string): string {
	let out = text;
	if (vault) out = out.split(vault).join("<Sub-Sub folder>");
	if (home) out = out.split(home).join("~");
	return out
		.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "<email>")
		.replace(/\b(?:sk-|AIza|ghp_|gho_|github_pat_|xox[bp]-)[\w-]{8,}/g, "<key>")
		.replace(/\b[A-Za-z0-9_-]{32,}\b/g, "<key>");
}

export function feedbackNote(f: FeedbackFacts): string {
	const clean = (s: string) => redact(s, f.home, f.vault);
	return [
		"---",
		"type: feedback",
		`created: ${f.date}`,
		"---",
		"",
		"# Sub-Sub feedback",
		"",
		`Read this draft, take out anything you do not want to share, then post it at ${ISSUES_URL}. Sub-Sub has sent nothing.`,
		"",
		"## What happened",
		"",
		clean(f.what.trim()) || "(what you did, and what you saw)",
		"",
		"## What you expected",
		"",
		"(what should have happened)",
		"",
		"## Set-up",
		"",
		`- ${clean(f.versions)}`,
		...f.setup.map((l) => `- ${clean(l)}`),
		"",
		"## subsub doctor",
		"",
		"```",
		clean(f.checks.trim()),
		"```",
		"",
		"## Last error",
		"",
		f.lastError ? ["```", clean(f.lastError.trim()).slice(0, 2000), "```"].join("\n") : "(none in this session)",
		"",
	].join("\n");
}
