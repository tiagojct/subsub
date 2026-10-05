import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

const ROOT = import.meta.dirname;
const PKG = path.join(ROOT, "..");

export default function (eleventyConfig) {
	// Files served as they are: styles, fonts, scripts and the two installers.
	eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
	eleventyConfig.addPassthroughCopy({ "src/install.sh": "install.sh" });
	eleventyConfig.addPassthroughCopy({ "src/install.ps1": "install.ps1" });

	// A short hash of the styles and scripts, appended to their URLs as ?v=, so that
	// Cloudflare or a browser never serves an old copy after a deploy.
	const hash = createHash("sha256");
	for (const dir of ["src/assets/css", "src/assets/js"]) {
		for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) hash.update(fs.readFileSync(path.join(ROOT, dir, f)));
	}
	eleventyConfig.addGlobalData("assetVersion", hash.digest("hex").slice(0, 10));

	// Versions come from the package, so the site always names the current release.
	const pkg = JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8"));
	const config = fs.readFileSync(path.join(PKG, "src", "config.ts"), "utf8");
	eleventyConfig.addGlobalData("release", {
		version: pkg.version,
		name: pkg.name,
		server: (config.match(/SERVER_VERSION = "([^"]+)"/) || [])[1],
		pi: (pkg.peerDependencies || {})["@earendil-works/pi-coding-agent"] || (pkg.dependencies || {})["@earendil-works/pi-coding-agent"],
	});

	const md = markdownIt({ html: true, typographer: false }).use(markdownItAnchor, {
		level: [2, 3],
		// Plain ASCII ids: "Formulário" gets #formulario, not #formul%C3%A1rio.
		slugify: (s) => eleventyConfig.getFilter("slugify")(s),
		permalink: markdownItAnchor.permalink.headerLink({ safariReaderFix: true }),
	});
	eleventyConfig.setLibrary("md", md);

	eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

	return {
		dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
	};
}
