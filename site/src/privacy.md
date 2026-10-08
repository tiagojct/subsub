---
alt: /pt/privacidade/
layout: base.njk
title: Privacy and safety
eyebrow: What stays, what leaves
lead: Sub-Sub runs on your computer. Your library stays in Zotero. You choose the model provider, and you approve every change.
---

## What stays on your computer

- Your Zotero library. Sub-Sub reads and changes it only through Zotero's local API on your computer (127.0.0.1). It never uses your zotero.org account.
- Your notes, your tag list and your settings.
- The journal of changes (`~/.local/share/zotero-local-mcp`), which `/undo` uses.

Sub-Sub sends no usage data, statistics or crash reports anywhere. It also turns off the install report of pi, the program it is built on.

For the pilot, you can turn on a usage log (`subsub init`, Usage log). It stays on your computer, in `~/.subsub/usage-log.jsonl`, and holds times, counts, commands and tool names, never what you wrote or what Sub-Sub replied. `subsub usage` shows it. Sub-Sub does not send it; you decide whether to share it.

## What goes to the model provider

The AI model runs at the provider you choose. It receives your messages and what the tools return to it: titles, authors, abstracts, tags, and parts of a full text when you ask for a note on it. When you check claims with `/verify <file> claims`, it also receives the citing sentences of your manuscript and the passages of the sources. Choose a provider whose terms suit your material. For confidential work, use an institutional model service or a local model (see [Models](/models/)). Free tiers have their own terms: outside the European Union, the United Kingdom and Switzerland, Google may use prompts sent with a free key to improve its products, and the providers of some free models on OpenRouter may keep prompts.

## What goes to other services

| Service | What it receives | When |
|---|---|---|
| PubMed (NCBI) | Your search terms; DOIs and PMIDs | Searches, imports, metadata repair; the author's address for `/request-copy` (read from the PubMed record only) |
| Europe PMC | Your search terms, DOIs and PMIDs | Searches, imports, open-access full text |
| OpenAlex | Your search terms, DOIs | Searches, citation graph, alerts, retraction checks |
| Crossref | DOIs, titles | Imports, metadata repair, retraction checks |
| Unpaywall | DOIs | Open-access PDFs |
| Open Library | ISBNs; titles and authors | Book imports; finding the reference of a file without a parent item |
| Google Books, Internet Archive, Wikidata | Titles, publication names and dates | Finding the reference of a file without a parent item |
| Brave Search (United States) | Titles, publication names and dates | The same, only when you saved a Brave Search key in `subsub init` |
| Crossref, DataCite, PubMed, OpenAlex, arXiv, Open Library, Europe PMC | The identifiers and titles of the cited works, and your contact email | Reference checks (Starbuck), only when you turn the add-on on |
| npm, PyPI | Package downloads | Install and update |

These services receive identifiers and search terms, not your notes or your library. If you give a contact email in `subsub init`, every request to them carries it, as these services ask (Unpaywall requires it). Without it, Sub-Sub cannot find open-access PDFs.

Searches happen only in the Researcher. The Librarian also contacts these services, but only to import, repair and check the items you work on, and to find the reference of a file without a parent item. For those files Sub-Sub sends the title, the publication and the date it read in the file, never other text from it.

Sub-Sub sends no email. `/request-copy` writes a draft in your Sub-Sub folder; you decide whether to send it.

## For a data-protection officer

- Controller: the person who uses Sub-Sub. Sub-Sub is software on their computer, not a service; its author receives no data.
- Processors: the model provider the user chooses, under that provider's terms (see [Where your data goes](/models/#where-your-data-goes)), and the bibliographic services in the table above.
- Data sent to the model provider: the user's messages, and what the tools return (bibliographic records, abstracts, tags, passages of full texts, passages of the user's manuscript when they check claims). Sub-Sub is not meant for patient data, and it does not look for it.
- Location: Mistral processes in the European Union; the other providers mostly in the United States or elsewhere. For material that must stay in the EU, use Mistral, an institutional model service, or a local model.
- Retention: Sub-Sub keeps conversations, notes and the change journal on the user's computer only. Retention at the model provider follows its terms.
- Logs: none sent. The pilot usage log is off unless the user turns it on, stays on the computer and holds no content.

## Safety

- Every library change is shown as a preview first and runs only after you approve it. The check is in the program; the model cannot skip it.
- If you edit an item in Zotero while the preview is open, Sub-Sub shows you the new preview before it changes anything. Each change also sends the item's version, so a field you edit at the moment of writing is not overwritten.
- Every change is journaled and can be undone, including a new collection (undo moves it to the Zotero trash).
- Nothing is deleted. Items go to the Zotero trash; tags are removed from items.
- Only tags from your tag list can be added.
- The Librarian has no search tools.
- Text in abstracts, full texts, web pages and search results is treated as data. Sub-Sub's instructions tell the model never to follow instructions found in it.
- A search sent to an outside service is checked in the program: a query longer than 1500 characters or of more than three lines is refused, so passages of your notes or full texts do not go out as a "search".
- A literature note written from the full text may quote only what the full text says. Sub-Sub compares each quote with the item's text in Zotero and refuses the note when a quote is not there.
- Sub-Sub has no shell access. Writes outside your Sub-Sub folder and the current folder, and writes to settings and rule files, need your yes.
- The browser view is a small server on your own computer. It listens only on 127.0.0.1, so other computers cannot reach it. The address that opens it contains a random key; other websites cannot read the page or answer an approval. It stops by itself 10 minutes after you close the page.
- An API key that you save in the browser view is stored on your computer, in the same file as `/login` uses (`~/.subsub/agent/auth.json`, readable only by you). It is sent only to that provider.
