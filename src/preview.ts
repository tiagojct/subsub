/**
 * Turn a dry-run result from the Zotero servers into a short text that the user
 * reads in the approval dialog. Plain ASCII, at most about 20 lines.
 */

const MAX_LINES = 14;

export type Lang = "en" | "pt";

/** The words of the preview in English and European Portuguese; tags, titles and values stay as they are. */
const WORDS = {
	en: {
		more: (n: number) => `... and ${n} more`,
		moreChars: (n: number) => `[${n} more characters not shown]`,
		empty: "(empty)",
		change: "(change)",
		undo: "Undo",
		already: "ALREADY APPLIED",
		drift: (n: number) => `${n} item(s) changed after the note was written; the note overwrites them:`,
		now: "now",
		none: "(none)",
		wouldChange: (n: number) => `${n} item(s) would change.`,
		inShort: (listed: number, total: number) => (listed < total ? `In short (in the ${listed} items listed):` : "In short:"),
		items: "Items:",
		itemsN: (n: number) => `${n} item(s)`,
		changed: "changed",
		wouldImport: (n: number) => `${n} item(s) would be imported:`,
		noAbstract: "(no abstract)",
		wouldAttach: (n: number) => `${n} PDF(s) would be attached:`,
		newCollection: "New collection",
		inside: "inside",
		noteOn: "Note on",
		link: "Link",
		skipped: "Skipped",
		errors: "Errors",
	},
	pt: {
		more: (n: number) => `... e mais ${n}`,
		moreChars: (n: number) => `[mais ${n} caracteres não mostrados]`,
		empty: "(vazio)",
		change: "(alteração)",
		undo: "Anular",
		already: "JÁ APLICADO",
		drift: (n: number) => `${n} item(ns) mudaram depois de a nota ser escrita; a nota substitui-os:`,
		now: "agora",
		none: "(nenhuma)",
		wouldChange: (n: number) => `${n} item(ns) vão mudar.`,
		inShort: (listed: number, total: number) => (listed < total ? `Em resumo (nos ${listed} itens listados):` : "Em resumo:"),
		items: "Itens:",
		itemsN: (n: number) => `${n} item(ns)`,
		changed: "alterado",
		wouldImport: (n: number) => `${n} item(ns) vão ser importados:`,
		noAbstract: "(sem resumo)",
		wouldAttach: (n: number) => `${n} PDF(s) vão ser anexados:`,
		newCollection: "Nova coleção",
		inside: "dentro de",
		noteOn: "Nota sobre",
		link: "Ligação",
		skipped: "Ignorados",
		errors: "Erros",
	},
};

type Obj = Record<string, unknown>;

function s(v: unknown, n = 90): string {
	const t = typeof v === "string" ? v : JSON.stringify(v);
	return t.length > n ? `${t.slice(0, n - 3)}...` : t;
}

/** What will be written: shown whole up to a large limit, and the rest is counted, never silently cut. */
function whole(v: unknown, w: (typeof WORDS)[Lang], n = 3000): string {
	const t = typeof v === "string" ? v : JSON.stringify(v);
	return t.length > n ? `${t.slice(0, n)} ${w.moreChars(t.length - n)}` : t;
}

function list(rows: string[], w: (typeof WORDS)[Lang], total?: number): string[] {
	const out = rows.slice(0, MAX_LINES);
	const rest = (total ?? rows.length) - out.length;
	if (rest > 0) out.push(w.more(rest));
	return out;
}

function describeChange(c: Obj, w: (typeof WORDS)[Lang]): string {
	const parts: string[] = [];
	if (Array.isArray(c.added) && c.added.length) parts.push(`+ ${c.added.join(", ")}`);
	if (Array.isArray(c.removed) && c.removed.length) parts.push(`- ${c.removed.join(", ")}`);
	for (const [k, v] of Object.entries(c)) {
		if (["key", "item", "added", "removed", "tags_after"].includes(k)) continue;
		if (v && typeof v === "object" && "after" in (v as Obj)) {
			const b = (v as Obj).before;
			parts.push(`${k}: ${s(b || w.empty, 40)} -> ${whole((v as Obj).after, w)}`);
		}
	}
	return `${s(c.item ?? c.key, 60)}: ${parts.join("; ") || w.change}`;
}

