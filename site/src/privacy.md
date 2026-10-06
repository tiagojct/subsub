---
layout: base.njk
title: Privacy and safety
eyebrow: What stays, what leaves
lead: Sub-Sub runs on your computer. Your library stays in Zotero. You choose the model provider, and you approve every change.
---

## What stays on your computer

- Your Zotero library. Sub-Sub reads and changes it only through Zotero's local API on your computer (127.0.0.1). It never uses your zotero.org account.
- Your notes, your tag list and your settings.
- The journal of changes (`~/.local/share/zotero-local-mcp`), which `/undo` uses.

Sub-Sub sends no usage data, statistics or crash reports anywhere.

## What goes to the model provider

The AI model runs at the provider you choose. It receives your messages and what the tools return to it: titles, authors, abstracts, tags, and parts of a full text when you ask for a note on it. When you check claims with `/verify <file> claims`, it also receives the citing sentences of your manuscript and the passages of the sources. Choose a provider whose terms suit your material. For confidential work, use an institutional model service or a local model (see [Models](/models/)).

## What goes to other services

| Service | What it receives | When |
|---|---|---|
| PubMed (NCBI) | Your search terms; DOIs and PMIDs | Searches; the author's address for `/request-copy` (read from the PubMed record only) |
| Europe PMC | Your search terms, DOIs and PMIDs | Searches, open-access full text |
| OpenAlex | Your search terms, DOIs | Searches, citation graph, alerts |
| Crossref | DOIs, titles | Imports and metadata repair |
| Unpaywall | DOIs and your contact email | Open-access PDFs (the email is required by Unpaywall) |
| Open Library | ISBNs | Book imports |
| Crossref, DataCite, PubMed, OpenAlex, arXiv, Open Library, Europe PMC | The identifiers and titles of the cited works, and your contact email | Reference checks (Starbuck), only when you turn the add-on on |
| npm, PyPI | Package downloads | Install and update |

These services receive identifiers and search terms, not your notes or your library.

Sub-Sub sends no email. `/request-copy` writes a draft in your Sub-Sub folder; you decide whether to send it.

## Safety

- Every library change is shown as a preview first and runs only after you approve it. The check is in the program; the model cannot skip it.
- Each change sends the item's version, so an edit you make in Zotero at the same time is never overwritten.
- Every change is journaled and can be undone.
- Nothing is deleted. Items go to the Zotero trash; tags are removed from items.
- Only tags from your tag list can be added.
- With library changes off (the switch at the top, or `/library off`), Sub-Sub cannot change the library, except to add a short linked note (with a preview).
- Text in abstracts, full texts and search results is treated as data. Sub-Sub's instructions tell the model never to follow instructions found in it.
- Sub-Sub has no shell access. Writes outside your Sub-Sub folder and the current folder, and writes to settings and rule files, need your yes.
- The browser view is a small server on your own computer. It listens only on 127.0.0.1, so other computers cannot reach it. The address that opens it contains a random key; other websites cannot read the page or answer an approval. It stops by itself 10 minutes after you close the page.
- An API key that you save in the browser view is stored on your computer, in the same file as `/login` uses (`~/.subsub/agent/auth.json`, readable only by you). It is sent only to that provider.
