/**
 * Files that the web view and the terminal screens open: which file a link may point to, which notes exist, and the system's
 * default program. Moved out of web.ts so that the terminal does not import the web server.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { expand } from "./config.ts";
import { NOTE_DIRS, SETTINGS_DIR } from "./layout.ts";
import { realish, within } from "./paths.ts";

/** Files that the Open button may hand to the system (never programs or scripts). */
export const OPENABLE = new Set([".md", ".markdown", ".txt", ".pdf", ".bib", ".csv", ".qmd"]);

/** A file inside the working folder or the Sub-Sub folder, judged by its real path, so a link cannot point outside. */
export function allowedFile(raw: string, cwd: string, vault?: string): string | undefined {
	// expand() resolves against the process folder: use it for "~" only.
	const target = resolve(cwd, raw.startsWith("~") ? expand(raw) : raw);
	const real = realish(target);
	const inside = within(real, realish(cwd)) || Boolean(vault && within(real, realish(vault)));
	return inside && existsSync(target) && statSync(target).isFile() ? target : undefined;
}

/** The note a [[wikilink]] names: the first <folder>/<name>.md in the Sub-Sub folder, as Obsidian would find it. */
export function wikilinkTarget(name: string, root: string): string | undefined {
	const file = name.endsWith(".md") ? name : `${name}.md`;
	return ["", ...NOTE_DIRS, SETTINGS_DIR].map((d) => join(root, d, file)).find((f) => existsSync(f));
}

/** The notes in the Sub-Sub folders, newest first (dot folders such as Research/.plans left out). */
export function listNotes(root: string, max = 300): Array<{ path: string; rel: string; modified: number }> {
	const out: Array<{ path: string; rel: string; modified: number }> = [];
	for (const d of [...NOTE_DIRS, SETTINGS_DIR]) {
		let names: string[] = [];
		try {
			names = readdirSync(join(root, d), { recursive: true }) as string[];
		} catch {
			continue;
		}
		for (const n of names) {
			if (!n.endsWith(".md") || n.split(/[\\/]/).some((x) => x.startsWith("."))) continue;
			const path = join(root, d, n);
			out.push({ path, rel: join(d, n), modified: statSync(path).mtimeMs });
		}
	}
	return out.sort((a, b) => b.modified - a.modified).slice(0, max);
}

/** Open a URL or a file with the system's default program. */
export function openExternal(target: string): void {
	const opts = { detached: true, stdio: "ignore" as const, windowsHide: true };
	let child: ChildProcess;
	if (process.platform === "darwin") child = spawn("open", [target], opts);
	// rundll32 hands the target to the default program without cmd.exe parsing it.
	else if (process.platform === "win32") child = spawn("rundll32", ["url.dll,FileProtocolHandler", target], opts);
	else child = spawn("xdg-open", [target], opts);
	child.on("error", () => {});
	child.unref();
}
