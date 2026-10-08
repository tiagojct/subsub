---
alt: /pt/guia/
layout: base.njk
title: Guide
eyebrow: The first half hour
lead: Tag your first items, import a paper, write a literature note and undo a change. Start Zotero before Sub-Sub.
---

## Start

1. Open Sub-Sub from its shortcut (or type `subsub web`). It opens in your browser.
2. Select Library overview. The result shows the Zotero connection and your library: items, items without tags, items that wait for review.
3. Talk to Sub-Sub in plain language. Type `/` in the message box to see all commands.

Sub-Sub has two modes. The Researcher is the default. It reads your library, searches the literature, writes notes and also changes the library. The Librarian manages the library only: tags, imports, metadata, PDFs and collections. To change the mode, select Researcher or Librarian at the top. Each mode can have its own model. In both modes, every library change shows a preview first and runs only after you select Yes.

The profile menu and the model button are at the top right. The panel on the left has the most used commands and your earlier conversations. In the Researcher, the commands are in two groups, Research and Library. In the Librarian, only the Library group shows.

This guide gives the commands that you type. In the browser, most of them are also buttons.

For a map of the parts (the apps, the servers, the modes, the profiles and the folders), see [How it works](/how-it-works/).

### In the terminal

Type `subsub`. It starts in the Researcher. To start in the Librarian, type `subsub --librarian`. To change the mode, type `/librarian` or `/researcher`. When you start Sub-Sub from your home folder, it works in your Sub-Sub folder. From another folder (for example a manuscript folder), it works in that folder. To stay in the home folder, type `subsub --here`.

## Tag your first items

Sub-Sub tags only with the tags in your tag list. The starter list for any field has no topics yet, because your topics depend on your library. The health-sciences list has some. If your list has no `topic/` tags, start here:

1. Type: `propose topics for my tag list`. Sub-Sub reads the titles of your items and writes `Inbox/Zotero topic proposal.md` with 15 to 30 topics.
2. Copy the topics you want into `Zotero/Zotero tags.md`, in the format of that file.

Then tag:

1. Type `/librarian` (or stay in the Researcher: it can tag too).
2. Type `/tag-batch 10`. Sub-Sub reads ten items without a topic and writes a review note: `Inbox/Zotero tag review 01.md`.
3. Open the note. Each row has the item, its current tags, the proposed tags and a reason.
4. Edit the Proposed tags column. To leave an item as it is, write `skip`.
5. Type: `apply the tag review Inbox/Zotero tag review 01.md`.
6. Read the preview. To apply it, select Yes. To stop, select No and say what to change.

The tags must be in your tag list, `Zotero/Zotero tags.md`. Sub-Sub refuses other tags. To add a tag, edit that file.

To apply many review notes at once, type this in a terminal: `subsub review apply 1-5` (the note numbers).

## Undo a change

In the browser view, each applied change has an Undo button on its line. Select it, read the preview, then select Yes.

Or type the commands:

1. Type `/history`. You see the recent changes, each with an ID.
2. Type `/undo` to revert the last change, or `/undo <ID>` for an earlier one.
3. Read the preview, then select Yes.

Undo skips items that you changed in Zotero after the change. A new collection goes to the Zotero trash; the items in it stay in the library.

## Import a paper

1. In either mode, type `import` and an identifier: a DOI (for example `import 10.1038/s41591-018-0300-7`), `pmid:` and a PubMed ID, or `isbn:` and an ISBN.
2. Read the preview. It shows the new citekey and says if the work is already in your library.
3. Select Yes. The item gets the review marker `_agent`, so the next tag batch includes it.

## Files without a parent item

A PDF or a note that you added to Zotero on its own has no parent item: no title, authors or date in the library, and no citekey. Sub-Sub can make the parent item for you.

1. In either mode, type `give my files without a parent item a proper parent item`. To start with a few, name them or say "the first five".
2. Sub-Sub reads each file. It looks the work up in Crossref, Google Books, Internet Archive, Open Library and Wikidata, and on the web if you saved a Brave Search key in `subsub init`. It keeps a result only when it agrees with the file.
3. Read the preview. For each file it shows a new item (type, citekey, publication, date, issue) or an item that is already in your library.
4. Select Yes. The file moves under its parent item; a new item takes the file's collections and gets the review marker `_agent`.

Undo puts the files back where they were and moves the new items to the Zotero trash. A scan without a text layer cannot be read: Sub-Sub then uses the file name, and says so. In Zotero, right-click a file and choose Reindex Item if it has text that Zotero has not indexed yet.


## Write a literature note

