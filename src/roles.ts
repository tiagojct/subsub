/**
 * Which tools each mode may use, and which calls need the user's approval.
 */

import type { Mode } from "./config.ts";

export const FILE_TOOLS = ["read", "edit", "write", "grep", "find", "ls"];

/** Prefixes of the tools that Sub-Sub's servers provide (the gate checks the mode for these). */
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
	/** The model test: also the bakeoff_ tools. */
	bench?: boolean;
}

/**
 * The tools of a mode. The Librarian manages the library: Zotero tools and files.
 * The Researcher has the same, plus searches, notes and reference checks. Every
 * library change is still previewed (gateKind).
 */
export function toolsFor(mode: Mode, registered: string[], opts: ToolOptions = {}): string[] {
	const has = new Set(registered);
	const zotero = registered.filter((n) => n.startsWith("zotero_") && (opts.bench || !n.startsWith("zotero_bakeoff_")));
	const wanted = [
		...ZOTERO_READ,
		...ZOTERO_CHECKS,
		...zotero,
		...(mode === "researcher" ? registered.filter((n) => n.startsWith("scholar_") || n.startsWith("verify_")) : []),
		...FILE_TOOLS,
	];
	return [...new Set(wanted)].filter((n) => has.has(n));
}

/**
 * The active tools for `next`, Sub-Sub's set for the mode. Inside plain pi, Sub-Sub replaces only its own
 * server tools and keeps the rest (pi's tools, other extensions' tools); with the `subsub` command, the set is
 * Sub-Sub's alone.
 */
export function activeTools(current: string[], next: string[], standalone: boolean): string[] {
	if (standalone) return next;
	const kept = current.filter((n) => !SERVER_PREFIXES.some((p) => n.startsWith(p)));
	return [...new Set([...kept, ...next])];
}

/** Tool names of Sub-Sub's servers without the prefix, for when the servers are not running. */
const KNOWN_SERVER_TOOLS = [...ZOTERO_READ, ...ZOTERO_CHECKS, ...PREVIEW_WRITES, ...CONFIRM_WRITES];

/**
 * The Sub-Sub name of a tool that pi's MCP support reaches on Sub-Sub's own servers (for example
 * zotero-local-mcp in the user's mcp.json), or undefined. pi names these tools mcp__<server>__<tool>.
 * Such a call skips the mode check and the preview, so the gate blocks it. A tool matches when its
 * name and description are those of a Sub-Sub tool, or when the server name has "zotero" or
 * "scholar" and the tool name is one of Sub-Sub's.
 */
export function duplicateServerTool(name: string, description: string | undefined, own: Array<{ name: string; fullName: string; description: string }>): string | undefined {
	if (!name.startsWith("mcp__")) return undefined;
	const rest = name.slice("mcp__".length);
	const cut = rest.indexOf("__");
	if (cut < 0) return undefined;
	const server = rest.slice(0, cut).toLowerCase();
	const tool = rest.slice(cut + 2);
	const norm = (s: string) => s.replace(/-/g, "_");
	const same = own.find((t) => norm(t.name) === tool && description !== undefined && t.description !== "" && description.trim() === t.description.trim());
	if (same) return same.fullName;
	if (!/zotero|scholar/.test(server)) return undefined;
	const byName = own.find((t) => norm(t.name) === tool);
	if (byName) return byName.fullName;
	return KNOWN_SERVER_TOOLS.find((n) => n.slice(n.indexOf("_") + 1) === tool);
}

/** Why a Sub-Sub tool is not available now, or undefined when it is. */
export function unavailableReason(name: string, mode: Mode, registered: string[], opts: ToolOptions = {}): string | undefined {
	if (toolsFor(mode, registered, opts).includes(name)) return undefined;
	if (mode === "librarian" && toolsFor("researcher", registered, opts).includes(name)) {
		return `${name} is part of the Researcher, which also does everything the Librarian does. The user can switch with /researcher.`;
	}
	return `${name} is not available.`;
}

/**
 * Server tools that change nothing in the library and need no question: reads, checks, outside
 * searches, and the import queue (a note in the Sub-Sub folder). Any zotero_ or scholar_ tool that is
 * on no list here is gated (see gateKind), so a new write tool of the server is never applied unasked.
 */
export const NO_GATE = new Set([
	...ZOTERO_READ,
	...ZOTERO_CHECKS,
	...["list_libraries", "get_figure", "bakeoff_items", "bakeoff_submit"].map((n) => `zotero_${n}`),
	...[
		"search_pubmed",
		"search_openalex",
		"search_europepmc",
		"search_multi",
		"read_oa_fulltext",
		"get_work",
		"find_contact",
		"citation_graph",
		"library_lookup",
		"check_manuscript",
		"queue_imports",
	].map((n) => `scholar_${n}`),
]);

export type GateKind = "preview" | "confirm" | "path" | null;

/** A dry run only when dry_run is absent (server default true) or clearly true. */
export function isDryRun(value: unknown, absentMeansDryRun = true): boolean {
	return (value === undefined && absentMeansDryRun) || value === true || value === "true";
}

/** The dry_run property of a tool's input schema, if it has one. */
function dryRunProperty(schema: Record<string, unknown> | undefined): { default?: unknown } | undefined {
	const props = schema?.properties as Record<string, { default?: unknown }> | undefined;
	return props && typeof props === "object" && props.dry_run && typeof props.dry_run === "object" ? props.dry_run : undefined;
}

/**
 * How the gate treats a call. `schema` is the tool's input schema from the server: a zotero_ or
 * scholar_ tool on no list is previewed when it has dry_run (absent counts as a dry run only when the
 * schema's default is true), and otherwise needs a yes.
 */
export function gateKind(toolName: string, input: Record<string, unknown>, schema?: Record<string, unknown>): GateKind {
	if (PREVIEW_WRITES.has(toolName)) return isDryRun(input.dry_run) ? null : "preview";
	if (CONFIRM_WRITES.has(toolName)) return "confirm";
	if (toolName === "write" || toolName === "edit") return "path";
	if ((toolName.startsWith("zotero_") || toolName.startsWith("scholar_")) && !NO_GATE.has(toolName)) {
		const dry = dryRunProperty(schema);
		if (dry) return isDryRun(input.dry_run, dry.default === true) ? null : "preview";
		return "confirm";
	}
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
