---
alt: /pt/perfis/
layout: base.njk
title: Modes and commands
eyebrow: What each mode does
lead: Sub-Sub has two modes. The Researcher has every command and tool. The Librarian manages the library only.
---

The mode sets which tools Sub-Sub may use. The Researcher is the default: it reads your library, searches the literature, writes notes and also changes the library. Use the Librarian for tagging sessions with a fast, cheap model. Each mode can have its own model.

To change the mode, select Researcher or Librarian at the top of the browser view. In the terminal, type `/researcher` or `/librarian`, or press F5.

## Researcher only

The Researcher has every command and tool. These need it:

- `/read`: guided reading of one paper.
- `/lit reading list:`: a reading list with questions to read with.
- `/lit-note`, `/synthesis`: literature notes and syntheses.
- `/lit`: a literature review with a screening log.
- `/gaps`, `/alert`: works that you do not have, and new publications.
- `/compare`, `/digest`: comparisons and digests.
- `/manuscript`: a citation check and a bibliography for a manuscript.
- `/review`: a review of a manuscript against a reporting guideline.
- `/verify`: reference checks with Starbuck.
- `/request-copy`: a draft email to ask an author for a copy.
- Drafted text for a manuscript or thesis, when you ask (never for assignments).

## Both modes

- Tag items with tags from your tag list (`/tag-batch`, `/clean-tags`).
- Import by DOI, PMID or ISBN (`/import-queue`).
- Attach open-access PDFs, add notes, file items in collections, set citekeys.
- Find duplicates, check retractions, check tags and metadata.
- Rename or remove tags, remove automatic tags.
- Edit fields, repair metadata.
- Move items to the Zotero trash.
- `/subsub`, `/history`, `/undo` and `/ai-statement`.

In both modes, each library change shows a preview first and runs only after you select Yes.

## Tools

The Librarian uses one server, zotero: the library tools. The Researcher uses zotero and scholar (searches of PubMed, Europe PMC and OpenAlex, full texts, notes and manuscripts). If you turn on Starbuck, the Researcher also uses verify, for reference checks. Both modes read and write files in your Sub-Sub folder. For a map, see [How it works](/how-it-works/).

## What Sub-Sub writes

Sub-Sub writes literature notes, syntheses and reviews from what it read, with a source for every claim. Each note says what Sub-Sub read: the full text, the abstract or only the metadata.

It does not draft text for assignments, even when you ask. It drafts text for your manuscript or thesis only when you ask. It cites library items as `[@citekey]`, uses only claims from sources it read, and marks the drafted text so that you can check it.

## Learn to read the literature

Two commands help you read papers yourself. Sub-Sub finds the passages and asks questions. You read and write the answers.

- `/read [reason] <citekey, DOI or PMID>` is a guided reading of one paper. Select why you read it: background, one fact, extraction or critique. Sub-Sub reads only as deep as that reason needs, quotes the passages with their place and asks questions. For an extraction, it also adds a row for the paper to your extraction sheet in `Research/`. In the browser, select Read a paper, or Read next to a result of the library search. See [Read a paper](/guide/#read-a-paper) in the guide.
- `/lit reading list: <topic>` searches and screens as `/lit` does. Then it writes a reading list: the works to read, the order to read them in, what each work studies (not what it found) and questions to read each one with. It states no results. In the browser, select Reading list.

The rules of your course about AI apply to what you hand in.

Up to version 0.16, Sub-Sub had profiles (Reader, Scholar, Author, Editor). They are gone: every command is in the Researcher. If you type `/profile`, Sub-Sub tells you where things went.
