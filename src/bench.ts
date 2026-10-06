/**
 * subsub-bench: the same tasks for several models, against the real library,
 * with no changes applied. See docs/Subsub.md ("Model test").
 *
 *   subsub-bench prepare [--seed 7]        pick the tasks (read-only)
 *   subsub-bench run [--models a,b] [--librarian a,b] [--researcher c,d] [--parallel 3] [--only task]
 *   (--models sets the models for both task groups.)
 *   subsub-bench score                     objective checks -> results.md
 *
 * Results go to ~/Projects/subsub/bench-results/<date>/ (or --dir). Each model gets
 * an anonymous code; key.json maps codes to models. Library writes are recorded
 * with the server preview and blocked (SUBSUB_BENCH_OUT, see subsub.ts); file
 * writes are allowed only in the run folder.
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expand, loadConfig, type Mode, starbuckCommand, starbuckEnabled } from "./config.ts";
import { findUv } from "./subsub.ts";

export const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_MODELS: Record<Mode, string[]> = {
	librarian: ["mimo-v2.6-flash", "glm-5.3-flash", "qwen3.8-flash", "gpt-5.6-luna", "hy3", "mimo-v2.6-pro"],
	researcher: ["mimo-v2.6-pro", "qwen3.8-flash", "kimi-k3", "glm-5.3", "minimax-m3", "gpt-5.6-luna"],
};

export const TASKS: Record<Mode, string[]> = {
	librarian: ["tagging", "facet_fix", "import"],
	researcher: ["lit_note", "synthesis", "search", "lit"],
};

export interface Tasks {
	tagging: { keys: string[] };
	facet_fix: Record<string, string[]>;
	import: { in_library: { id: string; key: string; citekey: string } | null; new: Array<{ id: string; kind: string; title: string }> };
	lit_note: { key: string; citekey: string; title: string } | null;
	synthesis: { topic: string; description: string; keys: string[]; citekeys: string[] } | null;
	search: { topic: string | null; description: string; year_from: number };
}

export interface IndexRow {
	key: string;
	citekey: string | null;
	doi: string | null;
	pmid: string | null;
	title: string;
	year: string;
}

// ---------------------------------------------------------------- prompts

function about(t: Tasks): string {
	const s = t.synthesis;
	if (!s) return "";
	const d = s.description.replace(/\.$/, "").trim();
	return d ? `${d} (${s.topic})` : s.topic;
}

export function promptFor(task: string, t: Tasks, code: string, out: string): string | undefined {
	switch (task) {
		case "tagging":
			return (
				`Model test. Do not change the library. Call zotero_bakeoff_items to get ${t.tagging.keys.length} items and the tag vocabulary. ` +
				"For every item, propose topic/, method/ and type/ tags following the tag rules (1 to 4 topic tags, most specific first; " +
				"method/ and type/ only when they apply; vocabulary tags only; no status/ tags). " +
				`Then call zotero_bakeoff_submit once with label "${code}" and all proposals. Do not call other tools.`
			);
		case "facet_fix":
			return "Find the items in my library that have no topic/ tag or no status/ tag, and tag them. Use status/to-read for status.";
		case "import": {
			const ids = [t.import.in_library?.id, ...t.import.new.map((n) => n.id)].filter(Boolean) as string[];
			if (ids.length < 2) return undefined;
			const order = [ids[1], ids[0], ...ids.slice(2)];
			return `Import these into Zotero: ${order.join(", ")}.`;
		}
		case "lit_note":
			return t.lit_note
				? `Make a literature note for ${t.lit_note.citekey}, following the literature-note format in the shared rules. Read the full text. ` +
						`This is a model test: save the note as ${join(out, `${t.lit_note.citekey}.md`)} instead of Resources/Zotero/, and do not attach anything to Zotero.`
				: undefined;
		case "synthesis":
			return t.synthesis
				? `Write a synthesis of what my library says about ${about(t)}, following the synthesis format in the shared rules. ` +
						`This is a model test: save it as ${join(out, "Synthesis.md")}.`
				: undefined;
		case "lit":
			// The /lit template, with the model-test paths in its arguments.
			return t.synthesis
				? `/lit ${about(t)}. This is a model test: write the review as ${join(out, "Lit.md")}, the plan and the screening log ` +
						`in ${join(out, ".plans")}, nothing in Research/, and do not queue imports.`
				: undefined;
		case "search":
			return t.synthesis
				? `Find up to 5 important papers published from ${t.search.year_from} onwards on ${about(t)} that are not yet in my library. ` +
						`This is a model test: do not queue them. Write the list to ${join(out, "Search.md")} with, for each paper, ` +
						"the DOI or PMID, the reference, and one sentence on why it matters for my work."
				: undefined;
	}
	return undefined;
}

// ---------------------------------------------------------------- RPC run

export interface RunSummary {
	code: string;
	role: Mode;
	task: string;
	seconds: number;
	settled: boolean;
	timedOut: boolean;
	stats?: Record<string, any>;
	finalText: string;
	error?: string;
}

/** Events worth keeping (streaming deltas are dropped). */
const KEEP = new Set(["tool_execution_start", "tool_execution_end", "message_end", "entry_appended", "agent_end", "agent_settled", "auto_retry_start", "extension_error"]);

