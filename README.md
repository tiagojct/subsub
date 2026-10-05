# Sub-Sub

[![npm version](https://img.shields.io/npm/v/@tiagojct/subsub.svg?style=flat-square&color=0b62cf)](https://www.npmjs.com/package/@tiagojct/subsub)
[![Website](https://img.shields.io/badge/website-subsub.tiagojacinto.eu-e0832a.svg?style=flat-square)](https://subsub.tiagojacinto.eu)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.19.0-339933.svg?style=flat-square)](https://nodejs.org)
[![Platform: macOS | Linux | Windows](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg?style=flat-square)](#requirements)

A Zotero librarian and research assistant that runs on your computer, in your browser or in your terminal. It is built on the [pi](https://pi.dev) agent and connects directly to your local Zotero library through Zotero's local API.

> *"This mere painstaking burrower and grub-worm of a poor devil of a Sub-Sub appears to have gone through the long Vaticans and street-stalls of the earth, picking up whatever random allusions to whales he could anyways find in any book whatsoever."*  
> — Herman Melville, *Moby-Dick* (Extracts)

---

## Highlights

* **Code-Enforced Safety Gate**: The model **cannot** modify your library without your explicit approval. Every change is calculated first as a dry-run preview (+added in green, -removed in red) and executed only when you confirm.
* **Full Journal & Reversible Edits**: Every library modification is recorded with a unique journal ID and can be reverted anytime using `/undo`.
* **Two Dedicated Roles**:
  * 📚 **The Librarian**: Cleans tags, imports references (DOI, PMID, ISBN), deduplicates, fixes metadata, retrieves open-access PDFs, creates collections, and checks retractions. *Runs completely offline with no web search access.*
  * 🔬 **The Researcher**: Reads items, searches PubMed and OpenAlex, finds gaps, checks citations in manuscripts, and writes structured Markdown notes in your notes vault (e.g. Obsidian). *Cannot modify library records.*
* **Local & Private**: Listens strictly on `127.0.0.1` protected by an authenticated single-origin session cookie. Your library contents remain on your computer.
* **Modern Web Interface & Terminal UI**: Use Sub-Sub in your browser with desktop shortcuts (`~/Applications/Sub-Sub.app`, Start menu, or `.desktop`), or launch it right in your terminal with adaptive color themes.

---

## Profiles

Profiles calibrate how much Sub-Sub drafts and executes for you. Choose your profile during `subsub init` or change it on the fly with `/profile <name>`.

| Profile | Description |
|---|---|
| **Reader** | Guided and instructional. Reading notes are quotes with page numbers and reflective questions. Never generates unrequested summaries or syntheses. No bulk library edits. |
| **Scholar** | Full research workflow: literature notes, conceptual syntheses, database searches, alerts, and the full librarian toolkit. |
| **Author** | Scholar capabilities plus manuscript workflows: citation auditing against your library, automated Pandoc/Quarto bibliographies, and argument analysis. It critiques but does not write your paragraphs. |
| **Editor** | Everything unlocked, including drafting full manuscript sections and abstracts upon request. |

> [!NOTE]
> A profile is your own operational baseline, not a rigid constraint. You can switch between profiles whenever your research focus shifts.

---

## Requirements

* **Zotero 10 or later** running locally. In Zotero, enable:  
  *Settings > Advanced > "Allow other applications on this computer to communicate with Zotero"*.
* **Node.js 22.19** or later.
* **[uv](https://docs.astral.sh/uv/)** fast Python package manager.
* **Model Provider Account**: Any provider supported by pi (e.g., OpenCode Go, OpenRouter, Anthropic, OpenAI, Mistral, DeepSeek, Google Gemini, or local Ollama).
* **OS**: macOS, Linux, or Windows.

---

## Install

### Quick Installers

Automated installers handle Node.js, uv, and desktop shortcuts:

* **macOS & Linux**:
  ```sh
  curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh
  ```
* **Windows (PowerShell)**:
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"
  ```

### Manual Installation

1. Install the global package:
   ```sh
   npm install -g @tiagojct/subsub
   ```
2. Run setup:
   ```sh
   subsub init
   ```
   Answer the interactive prompts (press <kbd>Enter</kbd> to accept defaults). This creates your notes folder (`Inbox/` and `Systems/`), sets up starter tag vocabularies, and writes note templates (`Systems/Zotero agent.md`).
3. Verify your environment:
   ```sh
   subsub doctor
   ```
   Resolve any items marked with `FIX`.
4. Install system shortcuts:
   ```sh
   subsub shortcut
   ```
   Creates `~/Applications/Sub-Sub.app` on macOS, Start menu & desktop shortcuts on Windows, or an application launcher on Linux.
5. Launch Sub-Sub:
   Open the shortcut or run `subsub web`. Connect your model provider via the **Model** dialog with an API key (or in the terminal via `subsub`, then `/login`).

If you already use [pi](https://pi.dev), you can add Sub-Sub as an extension:
```sh
pi install npm:@tiagojct/subsub
```

The underlying Python servers ([zotero-local-mcp](https://github.com/tiagojct/zotero-local-mcp)) run via `uv` from PyPI. To run from a local checkout, specify `"serverDir": "/path/to/zotero-local-mcp"` in your configuration.

---

## Web View

Starting Sub-Sub with `subsub web` (or `subsub serve`) launches the browser application:

* **Approval Previews**: Shows server-computed dry-run diffs directly in the UI. Changes are applied only after clicking **Yes** or pressing <kbd>Y</kbd>.
* **Keyboard-First Review**: In approval dialogs, press <kbd>Y</kbd> or <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> to approve, or <kbd>N</kbd>/<kbd>Esc</kbd> to decline.
* **Theme Switcher**: Header toggle between **Light**, **Dark**, and **System** themes, with tailored styling for each mode (Try-Works amber for Librarian, Glauca blue for Researcher).
* **One-Click Copy**: Built-in copy buttons on all code snippets, BibTeX records, and assistant literature notes.
* **Session Search & Markdown Export**: Filter conversation history in real time and download full discussions as Markdown notes.
* **Local Security**: Binds strictly to `127.0.0.1`. The initial link carries a random token that converts into an `HttpOnly`, `SameSite=Strict` cookie. Protected with strict Content Security Policy (CSP), origin validation, and sanitized output.
* **Auto-Idle Management**: A single daemon serves requests and stops automatically after 10 minutes of inactivity when no pages remain open. Use `--stay` to keep running indefinitely, or `--idle N` to change the timeout.

---

## Usage

### Interactive Modes & Commands

```sh
subsub             # Start in researcher mode
subsub --librarian # Start in librarian mode
subsub web         # Start browser view
subsub -c          # Continue the previous session
subsub -r          # Resume an older session
```

Commands available within Sub-Sub:

* `/librarian`: Switch to the librarian (modify library, tag, import; offline).
* `/researcher`: Switch to the researcher (read library, search literature, write notes).
* `/profile [name]`: View or change active profile (`reader`, `scholar`, `author`, `editor`).
* `/subsub`: Display Zotero connection health and library statistics.
* `/history`: List recent library changes with journal IDs.
* `/undo [id]`: Revert the last change (or a specific journal ID).

### Built-in Prompt Templates

Type the command followed by arguments:

* **Librarian**:
  * `/tag-batch [size]`: Tag untagged items using your tag vocabulary.
  * `/clean-tags`: Find irregular tags and reconcile with your vocabulary.
  * `/import-queue [path]`: Import pending references from an inbox note.
* **Researcher**:
  * `/lit <question>`: Literature review: the library first, then PubMed, Europe PMC and OpenAlex in one merged search; reads before it summarises; an evidence table, agreement, disagreement and open questions; references checked; one note in `Research/` (Scholar, Author, Editor).
  * `/compare <question or citekeys>`: Source matrix (claim, evidence type, caveats, confidence), agreements and disagreements (Scholar, Author, Editor).
  * `/review <path>`: Critical review of your own manuscript: FATAL, MAJOR and MINOR issues against the reporting guideline that applies (CONSORT, STROBE, PRISMA, STARD, TRIPOD), with quotations and a revision plan. Comments only (Author, Editor).
  * `/digest [days] [topic]`: Digest of the last days (default 7): what the new notes and alerts change, works worth reading, open questions, decisions for you (Scholar, Author, Editor).
  * `/request-copy <citekey, DOI or PMID>`: Draft an email to the corresponding author asking for a copy of a paper that is not open access. The address comes from the PubMed record; you send the email yourself.
  * `/lit-note <citekey>`: Generate an in-depth literature note from item fulltext.
  * `/synthesis <topic>`: Synthesize library findings on a specific topic.
  * `/gaps <topic>`: Identify unanswered questions and literature gaps.
  * `/manuscript <path>`: Cross-check manuscript citations against your library.
  * `/verify <path> [claims]`: Check that each cited work exists, matches its citation and was not retracted (needs the Starbuck add-on). With `claims`, also check whether each source supports the sentence that cites it.
  * `/alert`: Check PubMed and OpenAlex for new publications matching research topics.

### Batch Tag Review

To preview or apply batch tag reviews generated in your `Inbox/`:
```sh
subsub review preview 13-31
subsub review apply 13-31
```

---

## Configuration

`subsub init` writes settings to `~/.config/subsub/config.json` (or `$SUBSUB_CONFIG`):

| Setting | Type | Description | Default |
|---|---|---|---|
| `profile` | string | `reader`, `scholar`, `author`, or `editor` | `"scholar"` |
| `userName` | string | Name used by the agent in replies | `"the user"` |
| `about` | string | Brief background context about your research domain | `null` |
| `language` | string | Response language, or `"auto"` to match your input | `"English"` |
| `vault` | string | Path to your Markdown notes folder / Obsidian vault | `$ZOTERO_VAULT` |
| `models` | object | Model overrides per mode (e.g. `{"librarian": "opencode-go/glm-5.3-flash"}`) | Current model |
| `defaultMode`| string | Default launch mode (`"researcher"` or `"librarian"`) | `"researcher"` |
| `serverDir` | string | Local development path for `zotero-local-mcp` | PyPI package |
| `look` | boolean| Show header banners and status lines in terminal | `true` |
| `quotes` | boolean| Display quotes from *Moby-Dick* in terminal banner | `true` |
| `themes` | object | Mode-specific terminal themes | `true` |
| `addons` | array | Optional servers; `["starbuck"]` adds reference checks | `[]` |
| `starbuckDir` | string | Local Starbuck folder (used when it has a `pyproject.toml`) | `~/Projects/starbuck` |

Server-level configurations (notes folder path, tag vocabulary path, Unpaywall email) reside in `~/.config/zotero-local-mcp/env`.

### Papers that are not open access

Sub-Sub finds open-access copies (Unpaywall, Europe PMC). For other papers, use Sub-Sub on your institution's network (at FMUP: the U.Porto network), where the DOI link opens the publisher's version through the library's subscriptions, or use `/request-copy` to ask the author. Sub-Sub does not use unlicensed sources.

### Reference checks (Starbuck add-on)

[Starbuck](https://github.com/tiagojct/starbuck) checks references: does each cited work exist, do the title, first author and year match, was it retracted or corrected, and (on request) does the source support the sentence that cites it.

1. Add the add-on to the settings file:
   ```json
   "addons": ["starbuck"]
   ```
2. Optional: set `"starbuckDir"` to a local copy of Starbuck. Without it, Sub-Sub runs the pinned Starbuck release with uv.
3. Start Sub-Sub again and run `subsub doctor`. The line `Starbuck` must show `ok`.

The researcher gets four tools: `verify_check_manuscript`, `verify_check_references`, `verify_prepare_claims` and `verify_record_claims`. Starbuck writes its report to a `_starbuck` folder next to the manuscript. Inside the notes folder or the working folder this needs no approval; elsewhere Sub-Sub asks first. Starbuck gets the contact email from the zotero-local-mcp env file. For the claim check, Sub-Sub's own model judges; Starbuck checks that every quoted passage is in the source.

---

## Model Evaluation (`subsub-bench`)

Evaluate how accurately different LLMs tag, import, and synthesize literature against your own library without applying changes:

```sh
subsub-bench prepare    # Sample realistic test tasks from your library
subsub-bench run        # Run models in parallel against safety-isolated sandbox
subsub-bench score      # Generate objective evaluation scorecard (results.md)
```

Measures tag accuracy, adherence to vocabulary, hallucinated citations, token usage, cost, and latency.

---

## Development & Testing

```sh
git clone https://github.com/tiagojct/subsub.git
cd subsub
npm install
npm test
npm run build
```

Run end-to-end integration tests (real agent, Python MCP servers, fake Zotero, scripted LLM):
```sh
ZLM_DIR=/path/to/zotero-local-mcp npm run test:e2e
```

---

## License

[MIT](LICENSE) © Tiago Jacinto. The `/lit`, `/compare` and `/review` prompts adapt text from [Feynman](https://github.com/Companion-Inc/feynman) (MIT); see [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).
