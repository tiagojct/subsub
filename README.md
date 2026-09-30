# Sub-Sub

A Zotero librarian and research assistant that runs on your computer, in your browser or in your terminal. It is built on the [pi](https://pi.dev) agent and works with your own Zotero library through Zotero's local API.

> "This mere painstaking burrower and grub-worm of a poor devil of a Sub-Sub appears to have gone through the long Vaticans and street-stalls of the earth, picking up whatever random allusions to whales he could anyways find in any book whatsoever." (Moby-Dick, Extracts)

Sub-Sub has two modes:

- The librarian changes the library: tags from your own tag list, imports by DOI, PMID or ISBN, metadata repair, duplicates, retractions, open-access PDFs, notes and collections. It has no web access.
- The researcher reads the library, searches PubMed and OpenAlex, and writes notes in your notes folder. It cannot change the library, except to add a short linked note to an item.

Every library change is shown as a preview and runs only after you approve it. The model cannot skip this: the check is in the code, not in the prompt. Every change is journaled and can be undone with `/undo`.

## Profiles

A profile sets how much Sub-Sub does for you. Choose it in `subsub init` and change it with `/profile`.

| Profile | What it does |
|---|---|
| Reader | Explains each step. Reading notes are quotes with page numbers, plus questions for you to answer. No summaries or syntheses. No bulk library changes. |
| Scholar | Literature notes, syntheses, searches and alerts. The full librarian. |
| Author | Scholar, plus manuscripts: citation check against the library, bibliography for Quarto or Pandoc, comments on the argument. It does not write your paragraphs. |
| Editor | Everything, including drafting manuscript text when you ask. |

A profile is your own choice, not a lock.

## Requirements

- Zotero 10 or later, running. In Zotero, open Settings > Advanced and turn on "Allow other applications on this computer to communicate with Zotero".
- Node.js 22.19 or later.
- uv (https://docs.astral.sh/uv/).
- An account with a model provider that pi supports (for example OpenCode Go, OpenRouter, Anthropic, OpenAI, or a local Ollama).
- macOS, Windows or Linux.

## Install

The installers on [subsub.tiagojacinto.eu](https://subsub.tiagojacinto.eu/install/) do all of this, including Node.js and uv. By hand:

1. Type `npm install -g @tiagojct/subsub`. The command is `subsub`.
2. Type `subsub init`. Answer the questions. Press Enter to keep a default.
3. Type `subsub doctor`. Fix each line marked FIX.
4. Type `subsub shortcut` to add a Sub-Sub shortcut (Applications on macOS, the Start menu and the desktop on Windows, the applications menu on Linux).
5. Open Sub-Sub with the shortcut, or type `subsub web`. Select the model button and connect a provider with an API key (or, in the terminal, type `subsub`, then `/login`).

`subsub init` creates a notes folder with Inbox/ and Systems/, a starter tag list (health sciences, health informatics, or any field) and a file with the note formats (Systems/Zotero agent.md). You can edit both files. It never replaces a file that exists.

If you already use pi, you can also add Sub-Sub to plain pi: `pi install npm:@tiagojct/subsub`.

The Zotero servers (zotero-local-mcp) run from PyPI through uv. To run them from a copy of the repository, add `"serverDir": "/path/to/zotero-local-mcp"` to the settings file.

## Web view

`subsub web` (or `subsub serve`) opens Sub-Sub in your browser. It has the same modes, profiles, tools and approvals as the terminal:

- pi runs in RPC mode with the Sub-Sub extension. Sub-Sub's approval dialog (the server preview) appears in the page, and the change runs only after you select Yes.
- The server listens only on 127.0.0.1. The address that opens the page carries a random key, which becomes an HttpOnly, SameSite=Strict cookie; other requests need that cookie, the right Host header and a same-origin JSON request. The page has a strict content security policy and shows model output without raw HTML.
- One server per user: a second `subsub web` opens the running one. Without an open page for 10 minutes (and with nothing waiting for approval), the server stops. `--stay` keeps it running; `--idle N` sets the minutes; `--no-open` does not open a browser; `--librarian` starts in the librarian mode.
- Labels are in European Portuguese when the language setting is Portuguese, otherwise in English. A theme button in the header toggles light, dark, and system themes.
- Fast approval shortcuts (`y` to apply, `n` to decline), one-click copy buttons on code blocks and notes, conversation search, and export to Markdown.
- The model button lists the models you can use and saves an API key for a provider in the same file as `/login`. Sign-ins through a provider's website stay in the terminal (`/login`).
- A log is kept in `~/.subsub/web.log`.

## Use

- `subsub` starts in the researcher mode. `subsub --librarian` starts in the librarian mode. `/librarian` and `/researcher` change the mode.
- `/profile` shows or changes the profile. `/subsub` shows the Zotero connection. `/history` lists recent library changes. `/undo` reverts one.
- Templates: `/tag-batch`, `/clean-tags`, `/import-queue` (librarian); `/lit-note <citekey>`, `/synthesis <topic>`, `/gaps <topic>`, `/manuscript <file>`, `/alert` (researcher).
- `subsub review preview 13-31` and `subsub review apply 13-31` preview or apply tag review notes by number.
- `subsub -c` continues the last session. `subsub -r` selects an older one.

## Settings

`subsub init` writes `~/.config/subsub/config.json` (or the file in `SUBSUB_CONFIG`):

| Setting | Meaning | Default |
|---|---|---|
| `profile` | reader, scholar, author or editor | scholar |
| `userName` | how Sub-Sub names you | "the user" |
| `about` | one line about you | none |
| `language` | language of replies and notes, or `auto` | English |
| `vault` | notes folder | `ZOTERO_VAULT` from the server settings |
| `models` | model per mode, e.g. `{ "librarian": "opencode-go/glm-5.3-flash" }` | pi's current model |
| `defaultMode` | librarian or researcher | researcher |
| `serverDir` | a local copy of zotero-local-mcp | the PyPI release |
| `look`, `quotes`, `themes` | banner, Moby-Dick line, themes per mode | on |

The server settings (notes folder, tag list, contact email for Unpaywall) are in `~/.config/zotero-local-mcp/env`.

## Model test

`subsub-bench prepare`, `subsub-bench run` and `subsub-bench score` run the same tasks for several models against your library. Every library change is recorded and blocked, and files are written only in the run folder. The results show tag accuracy, invented references, tokens, cost and time.

## Tests

```sh
npm install
npm test
ZLM_DIR=/path/to/zotero-local-mcp npm run test:e2e
```

The end-to-end tests run the real pi with Sub-Sub, the real Python servers, a fake Zotero and a scripted model.

## Licence

MIT.