Use the Researcher for this part. The Librarian does not search or write notes.

1. Ask: `What do I have on home spirometry?`. The answer lists citekeys from your library.
2. Type `/lit-note smith2021`. Sub-Sub reads the full text (or the abstract, and says so) and writes `Literature/smith2021.md` in your Sub-Sub folder.
3. Type `/synthesis <topic>` for a note on several items, or `/gaps <topic>` to search PubMed and OpenAlex for works you do not have.

Each literature note says what Sub-Sub read: the full text, the abstract or only the metadata. Page numbers come only from the full text. Sub-Sub refuses a note that breaks this rule.

What Sub-Sub writes depends on your [profile](/profiles/). The note formats are in `Zotero/Zotero agent.md`. You can edit them.

## Review the literature

1. Type `/lit` and your question, for example `/lit home spirometry in children with asthma`.
2. Sub-Sub searches your library first. Then it does one merged search of PubMed, Europe PMC and OpenAlex, with terms that pre-screen the results.
3. It screens each work and keeps a screening log in `Research/.plans/`.
4. It reads the works before it summarises them. The evidence table says for each source if Sub-Sub read the full text, the abstract or only the metadata.
5. It looks for gaps, checks the references and writes one note in `Research/`.
6. It lists the works worth adding. Say which ones, and it imports them in the same conversation: one preview for all. Then it offers to tag them.

`/lit` is a rapid review, not a systematic review: one AI screens, with no second reviewer, no registered protocol and no formal risk-of-bias assessment. Each note says so in a section, "What this review is". Use it to scope a question, for a background section or as a first search. For a systematic review, start from its searches and screening log, then screen in duplicate, assess the risk of bias and report to PRISMA.

Other research commands:

- `/compare <question or citekeys>` writes a source matrix: the claim, the type of evidence, the caveats and the confidence for each source.
- `/review <file>` comments on your own manuscript against the reporting guideline that applies: CONSORT, STROBE, PRISMA, STARD, TRIPOD, CHEERS, or SRQR or COREQ. It writes comments only, next to the manuscript in `<name>-review.md`, and does not change the manuscript.
- `/digest [days] [topic]` summarises the alerts and notes of the last days (7 by default).
- `/ai-statement [what you used it for]` writes a draft of the statement on the use of AI that journals ask for, with the Sub-Sub version, its DOI and your models, in `Research/`. Complete the parts in brackets. In every profile.
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
| `/librarian`, `/researcher` | Change the mode (each mode can have its own model) |
| `/profile` | Show or change the profile |
| `/subsub` | Zotero connection and library overview |
| `/history`, `/undo` | Recent changes; revert one |
| `/ai-statement [uses]` | A draft statement on the use of AI for a manuscript |
| `/tag-batch [size]`, `/clean-tags`, `/import-queue` | Library templates (both modes) |
| `/lit-note <citekey>`, `/synthesis <topic>`, `/gaps <topic>`, `/manuscript <file>`, `/alert` | Research templates (Researcher) |
| `/lit <question>`, `/compare <question>`, `/review <file>`, `/digest [days]`, `/request-copy <citekey>` | Research templates (Researcher) |
| `/verify <file> [claims]` | Reference checks (Researcher, needs Starbuck) |
| `subsub -c`, `subsub -r` | Continue the last session; select an older one (terminal) |
| `subsub web` | Open Sub-Sub in the browser |
| `subsub shortcut` | Add the Sub-Sub shortcut again, for example after a move |

## Your Sub-Sub folder

Sub-Sub keeps its notes and settings in one folder, `Sub-Sub`. Two things go elsewhere: a manuscript review (`/review`) goes next to the manuscript, and a Starbuck report goes in a `_starbuck` folder next to it. By default it is in your Documents folder. If you use Obsidian, `subsub init` puts it inside your vault, and Sub-Sub leaves the rest of the vault alone.

| Path | Contents |
|---|---|
| `Inbox/` | Review notes, the import queue, proposals |
| `Literature/` | One note per item, named after the citekey |
| `Syntheses/` | Notes on several items |
| `Research/` | Literature reviews, comparisons, digests; plans and screening logs in `Research/.plans/` |
| `Zotero/Zotero tags.md` | Your tag list |
| `Zotero/Zotero agent.md` | Note formats and shared rules |
| `Zotero/Literature alerts.md` | The searches for weekly alerts (optional) |

Before version 0.9, the files of `Zotero/` were in `Systems/`, and the folder could be a whole vault. Type `subsub init` to move them. It moves only the files that Sub-Sub made, and never replaces a file.
