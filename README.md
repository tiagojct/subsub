# Sub-Sub

A Zotero librarian and research assistant for the [pi](https://pi.dev) coding agent.

> "This mere painstaking burrower and grub-worm of a poor devil of a Sub-Sub appears to have gone through the long Vaticans and street-stalls of the earth, picking up whatever random allusions to whales he could anyways find in any book whatsoever." (Moby-Dick, Extracts)

Sub-Sub is a pi package. It starts the two MCP servers of [zotero-local-mcp](../zotero-local-mcp) and adds:

- **Two modes.** `/librarian` changes the library (tags, imports, metadata, PDFs, notes) and has no web access. `/researcher` reads the library, searches PubMed and OpenAlex, writes notes in the vault, and can only add short linked notes to Zotero. Each mode has its own tool set and model. `bash` is off in both.
- **An approval gate in code.** When the model calls a library write with `dry_run=false`, Sub-Sub first asks the server for the preview (dry run), shows it in a dialog, and lets the call run only after you approve. Without an interactive UI, writes are blocked. The model cannot skip this.
- **Commands.** `/subsub` (connection and library overview), `/history`, `/undo` (preview, confirm, apply).
- **Prompt templates.** `/tag-batch`, `/clean-tags`, `/import-queue`, `/lit-note`, `/synthesis`, `/gaps`, `/manuscript`, `/alert`.
- **A lean prompt.** pi's short base prompt, plus the role text, plus the shared rules from the vault (`Systems/Zotero agent.md`), plus the vault conventions (`.claude/CLAUDE.md`) when pi runs in the vault.

All library safety (dry runs, version checks, journal and undo, vocabulary, the researcher's note-only client) stays in the Python servers.

## Requirements

- pi 0.87 or later (`npm install -g @earendil-works/pi-coding-agent`), Node 22.19 or later
- zotero-local-mcp in `~/Projects/zotero-local-mcp`, with `uv sync` done
- Zotero 10 running, with local API access enabled
- An OpenCode Go key (pi has a built-in `opencode-go` provider)

## Install

```sh
cd ~/Projects/subsub
npm install --omit=dev
pi install ~/Projects/subsub
```

In pi, run `/login`, select OpenCode Zen and Go, and paste the key. Or set `OPENCODE_API_KEY`.

## Configuration

No file is needed. Defaults:

| Setting | Default |
|---|---|
| `serverDir` | `~/Projects/zotero-local-mcp` |
| `envFile` | `$ZOTERO_MCP_ENV`, `~/.config/zotero-local-mcp/env`, or `~/.config/opencode/zotero.env` (first that exists) |
| `vault` | `ZOTERO_VAULT` from the env file |
| `models` | librarian `opencode-go/glm-5.3-flash`, researcher `opencode-go/mimo-v2.6-pro` |
| `defaultMode` | `researcher` (start with `pi --librarian` for the librarian) |

To change them, write `~/.config/subsub/config.json` (or point `SUBSUB_CONFIG` at a file), for example:

```json
{ "models": { "researcher": "opencode-go/deepseek-v4-pro" }, "defaultMode": "librarian" }
```

## Tests

```sh
npm install
npm test                                   # unit tests with a mock pi
ZLM_DIR=~/Projects/zotero-local-mcp npm run test:e2e
```

The end-to-end test runs the real pi in RPC mode with Sub-Sub, the real Python servers, a fake Zotero and a scripted fake model. It checks the tool sets per mode, the system prompt, the preview dialog, an approved change and a declined change.
