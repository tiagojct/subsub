# Sub-Sub

[![npm](https://img.shields.io/npm/v/@tiagojct/subsub.svg?style=flat-square&color=2c5d87)](https://www.npmjs.com/package/@tiagojct/subsub)
[![Website](https://img.shields.io/badge/website-subsub.tiagojacinto.eu-a33b14.svg?style=flat-square)](https://subsub.tiagojacinto.eu)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-5f5c55.svg?style=flat-square)](LICENSE)

Your research assistant, working from your own Zotero library.

Sub-Sub reads what you already have, finds what you are missing in PubMed, Europe PMC and OpenAlex, and writes notes in Markdown. It also keeps the library in order: it imports, tags and repairs references, and shows you each change before it happens. It runs on your computer, in the browser or in the terminal. It is built on the [pi](https://pi.dev) agent and talks to Zotero through Zotero's local API.

Website and guide: https://subsub.tiagojacinto.eu

> "This mere painstaking burrower and grub-worm of a poor devil of a Sub-Sub appears to have gone through the long Vaticans and street-stalls of the earth, picking up whatever random allusions to whales he could anyways find in any book whatsoever."
> Herman Melville, Moby-Dick (1851), the Extracts

## What it does

Sub-Sub has two modes.

- The Researcher (the default) reads items in your library, searches PubMed, Europe PMC and OpenAlex in one merged search, finds gaps, checks the citations in a manuscript, and writes notes in your Sub-Sub folder. It also does everything the Librarian does, so you can find papers and import and tag them in the same conversation.
- The Librarian only manages the library: it tags items, imports by DOI, PMID or ISBN, repairs metadata, finds duplicates, attaches open-access PDFs and checks retractions. It has no search tools. Give it a fast, cheap model for long tagging sessions.

Each mode can have its own model. Switch with `/researcher` and `/librarian`, or with the buttons in the browser view.

Every library change works the same way in both modes:

- The Zotero server computes the change first. Sub-Sub shows it to you (the tags it adds and the tags it removes) and applies it only when you select Yes. The check is in the program, so the model cannot skip it.
- If you edit an item in Zotero while the preview is open, Sub-Sub shows you the new preview before it changes anything. Each change also sends the item's version, so a field you edit at the moment of writing is not overwritten.
- Every change is journaled, including new collections. `/undo` reverts the last one, and the browser view shows an Undo button under each change.
- Nothing is deleted: items go to the Zotero trash. Only tags from your tag list can be added.

## What Sub-Sub writes

Sub-Sub writes literature notes, syntheses and reviews from what it read, with a source for every claim. It drafts text for your manuscript or thesis only when you ask, and marks the drafted text so that you can check it. It does not draft text for assignments, even when you ask.

To learn to read papers yourself, use `/read`: Sub-Sub finds the passages and asks questions, and you write the answers. `/lit reading list: <topic>` gives a reading list with questions to read with, and no results.

The [Commands page](https://subsub.tiagojacinto.eu/profiles/) lists the tools and commands of each mode.

## Requirements

- Zotero 10 or later, running, with Settings > Advanced > "Allow other applications on this computer to communicate with Zotero" on.
- Node.js 22.19 or later, and [uv](https://docs.astral.sh/uv/). The installers add both if they are missing.
- An account with a model provider that pi supports (for example OpenCode Go, OpenRouter, Anthropic, OpenAI, Mistral, Google), or a local model. To try Sub-Sub without paying, a free Google AI Studio key is enough (see [Use Sub-Sub for free](https://subsub.tiagojacinto.eu/models/#use-sub-sub-for-free)).
- macOS, Linux or Windows.

## Install

macOS and Linux:

```sh
curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh
```

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"
```

The installers put everything in your user folder (`~/.subsub`), run `subsub init`, and add a Sub-Sub shortcut. You do not need administrator rights.

With npm:

```sh
npm install -g @tiagojct/subsub
subsub init
subsub doctor
```

`subsub init` asks a few questions. Press Enter to accept the default. It creates the Sub-Sub folder (`~/Documents/Sub-Sub`, or a `Sub-Sub` folder inside your Obsidian vault) with `Inbox/`, `Literature/`, `Syntheses/`, `Research/` and `Zotero/`, a starter tag list (`Zotero/Zotero tags.md`) and the note formats (`Zotero/Zotero agent.md`). `subsub doctor` checks the set-up; each line marked FIX says what to do.

If you already use pi, you can add Sub-Sub to it: `pi install npm:@tiagojct/subsub`.

Sub-Sub runs its Zotero server, [zotero-local-mcp](https://github.com/tiagojct/zotero-local-mcp), from PyPI with uv.

## Use

```sh
subsub web           # in the browser
subsub               # in the terminal
subsub --librarian   # in the terminal, in the Librarian
subsub -c            # continue the last conversation
subsub --help        # all commands
```

In the browser view, connect a model provider with the model button. In the terminal, type `/login`.

The terminal has its own look, drawn like the website: a footer with the mode, the library, the model, the context in use and the cost; Sub-Sub's tools in plain words (`search the library: asthma`); and an approval screen for library changes (`y` applies, `n` or Esc leaves the library as it is, Enter does nothing). `/notes`, `/library` and `/actions` open screens for your notes, a library search and the actions of the browser view; Alt+N, Alt+L, Alt+A and Alt+M (mode) are shortcuts. Nothing is red: a failure is ink with a hollow mark and a word, and a removal is struck through. For terminals that cannot draw box glyphs, set `SUBSUB_ASCII=1`; `SUBSUB_REDUCE_MOTION=1` stops the working indicator from moving; `"look": false` in the settings brings back the plain screen.

The browser view also has a library search (each result can start `/read` or `/lit-note`), a notes pane that shows the notes of your Sub-Sub folder next to the conversation (note paths and `[[links]]` in replies open there), argument hints for the commands, and rename, delete (to `~/.subsub/trash`) and export for conversations.

Commands in Sub-Sub:

| Command | What it does |
|---|---|
| `/researcher`, `/librarian` | Switch the mode |
| `/subsub` | Zotero connection, mode, model and library counts |
| `/history`, `/undo [id]` | Recent library changes; undo the last one or one by its id |
| `/notes`, `/library`, `/actions` | Terminal screens: the notes in your Sub-Sub folder (the chosen note beside the list from 100 columns); a library search as you type (Enter starts `/read`, Ctrl+N `/lit-note`); the actions of the browser view as a list |
| `/feedback [what happened]` | A draft bug report in `Inbox/`, with versions, `subsub doctor` and the last error, and without your folders, emails or keys. You post it on GitHub; Sub-Sub sends nothing |
| `/ai-statement [uses]` | A draft statement on the use of AI for a manuscript, with the Sub-Sub version, its DOI and your models |
| `/tag-batch [size]` | Tag items that have no topic, with your tag list |
| `/clean-tags` | Find tags that are not in your tag list and propose fixes |
| `/import-queue [path]` | Import the references in the import queue note |
| `/read [reason] <citekey>` | Guided reading of one paper. Sub-Sub asks why you read it (background, one fact, extraction for a review, critique), finds the passages and asks questions; you write the answers. For extraction it adds a row to your extraction sheet in `Research/` |
| `/lit <question>` | Literature review: the library first, then one merged search; an evidence table, agreement, disagreement and open questions; one note in `Research/` |
| `/compare <question or citekeys>` | A matrix of sources: claim, evidence, caveats, confidence |
| `/lit-note <citekey>` | A literature note on one item, from its full text |
| `/synthesis <topic>` | A synthesis of what the library says on a topic |
| `/gaps <topic>` | Open questions and gaps in the literature |
| `/manuscript <path>` | Check a manuscript's citations against the library |
| `/review <path>` | Comments on your own manuscript against the reporting guideline that applies (CONSORT, STROBE, PRISMA, STARD, TRIPOD, CHEERS, SRQR, COREQ). Comments only, next to the manuscript |
| `/verify <path> [claims]` | Check that each cited work exists, matches its citation and was not retracted; with `claims`, also whether each source supports its sentence (Starbuck add-on) |
| `/alert` | New publications for your saved searches |
| `/digest [days] [topic]` | What changed in the last days: new notes, alerts, works worth reading |
| `/request-copy <citekey, DOI or PMID>` | A draft email to the corresponding author for a paper that is not open access. You send it yourself |

The library commands work in both modes; the research commands need the Researcher.

To check or apply a tag review note from `Inbox/` outside Sub-Sub:

```sh
subsub review preview 13-31
subsub review apply 13-31
```

## Settings

`subsub init` writes `~/.config/subsub/config.json` (or the file in `$SUBSUB_CONFIG`). You can also edit it.

| Setting | Meaning | Default |
|---|---|---|
| `userName`, `about` | Your name and one line about you, for the replies | none |
| `language` | Language of replies and notes, or `auto` for the language you write in | `English` |
| `vault` | The Sub-Sub folder | from the server settings |
| `models` | The model for each mode, as provider/id: `{"librarian": "...", "researcher": "..."}`. `{}` means you choose in Sub-Sub. The free choice in `subsub init` sets `google/gemini-3.1-flash-lite` for both | `opencode-go/mimo-v2.6-flash` and `opencode-go/mimo-v2.6-pro` |
| `defaultMode` | `researcher` or `librarian` | `researcher` |
| `addons` | `["starbuck"]` adds reference checks | `[]` |
| `usageLog` | `true` keeps the pilot's usage log on this computer (`subsub usage`) | off |
| `serverDir` | A local copy of zotero-local-mcp, for development | the PyPI release |
| `starbuckDir` | A local copy of Starbuck, for development | the pinned release |
| `look`, `quotes`, `themes` | The terminal look (header, footer, approval screen, tool lines), the Moby-Dick quotations, and the terminal colours (`subsub-glauca`, `subsub-try-works`, or `false` for your pi theme). `themes` can be `{"researcher": "...", "librarian": "..."}`: the Librarian uses `subsub-try-works` unless you say otherwise | on, on, `subsub-glauca` |

The settings of the Zotero server (Sub-Sub folder, tag list, alerts file, contact email) are in `~/.config/zotero-local-mcp/env`.

## Privacy

Your library stays in Zotero; Sub-Sub uses Zotero's local API and never your zotero.org account. The model provider you choose receives your messages and what the tools return (titles, abstracts, tags, and passages of full texts when you ask for them). PubMed, Europe PMC, OpenAlex, Crossref, Unpaywall and Open Library receive identifiers and search terms, with your contact email if you gave one. Sub-Sub sends no usage data. The browser view listens only on 127.0.0.1 and needs the random key in the address that `subsub web` opens. Details: https://subsub.tiagojacinto.eu/privacy/

## Papers that are not open access

Sub-Sub finds open-access copies through Unpaywall and Europe PMC. For other papers, use Sub-Sub on your institution's network, where the DOI link opens the publisher's version through the library's subscriptions, or use `/request-copy`. Sub-Sub does not use unlicensed sources.

## Reference checks (Starbuck)

[Starbuck](https://github.com/tiagojct/starbuck) is an optional add-on. It checks that each cited work exists, that its title, first author and year match the citation, and that it was not retracted or corrected. On request, it also checks whether the source supports the sentence that cites it; Sub-Sub's model judges, and Starbuck checks that every quoted passage is in the source.

Turn it on in `subsub init`, with the switch in the browser view, or with `"addons": ["starbuck"]` in the settings. Then `subsub doctor` must show Starbuck ok. Starbuck writes its report in a `_starbuck` folder next to the manuscript.

## Model test

`subsub-bench` runs several models on the same tasks against your own library and scores them. Nothing in the library changes. See [docs/model-test.md](https://github.com/tiagojct/subsub/blob/main/docs/model-test.md) and the [Models page](https://subsub.tiagojacinto.eu/models/) for the latest results.

## Development

```sh
git clone https://github.com/tiagojct/subsub.git
cd subsub
npm install
npm test
npm run build
```

End-to-end tests (real pi and Python servers, a fake Zotero, a scripted model): `ZLM_DIR=/path/to/zotero-local-mcp npm run test:e2e`.

## Changes

See [CHANGELOG.md](CHANGELOG.md).

## Cite

Jacinto T. Sub-Sub: a research assistant for Zotero [software]. Porto: Faculdade de Medicina da Universidade do Porto; 2026. doi:[10.5281/zenodo.23238602](https://doi.org/10.5281/zenodo.23238602)

This DOI always points to the latest version; each version also has its own DOI on [Zenodo](https://doi.org/10.5281/zenodo.23238602). `CITATION.cff` has the same reference for citation managers.

## Licence

[MIT](LICENSE), Tiago Jacinto. The `/lit`, `/compare` and `/review` prompts adapt text from [Feynman](https://github.com/Companion-Inc/feynman) (MIT); see [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES). Literata and Atkinson Hyperlegible fonts: SIL Open Font License.
