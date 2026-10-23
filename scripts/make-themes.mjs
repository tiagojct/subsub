#!/usr/bin/env node
// Writes the pi themes of Sub-Sub (themes/subsub-<name>-<scheme>.json) from the colours in the front matter of
// DESIGN.md and the role map in scripts/plate.json. The Researcher uses Prussian blue as its accent (glauca), the
// Librarian madder (try-works). Errors have no colour of their own, removals are muted ink (the strike-through is
// drawn by the code), and every meaning also has a glyph or a word, so the themes work for readers who do not see the washes.
//
//   node scripts/make-themes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json";

/** The `colors:` block of the DESIGN.md front matter as {token: "#rrggbb"}. */
export function designColors(markdown) {
	const colors = {};
	let inBlock = false;
	for (const line of markdown.split("\n")) {
		if (/^colors:\s*$/.test(line)) inBlock = true;
		else if (inBlock && /^\S/.test(line)) break;
		else if (inBlock) {
			const m = line.match(/^\s+([a-z0-9-]+):\s*"(#[0-9a-fA-F]{6})"\s*$/);
			if (m) colors[m[1]] = m[2].toLowerCase();
		}
	}
	return colors;
}


const CUBE = [0, 95, 135, 175, 215, 255];
/** The RGB of an xterm-256 colour index from 16 to 255 (the 16 system colours depend on the terminal). */
export function xterm256(i) {
	if (i >= 232) return [8 + (i - 232) * 10, 8 + (i - 232) * 10, 8 + (i - 232) * 10];
	const n = i - 16;
	return [CUBE[Math.floor(n / 36)], CUBE[Math.floor(n / 6) % 6], CUBE[n % 6]];
}
const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const luminance = (rgb) => {
	const [r, g, b] = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrastRatio(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** The xterm-256 index nearest to a colour that reaches `min` contrast against `against` (the closest index with enough contrast, or the one with the most). */
export function nearest256(hex, against, min) {
	const want = toRgb(hex);
	const ranked = [];
	for (let i = 16; i < 256; i++) {
		const c = xterm256(i);
		ranked.push({ i, d: (c[0] - want[0]) ** 2 * 0.3 + (c[1] - want[1]) ** 2 * 0.59 + (c[2] - want[2]) ** 2 * 0.11, k: against ? contrastRatio(c, against) : Infinity });
	}
	ranked.sort((a, b) => a.d - b.d);
	return (ranked.find((r) => r.k >= min) ?? ranked.sort((a, b) => b.k - a.k)[0]).i;
}

// Contrast that each colour variable needs against the terminal's own background: text 4.5, lines and bullets 3, rules none.
const NEEDS = { ink: 4.5, muted: 4.5, faint: 4.5, prussian: 4.5, madder: 4.5, sap: 4.5, gamboge: 4.5, mark: 3, rule: 0 };
// Roles whose background is left to the terminal in the 256-colour themes: a wash that is quantised to the cube loses its contrast.
const DEFAULT_BG = ["userMessageBg", "customMessageBg", "toolPendingBg", "toolSuccessBg", "toolErrorBg", "searchMatchBg"];

/** The same theme with xterm-256 indexes, for terminals without truecolor. */
function to256(theme) {
	const v = theme.vars;
	const sheet = toRgb(v.sheet);
	const vars = {};
	for (const name of Object.keys(NEEDS)) vars[name] = nearest256(v[name], sheet, NEEDS[name]);
	vars.accent = vars[Object.keys(NEEDS).find((n) => v[n] === v.accent)];
	// The selection needs the text colour to stay readable on it.
	vars.wash = nearest256(v.wash, xterm256(vars.ink), 4.5);
	const colors = { ...theme.colors };
	for (const r of DEFAULT_BG) colors[r] = "";
	return { ...theme, name: `${theme.name}-256`, vars, colors, export: theme.export };
}

/** {"subsub-glauca-dark": theme, "subsub-glauca-dark-256": theme, ...} for every theme and scheme of the plate file. */
export function buildThemes(designMd, plate) {
	const design = designColors(designMd);
	const out = {};
	for (const [name, mode] of Object.entries(plate.themes)) {
		for (const scheme of ["dark", "light"]) {
			const vars = {};
			for (const [v, key] of Object.entries(plate.tokens[scheme])) {
				if (!design[key]) throw new Error(`DESIGN.md has no colour "${key}" (${scheme} ${v})`);
				vars[v] = design[key];
			}
			vars.accent = vars[mode.accent];
			vars.wash = vars[mode.wash];
			const colors = {};
			for (const [role, ref] of Object.entries(plate.roles)) colors[role] = ref === "$accent" ? "accent" : ref === "$wash" ? "wash" : ref;
			const id = `subsub-${name}-${scheme}`;
			out[id] = { $schema: SCHEMA, name: id, vars, colors, export: { pageBg: vars.sheet, cardBg: vars.field, infoBg: vars.sunk } };
			out[`${id}-256`] = to256(out[id]);
		}
	}
	return out;
}

function main() {
	const design = fs.readFileSync(path.join(ROOT, "DESIGN.md"), "utf8");
	const plate = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "plate.json"), "utf8"));
	fs.mkdirSync(path.join(ROOT, "themes"), { recursive: true });
	for (const [id, theme] of Object.entries(buildThemes(design, plate))) {
		fs.writeFileSync(path.join(ROOT, "themes", `${id}.json`), JSON.stringify(theme, null, "\t") + "\n");
		console.log(`themes/${id}.json`);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
