// Sub-Sub web view. Talks only to the local Sub-Sub server (same origin).
// Every library change still goes through Sub-Sub's approval dialog; this page shows it and sends the answer.

import { marked } from "/vendor/marked.esm.js";
import { ACTIONS, STRINGS, SUGGESTIONS, TOOLS } from "/i18n.js";

// ---------------------------------------------------------------- state

let lang = "en";
let state = null; // Sub-Sub's own state: mode, profile, model, library, down
let session = null; // pi's session state
let busy = false;
let commands = [];
let providers = [];
const dialogs = []; // waiting dialog requests, oldest first
let shownDialog = null;
let currentMsg = null; // assistant message being streamed
const toolRows = new Map(); // toolCallId -> element
let working = null;

const $ = (id) => document.getElementById(id);
const log = $("log");

function t(key, vars = {}) {
	const s = (STRINGS[lang] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
	return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function el(tag, attrs = {}, ...children) {
	const e = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		if (v === undefined || v === null || v === false) continue;
		if (k === "class") e.className = v;
		else if (k === "text") e.textContent = v;
		else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
		else e.setAttribute(k, v === true ? "" : String(v));
	}
	for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) e.append(c);
	return e;
}

async function api(path, body) {
	const res = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.error || `${res.status}`);
	return data;
}

// ---------------------------------------------------------------- markdown (no raw HTML, safe links)

