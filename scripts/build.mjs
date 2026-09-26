// Compile src/ to dist/ for the npm package (Node does not run TypeScript inside node_modules).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
if (!existsSync(tsc)) {
	console.error("TypeScript is not installed. Type: npm install (without --omit=dev). Then try again.");
	process.exit(1);
}
const r = spawnSync(process.execPath, [tsc, "-p", join(root, "tsconfig.build.json")], { stdio: "inherit" });
process.exit(r.status ?? 1);
