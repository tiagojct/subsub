/**
 * Turn a dry-run result from the Zotero servers into a short text that the user
 * reads in the approval dialog. Plain ASCII, at most about 20 lines.
 */

const MAX_LINES = 14;

type Obj = Record<string, unknown>;

function s(v: unknown, n = 90): string {
	const t = typeof v === "string" ? v : JSON.stringify(v);
	return t.length > n ? `${t.slice(0, n - 3)}...` : t;
}

/** What will be written: shown whole up to a large limit, and the rest is counted, never silently cut. */
function whole(v: unknown, n = 3000): string {
	const t = typeof v === "string" ? v : JSON.stringify(v);
	return t.length > n ? `${t.slice(0, n)} [${t.length - n} more characters not shown]` : t;
}

function list(rows: string[], total?: number): string[] {
	const out = rows.slice(0, MAX_LINES);
	const rest = (total ?? rows.length) - out.length;
	if (rest > 0) out.push(`... and ${rest} more`);
	return out;
}

function describeChange(c: Obj): string {
	const parts: string[] = [];
	if (Array.isArray(c.added) && c.added.length) parts.push(`+ ${c.added.join(", ")}`);
	if (Array.isArray(c.removed) && c.removed.length) parts.push(`- ${c.removed.join(", ")}`);
	for (const [k, v] of Object.entries(c)) {
		if (["key", "item", "added", "removed", "tags_after"].includes(k)) continue;
		if (v && typeof v === "object" && "after" in (v as Obj)) {
			const b = (v as Obj).before;
			parts.push(`${k}: ${s(b || "(empty)", 40)} -> ${whole((v as Obj).after)}`);
		}
	}
	return `${s(c.item ?? c.key, 60)}: ${parts.join("; ") || "(change)"}`;
}

export function formatPreview(tool: string, preview: unknown): string {
	if (!preview || typeof preview !== "object") return s(preview, 1500);
	const p = preview as Obj;
	const lines: string[] = [];
	if (p.undoing && typeof p.undoing === "object") {
		const u = p.undoing as Obj;
		lines.push(`Undo ${u.op}: ${s(u.summary, 80)}`);
	}
	if (Array.isArray(p.already_applied) && p.already_applied.length) {
		lines.push(`ALREADY APPLIED: ${p.already_applied.join(", ")}`);
	}
	const drift = p.changed_since_note as Obj | undefined;
	if (drift && typeof drift === "object" && typeof drift.count === "number") {
		lines.push(`${drift.count} item(s) changed after the note was written; the note overwrites them:`);
		const items = Object.entries((drift.items as Obj) ?? {}).map(
			([k, v]) => `  ${k} now: ${((v as Obj).now as string[] | undefined)?.join(", ") || "(none)"}`,
		);
		lines.push(...items.slice(0, 4));
	}
	if (typeof p.would_change === "number") {
		lines.push(`${p.would_change} item(s) would change.`);
		const changes = (p.changes as Obj[]) ?? [];
		lines.push(...list(changes.map(describeChange), p.would_change as number));
	}
	if (Array.isArray(p.would_import)) {
		lines.push(`${p.would_import.length} item(s) would be imported:`);
		lines.push(
			...list(
				(p.would_import as Obj[]).map(
					(r) => `${r.citekey}  ${s(r.item, 70)}${r.has_abstract ? "" : "  (no abstract)"}`,
				),
			),
		);
	}
	if (Array.isArray(p.would_attach)) {
		lines.push(`${p.would_attach.length} PDF(s) would be attached:`);
		lines.push(
			...list(
				(p.would_attach as Obj[]).map(
					(r) => `${s(r.item, 60)}  [${r.host_type ?? "?"}, ${r.version ?? "?"}${r.license ? `, ${r.license}` : ""}]`,
				),
			),
		);
	}
	if (p.would_create && typeof p.would_create === "object") {
		const w = p.would_create as Obj;
		lines.push(`New collection: ${w.name}${w.parent ? ` (inside ${w.parent})` : ""}`);
	}
	if (tool.endsWith("attach_note") || tool.endsWith("create_note")) {
		if (p.item || p.parent) lines.push(`Note on: ${s(p.item ?? p.parent, 90)}`);
		if (p.summary || p.note_preview) lines.push(whole(p.summary ?? p.note_preview));
		if (p.link) lines.push(`Link: ${p.link}`);
	}
	const skipped = p.skipped as Obj | undefined;
	if (skipped && typeof skipped === "object" && Object.keys(skipped).length) {
		lines.push(`Skipped: ${Object.keys(skipped).length}`);
		lines.push(...list(Object.entries(skipped).map(([k, v]) => `  ${k}: ${s(v, 70)}`)).slice(0, 5));
	}
	const errors = p.errors as Obj | undefined;
	if (errors && typeof errors === "object" && Object.keys(errors).length) {
		lines.push(`Errors: ${Object.keys(errors).length}`);
		lines.push(...Object.entries(errors).slice(0, 5).map(([k, v]) => `  ${k}: ${s(v, 70)}`));
	}
	if (!lines.length) lines.push(s(p, 1500));
	return lines.join("\n");
}

export function describeArgs(input: Record<string, unknown>): string {
	return Object.entries(input)
		.map(([k, v]) => `${k}: ${s(v, 120)}`)
		.join("\n");
}
