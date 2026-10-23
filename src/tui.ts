/**
 * `subsub tui`: Sub-Sub in the whole terminal. A client of pi's RPC mode, like the web view: pi runs as a child process with the Sub-Sub extension
 * (src/rpc.ts), and this file draws what it says on a full-screen pi-tui screen (a transcript that scrolls, a side panel from 110 columns, the
 * editor and the footer), and answers its dialogs. The look is that of `subsub` (src/chrome.ts, src/screens.ts, src/dialogs.ts); the colours are
 * read from themes/, because RPC mode has no pi theme to share.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { CombinedAutocompleteProvider, Editor, HStack, Markdown, matchesKey, ProcessTerminal, ScrollView, type Component, type SlashCommand, type Terminal, TuiAltScreen, VStack } from "@earendil-works/pi-tui";
import { agentDirFor, chooseCwd, PACKAGE_DIR, packageVersion } from "./cli.ts";
import { fill, footerLines } from "./chrome.ts";
import { loadConfig, uiLanguage } from "./config.ts";
import { type LibraryState, LIBRARIAN_THEME, DEFAULT_THEME, QUOTES } from "./look.ts";
import { PURPOSES } from "./read.ts";
import { Agent, isDialog, Side, withHints } from "./rpc.ts";
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
		await this.load();
	}

	/** The conversation, the commands and the usage of the session that pi has open. */
	async load(): Promise<void> {
		try {
			const state = await this.d.agent.request({ type: "get_state" });
			this.model = state?.model?.id ?? this.model;
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
		const own: SlashCommand[] = [
			{ name: "quit", description: this.lang === "pt" ? "Sair" : "Quit" },
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
			this.conversations = list.slice(0, 12).map((s, i) => ({ title: SHORT(s.title || "...", SIDE_WIDTH - 4), open: i === 0 }));
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
		this.notice("error", `${this.lang === "pt" ? "O pi parou" : "pi stopped"} (${code}). ${this.d.agent.stderr.slice(-300).trim()}`);
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
	 * A dialog of the extension: nothing is applied without an answer, and no answer is a no. The approval screen, lists and questions
	 * are in the next phases; until then every dialog is declined, so that a change of the library cannot happen by accident.
	 */
	protected dialog(ev: any): void {
		this.d.agent.write({ type: "extension_ui_response", id: ev.id, ...(ev.method === "confirm" ? { confirmed: false } : { cancelled: true }) });
	}

	// ---------------------------------------------------------------- input

	/** Keys that count whatever has the focus. Returns true when the key is used. */
	private globalKey(data: string): boolean {
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
			quote: cfg.quotes === false ? undefined : QUOTES[Math.floor(Math.random() * QUOTES.length)],
			reduceMotion: Boolean(env.SUBSUB_REDUCE_MOTION && env.SUBSUB_REDUCE_MOTION !== "0"),
			themes: { researcher: typeof cfg.themes === "string" ? cfg.themes : undefined, librarian: cfg.themesLibrarian ?? (typeof cfg.themes === "string" ? cfg.themes : undefined) },
			sessions: async () => (await SessionManager.list(cwd)).filter((s) => s.messageCount > 0).sort((a, b) => +new Date(b.modified) - +new Date(a.modified)).map((s) => ({ title: s.name ?? s.firstMessage.slice(0, 60), path: s.path })),
			onQuit: resolve,
		});
		void app.start();
	});
}

