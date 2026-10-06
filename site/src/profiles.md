---
layout: base.njk
title: Profiles
eyebrow: How much Sub-Sub does
lead: A profile sets what Sub-Sub writes for you and which tools it offers. The names describe the work, not the person.
---

A profile applies in both modes, the Researcher and the Librarian. It changes two things. For research, it sets what Sub-Sub writes for you. For library changes, only the Reader profile is different: it has no bulk changes and smaller batches. Scholar, Author and Editor make the same library changes.

## Research (Researcher)

| | Reader | Scholar | Author | Editor |
|---|---|---|---|---|
| Explains each step | yes | | | |
| Reading notes: quotes with page numbers, and questions for you | yes | yes | yes | yes |
| Summaries, literature notes, syntheses | | yes | yes | yes |
| Literature reviews, comparisons, digests (`/lit`, `/compare`, `/digest`) | | yes | yes | yes |
| Reference checks with Starbuck (`/verify`) | yes | yes | yes | yes |
| Draft email to ask an author for a copy (`/request-copy`) | yes | yes | yes | yes |
| Citation check and bibliography for a manuscript | | | yes | yes |
| Comments on the argument of a manuscript | | | yes | yes |
| Review of a manuscript against a reporting guideline (`/review`) | | | yes | yes |
| Drafted text for a manuscript, when you ask | | | | yes |

## Library (both modes)

| | Reader | Scholar | Author | Editor |
|---|---|---|---|---|
| Explains each step | yes | | | |
| Tag items, with tags from your tag list | yes | yes | yes | yes |
| Import by DOI, PMID or ISBN | yes | yes | yes | yes |
| Attach open-access PDFs, add notes, file items in collections, set citekeys | yes | yes | yes | yes |
| Find duplicates, check retractions, check tags and metadata | yes | yes | yes | yes |
| Rename or remove tags, remove automatic tags | | yes | yes | yes |
| Edit fields, repair metadata | | yes | yes | yes |
| Move items to the Zotero trash | | yes | yes | yes |
| Items per tag review note | 10 | 25 | 25 | 25 |

In both modes and in every profile, each library change shows a preview first and runs only after you select Yes. `/history` and `/undo` work in every profile.

## Reader

For someone who wants to do the reading and the writing: a student who is new to a field, or anyone who starts in a new area. Sub-Sub says what it will do before each step. A reading note has the reference, direct quotes with page numbers, and under each quote a question for you to answer. Sub-Sub does not write summaries or text that you could hand in as your own.

For library changes, Reader tags, imports and attaches PDFs, with 10 items per review note. It cannot rename or remove tags, edit fields, repair metadata or move items to the trash. For those, change the profile to Scholar.

## Scholar

The default. Literature notes and syntheses from what Sub-Sub read, with a source for every claim, and all library changes, including the bulk changes. It does not draft text for your manuscripts.

## Author

Scholar, plus help with your manuscripts: it checks the citations against your library, exports the bibliography for Quarto or Pandoc, and comments on the argument, the structure and the evidence that is missing. You write the paragraphs.

## Editor

Everything. When you ask, it drafts text for a manuscript, cites library items as `[@citekey]`, uses only claims from sources it read, and marks the drafted text so that you can check it.

## Change the profile

- Type `/profile` to see the current profile.
- Type `/profile reader` (or `scholar`, `author`, `editor`) to change it. Sub-Sub saves the change.

If you type a command that your profile does not run, Sub-Sub refuses it and names the profiles that run it.

A profile is your choice, not a lock: you can change it at any time. If a course has rules about AI, those rules apply, whatever the profile.
