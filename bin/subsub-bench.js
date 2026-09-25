#!/usr/bin/env node
// Model test for Sub-Sub. See docs/Subsub.md.
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
	console.error(`subsub-bench needs Node.js 22.19 or later (this is ${process.versions.node}).`);
	process.exit(1);
}
const { main } = await import("../src/bench.ts");
try {
	await main();
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}
