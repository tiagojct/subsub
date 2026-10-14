---
alt: /pt/perfis/
layout: base.njk
title: Modes and commands
eyebrow: What each mode does
lead: Sub-Sub has two modes. The Researcher has every command and tool. The Librarian manages the library only.
---

The mode sets which tools Sub-Sub may use. The Researcher is the default: it reads your library, searches the literature, writes notes and also changes the library. Use the Librarian for tagging sessions with a fast, cheap model. Each mode can have its own model.

To change the mode, select Researcher or Librarian at the top of the browser view. In the terminal, type `/researcher` or `/librarian`.

## Research

| | Researcher | Librarian |
|---|---|---|
| Guided reading of one paper (`/read`) | yes | |
| Reading list with questions to read with (`/lit reading list:`) | yes | |
| Literature notes and syntheses (`/lit-note`, `/synthesis`) | yes | |
| Literature review with a screening log (`/lit`) | yes | |
| Works that you do not have, new publications (`/gaps`, `/alert`) | yes | |
| Comparisons and digests (`/compare`, `/digest`) | yes | |
| Citation check and bibliography for a manuscript (`/manuscript`) | yes | |
| Review of a manuscript against a reporting guideline (`/review`) | yes | |
| Reference checks with Starbuck (`/verify`) | yes | |
| Draft email to ask an author for a copy (`/request-copy`) | yes | |
| Drafted text for a manuscript, when you ask | yes | |

## Library

| | Researcher | Librarian |
|---|---|---|
| Tag items, with tags from your tag list (`/tag-batch`, `/clean-tags`) | yes | yes |
| Import by DOI, PMID or ISBN (`/import-queue`) | yes | yes |
| Attach open-access PDFs, add notes, file items in collections, set citekeys | yes | yes |
| Find duplicates, check retractions, check tags and metadata | yes | yes |
| Rename or remove tags, remove automatic tags | yes | yes |
| Edit fields, repair metadata | yes | yes |
| Move items to the Zotero trash | yes | yes |

`/subsub`, `/history`, `/undo` and `/ai-statement` work in both modes. In both modes, each library change shows a preview first and runs only after you select Yes.

## Tools

The Librarian uses one server, zotero: the library tools. The Researcher uses zotero and scholar (searches of PubMed, Europe PMC and OpenAlex, full texts, notes and manuscripts). If you turn on Starbuck, the Researcher also uses verify, for reference checks. Both modes read and write files in your Sub-Sub folder. For a map, see [How it works](/how-it-works/).

## What Sub-Sub writes

Sub-Sub writes literature notes, syntheses and reviews from what it read, with a source for every claim. Each note says what Sub-Sub read: the full text, the abstract or only the metadata.

It does not draft text for assignments, even when you ask. It drafts text for your manuscript or thesis only when you ask. It cites library items as `[@citekey]`, uses only claims from sources it read, and marks the drafted text so that you can check it.

## Learn to read the literature

Two commands help you read papers yourself. Sub-Sub finds the passages and asks questions. You read and write the answers.

- `/read [reason] <citekey>` is a guided reading of one paper. Select why you read it: background, one fact, extraction or critique. Sub-Sub reads only as deep as that reason needs, quotes the passages with their place and asks questions. For an extraction, it also adds a row for the paper to your extraction sheet in `Research/`. In the browser, select Read a paper. See [Read a paper](/guide/#read-a-paper) in the guide.
- `/lit reading list: <topic>` searches and screens as `/lit` does. Then it writes a reading list: the works to read, the order to read them in, what each work studies (not what it found) and questions to read each one with. It states no results. In the browser, select Reading list.

If a course has rules about AI, those rules apply.

Up to version 0.16, Sub-Sub had profiles (Reader, Scholar, Author, Editor). They are gone: every command is in the Researcher. If you type `/profile`, Sub-Sub tells you where things went.
