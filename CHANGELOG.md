# Changes

Sub-Sub follows the version numbers of npm: a change in the second number (0.13) adds features or changes how you use it; a change in the third (0.13.1) only fixes.

## 0.13.0 (2026-10-07)

The same changes were published first as 0.12.1.

Files and notes without a parent item (Zotero server 0.5.5):

- Sub-Sub lists them, reads each file, finds the reference and makes the parent item: from a DOI, PMID or ISBN, or from the file's own text (magazines, reports, books). An item already in the library is used instead of a copy. One preview for up to 25 files; undo puts the files back and moves the new items to the trash.
- Reference search for these files in Crossref, Google Books, Internet Archive, Open Library and Wikidata, without a key. Web search through Brave Search when you save a key in `subsub init`.
- A search of the library for attachments or notes now says that it covers regular items only, instead of finding nothing.

Also:

- Sub-Sub no longer offers to change its own programs; it says what it cannot do.
- Citekeys for long organisation names are shorter (europeancommission2026), and an item without creators takes the first main word of its title (economist2026, not the2026). Existing keys do not change.
- OpenCode's "requires Global regions" error is explained in plain words.

## 0.12.0 (2026-10-07)

For new users:

- `subsub init` asks whether you are a student. Students start with the Reader profile: Sub-Sub helps them read and does not write summaries or syntheses unless asked.
- The installers end with `subsub doctor`, which also downloads the Zotero server, so the first start is quicker.
- The browser view shows what is still missing on the first start (Zotero, a model, the servers), each with its fix.
- A tested EU option: Mistral, with servers in the European Union. The key form says where each provider processes your data.

Library changes:

- Every applied change has an Undo button in the browser view. It previews first, like `/undo`.
- New collections are journaled too: undo moves them to the Zotero trash. (Zotero server 0.5.4.)
- A preview of more than 10 items starts with a summary: each tag and field, and how many items it changes.
- Previews, approvals and notices are in European Portuguese when the language is Portuguese.

Free tiers and errors:

- After a per-minute limit (Google's free tier), Sub-Sub waits as long as the provider says and continues the task, up to three times. pi does not retry these errors, because their text mentions billing.

For the pilot:

- An optional usage log, kept on your computer (`subsub usage`): times, counts, commands and tool names, never what you wrote. It is off unless you turn it on in `subsub init`.
- The pilot page has a task that compares the same work with and without Sub-Sub.

Robustness:

- Sub-Sub accepts pi patch releases only (~1.0.4). A weekly test runs against pi's latest release, so a change in pi shows before users meet it.
- Randomised tests of the path gate: 3000 spellings of paths (dot segments, case, accents, links) must agree with the rules.

Models page: the limits of the tests come first. Most tested models are adequate; the table is not a ranking.

## 0.11.4 (2026-10-07)

- A free way to try Sub-Sub: Google AI Studio, with gemini-3.1-flash-lite in both modes (`subsub init`, or the model dialog).
- Model dialog: search, and the tested models first, marked.
- Provider errors in plain words: limit reached, provider busy, reply blocked, key refused.

## 0.11.3 (2026-10-07)

- `subsub init` asks about the FMUP set-up after the folder.
- Created notes keep raw HTML as text; the preview shows the whole note (Zotero server 0.5.3).

## 0.11.2 (2026-10-07)

- The mode's model is applied again at start (a regression in 0.11.1).
- After Yes, the preview is computed again; if the library changed meanwhile, the new preview is shown first.
- Case and Unicode spellings no longer get round protected and key files.

## 0.11.1 (2026-10-07)

- Writes into hidden folders always ask; the model cannot read files with keys.
- pi's install report is off.

## 0.11.0 (2026-10-06)

- Two modes again: the Librarian manages the library; the Researcher does that and the research.
- Defaults from the October model test: mimo-v2.6-flash for the Librarian, mimo-v2.6-pro for the Researcher.

Earlier versions: see the git history.
