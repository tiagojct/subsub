#!/usr/bin/env node
// Model test for Sub-Sub. See docs/Subsub.md.
import { fileURLToPath } from "node:url";
// Inside node_modules (an npm install), Node cannot strip types: use the compiled dist/.
// From a checkout (npm link), run the TypeScript sources directly.
const installed = fileURLToPath(import.meta.url).split(/[\\/]/).includes("node_modules");
const entry = (name) => (installed ? `../dist/${name}.js` : `../src/${name}.ts`);
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
	console.error(`subsub-bench needs Node.js 22.19 or later (this is ${process.versions.node}).`);
	process.exit(1);
}
const { main } = await import(entry("bench"));
try {
	await main();
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}
