/**
 * Which tools each mode may use, and which calls need Tiago's approval.
 */

import type { Mode } from "./config.ts";

export const FILE_TOOLS = ["read", "edit", "write", "grep", "find", "ls"];

export const ZOTERO_READ = [
	"status",
	"library_overview",
	"find_items",
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
	].map((n) => `zotero_${n}`),
	"scholar_attach_note",
]);

/** Writes without a dry run that still need a yes. */
export const CONFIRM_WRITES = new Set(["scholar_export_bibliography"]);

export function toolsFor(mode: Mode, registered: string[]): string[] {
	const has = new Set(registered);
	const wanted =
		mode === "librarian"
			? [...registered.filter((n) => n.startsWith("zotero_")), ...FILE_TOOLS]
			: [...ZOTERO_READ, ...registered.filter((n) => n.startsWith("scholar_")), ...FILE_TOOLS];
	return [...new Set(wanted)].filter((n) => has.has(n));
}

export type GateKind = "preview" | "confirm" | "path" | null;

export function gateKind(toolName: string, input: Record<string, unknown>): GateKind {
	if (PREVIEW_WRITES.has(toolName)) return input.dry_run === false ? "preview" : null;
	if (CONFIRM_WRITES.has(toolName)) return "confirm";
	if (toolName === "write" || toolName === "edit") return "path";
	return null;
}

export function otherMode(mode: Mode): Mode {
	return mode === "librarian" ? "researcher" : "librarian";
}
