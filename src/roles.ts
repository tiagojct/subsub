/**
 * Which tools each mode may use, and which calls need the user's approval.
 */

import type { Mode, Profile } from "./config.ts";
import { profileSpec } from "./profiles.ts";

export const FILE_TOOLS = ["read", "edit", "write", "grep", "find", "ls"];

/** Prefixes of the tools that Sub-Sub's servers provide (the gate checks the mode for these). */
export const SERVER_PREFIXES = ["zotero_", "scholar_", "verify_"];

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
	].map((n) => `zotero_${n}`),
	"scholar_attach_note",
]);

/** Writes without a dry run that still need a yes. */
export const CONFIRM_WRITES = new Set(["scholar_export_bibliography"]);

export function toolsFor(mode: Mode, registered: string[], profile: Profile = "editor"): string[] {
	const has = new Set(registered);
	const without = new Set(profileSpec(profile).without);
	const wanted =
		mode === "librarian"
			? [...registered.filter((n) => n.startsWith("zotero_")), ...FILE_TOOLS]
			: [
					...ZOTERO_READ,
					...registered.filter((n) => n.startsWith("scholar_") || n.startsWith("verify_")),
					...FILE_TOOLS,
				];
	return [...new Set(wanted)].filter((n) => has.has(n) && !without.has(n));
}

/** Why a Sub-Sub tool is not available now, or undefined when it is. */
export function unavailableReason(name: string, mode: Mode, registered: string[], profile: Profile): string | undefined {
	if (toolsFor(mode, registered, profile).includes(name)) return undefined;
	if (profileSpec(profile).without.includes(name)) {
		return `${name} is not part of the ${profileSpec(profile).label} profile. The user can change the profile with /profile.`;
	}
	return `${name} is not available in ${mode} mode. The user can switch with /${otherMode(mode)}.`;
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

export function otherMode(mode: Mode): Mode {
	return mode === "librarian" ? "researcher" : "librarian";
}
