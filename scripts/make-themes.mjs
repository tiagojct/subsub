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

/** {"subsub-glauca-dark": theme, ...} for every theme and scheme of the plate file. */
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