const SAFE_LINK = /^(https?:|mailto:|zotero:|obsidian:)/i;
function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
marked.use({
	gfm: true,
	breaks: false,
	renderer: {
		html(token) {
			return escapeHtml(token.text ?? token.raw ?? "");
		},
		link(token) {
			const text = this.parser.parseInline(token.tokens);
			if (!SAFE_LINK.test(token.href ?? "")) return text;
			return `<a href="${escapeHtml(token.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
		},
		image(token) {
			return escapeHtml(token.text || token.href || "");
		},
		table(token) {
			let headerHtml = "";
			for (let r = 0; r < token.header.length; r++) {
				headerHtml += this.tablecell(token.header[r]);
			}
			let t = this.tablerow({ text: headerHtml });
			let s = "";
			for (let r = 0; r < token.rows.length; r++) {
				let row = token.rows[r];
				let n = "";
				for (let o = 0; o < row.length; o++) {
					n += this.tablecell(row[o]);
				}
				s += this.tablerow({ text: n });
			}
			if (s) s = `<tbody>${s}</tbody>`;
			return `<div class="md-table-wrap"><table><thead>${t}</thead>${s}</table></div>`;
		},
	},
});
function md(text) {
	try {
		return marked.parse(String(text ?? ""));
	} catch {
		return `<p>${escapeHtml(text)}</p>`;
	}
}

// ---------------------------------------------------------------- theme, layout & language

let currentTheme = localStorage.getItem("subsub-theme") || "auto";
let currentLayout = localStorage.getItem("subsub-layout") || "standard";

function updateLayoutUI() {
	const isWide = currentLayout === "wide";
	document.body.classList.toggle("layout-full", isWide);
	const textEl = $("width-btn-text");
	if (textEl) textEl.textContent = t("layoutWide");
	const btn = $("width-btn");
	if (btn) {
		btn.title = t("toggleWidth");
		btn.setAttribute("aria-pressed", String(isWide));
	}
}

function toggleLayout() {
	currentLayout = currentLayout === "wide" ? "standard" : "wide";
	localStorage.setItem("subsub-layout", currentLayout);
	updateLayoutUI();
}

function themeLabel(theme) {
	if (theme === "light") return t("themeLight");
	if (theme === "dark") return t("themeDark");
	return t("themeAuto");
}

/** Stroke icons for the theme button: fixed markup, no user text. */
const THEME_ICONS = {
	light: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
	dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
	auto: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>',
};

function updateThemeUI() {
	const label = `${t("theme")}: ${themeLabel(currentTheme)}`;
	const btn = $("theme-btn");
	if (btn) {
		btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${THEME_ICONS[currentTheme] ?? THEME_ICONS.auto}</svg>`;
		btn.append(el("span", { class: "visually-hidden", text: label }));
		btn.title = `${label} (${t("themeToggle")})`;
	}
	const sideBtn = $("theme-btn-side");
	if (sideBtn) sideBtn.textContent = themeLabel(currentTheme);
}

function setTheme(theme) {
	currentTheme = theme;
	localStorage.setItem("subsub-theme", theme);
	if (theme === "auto") {
		delete document.documentElement.dataset.theme;
	} else {
		document.documentElement.dataset.theme = theme;
	}
	updateThemeUI();
}

function toggleTheme() {
	if (currentTheme === "auto") setTheme("light");
	else if (currentTheme === "light") setTheme("dark");
	else setTheme("auto");
}

function applyLang() {
	document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";
	for (const e of document.querySelectorAll("[data-i18n]")) e.textContent = t(e.dataset.i18n);
	for (const e of document.querySelectorAll("[data-i18n-placeholder]")) e.placeholder = t(e.dataset.i18nPlaceholder);
	for (const e of document.querySelectorAll("[data-i18n-title]")) e.title = t(e.dataset.i18nTitle);
	updateThemeUI();
	updateLayoutUI();
}

function mode() {
	return state?.mode === "librarian" ? "librarian" : "researcher";
}

function renderHeader() {
	document.body.dataset.mode = mode();
	for (const b of document.querySelectorAll(".modes button")) {
		b.setAttribute("aria-pressed", String(b.dataset.mode === mode()));
		b.title = t(b.dataset.mode === "librarian" ? "librarianHint" : "researcherHint");
	}
	if (state?.profile) $("profile").value = $("profile-side").value = state.profile;
	$("starbuck-toggle").checked = Boolean(state?.starbuck);
	$("starbuck-label").title = t("starbuckHint");
	const m = state?.model ?? session?.model;
	const none = !m || !m.id || m.id === "unknown";
	$("model-btn").textContent = $("model-btn-side").textContent = none ? t("noModel") : m.id;
	for (const b of [$("model-btn"), $("model-btn-side")]) b.classList.toggle("needs", none);
	const lib = $("library");
	const txt = lib.querySelector(".library-text") ?? lib;
	const L = state?.library;
	lib.classList.remove("down", "reachable", "checking");
	if (!L || L.zotero === "checking") {
		txt.textContent = t("zoteroChecking");
		lib.classList.add("checking");
	} else if (L.zotero === "down") {
		txt.textContent = t("zoteroDown");
		lib.classList.add("down");
	} else {
		const num = (n) => (typeof n === "number" ? n.toLocaleString(lang === "pt" ? "pt-PT" : "en-GB") : (n ?? "?"));
		const parts = [t("items", { n: num(L.items) })];
		if (L.toReview) parts.push(t("toReview", { n: num(L.toReview) }));
		txt.textContent = `Zotero: ${parts.join(", ")}`;
		lib.classList.add("reachable");
	}
	if (state?.down?.length) {
		txt.textContent += ` · ${t("serversDown", { x: state.down.join(", ") })}`;
		lib.classList.add("down");
	}
	lib.title = L?.toReview ? `${txt.textContent}\n${t("toReviewHint")}` : txt.textContent;
	// On a phone the long hint does not fit in the box.
	const narrow = window.matchMedia("(max-width: 560px)").matches;
	$("input").placeholder = narrow ? t("placeholderShort") : mode() === "librarian" ? t("placeholderLibrarian") : t("placeholderResearcher");
	if (log.querySelector(".empty")) {
		clearEmpty();
		renderEmpty();
	}
	renderActions();
	renderBanner();
	updateThemeUI();
}

function hasCommand(name) {
	const base = name.split(" ")[0];
	return commands.length === 0 || commands.some((c) => c.name === base);
}

function renderActions() {
	const box = $("actions");
	box.replaceChildren();
	const shown = (a) =>
		hasCommand(a.cmd) &&

		(!a.needs || state?.[a.needs]) &&
		(!a.profiles || a.profiles.includes(state?.profile ?? "scholar"));
	const groups = mode() === "librarian" ? [["library", "groupLibrary"]] : [["research", "groupResearch"], ["library", "groupLibrary"]];
	for (const [group, label] of groups) {
		const list = ACTIONS[group].filter(shown);
		if (!list.length) continue;
		box.append(el("p", { class: "group", text: t(label) }));
		for (const a of list) box.append(actionButton(a));
	}
}

function actionButton(a) {
	return el("button", {
		type: "button",
		text: a[lang] ?? a.en,
		onclick: () => {
			closeSide();
			if (a.send) sendMessage(`/${a.cmd}`);
			else {
				const input = $("input");
				input.value = `/${a.cmd} `;
				input.focus();
				autosize();
			}
		},
	});
}

function renderBanner() {
	const b = $("banner");
	b.replaceChildren();
	const m = state?.model ?? session?.model;
	if (!m && session) {
		b.append(el("span", { text: t("connectModel") }), el("button", { type: "button", class: "primary small", text: t("connect"), onclick: showModels }));
		b.hidden = false;
	} else b.hidden = true;
}

let loadedSessions = [];

function renderSessionsList(filterText = "") {
	const ul = $("sessions");
	ul.replaceChildren();
	const q = filterText.trim().toLowerCase();
	const filtered = q
		? loadedSessions.filter((s) => (s.name || s.first || "").toLowerCase().includes(q))
		: loadedSessions;
	if (!filtered.length) {
		ul.append(el("li", { class: "muted small", text: t("noConversations") }));
		return;
	}
	const fmt = new Intl.DateTimeFormat(lang === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
	for (const s of filtered) {
		const current = session?.sessionFile === s.path;
		ul.append(
			el(
				"li",
				{ class: current ? "current" : "" },
				el(
					"button",
					{
						type: "button",
						"aria-current": current ? "true" : false,
						onclick: async () => {
							closeSide();
							if (busy) return note(t("busy"), "warning");
							try {
								await api("/api/session", { path: s.path });
							} catch (err) {
								note(err.message, "error");
							}
						},
					},
					el("span", { class: "what", text: s.name || s.first || "…" }),
					el(
						"span",
						{ class: "when" },
						el("span", { text: fmt.format(new Date(s.modified)) }),
						s.messages ? el("span", { class: "badge", text: `${s.messages}` }) : null,
					),
				),
			),
		);
	}
}

async function loadSessions() {
	try {
		loadedSessions = (await api("/api/sessions")).sessions ?? [];
	} catch {
		return;
	}
	renderSessionsList($("session-search")?.value ?? "");
}

function exportConversation() {
	const msgs = [];
	const items = log.querySelectorAll(".msg");
	if (!items.length) {
		note(t("noConversations"), "warning");
		return;
	}
	for (const m of items) {
		if (m.classList.contains("user")) {
			const text = m.querySelector(".bubble")?.innerText ?? "";
			if (text && text !== "/subsub-refresh") msgs.push(`### User\n\n${text}\n`);
		} else if (m.classList.contains("assistant")) {
			const text = Array.from(m.querySelectorAll(".md")).map((d) => d.innerText).join("\n\n");
			if (text) msgs.push(`### Sub-Sub\n\n${text}\n`);
		}
	}
	if (!msgs.length) return;
	const date = new Date().toISOString().slice(0, 10);
	const content = `# Sub-Sub Research Session (${date})\n\n**Profile**: ${state?.profile ?? "scholar"}  \n\n---\n\n${msgs.join("\n---\n\n")}`;
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `Sub-Sub-${date}.md`;
	document.body.append(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function closeSide() {
	$("side").classList.remove("open");
	$("menu-btn").setAttribute("aria-expanded", "false");
}

// ---------------------------------------------------------------- conversation

function scrollDown(force = false) {
	const near = log.scrollHeight - log.scrollTop - log.clientHeight < 160;
	if (force || near) log.scrollTop = log.scrollHeight;
}

// A provider error in plain words (keep in step with providerTrouble in src/keys.ts), with the raw text below.
function troubleOf(text) {
	if (/requires Global regions|not available in your region|region.{0,40}not (supported|allowed)/i.test(text)) return "region";
	if (/RESOURCE_EXHAUSTED|\b429\b|quota|rate.?limit|too many requests|usage limit/i.test(text)) return "quota";
	if (/\b(503|529)\b|UNAVAILABLE|high demand|overloaded/i.test(text)) return "busy";
	if (/RECITATION|SAFETY|PROHIBITED_CONTENT/.test(text)) return "blocked";
	if (/\b(401|403)\b|API key not valid|invalid api key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text)) return "key";
	return null;
}

function errorNote(text) {
	const kind = troubleOf(text);
	if (!kind) return el("div", { class: "note error", text });
	return el("div", { class: "note error" }, el("p", { text: t(`trouble_${kind}`) }), el("details", {}, el("summary", { text: t("details") }), el("pre", { text })));
}

function note(text, kind = "info", mono = false) {
	clearEmpty();
	const n = el("div", { class: `note ${kind}${mono ? " mono" : ""}`, text });
	log.append(n);
	scrollDown(true);
	return n;
}

function clearEmpty() {
	log.querySelector(".empty")?.remove();
}

/** First run: what is still missing (Zotero, a model, the servers), each with its fix. Hidden when all is ready. */
function setupList() {
	const L = state?.library;
	const m = state?.model ?? session?.model;
	const steps = [
		{ ok: L?.zotero === "reachable", wait: !L || L.zotero === "checking", text: t("stepZotero") },
		{ ok: Boolean(m && m.id && m.id !== "unknown"), text: t("stepModel"), action: { label: t("connect"), run: openModels } },
		{ ok: !state?.down?.length, text: t("stepServers", { x: (state?.down ?? []).join(", ") }) },
	];
	if (steps.every((x) => x.ok || x.wait)) return null;
	return el(
		"div",
		{ class: "setup" },
		el("h2", { text: t("setupTitle") }),
		el(
			"ol",
			{},
			steps.map((x) =>
				el(
					"li",
					{ class: x.ok ? "ok" : x.wait ? "wait" : "todo" },
					el("span", { class: "mark", text: x.ok ? t("stepDone") : x.wait ? "…" : t("stepTodo") }),
					el("span", { class: "step-text", text: x.ok ? x.text.split(". ")[0] : x.text }),
					!x.ok && x.action ? el("button", { type: "button", class: "primary small-btn", text: x.action.label, onclick: x.action.run }) : null,
				),
			),
		),
	);
}

function renderEmpty() {
	if (log.children.length) return;
	const s = SUGGESTIONS[mode()].map((x) => x[lang] ?? x.en);
	log.append(
		el(
			"div",
			{ class: "empty" },
			el("p", { class: "kicker", text: t(mode()) }),
			el("h1", { text: t("emptyTitle") }),
			el("p", { class: "lede", text: t(mode() === "librarian" ? "emptyLibrarian" : "emptyResearcher") }),
			setupList(),
			el(
				"div",
				{ class: "chips" },
				s.map((x) =>
					el("button", {
						type: "button",
						text: x.endsWith(" ") ? `${x.trim()}…` : x,
						onclick: () => {
							const input = $("input");
							input.value = x;
							input.focus();
							autosize();
						},
					}),
				),
			),
		),
	);
}

function textOf(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

/** Prompt templates arrive as their long, expanded text; show the command that was typed instead. */
const sentTemplates = [];

function userMessage(text) {
	if (String(text).trim() === "/subsub-refresh") return;
	clearEmpty();
	let bubble;
	if (text.length > 700) {
		const first = text.split("\n").find((l) => l.trim()) ?? "";
		bubble = el("details", { class: "bubble" }, el("summary", { text: first.length > 120 ? `${first.slice(0, 117)}...` : first }), el("div", { text }));
	} else bubble = el("div", { class: "bubble", text });
	log.append(el("div", { class: "msg user" }, bubble));
	scrollDown(true);
}

function toolLabel(name) {
	const short = String(name).replace(/^(zotero|scholar)_/, "");
	return (TOOLS[lang] ?? TOOLS.en)[short] ?? (TOOLS.en[short] || name);
}

function summarizeArgs(args) {
	if (!args || typeof args !== "object") return "";
	const parts = [];
	for (const [k, v] of Object.entries(args)) {
		if (k === "dry_run" || v === "" || v === null || v === undefined) continue;
		let s;
		if (Array.isArray(v)) s = v.every((x) => typeof x !== "object") ? v.join(", ") : `${v.length}`;
		else s = typeof v === "string" ? v : JSON.stringify(v);
		if (s.length > 80) s = `${s.slice(0, 77)}...`;
		parts.push(`${k}: ${s}`);
		if (parts.join("  ").length > 160) break;
	}
	return parts.join("  ");
}

function toolRow(id, name, args) {
	let row = toolRows.get(id);
	if (row) return row;
	const summary = el("summary", {}, el("span", { class: "label", text: toolLabel(name) }), el("span", { class: "args", text: summarizeArgs(args) }));
	row = el("details", { class: "tool running" }, summary);
	row.dataset.name = name;
	toolRows.set(id, row);
	updateTool(row, name, args);
	return row;
}

/** Arguments arrive after the tool call starts; files that Sub-Sub writes get an Open button. */
function updateTool(row, name, args) {
	if (!args || !Object.keys(args).length) return;
	row.querySelector(".args").textContent = summarizeArgs(args);
	if (args.path && (name === "write" || name === "edit") && !row.querySelector(".open")) {
		row.querySelector("summary").append(
			el("button", {
				type: "button",
				class: "open",
				text: t("open"),
				onclick: (e) => {
					e.preventDefault();
					api("/api/open", { path: args.path }).catch((err) => note(err.message, "warning"));
				},
			}),
		);
	}
}

function finishTool(id, result, isError) {
	const row = toolRows.get(id);
	if (!row) return;
	row.classList.remove("running");
	row.classList.add(isError ? "error" : "done");
	const text = textOf(result?.content ?? result);
	row.querySelector("pre")?.remove();
	if (text) row.append(el("pre", { text: text.length > 6000 ? `${text.slice(0, 6000)}\n...` : text }));
	if (isError) row.querySelector(".label").textContent = `${toolLabel(row.dataset.name)} (${t("failed")})`;
	// An applied library change gets an Undo button; it runs /undo with its id, which previews first.
	const jid = !isError && !/undo/.test(row.dataset.name) && /"journal_id":\s*"(\d{8}-\d{6}-\d{2}-[a-z_]+)"/.exec(text ?? "")?.[1];
	if (jid && !row.querySelector(".undo")) {
		row.querySelector("summary").append(
			el("button", {
				type: "button",
				class: "open undo",
				text: t("undo"),
				title: t("undoTitle"),
				onclick: (e) => {
					e.preventDefault();
					if (busy) return note(t("busy"), "warning");
					sendMessage(`/undo ${jid}`);
				},
			}),
		);
	}
}

function attachCopyButtons(root) {
	for (const pre of root.querySelectorAll("pre")) {
		if (pre.parentElement?.classList.contains("pre-wrap")) continue;
		const wrap = el("div", { class: "pre-wrap" });
		pre.parentNode.insertBefore(wrap, pre);
		wrap.append(pre);
		const btn = el("button", {
			type: "button",
			class: "copy-btn",
			text: t("copy"),
			onclick: async () => {
				const code = pre.querySelector("code")?.innerText ?? pre.innerText;
				try {
					await navigator.clipboard.writeText(code);
					btn.textContent = t("copied");
					btn.classList.add("copied");
					setTimeout(() => {
						btn.textContent = t("copy");
						btn.classList.remove("copied");
					}, 2000);
				} catch {
					btn.textContent = t("error");
				}
			},
		});
		wrap.append(btn);
	}
}

/** A container for one assistant message; blocks are keyed by content index. */
function startAssistant() {
	clearEmpty();
	const box = el("div", { class: "msg assistant" });
	log.append(box);
	currentMsg = { box, blocks: new Map(), raf: 0 };
	return currentMsg;
}

function block(msg, index, kind) {
	let b = msg.blocks.get(index);
	if (!b) {
		b = { kind, text: "", node: kind === "text" ? el("div", { class: "md" }) : null };
		msg.blocks.set(index, b);
		if (b.node) msg.box.append(b.node);
	}
	return b;
}

function paint(msg) {
	if (msg.raf) return;
	msg.raf = requestAnimationFrame(() => {
		msg.raf = 0;
		for (const b of msg.blocks.values()) if (b.kind === "text" && b.dirty) {
			b.node.innerHTML = md(b.text);
			attachCopyButtons(b.node);
			b.dirty = false;
		}
		scrollDown();
	});
}

function renderAssistantFinal(message, msg = startAssistant()) {
	msg.box.replaceChildren();
	msg.blocks.clear();
	let fullText = "";
	for (const c of message.content ?? []) {
		if (c.type === "text" && c.text?.trim()) {
			fullText += (fullText ? "\n\n" : "") + c.text;
			const node = el("div", { class: "md" });
			node.innerHTML = md(c.text);
			attachCopyButtons(node);
			msg.box.append(node);
		} else if (c.type === "toolCall") {
			const row = toolRow(c.id, c.name, c.arguments);
			updateTool(row, c.name, c.arguments);
			msg.box.append(row);
		}
	}
	if (fullText.trim()) {
		const actions = el(
			"div",
			{ class: "msg-actions" },
			el("button", {
				type: "button",
				class: "msg-action-btn",
				text: t("copyNote"),
				onclick: async (e) => {
					const btn = e.currentTarget;
					try {
						await navigator.clipboard.writeText(fullText);
						btn.textContent = t("copied");
						btn.classList.add("copied");
						setTimeout(() => {
							btn.textContent = t("copyNote");
							btn.classList.remove("copied");
						}, 2000);
					} catch {
						btn.textContent = t("error");
					}
				},
			}),
		);
		msg.box.append(actions);
	}
	if (message.stopReason === "error" && message.errorMessage) msg.box.append(errorNote(message.errorMessage));
	if (message.stopReason === "aborted") msg.box.append(el("div", { class: "note", text: t("stopped") }));
	if (!msg.box.children.length) msg.box.remove();
	scrollDown();
}

function renderHistory(messages) {
	log.replaceChildren();
	toolRows.clear();
	currentMsg = null;
	for (const m of messages ?? []) {
		if (m.role === "user") {
			const txt = textOf(m.content).trim();
			if (txt === "/subsub-refresh") continue;
			userMessage(txt);
		}
		else if (m.role === "assistant") renderAssistantFinal(m);
		else if (m.role === "toolResult") finishTool(m.toolCallId, m, m.isError);
		else if (m.role === "custom" && m.display) note(textOf(m.content));
		else if (m.role === "compactionSummary" || m.role === "branchSummary") note(t("earlier"));
	}
	for (const row of toolRows.values()) if (row.classList.contains("running")) row.classList.replace("running", "done");
	renderEmpty();
	scrollDown(true);
}

function setBusy(b) {
	busy = b;
	$("stop").hidden = !b;
	if (b && !working) {
		working = el("div", { class: "working", text: t("working") });
		log.append(working);
		scrollDown();
	} else if (!b && working) {
		working.remove();
		working = null;
	}
	if (working) log.append(working); // keep it last
}

// ---------------------------------------------------------------- events from Sub-Sub

function onEvent(ev) {
	switch (ev.type) {
		case "hello":
			lang = ev.lang === "pt" ? "pt" : "en";
			applyLang();
			state = ev.state ?? state;
			session = ev.session ?? null;
			commands = ev.commands ?? [];
			providers = ev.providers ?? [];
			$("version").textContent = ev.version ? `v${ev.version}` : "";
			renderHeader();
			renderHistory(ev.messages);
			if (ev.error) note(ev.error, "error");
			setBusy(!!ev.busy);
			dialogs.length = 0;
			for (const d of ev.dialogs ?? []) dialogs.push(d);
			dropStaleDialog();
			nextDialog();
			loadSessions();
			break;
		case "subsub_state":
			state = ev.state;
			renderHeader();
			break;
		case "agent_start":
			setBusy(true);
			break;
		case "agent_settled":
			setBusy(false);
			currentMsg = null;
			refreshSession();
			break;
		case "message_start":
			if (ev.message?.role === "user") {
				const txt = (sentTemplates.shift() ?? textOf(ev.message.content)).trim();
				if (txt !== "/subsub-refresh") userMessage(txt);
			}
			else if (ev.message?.role === "assistant") startAssistant();
			else if (ev.message?.role === "custom" && ev.message.display) note(textOf(ev.message.content));
			if (working) log.append(working);
			break;
		case "message_update": {
			const a = ev.assistantMessageEvent;
			const msg = currentMsg ?? startAssistant();
			if (a.type === "text_delta") {
				const b = block(msg, a.contentIndex, "text");
				b.text += a.delta;
				b.dirty = true;
				paint(msg);
			} else if (a.type === "text_end") {
				const b = block(msg, a.contentIndex, "text");
				b.text = a.content ?? b.text;
				b.dirty = true;
				paint(msg);
			} else if (a.type === "toolcall_start") {
				const b = block(msg, a.contentIndex, "tool");
				b.id = a.id;
				msg.box.append(toolRow(a.id, a.toolName, {}));
			} else if (a.type === "toolcall_end" && a.toolCall) {
				const row = toolRow(a.toolCall.id, a.toolCall.name, a.toolCall.arguments);
				updateTool(row, a.toolCall.name, a.toolCall.arguments);
				if (!row.isConnected) msg.box.append(row);
			}
			if (working) log.append(working);
			break;
		}
		case "message_end":
			if (ev.message?.role === "assistant") {
				renderAssistantFinal(ev.message, currentMsg ?? startAssistant());
				currentMsg = null;
			}
			if (working) log.append(working);
			break;
		case "tool_execution_start": {
			const row = toolRow(ev.toolCallId, ev.toolName, ev.args);
			updateTool(row, ev.toolName, ev.args);
			if (!row.isConnected) (currentMsg?.box ?? log).append(row);
			break;
		}
		case "tool_execution_end":
			finishTool(ev.toolCallId, ev.result, ev.isError);
			break;
		case "extension_ui_request":
			if (ev.method === "notify") {
				// The mode buttons show the mode; these confirmations would only repeat it.
				if (/^Sub-Sub: (Librarian|Researcher) mode\./.test(ev.message)) break;
				note(ev.message, ev.notifyType === "error" ? "error" : ev.notifyType === "warning" ? "warning" : "info", /\n/.test(ev.message));
			} else {
				dialogs.push(ev);
				nextDialog();
			}
			break;
		case "dialog_closed": {
			const i = dialogs.findIndex((d) => d.id === ev.id);
			if (i >= 0) dialogs.splice(i, 1);
			if (shownDialog?.id === ev.id) {
				shownDialog = null;
				$("dialog").close();
				nextDialog();
			}
			break;
		}
		case "auto_retry_start":
			note(`${ev.errorMessage ?? ""} (${ev.attempt}/${ev.maxAttempts})`, "warning");
			break;
		case "extension_error":
			note(ev.error, "error");
			break;
		case "agent_exit":
			setBusy(false);
			dialogs.length = 0;
			dropStaleDialog();
			log.append(
				el(
					"div",
					{ class: "note error" },
					el("div", { text: t("agentExit") }),
					ev.stderr ? el("pre", { class: "small", text: ev.stderr }) : null,
					el("button", { type: "button", class: "primary small", text: t("startAgain"), onclick: () => api("/api/restart", {}).catch((e) => note(e.message, "error")) }),
				),
			);
			scrollDown(true);
			break;
	}
}

async function refreshSession() {
	// The session file exists only after the first message; then the list can mark it.
	try {
		session = await api("/api/state");
	} catch {
		/* the stream reconnects */
	}
	renderBanner();
	loadSessions();
}

// ---------------------------------------------------------------- dialogs (approvals)

function dialogTitle(d) {
	const raw = String(d.title ?? "").replace(/^Sub-Sub:\s*/, "");
	let m;
	// The program sends the title in the user's language; both forms get the same friendly title.
	if ((m = raw.match(/^(?:apply|aplicar) (\S+)\?$/))) return t("apply", { x: toolLabel(m[1]) });
	if ((m = raw.match(/^(?:run|executar) (\S+)\?$/))) return t("run", { x: toolLabel(m[1]) });
	if (raw === "undo?" || raw === "anular?") return t("undo");
	if ((m = raw.match(/^(?:write the Starbuck report to|escrever o relatório do Starbuck em) (.+)\?$/))) return t("starbuckReport", { x: m[1] });
	if ((m = raw.match(/^(write|edit) (.+)\?$/))) return t("write", { x: m[2] });
	return raw;
}

/** Colour "+ added" and "- removed" parts, as the terminal does. */
function paintPreview(pre, text) {
	pre.replaceChildren();
	const seg = /(^|: |; )([+-] [^;]+)/g;
	for (const line of String(text ?? "").split("\n")) {
		let last = 0;
		for (const m of line.matchAll(seg)) {
			const start = m.index + m[1].length;
			if (start > last) pre.append(line.slice(last, start));
			pre.append(el("span", { class: m[2].startsWith("+") ? "add" : "rem", text: m[2] }));
			last = start + m[2].length;
		}
		if (last < line.length) pre.append(line.slice(last));
		pre.append("\n");
	}
}

/** Close the dialog on screen if Sub-Sub no longer waits for it (pi restarted, or another tab answered). */
function dropStaleDialog() {
	if (shownDialog && !dialogs.some((d) => d.id === shownDialog.id)) {
		shownDialog = null;
		if ($("dialog").open) $("dialog").close();
	}
}

function nextDialog() {
	if (shownDialog || !dialogs.length) return;
	const d = dialogs[0];
	shownDialog = d;
	const dlg = $("dialog");
	$("dialog-kicker").textContent = d.method === "confirm" ? t("previewKicker") : "";
	$("dialog-title").textContent = dialogTitle(d);
	const hint = $("dialog-hint");
	hint.textContent = d.method === "confirm" ? t("approveHint") : "";
	hint.hidden = d.method !== "confirm";
	const pre = $("dialog-message");
	pre.hidden = !d.message;
	if (d.message) paintPreview(pre, d.message);
	const body = $("dialog-body");
	body.replaceChildren();
	const buttons = $("dialog-buttons");
	buttons.replaceChildren();
	const answer = async (reply) => {
		try {
			await api("/api/dialog", { id: d.id, ...reply });
		} catch (err) {
			note(err.message, "error");
		}
	};
	$("dialog-form").onsubmit = (e) => e.preventDefault();
	if (d.method === "confirm") {
		buttons.append(
			el("span", { class: "modal-shortcut-hint", text: t("confirmShortcutHint") }),
			el("button", { type: "button", class: "secondary", text: t("no"), onclick: () => answer({ confirmed: false }) }),
			el("button", { type: "button", class: "primary", text: t("yes"), onclick: () => answer({ confirmed: true }) }),
		);
	} else if (d.method === "select") {
		for (const o of d.options ?? []) buttons.append(el("button", { type: "button", class: "secondary", text: o, onclick: () => answer({ value: o }) }));
		buttons.append(el("button", { type: "button", class: "ghost", text: t("cancel"), onclick: () => answer({ cancelled: true }) }));
	} else {
		const field = d.method === "editor" ? el("textarea", {}) : el("input", { type: "text", placeholder: d.placeholder ?? "" });
		field.value = d.prefill ?? "";
		body.append(field);
		$("dialog-form").onsubmit = (e) => {
			e.preventDefault();
			answer({ value: field.value });
		};
		buttons.append(
			el("button", { type: "button", class: "ghost", text: t("cancel"), onclick: () => answer({ cancelled: true }) }),
			el("button", { type: "button", class: "primary", text: t("ok"), onclick: () => answer({ value: field.value }) }),
		);
	}
	// Keys typed just before the dialog opened (the user was writing a message) must not answer it.
	const openedAt = performance.now();
	const yesKeys = lang === "pt" ? ["s", "S", "y", "Y"] : ["y", "Y"];
	dlg.onkeydown = (e) => {
		if (d.method === "confirm") {
			if (e.repeat || performance.now() - openedAt < 700) {
				// Escape still declines (through oncancel); Enter and Space would press the focused button.
				if (e.key !== "Escape" && e.key !== "Tab") e.preventDefault();
				return;
			}
			if (yesKeys.includes(e.key) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
				e.preventDefault();
				answer({ confirmed: true });
			} else if (e.key === "n" || e.key === "N") {
				e.preventDefault();
				answer({ confirmed: false });
			}
		}
	};
	dlg.oncancel = (e) => {
		e.preventDefault();
		answer(d.method === "confirm" ? { confirmed: false } : { cancelled: true });
	};
	if (!dlg.open) dlg.showModal();
	buttons.querySelector(d.method === "confirm" ? ".secondary" : "button")?.focus();
}

// ---------------------------------------------------------------- models and keys

/** Open the model dialog; a failure becomes a note, not an unhandled rejection. */
function showModels() {
	openModels().catch((err) => note(err.message, "warning"));
}

async function openModels() {
	const dlg = $("model-dialog");
	// Name the mode the choice is saved for; "both modes" is a choice for this time only.
	dlg.querySelector("h2").textContent = t(mode() === "librarian" ? "modelTitleLibrarian" : "modelTitleResearcher");
	$("model-both").checked = false;
	const ul = $("models");
	ul.replaceChildren(el("li", { class: "empty-models", text: "…" }));
	const sel = $("login-provider");
	sel.replaceChildren(...providers.map((p) => el("option", { value: p.id, text: p.label })));
	const link = $("login-link");
	const setLink = () => {
		const p = providers.find((x) => x.id === sel.value);
		link.href = p?.url ?? "#";
		const free = { google: "freeGoogle", openrouter: "freeOpenRouter" }[sel.value];
		$("login-free").hidden = !free;
		$("login-free").textContent = free ? t(free) : "";
		$("login-where").textContent = p?.where ? t(`where_${p.where}`) : "";
	};
	sel.onchange = setLink;
	setLink();
	if (!dlg.open) dlg.showModal();
	let models = [];
	let recommended = [];
	try {
		const data = await api("/api/models");
		models = data.models ?? [];
		recommended = data.recommended ?? [];
	} catch (err) {
		note(err.message, "error");
	}
	const cur = state?.model ?? session?.model;
	const specOf = (m) => `${m.provider}/${m.id}`;
	const isCurrent = (m) => cur && cur.provider === m.provider && cur.id === m.id;
	const available = new Set(models.map(specOf));
	// Recommended for this mode first (also when the provider has no key yet), then the rest.
	const mine = recommended.filter((r) => r.modes.includes(mode()));
	const recSpecs = new Set(mine.map((r) => r.spec));
	const others = models
		.filter((m) => !recSpecs.has(specOf(m)))
		.sort((a, b) => Number(isCurrent(b)) - Number(isCurrent(a)) || specOf(a).localeCompare(specOf(b)));
	const choose = async (m) => {
		if (busy) return note(t("busy"), "warning");
		try {
			await api("/api/model", { provider: m.provider, id: m.id, both: $("model-both").checked });
			dlg.close();
		} catch (err) {
			note(err.message, "error");
		}
	};
	const row = (m, rec) => {
		const spec = specOf(m);
		const can = available.has(spec);
		const label = providers.find((p) => p.id === m.provider)?.label ?? m.provider;
		return el(
			"li",
			{ "data-spec": spec.toLowerCase() },
			el(
				"button",
				{
					type: "button",
					class: [isCurrent(m) ? "current" : "", rec ? "rec" : "", can ? "" : "needs-key"].join(" ").trim(),
					// Without a key, the click goes to the form below: that provider, and the key field.
					onclick: () => {
						if (can) return choose(m);
						if (providers.some((p) => p.id === m.provider)) {
							sel.value = m.provider;
							setLink();
						}
						$("login-key").focus();
					},
				},
				el("span", { class: "model-name", text: spec }),
				rec ? el("span", { class: "model-tag", text: t(`rec_${rec.why}`) }) : null,
				rec && !can ? el("span", { class: "model-why", text: t("needsKey", { x: label }) }) : null,
			),
		);
	};
	const search = $("model-search");
	const render = () => {
		const q = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
		const hit = (spec) => q.every((w) => spec.toLowerCase().includes(w));
		const recRows = mine.filter((r) => hit(r.spec)).map((r) => {
			const i = r.spec.indexOf("/");
			return row({ provider: r.spec.slice(0, i), id: r.spec.slice(i + 1) }, r);
		});
		const rest = others.filter((m) => hit(specOf(m))).map((m) => row(m, null));
		ul.replaceChildren();
		if (recRows.length) ul.append(el("li", { class: "models-group", text: t("recommended") }), ...recRows);
		if (rest.length) ul.append(el("li", { class: "models-group", text: t(recRows.length ? "otherModels" : "allModels") }), ...rest);
		if (!recRows.length && !rest.length) ul.append(el("li", { class: "empty-models", text: models.length ? t("noMatch") : t("noModels") }));
	};
	search.value = "";
	search.oninput = render;
	search.onkeydown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			ul.querySelector("button:not(.needs-key)")?.click();
		}
	};
	render();
	search.focus();
}

$("login-form")?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const btn = $("login-save");
	btn.disabled = true;
	btn.textContent = t("saving");
	try {
		await api("/api/login", { provider: $("login-provider").value, key: $("login-key").value });
		$("login-key").value = "";
		note(t("saved"));
		await openModels();
	} catch (err) {
		note(err.message, "error");
	} finally {
		btn.disabled = false;
		btn.textContent = t("save");
	}
});

// ---------------------------------------------------------------- composer

const input = $("input");

function autosize() {
	input.style.height = "auto";
	input.style.height = `${Math.min(input.scrollHeight + 2, window.innerHeight * 0.4)}px`;
	suggest();
}

async function sendMessage(text) {
	const message = text.trim();
	if (!message) return false;
	const name = message.startsWith("/") ? message.slice(1).split(/\s/)[0] : "";
	const isTemplate = name && commands.some((c) => c.name === name && c.source === "prompt");
	if (isTemplate) sentTemplates.push(message);
	try {
		await api("/api/prompt", { message });
		return true;
	} catch (err) {
		if (isTemplate) sentTemplates.pop();
		if (err.message === "nomodel") {
			// Keep what the user wrote, and show where to connect a provider.
			if (!input.value.trim()) {
				input.value = message;
				autosize();
			}
			note(t("noModelSend"), "warning");
			showModels();
			return false;
		}
		note(err.message, "error");
		return false;
	}
}

let suggestIndex = 0;
function suggest() {
	const box = $("suggest");
	const v = input.value;
	if (!/^\/\S*$/.test(v)) {
		box.hidden = true;
		return;
	}
	const q = v.slice(1).toLowerCase();
	const list = commands.filter((c) => c.name !== "subsub-refresh" && c.name.toLowerCase().startsWith(q)).slice(0, 12);
	if (!list.length) {
		box.hidden = true;
		return;
	}
	suggestIndex = Math.min(suggestIndex, list.length - 1);
	box.replaceChildren(
		...list.map((c, i) =>
			el(
				"button",
				{
					type: "button",
					role: "option",
					"aria-selected": String(i === suggestIndex),
					onclick: () => pick(c),
				},
				el("span", { class: "name", text: `/${c.name}` }),
				el("span", { class: "desc", text: (c.description ?? "").replace(/^Sub-Sub:\s*/, "") }),
			),
		),
	);
	box.hidden = false;
	box.list = list;
}
function pick(c) {
	input.value = `/${c.name} `;
	$("suggest").hidden = true;
	input.focus();
}

input.addEventListener("input", () => {
	suggestIndex = 0;
	autosize();
});
input.addEventListener("keydown", (e) => {
	const box = $("suggest");
	if (!box.hidden && box.list) {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			suggestIndex = (suggestIndex + (e.key === "ArrowDown" ? 1 : -1) + box.list.length) % box.list.length;
			suggest();
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			pick(box.list[suggestIndex]);
			return;
		}
		if (e.key === "Escape") {
			box.hidden = true;
			return;
		}
	}
	if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
		e.preventDefault();
		$("composer").requestSubmit();
	}
});
$("composer").addEventListener("submit", (e) => {
	e.preventDefault();
	const text = input.value;
	if (!text.trim()) return;
	input.value = "";
	autosize();
	sendMessage(text);
});
$("stop").addEventListener("click", () => api("/api/abort", {}).catch(() => {}));
$("new-btn").addEventListener("click", async () => {
	closeSide();
	if (busy) return note(t("busy"), "warning");
	try {
		await api("/api/new", {});
	} catch (err) {
		note(err.message, "error");
	}
});
for (const b of document.querySelectorAll(".modes button")) {
	b.addEventListener("click", () => {
		if (b.dataset.mode !== mode()) sendMessage(`/${b.dataset.mode}`);
	});
}
$("profile").addEventListener("change", (e) => sendMessage(`/profile ${e.target.value}`));
$("starbuck-toggle").addEventListener("change", async (e) => {
	const on = e.target.checked;
	e.target.disabled = true;
	try {
		await api("/api/addons", { starbuck: on });
		note(t(on ? "starbuckOn" : "starbuckOff"), "info");
	} catch (err) {
		e.target.checked = !on;
		note(err.message, "warning");
	} finally {
		e.target.disabled = false;
	}
});
$("profile-side").addEventListener("change", (e) => sendMessage(`/profile ${e.target.value}`));
$("model-btn").addEventListener("click", showModels);
$("model-btn-side").addEventListener("click", () => {
	closeSide();
	showModels();
});
$("model-close").addEventListener("click", () => $("model-dialog").close());
$("main").addEventListener("click", () => {
	if ($("side").classList.contains("open")) closeSide();
});
$("menu-btn").addEventListener("click", (e) => {
	e.stopPropagation();
	if (window.innerWidth > 832) {
		const app = document.querySelector(".app");
		app.classList.toggle("side-collapsed");
		const collapsed = app.classList.contains("side-collapsed");
		$("menu-btn").setAttribute("aria-expanded", String(!collapsed));
		localStorage.setItem("subsub-side-collapsed", String(collapsed));
	} else {
		const side = $("side");
		side.classList.toggle("open");
		$("menu-btn").setAttribute("aria-expanded", String(side.classList.contains("open")));
	}
});
$("width-btn")?.addEventListener("click", toggleLayout);
$("theme-btn")?.addEventListener("click", toggleTheme);
$("theme-btn-side")?.addEventListener("click", () => {
	closeSide();
	toggleTheme();
});
$("session-search")?.addEventListener("input", (e) => renderSessionsList(e.target.value));
$("export-btn")?.addEventListener("click", exportConversation);
$("quit-btn").addEventListener("click", async () => {
	try {
		await api("/api/quit", {});
	} catch {
		/* closing */
	}
	stream?.close();
	document.body.replaceChildren(el("p", { class: "empty", text: t("quitDone") }));
});

// ---------------------------------------------------------------- the event stream

let stream = null;
let lostNote = null;
function connect() {
	stream = new EventSource("/api/events");
	stream.onmessage = (m) => {
		lostNote?.remove();
		lostNote = null;
		let ev;
		try {
			ev = JSON.parse(m.data);
		} catch {
			return;
		}
		onEvent(ev);
	};
	stream.onerror = () => {
		if (!lostNote) lostNote = note(t("disconnected"), "warning");
	};
}

setTheme(currentTheme);
updateLayoutUI();
if (localStorage.getItem("subsub-side-collapsed") === "true" && window.innerWidth > 832) {
	document.querySelector(".app")?.classList.add("side-collapsed");
	$("menu-btn")?.setAttribute("aria-expanded", "false");
}
applyLang();
connect();
