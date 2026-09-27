/**
 * `subsub shortcut`: a Sub-Sub shortcut that opens the web view, so students
 * can start Sub-Sub without a terminal.
 *
 * - macOS: ~/Applications/Sub-Sub.app (a small app bundle that runs `subsub web`;
 *   no Dock icon, it stops by itself when the page has been closed for a while).
 * - Windows: Sub-Sub in the Start menu and on the desktop.
 * - Linux: ~/.local/share/applications/sub-sub.desktop.
 *
 * The shortcut runs this copy of Sub-Sub with this Node.js (absolute paths), so
 * it works without PATH. Run `subsub shortcut` again after moving either.
 * `subsub shortcut --remove` removes what this command created.
 */

import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PACKAGE_DIR, packageVersion } from "./cli.ts";

export interface ShortcutPlan {
	platform: NodeJS.Platform;
	node: string;
	bin: string;
	home: string;
	packageDir: string;
	desktop: boolean;
}

export function planFor(env: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform, desktop = true): ShortcutPlan {
	const home = platform === "win32" ? (env.USERPROFILE ?? homedir()) : (env.HOME ?? homedir());
	return { platform, node: process.execPath, bin: join(PACKAGE_DIR, "bin", "subsub.js"), home, packageDir: PACKAGE_DIR, desktop };
}

/** Single-quote a string for sh. */
export function shQuote(s: string): string {
	return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** Quote an argument for the Exec line of a .desktop file. */
export function desktopQuote(s: string): string {
	return `"${s.replace(/(["`$\\])/g, "\\$1")}"`;
}

/** Single-quote a string for PowerShell. */
export function psQuote(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

export function macScript(p: ShortcutPlan): string {
	return [
		"#!/bin/sh",
		"# Opens Sub-Sub in the browser. Written by: subsub shortcut",
		'cd "$HOME" || exit 1',
		`exec ${shQuote(p.node)} ${shQuote(p.bin)} web >/dev/null 2>&1`,
		"",
	].join("\n");
}

export function macPlist(version: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleName</key><string>Sub-Sub</string>
	<key>CFBundleDisplayName</key><string>Sub-Sub</string>
	<key>CFBundleIdentifier</key><string>eu.tiagojacinto.subsub</string>
	<key>CFBundleExecutable</key><string>Sub-Sub</string>
	<key>CFBundleIconFile</key><string>icon</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleShortVersionString</key><string>${version}</string>
	<key>CFBundleVersion</key><string>${version}</string>
	<key>LSUIElement</key><true/>
</dict>
</plist>
`;
}

export function desktopEntry(p: ShortcutPlan): string {
	return [
		"[Desktop Entry]",
		"Type=Application",
		"Name=Sub-Sub",
		"Comment=Zotero librarian and research assistant",
		`Exec=${desktopQuote(p.node)} ${desktopQuote(p.bin)} web`,
		`Path=${p.home}`,
		`Icon=${join(p.packageDir, "assets", "icon.png")}`,
		"Terminal=false",
		"Categories=Education;Office;",
		"",
	].join("\n");
}

export function windowsScript(p: ShortcutPlan): string {
	const lines = [
		"$ErrorActionPreference = 'Stop'",
		"$shell = New-Object -ComObject WScript.Shell",
		"$places = @([Environment]::GetFolderPath('Programs'))",
		...(p.desktop ? ["$places += [Environment]::GetFolderPath('Desktop')"] : []),
		"foreach ($dir in $places) {",
		"  $s = $shell.CreateShortcut((Join-Path $dir 'Sub-Sub.lnk'))",
		`  $s.TargetPath = ${psQuote(p.node)}`,
		`  $s.Arguments = ${psQuote(`"${p.bin}" web`)}`,
		`  $s.WorkingDirectory = ${psQuote(p.home)}`,
		`  $s.IconLocation = ${psQuote(join(p.packageDir, "assets", "icon.ico"))}`,
		"  $s.Description = 'Sub-Sub: Zotero librarian and research assistant'",
		"  $s.WindowStyle = 7",
		"  $s.Save()",
		"  Write-Output (Join-Path $dir 'Sub-Sub.lnk')",
		"}",
	];
	return lines.join("\n");
}

function runPowerShell(script: string): { ok: boolean; out: string } {
	const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], { encoding: "utf8", windowsHide: true });
	return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? r.error.message : ""}`.trim() };
}

export function createShortcuts(p: ShortcutPlan): string[] {
	if (p.platform === "darwin") {
		const app = join(p.home, "Applications", "Sub-Sub.app");
		mkdirSync(join(app, "Contents", "MacOS"), { recursive: true });
		mkdirSync(join(app, "Contents", "Resources"), { recursive: true });
		writeFileSync(join(app, "Contents", "Info.plist"), macPlist(packageVersion(p.packageDir)));
		const exe = join(app, "Contents", "MacOS", "Sub-Sub");
		writeFileSync(exe, macScript(p));
		chmodSync(exe, 0o755);
		const icns = join(p.packageDir, "assets", "icon.icns");
		if (existsSync(icns)) copyFileSync(icns, join(app, "Contents", "Resources", "icon.icns"));
		return [app];
	}
	if (p.platform === "win32") {
		const r = runPowerShell(windowsScript(p));
		if (!r.ok) throw new Error(`could not create the shortcut: ${r.out}`);
		return r.out.split(/\r?\n/).filter(Boolean);
	}
	const dir = join(p.home, ".local", "share", "applications");
	mkdirSync(dir, { recursive: true });
	const file = join(dir, "sub-sub.desktop");
	writeFileSync(file, desktopEntry(p));
	chmodSync(file, 0o755);
	return [file];
}

export function removeShortcuts(p: ShortcutPlan): string[] {
	if (p.platform === "win32") {
		const script = [
			"foreach ($dir in @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('Desktop'))) {",
			"  $f = Join-Path $dir 'Sub-Sub.lnk'",
			"  if (Test-Path $f) { Remove-Item $f; Write-Output $f }",
			"}",
		].join("\n");
		const r = runPowerShell(script);
		return r.out.split(/\r?\n/).filter(Boolean);
	}
	const target = p.platform === "darwin" ? join(p.home, "Applications", "Sub-Sub.app") : join(p.home, ".local", "share", "applications", "sub-sub.desktop");
	if (!existsSync(target)) return [];
	rmSync(target, { recursive: true, force: true });
	return [target];
}

export function shortcutMain(args: string[], env: NodeJS.ProcessEnv = process.env): number {
	const plan = planFor(env, process.platform, !args.includes("--no-desktop"));
	try {
		if (args.includes("--remove")) {
			const gone = removeShortcuts(plan);
			console.log(gone.length ? `Removed:\n${gone.join("\n")}` : "No Sub-Sub shortcut found.");
			return 0;
		}
		const made = createShortcuts(plan);
		const where =
			plan.platform === "darwin"
				? "Open Sub-Sub from Applications, Launchpad or Spotlight."
				: plan.platform === "win32"
					? "Open Sub-Sub from the Start menu or the desktop."
					: "Open Sub-Sub from your applications menu.";
		console.log(`Shortcut:\n${made.join("\n")}\n${where} It opens Sub-Sub in your browser.`);
		return 0;
	} catch (err) {
		console.error(`Sub-Sub: ${(err as Error).message}`);
		return 1;
	}
}
