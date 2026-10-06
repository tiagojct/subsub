---
layout: base.njk
title: Guide
eyebrow: The first half hour
lead: Tag your first items, import a paper, write a literature note and undo a change. Start Zotero before Sub-Sub.
---

## Start

1. Open Sub-Sub from its shortcut (or type `subsub web`). It opens in your browser, in the researcher mode.
2. Select Library overview. The result shows the Zotero connection and your library: items, items without tags, items that wait for review.
3. Talk to Sub-Sub in plain language. Type `/` in the message box to see all commands.

The buttons at the top change the mode (Researcher, Librarian) and the profile. The model button changes the model. The panel on the left has the most used commands and your earlier conversations.

This guide gives the commands that you type. In the browser, most of them are also buttons.

For a map of the parts (the apps, the servers, the modes, the profiles and the folders), see [How it fits together](/#how-it-fits).

### In the terminal

Type `subsub`. To start in the librarian mode, type `subsub --librarian`. When you start Sub-Sub from your home folder, it works in your notes folder. From another folder (for example a manuscript folder), it works in that folder. To stay in the home folder, type `subsub --here`.

## Tag your first items

1. Type `/librarian`.
2. Type `/tag-batch 10`. The librarian reads ten items without a topic and writes a review note: `Inbox/Zotero tag review 01.md`.
3. Open the note. Each row has the item, its current tags, the proposed tags and a reason.
4. Edit the Proposed tags column. To leave an item as it is, write `skip`.
5. Type: `apply the tag review Inbox/Zotero tag review 01.md`.
6. Read the preview. To apply it, select Yes. To stop, select No and say what to change.

The tags must be in your tag list, `Systems/Zotero tags.md`. Sub-Sub refuses other tags. To add a tag, edit that file.

To apply many review notes at once, type this in a terminal: `subsub review apply 1-5` (the note numbers).

## Undo a change

1. Type `/history`. You see the recent changes, each with an ID.
2. Type `/undo` to revert the last change, or `/undo <ID>` for an earlier one.
3. Read the preview, then select Yes.

Undo skips items that you changed in Zotero after the change.

## Import a paper

1. In the librarian mode, type `import` and an identifier: a DOI (for example `import 10.1038/s41591-018-0300-7`), `pmid:` and a PubMed ID, or `isbn:` and an ISBN.
2. Read the preview. It shows the new citekey and says if the work is already in your library.
3. Select Yes. The item gets the review marker `_agent`, so the next tag batch includes it.

## Read and write notes

1. Type `/researcher`.
2. Ask: `What do I have on home spirometry?`. The answer lists citekeys from your library.
3. Type `/lit-note smith2021`. The researcher reads the full text (or the abstract, and says so) and writes `Literature/smith2021.md` in your notes folder.
4. Type `/synthesis <topic>` for a note on several items, or `/gaps <topic>` to search PubMed and OpenAlex for works you do not have.

Each literature note says what Sub-Sub read: the full text, the abstract or only the metadata. Page numbers come only from the full text. Sub-Sub refuses a note that breaks this rule.

What the researcher writes depends on your [profile](/profiles/). The note formats are in `Systems/Zotero agent.md`. You can edit them.

## Review the literature

1. In the researcher mode, type `/lit` and your question, for example `/lit home spirometry in children with asthma`.
2. Sub-Sub searches your library first. Then it does one merged search of PubMed, Europe PMC and OpenAlex, with terms that pre-screen the results.
3. It screens each work and keeps a screening log in `Research/.plans/`.
4. It reads the works before it summarises them. The evidence table says for each source if Sub-Sub read the full text, the abstract or only the metadata.
5. It looks for gaps, checks the references and writes one note in `Research/`.

Other researcher commands:

- `/compare <question or citekeys>` writes a source matrix: the claim, the type of evidence, the caveats and the confidence for each source.
- `/review <file>` comments on your own manuscript against the reporting guideline that applies: CONSORT, STROBE, PRISMA, STARD, TRIPOD, CHEERS, or SRQR or COREQ. It writes comments only, next to the manuscript in `<name>-review.md`, and does not change the manuscript.
- `/digest [days] [topic]` summarises the alerts and notes of the last days (7 by default).
- `/request-copy <citekey, DOI or PMID>` drafts an email to the corresponding author to ask for a copy of a paper that is not open access. The address comes from the PubMed record. Sub-Sub writes the draft in `Inbox/`; you send it.

Some profiles do not run all of these commands. See [Profiles](/profiles/).

## Check references

Reference checks use Starbuck, an add-on. It is off by default. To turn it on, answer On to the question "Reference checks (Starbuck)" in `subsub init` (or type `subsub init --starbuck on`). In the browser, use the switch "Reference checks (Starbuck)" in the panel on the left. Sub-Sub restarts.

1. Type `/verify <file>`, for example `/verify draft.qmd`.
2. Starbuck checks each cited work: does it exist, does it match the citation, and does it still stand (retractions, corrections).
3. Starbuck also lists the sentences that state a finding without a citation.
4. To check whether each source supports the sentence that cites it, type `/verify <file> claims`. The model must quote the passage that it relies on. Starbuck checks that the quote is in the source, word for word.

Sub-Sub does not change the manuscript. Starbuck writes an HTML report in a `_starbuck` folder next to the manuscript.

## Commands

| Command | What it does |
|---|---|
| `/librarian`, `/researcher` | Change the mode (and the model, if you set one per mode) |
| `/profile` | Show or change the profile |
| `/subsub` | Zotero connection and library overview |
| `/history`, `/undo` | Recent changes; revert one |
| `/tag-batch [size]`, `/clean-tags`, `/import-queue` | Librarian templates |
| `/lit-note <citekey>`, `/synthesis <topic>`, `/gaps <topic>`, `/manuscript <file>`, `/alert` | Researcher templates |
| `/lit <question>`, `/compare <question>`, `/review <file>`, `/digest [days]`, `/request-copy <citekey>` | Researcher templates (new in 0.7.0) |
| `/verify <file> [claims]` | Reference checks (needs Starbuck) |
| `subsub -c`, `subsub -r` | Continue the last session; select an older one (terminal) |
| `subsub web` | Open Sub-Sub in the browser |
| `subsub shortcut` | Add the Sub-Sub shortcut again, for example after a move |

## Your notes folder

| Path | Contents |
|---|---|
| `Inbox/` | Review notes, the import queue, proposals |
| `Literature/` | One note per item, named after the citekey |
| `Syntheses/` | Notes on several items |
| `Research/` | Literature reviews, comparisons, digests; plans and screening logs in `Research/.plans/` |
| `Systems/Zotero tags.md` | Your tag list |
| `Systems/Zotero agent.md` | Note formats and shared rules |
