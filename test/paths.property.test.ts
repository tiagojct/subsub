/**
 * Randomised tests of the path gate: thousands of spellings of paths inside and outside the
 * vault (dot segments, doubled slashes, case changes, decomposed accents, "@", "file://", a link
 * out of the vault) are judged by the gate and by a plain model of the rules; both must agree.
 * The seed is fixed, so a failure repeats; the message shows the path.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { buildPolicy, isSecret, judgePath, normalizeToolPath } from "../src/paths.ts";

const FOLD = process.platform === "darwin";

/** A small seeded random generator (mulberry32). */
function rng(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const SETTINGS = new Set(["zotero tags.md", "zotero agent.md", "literature alerts.md"]);

/** The rules in plain terms, on the resolved path: inside the vault, not through the link, not hidden, not a settings file. */
function expected(abs: string, vault: string): boolean {
	const norm = (p: string) => (FOLD ? p.normalize("NFC").toLowerCase() : p.normalize("NFC"));
	const v = norm(vault);
	const a = norm(abs);
	if (a !== v && !a.startsWith(v + sep)) return false;
	const parts = relative(v, a).split(sep).filter(Boolean);
	if (parts[0]?.toLowerCase() === "shortcut") return false;
	if (parts.some((p) => p.startsWith("."))) return false;
	if (["zotero", "systems"].includes(parts[0]?.toLowerCase() ?? "") && parts.length >= 2 && SETTINGS.has(parts[1].toLowerCase())) return false;
	return true;
}

const SEGMENTS = ["Literature", "Zotero", "Systems", ".obsidian", "Café", "Shortcut", "..", ".", "", "notes", ".git", "Zotero agent.md", "Zotero tags.md", "x.md"];

function spell(r: () => number, vault: string, root: string): string {
	const pick = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
	const n = 1 + Math.floor(r() * 5);
	let tail = Array.from({ length: n }, () => pick(SEGMENTS)).join("/");
	if (r() < 0.3) tail += "/note.md";
	if (r() < 0.3) tail = tail.replace(/Café/g, "Café"); // the same name with a decomposed accent
	if (FOLD && r() < 0.3) tail = tail.toUpperCase();
	let p = `${r() < 0.7 ? vault : root}/${tail}`;
	if (r() < 0.2) p = p.replace(/\//g, "//");
	const form = r();
	if (form < 0.1) return `@${p}`;
	if (form < 0.2) return pathToFileURL(resolve(p)).href;
	if (form < 0.4) return relative(root, p) || ".";
	return p;
}

test("path gate: random spellings agree with the rules", () => {
	if (process.platform === "win32") return; // links and separators here are POSIX; Windows has its own cases in unit.test.ts
	const root = realpathSync(mkdtempSync(join(tmpdir(), "subsub-prop-")));
	const vault = join(root, "Vault");
	const outside = join(root, "Outside");
	for (const d of [join(vault, "Literature"), join(vault, "Zotero"), join(vault, ".obsidian"), join(vault, "Café"), outside]) mkdirSync(d, { recursive: true });
	writeFileSync(join(vault, "Zotero", "Zotero agent.md"), "rules");
	symlinkSync(outside, join(vault, "Shortcut"), "dir");
	const policy = buildPolicy({ vault, cwd: root, serverDir: join(root, "server"), packageDir: join(root, "pkg") });
	// The temporary root is outside the home folder, so only the vault is allowed.
	const r = rng(20261007);
	for (let i = 0; i < 3000; i++) {
		const raw = spell(r, vault, root);
		const plain = raw.startsWith("file://") ? fileURLToPath(raw) : raw.replace(/^@/, "");
		const got = judgePath(normalizeToolPath(raw, root), policy).ok;
		const want = expected(resolve(root, plain), vault);
		assert.equal(got, want, `${raw}: the gate ${got ? "allows it" : "asks"}, the rules say ${want ? "allow" : "ask"}`);
	}
});

test("secret files: spellings of a protected file are all secret", () => {
	if (process.platform === "win32") return;
	const root = realpathSync(mkdtempSync(join(tmpdir(), "subsub-sec-")));
	const agent = join(root, "agent");
	mkdirSync(join(root, "x"), { recursive: true });
	mkdirSync(agent);
	writeFileSync(join(agent, "auth.json"), "{}");
	const before = process.env.SUBSUB_AGENT_DIR;
	process.env.SUBSUB_AGENT_DIR = agent;
	try {
		const file = join(agent, "auth.json");
		const spellings = [file, file.replace(/\//g, "//"), `${root}/x/../agent/auth.json`, `${root}/./agent/./auth.json`, `@${file}`, pathToFileURL(file).href, "agent/auth.json"];
		if (FOLD) spellings.push(file.replace("auth", "AUTH"), file.replace("agent", "Agent"));
		for (const s of spellings) assert.ok(isSecret(normalizeToolPath(s, root)), s);
		// A search of a folder that holds a secret file is refused too.
		assert.ok(isSecret(normalizeToolPath(".", root), true));
		const r = rng(7);
		for (let i = 0; i < 200; i++) {
			const name = `n${Math.floor(r() * 1e6)}.md`;
			assert.ok(!isSecret(normalizeToolPath(name, root)), name);
		}
	} finally {
		if (before === undefined) delete process.env.SUBSUB_AGENT_DIR;
		else process.env.SUBSUB_AGENT_DIR = before;
	}
});
