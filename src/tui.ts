/**
 * `subsub tui`: Sub-Sub in the whole terminal. A client of pi's RPC mode, like the web view: pi runs as a child process with the Sub-Sub extension
 * (src/rpc.ts), and this file draws what it says on a full-screen pi-tui screen (a transcript that scrolls, a side panel from 110 columns, the
 * editor and the footer), and answers its dialogs. The look is that of `subsub` (src/chrome.ts, src/screens.ts, src/dialogs.ts); the colours are
 * read from themes/, because RPC mode has no pi theme to share.
 */

import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join } from "node:path";
import { CombinedAutocompleteProvider, Editor, HStack, Markdown, matchesKey, ProcessTerminal, ScrollView, type Component, type SlashCommand, type Terminal, TuiAltScreen, VStack } from "@earendil-works/pi-tui";
import { agentDirFor, chooseCwd, PACKAGE_DIR, packageVersion } from "./cli.ts";
import { fill, footerLines } from "./chrome.ts";
import { loadConfig, uiLanguage } from "./config.ts";
import { type LibraryState, LIBRARIAN_THEME, DEFAULT_THEME, paintPreview, QUOTES } from "./look.ts";
import { PURPOSES } from "./read.ts";
import { allowedFile, listNotes, OPENABLE, openFile } from "./files.ts";
import { Agent, findLibrary, isDialog, Side, withHints } from "./rpc.ts";
import { ApprovalView } from "./dialogs.ts";
import { type Choice, ChoiceView, InputView, LibraryView, type LibraryItem, NotesView } from "./screens.ts";
import { glyphs as chooseGlyphs, type Glyphs, workingFrames } from "./skin.ts";
import { bannerLines, type Entry, entriesFromMessages, loadPalette, messageText, type Palette, schemeFromEnv, type Scheme, SIDE_WIDTH, sideLines, transcriptLines } from "./tui-view.ts";
import { loadWords, type Words } from "./words.ts";

type Lang = "en" | "pt";
type Mode = "researcher" | "librarian";

/** The part of the Agent class (src/rpc.ts) that the screen uses; tests give it a fake. */
export interface AgentLike {
	start(extra?: string[]): void;
	stop(): Promise<void>;
	request<T = any>(cmd: Record<string, unknown>, timeoutMs?: number): Promise<T>;
	write(rec: unknown): void;
	on(l: (ev: any) => void): () => void;
	onExit?: (code: number | null) => void;
	stderr: string;
}

export interface TuiDeps {
	terminal: Terminal;
	agent: AgentLike;
	version: string;
	lang: Lang;
	cwd: string;
	/** The palette of a theme base ("subsub-glauca") in the scheme and colour mode of the terminal. */
	palette: (base: string) => Palette;
	glyphs: Glyphs;
	words?: Words;
	quote?: [string, string];
	reduceMotion?: boolean;
	/** The theme of each mode; the Researcher's is subsub-glauca and the Librarian's subsub-try-works unless the settings say otherwise. */
	themes?: { researcher?: string; librarian?: string };
	/** The conversations of this folder, newest first (SessionManager.list in the real client). */
	sessions?: () => Promise<Array<{ title: string; path?: string }>>;
	/** The Sub-Sub folder, for /notes. */
	vault?: string;
	/** Milliseconds between the last key and the search in /library. */
	searchDelay?: number;
	/** Called when the user quits or pi stops. */
	onQuit?: (code: number) => void;
}