/** For a large batch: each tag and field with the number of items it changes, so the whole is readable at once. */
function tally(changes: Obj[], total: number, w: (typeof WORDS)[Lang]): string[] {
	const count = new Map<string, number>();
	const add = (k: string) => count.set(k, (count.get(k) ?? 0) + 1);
	for (const c of changes) {
		for (const tag of (c.added as string[] | undefined) ?? []) add(`+ ${tag}`);
		for (const tag of (c.removed as string[] | undefined) ?? []) add(`- ${tag}`);
		for (const [k, v] of Object.entries(c)) if (v && typeof v === "object" && "after" in (v as Obj)) add(`${k} ${w.changed}`);
	}
	if (!count.size) return [];
	const rank = (k: string) => (k.startsWith("+") ? 0 : k.startsWith("-") ? 1 : 2);
	const rows = [...count].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => `  ${k}: ${w.itemsN(n)}`);
	return [w.inShort(changes.length, total), ...list(rows, w), w.items];
}

export function formatPreview(tool: string, preview: unknown, lang: Lang = "en"): string {
	const w = WORDS[lang];
	if (!preview || typeof preview !== "object") return s(preview, 1500);
	const p = preview as Obj;
	const lines: string[] = [];
	if (p.undoing && typeof p.undoing === "object") {
		const u = p.undoing as Obj;
		lines.push(`${w.undo} ${u.op}: ${s(u.summary, 80)}`);
	}
	if (Array.isArray(p.already_applied) && p.already_applied.length) {
		lines.push(`${w.already}: ${p.already_applied.join(", ")}`);
	}
	const drift = p.changed_since_note as Obj | undefined;
	if (drift && typeof drift === "object" && typeof drift.count === "number") {
		lines.push(w.drift(drift.count));
		const items = Object.entries((drift.items as Obj) ?? {}).map(
			([k, v]) => `  ${k} ${w.now}: ${((v as Obj).now as string[] | undefined)?.join(", ") || w.none}`,
		);
		lines.push(...items.slice(0, 4));
	}
	if (typeof p.would_change === "number") {
		lines.push(w.wouldChange(p.would_change));
		const changes = (p.changes as Obj[]) ?? [];
		if (p.would_change > 10) lines.push(...tally(changes, p.would_change as number, w));
		lines.push(...list(changes.map((c) => describeChange(c, w)), w, p.would_change as number));
	}
	if (Array.isArray(p.would_import)) {
		lines.push(w.wouldImport(p.would_import.length));
		lines.push(
			...list(
				(p.would_import as Obj[]).map(
					(r) => `${r.citekey}  ${s(r.item, 70)}${r.has_abstract ? "" : `  ${w.noAbstract}`}`,
				),
				w,
			),
		);
	}
	if (Array.isArray(p.would_attach)) {
		lines.push(w.wouldAttach(p.would_attach.length));
		lines.push(
			...list(
				(p.would_attach as Obj[]).map(
					(r) => `${s(r.item, 60)}  [${r.host_type ?? "?"}, ${r.version ?? "?"}${r.license ? `, ${r.license}` : ""}]`,
				),
				w,
			),
		);
	}
	if (p.would_create && typeof p.would_create === "object") {
		const nc = p.would_create as Obj;
		lines.push(`${w.newCollection}: ${nc.name}${nc.parent ? ` (${w.inside} ${nc.parent})` : ""}`);
	}
	if (tool.endsWith("attach_note") || tool.endsWith("create_note")) {
		if (p.item || p.parent) lines.push(`${w.noteOn}: ${s(p.item ?? p.parent, 90)}`);
		if (p.summary || p.note_preview) lines.push(whole(p.summary ?? p.note_preview, w));
		if (p.link) lines.push(`${w.link}: ${p.link}`);
	}
	const skipped = p.skipped as Obj | undefined;
	if (skipped && typeof skipped === "object" && Object.keys(skipped).length) {
		lines.push(`${w.skipped}: ${Object.keys(skipped).length}`);
		lines.push(...list(Object.entries(skipped).map(([k, v]) => `  ${k}: ${s(v, 70)}`), w).slice(0, 5));
	}
	const errors = p.errors as Obj | undefined;
	if (errors && typeof errors === "object" && Object.keys(errors).length) {
		lines.push(`${w.errors}: ${Object.keys(errors).length}`);
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
