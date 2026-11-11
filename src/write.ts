/**
 * Writes of Sub-Sub's own files (settings, keys, the web view's running file). Each write goes to a
 * temporary file next to the target and is then renamed over it, so a crash or a full disk never
 * leaves half a file. A link (a shared pi auth.json) is followed: the file it points to is replaced,
 * and the link stays. A private file (keys) is readable only by the user, also when it existed before.
 */

import { chmodSync, existsSync, lstatSync, mkdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname } from "node:path";

export function writeFileSafe(file: string, text: string, opts: { private?: boolean } = {}): void {
	let target = file;
	try {
		if (lstatSync(file).isSymbolicLink()) target = realpathSync(file);
	} catch {
		/* a new file, or a broken link: write the path as given */
	}
	mkdirSync(dirname(target), { recursive: true });
	// Keep the mode of a file that is there (another user's choice), unless it holds keys.
	const mode = opts.private ? 0o600 : existsSync(target) ? statSync(target).mode & 0o777 : 0o644;
	const tmp = `${target}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
	try {
		writeFileSync(tmp, text, { mode });
		chmodSync(tmp, mode); // the umask may have taken bits away from a kept mode
		renameSync(tmp, target);
	} catch (err) {
		rmSync(tmp, { force: true });
		throw err;
	}
}