const SHORT = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 3)}...` : s);

export class TuiApp {
	readonly tui: TuiAltScreen;
	readonly side = new Side();
	entries: Entry[] = [];
	mode: Mode = "researcher";
	busy = false;
	private working = "";
	private frame = 0;
	private frames: string[];
	private timer: ReturnType<typeof setInterval> | undefined;
	private model = "";
	private sessionFile: string | undefined;
	private percent: number | null = null;
	private window: number | undefined;
	private tokens: number | null = 0;
	private cost: number | null = 0;
	private expanded = false;
	private conversations: Array<{ title: string; open?: boolean }> = [];
	private lastCtrlC = 0;
	private palette: Palette;
	private readonly d: TuiDeps;
	private readonly editor: Editor;
	private current: Extract<Entry, { kind: "assistant" }> | undefined;
	private readonly tools = new Map<string, Extract<Entry, { kind: "tool" }>>();
	private unlisten: (() => void) | undefined;
	private stopped = false;
	/** The screen over the conversation (notes, library, a list), if one is open. */
	private overlay: { hide(): void } | undefined;
	/** A dialog of the extension that waits for an answer, and the ones behind it. */
	private dialogHandle: { hide(): void } | undefined;
	private dialogs: any[] = [];

	constructor(d: TuiDeps) {
		this.d = d;
		this.palette = d.palette(this.themeFor("researcher"));
		this.frames = workingFrames(d.glyphs, d.reduceMotion);
		this.tui = new TuiAltScreen(d.terminal, false, undefined, { mouse: true });
		this.editor = new Editor(this.tui, this.palette.editorTheme(), { paddingX: 1 });
		this.editor.onSubmit = (text) => void this.submit(text);
		this.tui.setLayoutRoot(this.layout());
		this.tui.setFocus(this.editor);
		this.tui.addInputListener?.((data: string) => (this.globalKey(data) ? { consume: true } : undefined));
	}

	private themeFor(mode: Mode): string {
		return (mode === "librarian" ? this.d.themes?.librarian ?? LIBRARIAN_THEME : this.d.themes?.researcher ?? DEFAULT_THEME) as string;
	}

	// ---------------------------------------------------------------- layout

	private get lang(): Lang {
		return this.d.lang;
	}

	private library(): LibraryState {
		const s = this.side.state as { library?: LibraryState } | null;
		return s?.library ?? { zotero: "checking" };
	}

	private markdown = (text: string, width: number): string[] => new Markdown(text, 0, 0, this.palette.markdownTheme() as never).render(width);

	private layout(): Component {
		const app = this;
		const transcript: Component = {
			render: (width) => {
				const w = Math.max(10, width - 2);
				const body = transcriptLines(app.entries, w, { paint: app.palette.paint(), glyphs: app.d.glyphs, lang: app.lang, markdown: app.markdown, words: app.d.words, expanded: app.expanded });
				return [...app.banner(w), "", ...body].map((l) => ` ${l}`);
			},
			invalidate() {},
		};
		const working: Component = {
			render: () => [app.busy ? ` ${app.palette.paint().mark(app.frames[app.frame % app.frames.length])} ${app.palette.paint().muted(app.working)}` : ""],
			invalidate() {},
		};
		const footer: Component = {
			render: (width) => footerLines({ mode: app.mode, lang: app.lang, library: app.library(), model: app.model, percent: app.percent, window: app.window, tokens: app.tokens, cost: app.cost, down: app.down() }, width - 1, app.palette.paint(), app.d.glyphs).map((l) => ` ${l}`),
			invalidate() {},
		};
		const side: Component = {
			render: (width) => {
				const rows = app.d.terminal.rows;
				const p = app.palette.paint();
				const lines = sideLines({ version: app.d.version, mode: app.mode, lang: app.lang, library: app.library(), model: app.model, conversations: app.conversations }, width - 2, rows, p, app.d.glyphs);
				const bar = p.muted(app.d.glyphs.vertical);
				return fill(lines, width - 2, rows).map((l) => `${l}${bar} `);
			},
			invalidate() {},
		};
		const main = new VStack([
			{ component: new ScrollView(transcript, { follow: "end", primary: true, overscroll: "chain" }), basis: 0, grow: 1, minSize: 1 },
			{ component: working, basis: "auto" },
			{ component: this.editor, basis: "auto", shrink: 1, minSize: 3 },
			{ component: footer, basis: "auto" },
		]);
		return new HStack([
			{ component: side, basis: SIDE_WIDTH, shrink: 0, visible: (v: { width: number }) => v.width >= 110 },
			{ component: main, grow: 1, minSize: 20 },
		]);
	}

	private down(): string[] {
		return ((this.side.state as { down?: string[] } | null)?.down ?? []).slice();
	}

	private banner(width: number): string[] {
		return bannerLines({ version: this.d.version, mode: this.mode, model: this.model, library: this.library(), width, paint: this.palette.paint(), lang: this.lang, glyphs: this.d.glyphs, quote: this.d.quote });
	}

	// ---------------------------------------------------------------- life

	async start(): Promise<void> {
		this.unlisten = this.d.agent.on((ev) => this.handle(ev));
		this.d.agent.onExit = (code) => this.exited(code);
		this.tui.start();
		this.d.agent.start();
		this.timer = setInterval(() => {
			if (!this.busy || this.frames.length < 2) return;
			this.frame++;
			this.tui.requestRender();
		}, 160);
		this.timer.unref();
		await this.load();
	}

	/** The conversation, the commands and the usage of the session that pi has open. */
	async load(): Promise<void> {
		try {
			const state = await this.d.agent.request({ type: "get_state" });
			this.model = state?.model?.id ?? this.model;
			this.sessionFile = state?.sessionFile ?? this.sessionFile;
			const messages = (await this.d.agent.request({ type: "get_messages" }))?.messages ?? [];
			this.entries = entriesFromMessages(messages);
			const commands = withHints((await this.d.agent.request({ type: "get_commands" }))?.commands ?? []);
			this.editor.setAutocompleteProvider(new CombinedAutocompleteProvider(this.slashCommands(commands), this.d.cwd));
		} catch (err) {
			this.notice("error", (err as Error).message);
		}
		await this.refreshStats();
		await this.refreshConversations();
		this.tui.requestRender();
	}

	private slashCommands(commands: Array<Record<string, any>>): SlashCommand[] {
		const hidden = /^subsub-/;
		const pt = this.lang === "pt";
		const own: SlashCommand[] = [
			{ name: "notes", description: pt ? "As notas da pasta do Sub-Sub" : "The notes in your Sub-Sub folder" },
			{ name: "library", description: pt ? "Pesquisar na biblioteca à medida que escreve" : "Search your library as you type" },
			{ name: "actions", description: pt ? "As ações da vista no navegador" : "The actions of the browser view" },
			{ name: "sessions", description: pt ? "Conversas anteriores" : "Earlier conversations" },
			{ name: "new", description: pt ? "Uma conversa nova" : "A new conversation" },
			{ name: "model", description: pt ? "Escolher o modelo" : "Choose the model" },
			{ name: "restart", description: pt ? "Recomeçar o pi na mesma conversa" : "Start pi again in the same conversation" },
			{ name: "quit", description: pt ? "Sair" : "Quit" },
		];
		const fromPi: SlashCommand[] = commands
			.filter((c) => !hidden.test(String(c.name)))
			.map((c) => {
				const cmd: SlashCommand = { name: String(c.name), description: c.description, argumentHint: c.hint };
				if (c.name === "read") {
					cmd.getArgumentCompletions = (prefix: string) => {
						if (/\s/.test(prefix.trim())) return null;
						const found = Object.keys(PURPOSES).filter((k) => k.startsWith(prefix.trim().toLowerCase()));
						return found.length ? found.map((k) => ({ value: k, label: PURPOSES[k as keyof typeof PURPOSES][this.lang === "pt" ? 1 : 0] })) : null;
					};
				}
				return cmd;
			});
		return [...own, ...fromPi];
	}

	async refreshStats(): Promise<void> {
		try {
			const s = await this.d.agent.request({ type: "get_session_stats" });
			this.tokens = s?.tokens?.total ?? null;
			this.cost = typeof s?.cost === "number" ? s.cost : null;
			this.percent = s?.contextUsage?.percent ?? null;
			this.window = s?.contextUsage?.contextWindow;
		} catch {
			/* keep what is shown */
		}
	}

	async refreshConversations(): Promise<void> {
		try {
			const list = (await this.d.sessions?.()) ?? [];
			this.conversations = list.slice(0, 12).map((s) => ({ title: SHORT(s.title || "...", SIDE_WIDTH - 4), open: Boolean(s.path && s.path === this.sessionFile) }));
		} catch {
			this.conversations = [];
		}
	}

	async stop(): Promise<void> {
		if (this.stopped) return;
		this.stopped = true;
		if (this.timer) clearInterval(this.timer);
		this.unlisten?.();
		this.tui.stop();
		await this.d.agent.stop();
	}

	private exited(code: number | null): void {
		if (this.stopped) return;
		this.busy = false;
		const pt = this.lang === "pt";
		const parts = [`${pt ? "O pi parou" : "pi stopped"} (${code}).`, this.d.agent.stderr.slice(-300).trim(), pt ? "Escreva /restart para recomeçar." : "Type /restart to start it again."];
		this.notice("error", parts.filter(Boolean).join(" "));
		this.tui.requestRender();
	}

	// ---------------------------------------------------------------- events

	private notice(level: "info" | "warning" | "error", text: string): void {
		this.entries.push({ kind: "notice", level, text });
	}

	handle(ev: any): void {
		if (ev?.type === "extension_ui_request") {
			if (isDialog(ev)) return this.dialog(ev);
			const kind = this.side.take(ev);
			if (kind === "state") return this.sideState();
			if (ev.method === "notify") this.notice(ev.notifyType === "warning" ? "warning" : ev.notifyType === "error" ? "error" : "info", String(ev.message ?? ""));
			return this.tui.requestRender();
		}
		switch (ev?.type) {
			case "agent_start":
				this.busy = true;
				this.working = this.lang === "pt" ? "A trabalhar..." : "Working...";
				break;
			case "agent_settled":
				this.busy = false;
				this.current = undefined;
				void this.refreshStats().then(() => this.tui.requestRender());
				void this.refreshConversations().then(() => this.tui.requestRender());
				break;
			case "message_start":
				if (ev.message?.role === "assistant") {
					this.current = { kind: "assistant", text: "" };
					this.entries.push(this.current);
				}
				break;
			case "message_update":
				if (ev.assistantMessageEvent?.type === "text_delta" && this.current) this.current.text += ev.assistantMessageEvent.delta ?? "";
				break;
			case "message_end": {
				const m = ev.message ?? {};
				if (m.role === "assistant") {
					const text = messageText(m.content);
					if (this.current) {
						if (text.trim()) this.current.text = text;
						else this.entries.splice(this.entries.indexOf(this.current), 1);
					} else if (text.trim()) this.entries.push({ kind: "assistant", text });
					this.current = undefined;
				} else if (m.role === "user") {
					const first = messageText(m.content).trim().split("\n")[0];
					if (first && !first.startsWith("/subsub-")) this.entries.push({ kind: "user", text: first });
				}
				break;
			}
			case "tool_execution_start": {
				const t: Extract<Entry, { kind: "tool" }> = { kind: "tool", id: ev.toolCallId, name: String(ev.toolName), args: ev.args, state: "pending" };
				this.tools.set(ev.toolCallId, t);
				this.entries.push(t);
				break;
			}
			case "tool_execution_end": {
				const t = this.tools.get(ev.toolCallId);
				if (t) {
					const out = messageText(ev.result?.content);
					t.output = out;
					t.state = ev.isError ? "failed" : "done";
					if (ev.isError) t.error = out.trim().split("\n")[0];
				}
				break;
			}
			case "auto_retry_start":
				this.notice("warning", this.lang === "pt" ? "A tentar outra vez..." : "Trying again...");
				break;
			case "extension_error":
				this.notice("error", String(ev.error ?? "extension error"));
				break;
		}
		this.tui.requestRender();
	}

	/** The state that the extension sends: the mode (and so the colours), the library, the model, the servers that are down. */
	private sideState(): void {
		const s = this.side.state as { mode?: Mode; model?: { id?: string } | null } | null;
		if (s?.mode && s.mode !== this.mode) {
			this.mode = s.mode;
			this.palette = this.d.palette(this.themeFor(this.mode));
		}
		if (s?.model?.id) this.model = s.model.id;
		this.tui.requestRender();
	}

	/**
	 * A dialog of the extension. Nothing is applied without an answer, and anything but a yes is a no: the approval screen (src/dialogs.ts) answers
	 * `confirm`, a list answers `select`, a line answers `input` and `editor`. One dialog at a time, in the order they came.
	 */
	protected dialog(ev: any): void {
		this.dialogs.push(ev);
		if (!this.dialogHandle) this.nextDialog();
	}

	private reply(id: string, payload: Record<string, unknown>): void {
		this.d.agent.write({ type: "extension_ui_response", id, ...payload });
		this.dialogHandle?.hide();
		this.dialogHandle = undefined;
		this.tui.requestRender();
		this.nextDialog();
	}

	private nextDialog(): void {
		const ev = this.dialogs.shift();
		if (!ev) return;
		const c = this.common();
		const show = (component: Component, options: Record<string, unknown>) => {
			this.dialogHandle = this.tui.showOverlay(component, options as never);
			this.tui.requestRender();
		};
		const centered = { width: "72%", minWidth: 44, maxHeight: "80%", anchor: "center" };
		const title = String(ev.title ?? "Sub-Sub");
		if (ev.method === "confirm") {
			const p = this.palette.paint();
			const body = paintPreview(String(ev.message ?? ""), p.ok, p.strike, p.text);
			show(new ApprovalView({ title, body, lang: this.lang, paint: p, glyphs: this.d.glyphs, rows: c.rows, redraw: c.redraw, done: (yes) => this.reply(ev.id, { confirmed: yes }) }), { width: "92%", minWidth: 40, maxHeight: "92%", anchor: "center", margin: 1 });
		} else if (ev.method === "select") {
			const choices: Choice[] = (ev.options ?? []).map((o: unknown) => ({ label: String(o), value: String(o) }));
			show(new ChoiceView({ ...c, title, choices, choose: (value) => this.reply(ev.id, { value }), cancel: () => this.reply(ev.id, { cancelled: true }) }), centered);
		} else if (ev.method === "input" || ev.method === "editor") {
			show(new InputView({ ...c, title, placeholder: ev.placeholder, prefill: ev.prefill, submit: (text) => this.reply(ev.id, { value: text }), cancel: () => this.reply(ev.id, { cancelled: true }) }), centered);
		} else {
			this.reply(ev.id, ev.method === "confirm" ? { confirmed: false } : { cancelled: true });
		}
	}

	/** /restart: pi again, with the same conversation and mode (after it stopped, or to take up a new add-on or key). */
	async restart(): Promise<void> {
		let session: string | undefined;
		try {
			session = (await this.d.agent.request({ type: "get_state" }))?.sessionFile;
		} catch {
			/* pi is not running: start a new conversation */
		}
		await this.d.agent.stop();
		this.busy = false;
		this.current = undefined;
		this.tools.clear();
		this.dialogs = [];
		this.dialogHandle?.hide();
		this.dialogHandle = undefined;
		this.d.agent.start([`--${this.mode}`, ...(session ? ["--session", session] : [])]);
		await this.load();
	}

	/** /model: the models that are connected; the choice is the model of this conversation. */
	async openModels(): Promise<void> {
		if (this.overlay) return;
		let models: Array<{ provider: string; id: string; name?: string }> = [];
		try {
			models = (await this.d.agent.request({ type: "get_available_models" }))?.models ?? [];
		} catch (err) {
			this.notice("error", (err as Error).message);
			return void this.tui.requestRender();
		}
		const choices: Choice[] = models.map((m) => ({ label: m.name ?? m.id, hint: m.provider, value: `${m.provider}/${m.id}` }));
		this.open(
			new ChoiceView({
				...this.common(),
				title: this.lang === "pt" ? "Modelo" : "Model",
				choices,
				choose: (value) => {
					this.close();
					const i = value.indexOf("/");
					void this.d.agent.request({ type: "set_model", provider: value.slice(0, i), modelId: value.slice(i + 1) }).then((m) => {
						this.model = m?.id ?? value.slice(i + 1);
						this.tui.requestRender();
					}).catch((err) => this.notice("error", (err as Error).message));
				},
				cancel: () => this.close(),
			}),
			true,
		);
	}

	// ---------------------------------------------------------------- screens

	private open(component: Component, centered = false): void {
		this.overlay = this.tui.showOverlay(component, centered ? { width: "72%", minWidth: 44, maxHeight: "80%", anchor: "center" } : { width: "100%", maxHeight: "100%", anchor: "top-left", margin: 0 });
		this.tui.requestRender();
	}

	private close(): void {
		this.overlay?.hide();
		this.overlay = undefined;
		this.tui.setFocus(this.editor);
		this.tui.requestRender();
	}

	private common() {
		return { lang: this.lang, paint: this.palette.paint(), glyphs: this.d.glyphs, rows: () => this.d.terminal.rows, redraw: () => this.tui.requestRender() };
	}

	/** Alt+N, /notes: the notes of the Sub-Sub folder, newest first, with the chosen note beside the list. */
	async openNotes(): Promise<void> {
		if (this.overlay) return;
		const root = this.d.vault ?? this.d.cwd;
		this.open(
			new NotesView({
				...this.common(),
				notes: listNotes(root),
				read: (path) => {
					const file = allowedFile(path, root, this.d.vault);
					return file && statSync(file).size < 2_000_000 ? readFileSync(file, "utf8") : "";
				},
				markdown: (text, width) => new Markdown(text, 1, 0, this.palette.markdownTheme() as never).render(width),
				open: (path) => {
					const file = allowedFile(path, root, this.d.vault);
					if (file && OPENABLE.has(extname(file).toLowerCase())) openFile(file, this.d.vault);
				},
				done: () => this.close(),
			}),
		);
	}

	/** Alt+L, /library: search as you type; Enter puts /read <item> in the editor (the Librarian gets the key), ctrl+n puts /lit-note <item>. */
	async openLibrary(): Promise<void> {
		if (this.overlay) return;
		const ref = (it: LibraryItem) => it.citekey || it.key;
		this.open(
			new LibraryView({
				...this.common(),
				researcher: this.mode === "researcher",
				delay: this.d.searchDelay,
				search: async (q) => {
					const r = await findLibrary(this.d.agent, this.side, q);
					if (r.error) throw new Error(r.error);
					return ((r.items ?? []) as LibraryItem[]).filter((it) => it && it.key);
				},
				choose: (it) => {
					this.close();
					this.editor.setText(this.mode === "researcher" ? `/read ${ref(it)}` : ref(it));
				},
				note: (it) => {
					this.close();
					this.editor.setText(`/lit-note ${ref(it)}`);
				},
				done: () => this.close(),
			}),
		);
	}

	/** Alt+A, /actions: the actions of the browser view; the choice goes into the editor. */
	async openActions(): Promise<void> {
		if (this.overlay) return;
		const w = this.d.words ?? (await loadWords());
		const starbuck = Boolean((this.side.state as { starbuck?: boolean } | null)?.starbuck);
		const list = [...(this.mode === "researcher" ? w.ACTIONS.research : []), ...w.ACTIONS.library].filter((a) => a.needs !== "starbuck" || starbuck);
		const choices: Choice[] = list.map((a) => ({ label: a[this.lang], hint: `/${a.cmd}`, value: a.cmd }));
		this.open(
			new ChoiceView({
				...this.common(),
				title: this.lang === "pt" ? "Ações" : "Actions",
				choices,
				choose: (cmd) => {
					this.close();
					this.editor.setText(cmd.endsWith(" ") ? `/${cmd}` : `/${cmd} `);
				},
				cancel: () => this.close(),
			}),
			true,
		);
	}

	/** /sessions: earlier conversations of this folder; the choice opens it. */
	async openSessions(): Promise<void> {
		if (this.overlay) return;
		const list = (await this.d.sessions?.()) ?? [];
		const choices: Choice[] = list.filter((s) => s.path).map((s) => ({ label: SHORT(s.title || "...", 70), value: s.path as string }));
		this.open(
			new ChoiceView({
				...this.common(),
				title: this.lang === "pt" ? "Conversas" : "Conversations",
				choices,
				choose: (path) => {
					this.close();
					void this.d.agent.request({ type: "switch_session", sessionPath: path }).then(() => this.load()).catch((err) => this.notice("error", (err as Error).message));
				},
				cancel: () => this.close(),
			}),
			true,
		);
	}

	/** /new: an empty conversation. */
	async newConversation(): Promise<void> {
		try {
			await this.d.agent.request({ type: "new_session" });
			await this.load();
		} catch (err) {
			this.notice("error", (err as Error).message);
			this.tui.requestRender();
		}
	}

	// ---------------------------------------------------------------- input

	/** Keys that count whatever has the focus. Returns true when the key is used. */
	private globalKey(data: string): boolean {
		if (this.overlay || this.dialogHandle) return false; // the open screen has its own keys
		const shortcuts: Record<string, () => void> = {
			"alt+n": () => void this.openNotes(),
			"alt+l": () => void this.openLibrary(),
			"alt+a": () => void this.openActions(),
			"alt+m": () => this.switchMode(),
			// The same on the function keys, for terminals where Alt (Option on a Mac) does not send Escape plus the letter.
			f2: () => void this.openNotes(),
			f3: () => void this.openLibrary(),
			f4: () => void this.openActions(),
			f5: () => this.switchMode(),
		};
		for (const [key, run] of Object.entries(shortcuts)) {
			if (matchesKey(data, key as never)) {
				run();
				return true;
			}
		}
		if (matchesKey(data, "ctrl+c")) {
			const now = Date.now();
			if (this.editor.getText()) this.editor.setText("");
			else if (now - this.lastCtrlC < 800) void this.quit();
			else if (this.busy) void this.d.agent.request({ type: "abort" }).catch(() => {});
			this.lastCtrlC = now;
			this.tui.requestRender();
			return true;
		}
		if (matchesKey(data, "escape") && this.busy) {
			void this.d.agent.request({ type: "abort" }).catch(() => {});
			return true;
		}
		if (matchesKey(data, "ctrl+o")) {
			this.expanded = !this.expanded;
			this.tui.requestRender();
			return true;
		}
		return false;
	}

	private switchMode(): void {
		void this.d.agent.request({ type: "prompt", message: this.mode === "researcher" ? "/librarian" : "/researcher" }).catch(() => {});
	}

	/** What is in the editor (for tests and for the screens that fill it). */
	editorText(): string {
		return this.editor.getText();
	}

	async quit(): Promise<void> {
		await this.stop();
		this.d.onQuit?.(0);
	}

	/** A line from the editor: /quit ends the client, everything else goes to pi (as a follow-up while pi is busy). */
	async submit(text: string): Promise<void> {
		const line = text.trim();
		if (!line) return;
		this.editor.addToHistory?.(line);
		this.editor.setText("");
		if (/^\/(quit|exit)\s*$/.test(line)) return void (await this.quit());
		const unavailable = /^\/(login|logout|settings|tree|resume|fork|share|export|import|hotkeys|reload)\b/.exec(line);
		if (unavailable) {
			this.notice("info", this.lang === "pt" ? `/${unavailable[1]} não existe em subsub tui. Use subsub no terminal ou subsub web.` : `/${unavailable[1]} is not in subsub tui. Use subsub in the terminal, or subsub web.`);
			return void this.tui.requestRender();
		}
		const own: Record<string, () => Promise<void> | void> = { "/restart": () => this.restart(), "/model": () => this.openModels(), "/notes": () => this.openNotes(), "/library": () => this.openLibrary(), "/actions": () => this.openActions(), "/sessions": () => this.openSessions(), "/new": () => this.newConversation() };
		if (own[line]) return void (await own[line]());
		try {
			await this.d.agent.request({ type: "prompt", message: line, ...(this.busy ? { streamingBehavior: "followUp" } : {}) });
		} catch (err) {
			this.notice("error", (err as Error).message);
			this.tui.requestRender();
		}
	}
}

// ---------------------------------------------------------------- the command

export interface TuiFlags {
	scheme?: Scheme;
	librarian: boolean;
	here: boolean;
	piArgs: string[];
}

export function parseTuiArgs(args: string[]): TuiFlags {
	const f: TuiFlags = { librarian: false, here: false, piArgs: [] };
	for (const a of args) {
		if (a === "--light") f.scheme = "light";
		else if (a === "--dark") f.scheme = "dark";
		else if (a === "--librarian") f.librarian = true;
		else if (a === "--here") f.here = true;
		else f.piArgs.push(a);
	}
	return f;
}

/** `subsub tui`: start pi in RPC mode and draw it on the whole terminal; resolves with the exit code when the user quits. */
export async function runTui(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		process.stderr.write("subsub tui needs a terminal. In a script, use subsub web or the pi RPC mode.\n");
		return 1;
	}
	const flags = parseTuiArgs(args);
	const home = homedir();
	const cfg = loadConfig(env);
	env.PI_CODING_AGENT_DIR = agentDirFor(env, home);
	const cwd = chooseCwd(process.cwd(), home, cfg.vault, flags.here);
	const scheme = flags.scheme ?? schemeFromEnv(env);
	const words = await loadWords().catch(() => undefined);
	const bin = join(PACKAGE_DIR, "bin", "subsub.js");
	const agent = new Agent(process.execPath, [bin, "--mode", "rpc", "--here", ...(flags.librarian ? ["--librarian"] : []), ...flags.piArgs], cwd, { ...env, SUBSUB_TUI: "1" });
	const themesDir = join(PACKAGE_DIR, "themes");
	const { SessionManager } = await import("@earendil-works/pi-coding-agent");
	return await new Promise<number>((resolve) => {
		const app = new TuiApp({
			terminal: new ProcessTerminal(),
			agent,
			version: packageVersion(),
			lang: uiLanguage(cfg.language),
			cwd,
			palette: (base) => loadPalette(themesDir, base, scheme),
			glyphs: chooseGlyphs(env),
			words,
			vault: cfg.vault,
			quote: cfg.quotes === false ? undefined : QUOTES[Math.floor(Math.random() * QUOTES.length)],
			reduceMotion: Boolean(env.SUBSUB_REDUCE_MOTION && env.SUBSUB_REDUCE_MOTION !== "0"),
			themes: { researcher: typeof cfg.themes === "string" ? cfg.themes : undefined, librarian: cfg.themesLibrarian ?? (typeof cfg.themes === "string" ? cfg.themes : undefined) },
			sessions: async () => (await SessionManager.list(cwd)).filter((s) => s.messageCount > 0).sort((a, b) => +new Date(b.modified) - +new Date(a.modified)).map((s) => ({ title: s.name ?? s.firstMessage.slice(0, 60), path: s.path })),
			onQuit: resolve,
		});
		void app.start();
	});
}

