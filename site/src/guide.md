---
layout: base.njk
title: Guide
eyebrow: The first half hour
lead: Tag your first items, import a paper, write a literature note and undo a change. Start Zotero before Sub-Sub.
---

## Start

1. Type `subsub`. Sub-Sub starts in the researcher mode. To start in the librarian mode, type `subsub --librarian`.
2. Type `/subsub`. The result shows the Zotero connection and your library: items, items without tags, items that wait for review.
3. Talk to Sub-Sub in plain language. Type `/` to see all commands.

When you start Sub-Sub from your home folder, it works in your notes folder. From another folder (for example a manuscript folder), it works in that folder. To stay in the home folder, type `subsub --here`.

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

What the researcher writes depends on your [profile](/profiles/). The note formats are in `Systems/Zotero agent.md`. You can edit them.

## Commands

| Command | What it does |
|---|---|
| `/librarian`, `/researcher` | Change the mode (and the model, if you set one per mode) |
| `/profile` | Show or change the profile |
| `/subsub` | Zotero connection and library overview |
| `/history`, `/undo` | Recent changes; revert one |
| `/tag-batch [size]`, `/clean-tags`, `/import-queue` | Librarian templates |
| `/lit-note <citekey>`, `/synthesis <topic>`, `/gaps <topic>`, `/manuscript <file>`, `/alert` | Researcher templates |
| `subsub -c`, `subsub -r` | Continue the last session; select an older one |

## Your notes folder

| Path | Contents |
|---|---|
| `Inbox/` | Review notes, the import queue, proposals |
| `Literature/` | One note per item, named after the citekey |
| `Syntheses/` | Notes on several items |
| `Systems/Zotero tags.md` | Your tag list |
| `Systems/Zotero agent.md` | Note formats and shared rules |
