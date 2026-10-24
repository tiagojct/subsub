// Stages the web view for screenshots.py: a scripted fake model, the fake Zotero of the tests and an empty vault.
// node site/scripts/stage-web.mjs <en|pt> prints the address of the view. The papers are invented.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ZLM = process.env.ZLM_DIR ?? join(homedir(), "Projects", "zotero-local-mcp");
const lang = process.argv[2] === "pt" ? "pt" : "en";

const ANSWER = {
	en: `You have **4 items** on home spirometry. Two are cohorts in children; one is a systematic review from 2024.

| Citekey | Year | Title | Design |
|---|---|---|---|
| \`smith2021\` | 2021 | Home spirometry in children with asthma | cohort |
| \`okafor2023\` | 2023 | Remote monitoring after lung transplant | cohort |
| \`lind2020\` | 2020 | Agreement of home and clinic FEV1 | cross-sectional |
| \`reyes2024\` | 2024 | Home spirometry: a systematic review | systematic review |

PubMed has 38 works on the topic since 2024. Three look relevant and are not in your library:

1. Bauer et al. 2025, *Unsupervised spirometry in primary care*, Thorax.
2. Nunes et al. 2024, *Quality grading of home FEV1 manoeuvres*, ERJ Open Res.
3. Kim et al. 2025, *Home spirometry after COVID-19*, Respir Med.

Shall I import them? You will see a preview first. To read one of your items with guidance, type \`/read smith2021\`.`,
	pt: `Tem **4 itens** sobre espirometria em casa. Dois são coortes em crianças; um é uma revisão sistemática de 2024.

| Citekey | Ano | Título | Desenho |
|---|---|---|---|
| \`smith2021\` | 2021 | Home spirometry in children with asthma | coorte |
| \`okafor2023\` | 2023 | Remote monitoring after lung transplant | coorte |
| \`lind2020\` | 2020 | Agreement of home and clinic FEV1 | transversal |
| \`reyes2024\` | 2024 | Home spirometry: a systematic review | revisão sistemática |

A PubMed tem 38 obras sobre o tema desde 2024. Três parecem relevantes e não estão na sua biblioteca:

1. Bauer et al. 2025, *Unsupervised spirometry in primary care*, Thorax.
2. Nunes et al. 2024, *Quality grading of home FEV1 manoeuvres*, ERJ Open Res.
3. Kim et al. 2025, *Home spirometry after COVID-19*, Respir Med.

Quer que as importe? Vê primeiro uma pré-visualização. Para ler um dos seus itens com orientação, escreva \`/read smith2021\`.`,
};

let turn = 0;
function sse(res, chunks) {
	res.writeHead(200, { "Content-Type": "text/event-stream" });
	for (const c of chunks) res.write(`data: ${JSON.stringify(c)}\n\n`);
	res.write("data: [DONE]\n\n");
	res.end();
}
const model = createServer((req, res) => {
	let body = "";
	req.on("data", (c) => (body += c));
	req.on("end", () => {
		const json = JSON.parse(body || "{}");
		const msgs = json.messages ?? [];
		const last = msgs[msgs.length - 1];
		const base = { id: `c${++turn}`, object: "chat.completion.chunk", created: 0, model: "fake-model" };
		const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
		const tool = (name, args) => sse(res, [
			{ ...base, choices: [{ index: 0, delta: { role: "assistant", content: null, tool_calls: [{ index: 0, id: `call_${turn}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: null }] },
			{ ...base, choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }], usage },
		]);
		const text = (t) => sse(res, [
			{ ...base, choices: [{ index: 0, delta: { role: "assistant", content: t }, finish_reason: null }] },
			{ ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage },
		]);
		const user = JSON.stringify([...msgs].reverse().find((m) => m.role === "user")?.content ?? "");
		if (last?.role === "user" && /spirometr|espirometria/i.test(user)) return tool("zotero_find_items", { query: "spirometry", limit: 25 });
		if (last?.role === "user" && /tag|etiquet/i.test(user)) return tool("zotero_tag_items", { changes: [{ key: "AAAA2222", add: ["topic/spirometry"] }, { key: "BBBB3333", add: ["topic/asthma", "status/to-read"], remove: ["status/read"] }], dry_run: false });
		if (/tag/i.test(user) || /etiquet/i.test(user)) return text(lang === "pt" ? "Etiquetei 2 itens. O botão Anular está junto à alteração." : "Tagged 2 items. Undo is next to the change.");
		return text(ANSWER[lang]);
	});
});
await new Promise((r) => model.listen(0, "127.0.0.1", r));
const modelUrl = `http://127.0.0.1:${model.address().port}/v1`;

const python = process.platform === "win32" ? join(ZLM, ".venv", "Scripts", "python.exe") : join(ZLM, ".venv", "bin", "python");
const zotero = spawn(python, [join(ROOT, "test", "fixtures", "fake_zotero_server.py"), join(ZLM, "tests")]);
const zoteroUrl = await new Promise((r) => zotero.stdout.once("data", (d) => r(d.toString().trim())));

const work = mkdtempSync(join(tmpdir(), "subsub-stage-"));
const vault = join(work, "vault");
for (const d of ["Zotero", "Inbox", "Literature", "Research"]) mkdirSync(join(vault, d), { recursive: true });
writeFileSync(join(vault, "Zotero", "Zotero tags.md"), "---\nrequired_facets: topic, status\nsingle_facets: status\n---\n## topic\n- `topic/spirometry` Spirometry.\n- `topic/asthma` Asthma.\n## status\n- `status/to-read`\n- `status/read`\n");
writeFileSync(join(vault, "Zotero", "Zotero agent.md"), "Shared rules.");
const home = join(work, "home");
const agentDir = join(home, ".subsub", "agent");
mkdirSync(agentDir, { recursive: true });
writeFileSync(join(agentDir, "models.json"), JSON.stringify({ providers: { fake: { baseUrl: modelUrl, api: "openai-completions", apiKey: "test", models: [{ id: "mimo-v2.6-pro" }] } } }));
writeFileSync(join(work, "subsub.json"), JSON.stringify({ serverDir: ZLM, vault, models: {}, defaultMode: "researcher", language: lang === "pt" ? "Portuguese" : "English" }));
const env = {
	...process.env, HOME: home, USERPROFILE: home, SUBSUB_AGENT_DIR: agentDir, PI_OFFLINE: "1", PI_SKIP_VERSION_CHECK: "1", PI_TELEMETRY: "0",
	SUBSUB_CONFIG: join(work, "subsub.json"), ZOTERO_MCP_ENV: join(work, "no-such.env"), ZOTERO_API_URL: zoteroUrl,
	ZOTERO_VOCAB: join(vault, "Zotero", "Zotero tags.md"), ZOTERO_VAULT: vault, ZOTERO_MCP_STATE: join(work, "state"),
};
delete env.PI_CODING_AGENT_DIR;
const web = spawn(process.execPath, [join(ROOT, "bin", "subsub.js"), "web", "--no-open", "--idle", "0", "--provider", "fake", "--model", "mimo-v2.6-pro"], { cwd: vault, env, stdio: ["ignore", "inherit", "inherit"] });
const stop = () => { web.kill(); zotero.kill(); model.close(); process.exit(0); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
web.on("exit", stop);