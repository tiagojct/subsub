/**
 * Which tools each mode may use, and which calls need the user's approval.
 */

import type { Mode, Profile } from "./config.ts";
import { profileSpec } from "./profiles.ts";

export const FILE_TOOLS = ["read", "edit", "write", "grep", "find", "ls"];

/** Prefixes of the tools that Sub-Sub's servers provide (the gate checks the mode and the profile for these). */
export const SERVER_PREFIXES = ["zotero_", "scholar_", "verify_"];

export const ZOTERO_READ = [
	"status",
	"library_overview",
	"find_items",
	"standalone_items",
	"get_item",
	"get_fulltext",
	"list_tags",
	"get_vocabulary",
	"list_collections",
	"history",
].map((n) => `zotero_${n}`);

/** Write tools that support dry_run: the gate previews them and asks. */
export const PREVIEW_WRITES = new Set([
	...[
		"tag_items",
		"apply_tag_review",
		"rename_tags",
		"remove_tags",
		"remove_automatic_tags",
		"set_citekeys",
		"update_fields",
		"file_items",
		"create_collection",
		"create_note",
		"trash_items",
		"undo",
		"import_identifiers",
		"import_queue",
		"repair_metadata",
		"attach_oa_pdfs",
		"set_parent_items",
	].map((n) => `zotero_${n}`),
	"scholar_attach_note",
]);

/** Writes without a dry run that still need a yes. */
export const CONFIRM_WRITES = new Set(["scholar_export_bibliography"]);

/** Zotero tools that look at the library or write only a note in the Sub-Sub folder. */
export const ZOTERO_CHECKS = [
	"tag_audit",
	"audit_metadata",
	"find_duplicates",
	"check_retractions",
	"missing_pdfs",
	"write_tag_review",
	"find_reference",
	"web_search",
].map(
	(n) => `zotero_${n}`,
);


export interface ToolOptions {
	profile?: Profile;
	/** The model test: also the bakeoff_ tools. */
	bench?: boolean;
}

/**
 * The tools of a mode. The Librarian manages the library: Zotero tools and files.
 * The Researcher has the same, plus searches, notes and reference checks. The
 * profile then removes tools. Every library change is still previewed (gateKind).
 */
export function toolsFor(mode: Mode, registered: string[], opts: ToolOptions = {}): string[] {
	const has = new Set(registered);
	const without = new Set(profileSpec(opts.profile ?? "editor").without);
	const zotero = registered.filter((n) => n.startsWith("zotero_") && (opts.bench || !n.startsWith("zotero_bakeoff_")));
	const wanted = [
		...ZOTERO_READ,
		...ZOTERO_CHECKS,
		...zotero,
		...(mode === "researcher" ? registered.filter((n) => n.startsWith("scholar_") || n.startsWith("verify_")) : []),
		...FILE_TOOLS,
	];
	return [...new Set(wanted)].filter((n) => has.has(n) && !without.has(n));
}

/** Why a Sub-Sub tool is not available now, or undefined when it is. */
export function unavailableReason(name: string, mode: Mode, registered: string[], opts: ToolOptions = {}): string | undefined {
	if (toolsFor(mode, registered, opts).includes(name)) return undefined;
	const profile = opts.profile ?? "editor";
	if (profileSpec(profile).without.includes(name)) {
		return `${name} is not part of the ${profileSpec(profile).label} profile. The user can change the profile with /profile.`;
	}
	if (mode === "librarian" && toolsFor("researcher", registered, opts).includes(name)) {
		return `${name} is part of the Researcher, which also does everything the Librarian does. The user can switch with /researcher.`;
	}
	return `${name} is not available.`;
}

export type GateKind = "preview" | "confirm" | "path" | null;

/** A dry run only when dry_run is absent (server default true) or clearly true. */
export function isDryRun(value: unknown): boolean {
	return value === undefined || value === true || value === "true";
}

export function gateKind(toolName: string, input: Record<string, unknown>): GateKind {
	if (PREVIEW_WRITES.has(toolName)) return isDryRun(input.dry_run) ? null : "preview";
	if (CONFIRM_WRITES.has(toolName)) return "confirm";
	if (toolName === "write" || toolName === "edit") return "path";
	return null;
}

/** Tools that send a query to an outside service (PubMed, Europe PMC, OpenAlex, Crossref, a web search). */
const OUTBOUND = new Set(["scholar_search_pubmed", "scholar_search_openalex", "scholar_search_europepmc", "scholar_search_multi", "zotero_find_reference", "zotero_web_search"]);
export const MAX_QUERY_CHARS = 1500;

/**
 * Why an outside search is refused: a query is search terms, so a query that is long or holds
 * several lines is text from a note, a full text or the library, sent where it should not go
 * (for example because a document asked for it).
 */
export function outboundProblem(toolName: string, input: Record<string, unknown>): string | undefined {
	if (!OUTBOUND.has(toolName)) return undefined;
	const queries = [input.query, ...(Array.isArray(input.queries) ? input.queries : [])].filter((q): q is string => typeof q === "string");
	for (const q of queries) {
		if (q.length > MAX_QUERY_CHARS || q.split("\n").length > 3) {
			return `This search query is ${q.length} characters on ${q.split("\n").length} lines. A query is search terms; send no passages of notes, full texts or library records to an outside service. Shorten it to the search terms.`;
		}
	}
	return undefined;
}