export function runOne(opts: {
	role: Mode;
	task: string;
	code: string;
	model: string;
	prompt: string;
	out: string;
	cwd: string;
	configFile: string;
	timeoutSec: number;
	cli?: string;
	extraEnv?: NodeJS.ProcessEnv;
	provider?: string;
}): Promise<RunSummary> {
	mkdirSync(opts.out, { recursive: true });
	const args = ["--mode", "rpc", "--no-session", "--provider", opts.provider ?? "opencode-go", "--model", opts.model];
	if (opts.role === "librarian") args.push("--librarian");
	const env = { ...process.env, ...opts.extraEnv, SUBSUB_BENCH_OUT: opts.out, SUBSUB_CONFIG: opts.configFile };
	const proc = spawn(process.execPath, [opts.cli ?? join(PACKAGE_DIR, "bin", "subsub.js"), ...args], { cwd: opts.cwd, env });
	const events: any[] = [];
	let stderr = "";
	let buf = "";
	const t0 = Date.now();
	return new Promise((resolveRun) => {
		let settled = false;
		let done = false;
		let statsTimer: NodeJS.Timeout | undefined;
		const send = (o: unknown) => proc.stdin.write(`${JSON.stringify(o)}\n`);
		const finish = (extra: Partial<RunSummary>) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			if (statsTimer) clearTimeout(statsTimer);
			proc.kill();
			const texts = events
				.filter((e) => e.type === "message_end" && e.message?.role === "assistant")
				.map((e) => (e.message.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(""))
				.filter((x: string) => x.trim());
			writeFileSync(join(opts.out, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
			const summary: RunSummary = {
				code: opts.code,
				role: opts.role,
				task: opts.task,
				seconds: Math.round((Date.now() - t0) / 1000),
				settled,
				timedOut: false,
				finalText: texts.at(-1) ?? "",
				...extra,
			};
			if (stderr.trim()) writeFileSync(join(opts.out, "stderr.txt"), stderr.slice(-20000));
			writeFileSync(join(opts.out, "summary.json"), JSON.stringify(summary, null, 1));
			resolveRun(summary);
		};
		const timer = setTimeout(() => {
			send({ type: "abort" });
			setTimeout(() => finish({ timedOut: true, error: "timeout" }), 3000);
		}, opts.timeoutSec * 1000);
		proc.stderr.on("data", (d) => (stderr += d.toString()));
		proc.on("exit", (code) => finish({ error: `pi exited (${code}) before the task ended` }));
		proc.stdout.on("data", (d) => {
			buf += d.toString();
			let i: number;
			while ((i = buf.indexOf("\n")) >= 0) {
				const line = buf.slice(0, i).replace(/\r$/, "");
				buf = buf.slice(i + 1);
				if (!line.trim()) continue;
				let ev: any;
				try {
					ev = JSON.parse(line);
				} catch {
					continue;
				}
				if (ev.type === "extension_ui_request" && ["confirm", "select", "input", "editor"].includes(ev.method)) {
					send({ type: "extension_ui_response", id: ev.id, ...(ev.method === "confirm" ? { confirmed: false } : { cancelled: true }) });
					events.push({ type: "ui_declined", method: ev.method, title: ev.title, message: ev.message });
					continue;
				}
				if (ev.type === "response" && ev.command === "get_session_stats") {
					finish({ stats: ev.data });
					continue;
				}
				if (ev.type === "response" && ev.command === "prompt" && ev.success === false) {
					finish({ error: ev.error ?? "prompt refused" });
					continue;
				}
				if (KEEP.has(ev.type)) events.push(ev);
				if (ev.type === "agent_settled" && !settled) {
					settled = true;
					send({ id: "stats", type: "get_session_stats" });
					statsTimer = setTimeout(() => finish({}), 10000);
				}
			}
		});
		send({ id: "p1", type: "prompt", message: opts.prompt });
	});
}

// ---------------------------------------------------------------- scoring helpers

export function readEvents(dir: string): any[] {
	const f = join(dir, "events.jsonl");
	if (!existsSync(f)) return [];
	return readFileSync(f, "utf8")
		.split("\n")
		.filter((l) => l.trim())
		.map((l) => JSON.parse(l));
}

function resultText(ev: any): string {
	return (ev.result?.content ?? []).map((c: any) => c.text ?? "").join("\n");
}

export function toolCalls(events: any[]): Array<{ name: string; args: any; result: string; isError: boolean }> {
	const starts = new Map<string, any>();
	const out: Array<{ name: string; args: any; result: string; isError: boolean }> = [];
	for (const e of events) {
		if (e.type === "tool_execution_start") starts.set(e.toolCallId, e);
		if (e.type === "tool_execution_end") {
			const s = starts.get(e.toolCallId);
			out.push({ name: e.toolName, args: s?.args ?? {}, result: resultText(e), isError: !!e.isError });
		}
	}
	return out;
}

export function benchEntries(events: any[]): any[] {
	return events.filter((e) => e.type === "entry_appended" && e.entry?.customType === "subsub-bench").map((e) => e.entry.data);
}

export function prf(pred: Set<string>, gold: Set<string>) {
	let tp = 0;
	for (const t of pred) if (gold.has(t)) tp++;
	const fp = pred.size - tp;
	const fn = gold.size - tp;
	return { tp, fp, fn };
}

function f1(tp: number, fp: number, fn: number) {
	const p = tp + fp ? tp / (tp + fp) : 0;
	const r = tp + fn ? tp / (tp + fn) : 0;
	return { precision: +p.toFixed(3), recall: +r.toFixed(3), f1: p + r ? +((2 * p * r) / (p + r)).toFixed(3) : 0 };
}

const SCORED = /^(topic|method|type)\//;

export function scoreTags(proposals: Record<string, string[]>, gold: Record<string, string[]>) {
	let tp = 0,
		fp = 0,
		fn = 0,
		exact = 0,
		missing = 0;
	for (const [key, g] of Object.entries(gold)) {
		const goldSet = new Set(g.filter((t) => SCORED.test(t)));
		const p = proposals[key];
		if (!p) {
			missing++;
			fn += goldSet.size;
			continue;
		}
		const predSet = new Set(p.filter((t) => SCORED.test(t)));
		const s = prf(predSet, goldSet);
		tp += s.tp;
		fp += s.fp;
		fn += s.fn;
		if (s.fp === 0 && s.fn === 0) exact++;
	}
	return { items: Object.keys(gold).length, ...f1(tp, fp, fn), edits: fp + fn, exact, missing };
}

export const DOI_RE = /\b10\.\d{4,9}\/[^\s"'<>\]|,;]+/gi;
export const PMID_RE = /\bPMID[:\s]*([0-9]{5,9})\b/gi;

export function normDoi(d: string): string {
	let x = d.toLowerCase().replace(/[.,;:]+$/, "");
	const count = (c: string) => x.split(c).length - 1;
	while (x.endsWith(")") && count(")") > count("(")) x = x.slice(0, -1).replace(/[.,;:]+$/, "");
	return x;
}

export function citekeysIn(text: string): string[] {
	const out = new Set<string>();
	for (const m of text.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) out.add(m[1].trim());
	for (const m of text.matchAll(/(?:^|[\s\[(;])@([A-Za-z][\w:-]*\d{4}[a-z]?)/g)) out.add(m[1]);
	return [...out];
}

// ---------------------------------------------------------------- score one run

/** Starbuck's verdicts on a file: runs `starbuck check` and reads its JSON report (undefined when it cannot run). */
export type StarbuckScorer = (file: string) => Record<string, any> | undefined;

export function starbuckScorer(cfg = loadConfig(), env: NodeJS.ProcessEnv = process.env): StarbuckScorer | undefined {
	if (!starbuckEnabled(cfg)) return undefined;
	const cmd = starbuckCommand(cfg, env);
	return (file) => {
		const claims = env.STARBUCK_JUDGE_URL && env.STARBUCK_JUDGE_MODEL ? ["--claims"] : [];
		const args = [...cmd.args.slice(0, -1), "starbuck", "check", file, "--to", "", "--quiet", ...claims];
		const r = spawnSync(cmd.command, args, { env, encoding: "utf8", timeout: 20 * 60_000 });
		const report = join(dirname(file), "_starbuck", `${file.split(/[\\/]/).pop()!.replace(/\.[^.]+$/, "")}-references.json`);
		if (!existsSync(report)) return { error: (r.stderr || r.error?.message || "no report").trim().slice(0, 300) };
		const res = JSON.parse(readFileSync(report, "utf8"));
		const run = res.claims_run ?? {};
		return {
			references: res.summary?.references_checked,
			fail: res.summary?.fail,
			check: res.summary?.warn,
			uncited_sentences: res.summary?.uncited_sentences,
			citation_recall: run.citation_recall?.value,
			citation_precision: run.citation_precision?.value,
		};
	};
}

export function scoreRun(task: string, dir: string, t: Tasks, index: IndexRow[], blindRef: Record<string, string[]>,
	starbuck?: StarbuckScorer): Record<string, any> {
	const events = readEvents(dir);
	const calls = toolCalls(events);
	const entries = benchEntries(events);
	const summary = existsSync(join(dir, "summary.json")) ? JSON.parse(readFileSync(join(dir, "summary.json"), "utf8")) : {};
	const base: Record<string, any> = {
		ok: !summary.error,
		error: summary.error,
		seconds: summary.seconds,
		tool_calls: calls.length,
		tool_errors: calls.filter((c) => c.isError && !/Model test:/.test(c.result)).length,
		wrong_mode: entries.filter((e) => e.kind === "wrong_mode").length,
		path_blocked: entries.filter((e) => e.kind === "path_blocked").length,
		tokens_in: summary.stats?.tokens ? summary.stats.tokens.input + summary.stats.tokens.cacheRead : undefined,
		tokens_out: summary.stats?.tokens?.output,
		cost: summary.stats?.cost,
	};
	const citekeys = new Set(index.map((r) => r.citekey).filter(Boolean) as string[]);
	const libDois = new Set(index.map((r) => (r.doi ? normDoi(r.doi) : "")).filter(Boolean));
	const libPmids = new Set(index.map((r) => r.pmid).filter(Boolean) as string[]);
	const readFile = (name: string) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8") : undefined);

	if (task === "tagging") {
		const sub = calls.filter((c) => c.name === "zotero_bakeoff_submit").at(-1);
		const proposals: Record<string, string[]> = {};
		for (const p of sub?.args?.proposals ?? []) if (p?.key) proposals[p.key] = (p.tags ?? []).map((x: string) => String(x).trim());
		let invalid = 0;
		try {
			invalid = (JSON.parse(sub?.result ?? "{}").tags_not_in_vocabulary ?? []).length;
		} catch {
			invalid = 0;
		}
		const peeked = calls.filter((c) => ["zotero_get_item", "zotero_find_items"].includes(c.name)).length;
		const status = Object.values(proposals).flat().filter((x) => x.startsWith("status/")).length;
		return {
			...base,
			submitted: !!sub,
			items_proposed: Object.keys(proposals).length,
			invalid_tags: invalid,
			status_tags: status,
			peeked,
			vs_reference: Object.keys(blindRef).length ? scoreTags(proposals, blindRef) : undefined,
			proposals,
		};
	}
	if (task === "facet_fix") {
		const changes = entries.filter((e) => e.kind === "change" && e.tool === "zotero_tag_items");
		const touched = new Map<string, string[]>();
		for (const c of changes) for (const ch of c.input?.changes ?? []) touched.set(ch.key, [...(touched.get(ch.key) ?? []), ...(ch.add ?? [])]);
		const missTopic = new Set(t.facet_fix.missing_topic ?? []);
		const missStatus = new Set(t.facet_fix.missing_status ?? []);
		const expected = new Set([...missTopic, ...missStatus]);
		let fixed = 0;
		for (const k of expected) {
			const add = touched.get(k) ?? [];
			const okTopic = !missTopic.has(k) || add.some((x) => x.startsWith("topic/"));
			const okStatus = !missStatus.has(k) || add.some((x) => x.startsWith("status/"));
			if (okTopic && okStatus) fixed++;
		}
		const previewErrors = changes.map((c) => JSON.stringify(c.preview?.errors ?? c.preview?.error ?? [])).filter((x) => x !== "[]" && x !== '""');
		return {
			...base,
			expected: expected.size,
			fixed,
			extra_items: [...touched.keys()].filter((k) => !expected.has(k)).length,
			change_calls: changes.length,
			preview_errors: previewErrors.length,
			proposed: Object.fromEntries(touched),
		};
	}
	if (task === "import") {
		const changes = entries.filter((e) => e.kind === "change" && e.tool === "zotero_import_identifiers");
		const want = [t.import.in_library?.id, ...t.import.new.map((n) => n.id)].filter(Boolean).map((x) => normId(x!));
		const sent = new Set(changes.flatMap((c) => (c.input?.identifiers ?? []).map((x: string) => normId(x))));
		const last = changes.at(-1)?.preview ?? {};
		const final = summary.finalText ?? "";
		const dup = t.import.in_library;
		const reported = !!dup && (final.includes(dup.citekey) || final.includes(dup.key) || /already|duplicate|exists/i.test(final));
		return {
			...base,
			ids_expected: want.length,
			ids_sent: want.filter((w) => sent.has(w)).length,
			extra_ids: [...sent].filter((s) => !want.includes(s)).length,
			change_calls: changes.length,
			would_import: Array.isArray(last.would_import) ? last.would_import.length : undefined,
			duplicate_reported: reported,
		};
	}
	if (task === "lit_note" || task === "synthesis") {
		const file = task === "lit_note" ? `${t.lit_note?.citekey}.md` : "Synthesis.md";
		const text = readFile(file);
		const cited = text ? citekeysIn(text) : [];
		const citedKeys = cited.filter((c) => /\d{4}[a-z]?$/.test(c));
		const res: Record<string, any> = {
			...base,
			written: !!text,
			words: text ? text.split(/\s+/).filter(Boolean).length : 0,
			citekeys_cited: citedKeys.length,
			citekeys_unknown: citedKeys.filter((c) => !citekeys.has(c)),
		};
		if (task === "lit_note") {
			res.read_fulltext = calls.some((c) => c.name === "zotero_get_fulltext" && !c.isError);
			res.cites_itself = !!t.lit_note && citedKeys.includes(t.lit_note.citekey);
		} else if (t.synthesis) {
			const topicKeys = new Set(t.synthesis.citekeys.filter(Boolean));
			res.topic_items = topicKeys.size;
			res.topic_items_cited = citedKeys.filter((c) => topicKeys.has(c)).length;
		}
		return res;
	}
	if (task === "lit") {
		const text = readFile("Lit.md") ?? "";
		const seen = calls.map((c) => c.result).join("\n").toLowerCase();
		const dois = [...new Set([...text.matchAll(DOI_RE)].map((m) => normDoi(m[0])))];
		const pmids = [...new Set([...text.matchAll(PMID_RE)].map((m) => m[1]))];
		const rows = text.split("\n").filter((l) => /^\|\s*\[?\d+\]?\s*\|/.test(l));
		const readCol = rows.map((l) => l.split("|").map((c) => c.trim().toLowerCase())).map((c) => c.find((x) => /^(full text|abstract|metadata)$/.test(x)));
		const plans = join(dir, ".plans");
		return {
			...base,
			written: !!text,
			words: text ? text.split(/\s+/).filter(Boolean).length : 0,
			evidence_rows: rows.length,
			evidence_labelled: readCol.filter(Boolean).length,
			dois: dois.length,
			pmids: pmids.length,
			ungrounded: [...dois.filter((d) => !seen.includes(d)), ...pmids.filter((p) => !seen.includes(p))],
			screening_log: existsSync(plans) && readdirSync(plans).some((f) => /screening/i.test(f)),
			multi_searches: calls.filter((c) => c.name === "scholar_search_multi").length,
			fulltext_reads: calls.filter((c) => c.name === "scholar_read_oa_fulltext" || c.name === "zotero_get_fulltext").length,
			starbuck: text && starbuck ? starbuck(join(dir, "Lit.md")) : undefined,
		};
	}
	if (task === "search") {
		const text = readFile("Search.md") ?? "";
		const seen = calls.map((c) => c.result).join("\n").toLowerCase();
		const dois = [...new Set([...text.matchAll(DOI_RE)].map((m) => normDoi(m[0])))];
		const pmids = [...new Set([...text.matchAll(PMID_RE)].map((m) => m[1]))];
		return {
			...base,
			written: !!text,
			dois: dois.length,
			pmids: pmids.length,
			ungrounded: [...dois.filter((d) => !seen.includes(d)), ...pmids.filter((p) => !seen.includes(p))],
			already_in_library: [...dois.filter((d) => libDois.has(d)), ...pmids.filter((p) => libPmids.has(p))],
			queued: entries.filter((e) => e.tool === "scholar_queue_imports").length,
			searches: calls.filter((c) => c.name.startsWith("scholar_search")).length,
		};
	}
	return base;
}

export function normId(x: string): string {
	const s = x.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "");
	const pm = s.match(/^pmid[:\s]*(\d+)$/);
	return pm ? `pmid:${pm[1]}` : s;
}

// ---------------------------------------------------------------- report

function cell(v: unknown): string {
	if (v === undefined || v === null) return "n/a";
	if (Array.isArray(v)) return String(v.length);
	if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(3);
	return String(v);
}

export function renderResults(rows: Array<{ model: string; role: Mode; task: string; s: Record<string, any> }>): string {
	const out: string[] = [`Model test results (${new Date().toISOString().slice(0, 10)}). Objective checks only; the quality judgement is separate.`, ""];
	const cols: Record<string, string[]> = {
		tagging: ["submitted", "items_proposed", "vs_reference.f1", "vs_reference.exact", "invalid_tags", "status_tags", "peeked"],
		facet_fix: ["expected", "fixed", "extra_items", "change_calls", "preview_errors"],
		import: ["ids_expected", "ids_sent", "extra_ids", "would_import", "duplicate_reported"],
		lit_note: ["written", "words", "read_fulltext", "cites_itself", "citekeys_unknown"],
		synthesis: ["written", "words", "topic_items", "topic_items_cited", "citekeys_unknown"],
		search: ["written", "dois", "pmids", "ungrounded", "already_in_library", "queued", "searches"],
		lit: ["written", "words", "evidence_rows", "evidence_labelled", "dois", "pmids", "ungrounded", "screening_log",
			"multi_searches", "fulltext_reads", "starbuck.fail", "starbuck.check", "starbuck.uncited_sentences",
			"starbuck.citation_recall", "starbuck.citation_precision"],
	};
	const common = ["seconds", "tool_calls", "tool_errors", "wrong_mode", "tokens_in", "tokens_out", "cost", "error"];
	for (const task of Object.keys(cols)) {
		const rs = rows.filter((r) => r.task === task);
		if (!rs.length) continue;
		const head = ["model", ...cols[task], ...common];
		out.push(`## ${task}`, "", `| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`);
		for (const r of rs) {
			const get = (k: string) => k.split(".").reduce((o: any, p) => (o == null ? undefined : o[p]), r.s);
			out.push(`| ${[r.model, ...cols[task].map((c) => cell(get(c))), ...common.map((c) => cell(get(c)))].join(" | ")} |`);
		}
		out.push("");
	}
	return out.join("\n");
}

// ---------------------------------------------------------------- CLI

function arg(argv: string[], name: string): string | undefined {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : undefined;
}

export function benchDir(argv: string[]): string {
	const d = arg(argv, "dir");
	if (d) return expand(d);
	const root = join(PACKAGE_DIR, "bench-results");
	if (argv[0] !== "prepare" && existsSync(root)) {
		const dates = readdirSync(root).filter((x) => /^\d{4}-\d{2}-\d{2}/.test(x)).sort();
		if (dates.length) return join(root, dates.at(-1)!);
	}
	return join(root, new Date().toISOString().slice(0, 10));
}

function codesFor(models: string[], dir: string): Record<string, string> {
	const keyFile = join(dir, "key.json");
	const key: Record<string, string> = existsSync(keyFile) ? JSON.parse(readFileSync(keyFile, "utf8")) : {};
	const byModel = new Map(Object.entries(key).map(([c, m]) => [m, c]));
	for (const m of models) {
		if (byModel.has(m)) continue;
		let c: string;
		do c = `M${Math.floor(100 + Math.random() * 900)}`;
		while (key[c]);
		key[c] = m;
		byModel.set(m, c);
	}
	writeFileSync(keyFile, JSON.stringify(key, null, 1));
	return Object.fromEntries(byModel);
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>): Promise<void> {
	const queue = [...items];
	await Promise.all(Array.from({ length: Math.max(1, n) }, async () => {
		while (queue.length) await fn(queue.shift()!);
	}));
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const cmd = argv[0];
	const cfg = loadConfig();
	const dir = benchDir(argv);
	if (cmd === "prepare") {
		mkdirSync(dir, { recursive: true });
		const env = { ...process.env, ...(cfg.envFile ? { ZOTERO_MCP_ENV: cfg.envFile } : {}) };
		const r = spawnSync(findUv(cfg), ["run", "--directory", cfg.serverDir, "zotero-bench", "prepare", "--out", dir, "--seed", arg(argv, "seed") ?? "7"], { env, stdio: "inherit" });
		process.exitCode = r.status ?? 1;
		return;
	}
	if (cmd === "run") {
		const tasksFile = join(dir, "tasks.json");
		if (!existsSync(tasksFile)) throw new Error(`No tasks in ${dir}. Run: subsub-bench prepare`);
		if (!cfg.vault) throw new Error("No vault configured (ZOTERO_VAULT).");
		const t: Tasks = JSON.parse(readFileSync(tasksFile, "utf8"));
		const both = arg(argv, "models")?.split(",").filter(Boolean);
		const lists: Record<Mode, string[]> = {
			librarian: arg(argv, "librarian")?.split(",").filter(Boolean) ?? both ?? DEFAULT_MODELS.librarian,
			researcher: arg(argv, "researcher")?.split(",").filter(Boolean) ?? both ?? DEFAULT_MODELS.researcher,
		};
		const only = arg(argv, "only")?.split(",");
		const codes = codesFor([...new Set([...lists.librarian, ...lists.researcher])], dir);
		const userCfgFile = expand(process.env.SUBSUB_CONFIG ?? "~/.config/subsub/config.json");
		const userCfg = existsSync(userCfgFile) ? JSON.parse(readFileSync(userCfgFile, "utf8")) : {};
		const cfgDir = join(dir, ".configs");
		mkdirSync(cfgDir, { recursive: true });
		const jobs: Array<{ role: Mode; task: string; model: string; code: string }> = [];
		for (const role of ["librarian", "researcher"] as Mode[])
			for (const model of lists[role])
				for (const task of TASKS[role]) if (!only || only.includes(task)) jobs.push({ role, task, model, code: codes[model] });
		const timeoutSec = Number(arg(argv, "timeout") ?? 900);
		let n = 0;
		await pool(jobs, Number(arg(argv, "parallel") ?? 3), async (j) => {
			const out = join(dir, "runs", j.code, j.task);
			if (existsSync(join(out, "summary.json")) && !argv.includes("--again")) return;
			const prompt = promptFor(j.task, t, j.code, out);
			if (!prompt) return;
			const cf = join(cfgDir, `${j.code}.json`);
			writeFileSync(cf, JSON.stringify({ ...userCfg, profile: "editor", models: { librarian: `opencode-go/${j.model}`, researcher: `opencode-go/${j.model}` }, model: undefined, libraryChanges: undefined }));
			const s = await runOne({ ...j, prompt, out, cwd: cfg.vault!, configFile: cf, timeoutSec });
			n++;
			console.log(`${n}/${jobs.length}  ${j.code}  ${j.task}  ${s.seconds}s  ${s.error ?? (s.settled ? "done" : "?")}`);
		});
		console.log(`Finished. Results in ${dir}. Next: subsub-bench score`);
		return;
	}
	if (cmd === "score") {
		const t: Tasks = JSON.parse(readFileSync(join(dir, "tasks.json"), "utf8"));
		const index: IndexRow[] = JSON.parse(readFileSync(join(dir, "library-index.json"), "utf8"));
		const key: Record<string, string> = JSON.parse(readFileSync(join(dir, "key.json"), "utf8"));
		const blind = existsSync(join(dir, "reference.json")) ? JSON.parse(readFileSync(join(dir, "reference.json"), "utf8")) : {};
		const rows: Array<{ model: string; role: Mode; task: string; s: Record<string, any> }> = [];
		const scorer = starbuckScorer(cfg);
		for (const code of Object.keys(key).sort()) {
			for (const role of ["librarian", "researcher"] as Mode[])
				for (const task of TASKS[role]) {
					const d = join(dir, "runs", code, task);
					if (!existsSync(join(d, "summary.json"))) continue;
					rows.push({ model: key[code], role, task, s: scoreRun(task, d, t, index, blind, scorer) });
				}
		}
		writeFileSync(join(dir, "results.json"), JSON.stringify(rows, null, 1));
		writeFileSync(join(dir, "results.md"), renderResults(rows));
		console.log(`Wrote ${join(dir, "results.md")}`);
		return;
	}
	console.log("Usage: subsub-bench prepare | run [--models a,b] [--librarian a,b] [--researcher c,d] [--only task] [--parallel 3] | score  [--dir DIR]");
}

