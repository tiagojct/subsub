#!/usr/bin/env node
// Sub-Sub: pi set up as a Zotero librarian and research assistant.
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
	console.error(`Sub-Sub needs Node.js 22.19 or later (this is ${process.versions.node}).`);
	process.exit(1);
}
const { run } = await import("../src/cli.ts");
await run();
