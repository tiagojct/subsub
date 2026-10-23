# Changes

Sub-Sub follows the version numbers of npm: a change in the second number (0.13) adds features or changes how you use it; a change in the third (0.13.1) only fixes.

## 0.21.0 (2026-10-23)

A new look for the terminal. It is on by default in `subsub`; set `"look": false` in the settings to go back to the old screen.

- Colours: the terminal themes use the colours of the website (Prussian blue for the Researcher, madder for the Librarian, sap green for what is applied or added, gamboge for a preview). Nothing is red. A failure is ink with a hollow mark and a word, a removal is struck through, and a closed Zotero is a hollow mark and the words "not running". The theme follows the mode, and `themes.librarian` in the settings picks another theme for the Librarian. There are variants for terminals with 256 colours, and a plain look for terminals that cannot draw box glyphs (set `SUBSUB_ASCII=1`, or use a locale that is not UTF-8). `SUBSUB_REDUCE_MOTION=1` stops the working indicator from moving.
- Footer: the mode, the Zotero items and the items to check, the model, how much of the context is used, the tokens and the cost. It gets shorter on narrow terminals. It replaces pi's own footer, so the working folder and the git branch are not shown.
- Tool lines: Sub-Sub's tools show in plain words, for example "search the library: asthma", dashed while they run and solid when done. A failure says "could not search the library" and gives the first line of the error. Press Ctrl+O to expand the rows and see the output. The tools of pi itself (read, edit, write) look as before.
- Approvals: a library change opens a screen with the preview between dashed rules. Press y (s in Portuguese) to apply it, n or Esc to leave the library as it is. Enter does nothing, and keys pressed in the first half second are ignored, so a letter that you typed just before the screen opened cannot answer it. Removals in the preview are struck through, not red. With `look` off, pi's own Yes/No dialog is used.
- Screens: `/notes` lists the notes in your Sub-Sub folder, newest first, with the chosen note beside the list from 100 columns, and its evidence line (full text, abstract or metadata). `/library` searches your Zotero library as you type; Enter puts `/read <item>` in the box (in the Librarian, the item's key) and Ctrl+N puts `/lit-note <item>`. `/actions` lists the actions of the browser view. The shortcuts are Alt+N, Alt+L and Alt+A, and Alt+M switches the mode. In macOS Terminal, Option acts as Alt only if you turn on "Use Option as Meta key"; the commands work everywhere.
- `/read` offers the reasons (background, fact, extract, critique) when you press Tab.
- The library line says "to check" ("por verificar"), as the browser view does; it said "to review".
- Tests: snapshots of the screens at 40, 80 and 120 columns in English and Portuguese, contrast tests for the colours, and tests that run Sub-Sub in a terminal (macOS and Linux).

## 0.20.0 (2026-10-23)

Changes from a technical evaluation of 0.19.0 and Starbuck 0.2.0 (LLMSSH 2026).

- Searching the library: when you ask what you have on a topic, Sub-Sub first searches with your own words, then with close synonyms and other word forms, and says which words it searched. In the evaluation it missed items whose titles use a synonym or repeat your words. In a test on the 20 evaluation tasks, recall rose from 0.87 to 0.96 and precision fell from 0.98 to 0.91: the wider search also lists some items that are only near the topic. Check the list.
- Drafts: Sub-Sub now works from quotes. It reads the full text of each item, chooses a quote for each sentence, and writes the sentence so that it says no more than the quote, with one source for each sentence. A table "Quotes for the check" follows the draft with the quote, word for word, and the page or section for each sentence. A sentence without a quote is cut. In the evaluation, 37% to 53% of the factual sentences in drafts were only partly supported or unsupported by the works they cited. In a test on 18 drafts by two language-model raters, the share fell to 12% to 14% with the new rule. A second test on nine drafts of three other tasks, with the same raters, gave 14% and 16% against 35% and 37% for the old rule; one of the three tasks showed no change. The drafts have more and shorter sentences. Read the table as a way to check, not as a guarantee.
- Reference checks: a Check with "not found by search" is reported as "not confirmed", with the note that books, theses, reports, archives and works in Portuguese are often missing from Crossref and PubMed. Claim verdicts are reported as sentences to check; Sub-Sub does not change the text or the citation because of a verdict.
- Guide pages (English and Portuguese): the same two notes on reference checks.
- Website: a Changes page (English; the Portuguese menu links to it) shows this file.
- Bench: `retrievalScore` scores a retrieval answer by precision and recall against gold items, naming items by citekey or by title.

## 0.19.0 (2026-10-16)

A new look for the browser view, the website, the tutorial and the workshop, after the engraved plates of 19th-century natural history books.

- A grey-green paper, blue-black ink, and four colours with one meaning each: blue for the Researcher and for links, madder red for the Librarian, green for what is applied or checked, ochre for a preview. In dark mode the page is a blue-black plate.
- Type: Literata for text, with true italics; Atkinson Hyperlegible Next for the interface; Atkinson Hyperlegible Mono for commands. They replace IBM Plex.
- The notes pane shows what a note was written from: a line under `evidence:`, solid for the full text, dashed for the abstract, dotted for the metadata.
- Reading mode in the notes pane: larger type and more space between lines, for long notes. Sub-Sub remembers it on this computer. The tutorial has the same button.
- In a preview, a tag that would be removed is struck through instead of red. Errors show in ink, with a word, so that red belongs to the Librarian only. Each mode button keeps its own colour, selected or not.
- A preview has a dashed frame: nothing has changed yet.

## 0.18.0 (2026-10-15)

- Figures and tables from the PDF. With the Zotero server 0.6.0, Sub-Sub can cut a figure or a table out of an item's PDF (`zotero_get_figure`, with the label of its caption, such as "Figure 2" or "Table 1") and show it in a note, with its caption and a link to the page. `/read critique` shows the table or figure with the main result. The images are PNG files in `Literature/figures/`; the notes pane and Obsidian show them. When the figure cannot be cut out, Sub-Sub takes the whole page and says so.
- In a note written from the full text, the page after each quote, "(p. N)", becomes a link that opens the PDF in Zotero at the page where Sub-Sub found the quote. The label stays as written; the link goes to the right page even when the printed page number differs from the PDF's.
- `/feedback [what happened]` (Report a problem in the browser) writes a draft bug report in `Inbox/`: the versions, the mode and model, the output of `subsub doctor` and the last error, with your folders, email addresses and keys taken out. You read it and post it on GitHub; Sub-Sub sends nothing.
- Preprints (medRxiv, bioRxiv, Research Square, SSRN, arXiv) are marked as not peer reviewed wherever Sub-Sub uses them: "(preprint)" in evidence tables and comparison matrices, and in the text. When a journal version exists, Sub-Sub uses and cites it instead.
- `/lit` rates how hard the search is (1 to 10) and allows none, one or two follow-up search rounds to match, with one publication window for every search; it stops early when the sources cover the question. The note's Methods give the rating and the rounds. `/gaps` gives a ranked list of 5 to 15 works and does not read them. This keeps the cost of a search in proportion to the question.
- In the browser view, every table in a note or a reply has a Download CSV button: evidence tables, extraction sheets, comparison matrices. The file opens in Excel (with semicolons when the interface is in Portuguese, as Excel expects there), Rayyan or Covidence.
- A `/lit` note (and a reading list) shows the flow of works under Methods: found, unique, screened, read and used, with what was left out at each step. It is a Mermaid diagram, so Obsidian, Quarto and GitHub draw it; the browser view draws it too.
- The quote check is stricter. A quote may skip text only at a page break (the running footer and header); two passages of one page joined into one quote, without [...] for the omission, are refused. Zotero marks page breaks in the full text, so the check knows where they are.
- `/lit reading list:` no longer ends with "the answer in three lines": a reading list states no results, in the reply too.
- In Portuguese, the browser button for `/lit-note` is now Nota de literatura, so that it is not confused with the reading notes of `/read`.
- Delete in the browser view keeps the conversation's subfolder in `~/.subsub/trash`, so that moving it back is one step.

## 0.17.0 (2026-10-14)

For people who are learning to read the literature:

- `/read <citekey>` is a guided reading of one paper. Sub-Sub asks why you read it: background (the title and abstract, then keep or drop), one fact, extraction for a review, or critique. It reads only as deep as that reason needs, quotes the passages with their place and asks questions; you write the answers. It writes no results or summaries in this note. For an extraction, it also adds a row for the paper to your extraction sheet in `Research/`, with where to find each value. Put the reason first to skip the question: `/read extract smith2021`. In the browser it is the button Read a paper.
- Sub-Sub has no profiles any more (Reader, Scholar, Author, Editor). The two modes stay: the Researcher has every command and tool, and every library change still needs your yes. Sub-Sub writes notes and syntheses with a source for every claim, drafts text for a manuscript or thesis only when you ask, and does not draft text for assignments. What the Reader profile did is now `/read` (a guided reading of one paper) and `/lit reading list: <topic>` (a reading list with questions, no results). `subsub init` no longer asks whether you are a student or which profile you want, and removes the old setting. `/profile` says where things went.
- The browser view is more useful:
  - A library search in the left panel. Each result has Read, Note and a link to the item in Zotero.
  - A notes pane: Notes at the top lists the notes in your Sub-Sub folder, and a note opens next to the conversation. Note paths in replies, `[[links]]` and the Open button on a written file open there too; Open in app still hands it to Obsidian or your editor.
  - After a command and a space, the message box shows what the command needs.
  - Conversations can be renamed and deleted. Delete moves the file to `~/.subsub/trash`. Export is in the language of the interface and includes the tools that Sub-Sub used and their results.
  - The reasons of `/read` show as a list. The undo question has its own title again, and the page no longer scrolls as a whole when the left panel is long.
- In the browser, a command that asks a question (`/read`, `/undo`) no longer shows an error when the answer takes more than 30 seconds.

## 0.16.0 (2026-10-08)

For clinical researchers:

- `/ai-statement [what you used it for]` writes a draft of the statement on the use of AI that journals ask for, with the Sub-Sub version, its DOI, your models and Sub-Sub's checks, in `Research/`. The parts in brackets are for you to complete. It is also a button in the browser view.
- A `/lit` note now says what it is: an AI-assisted rapid review, with one AI screener, no second reviewer and no formal risk-of-bias assessment, for scoping, a background section or a first search, and not a systematic review.
- The site has a page for clinical researchers, in English and Portuguese: what Sub-Sub does for them, what it is not, how to get it on a hospital computer, moving from EndNote or Mendeley, data protection, and journals and AI. The Install page has a section for your IT service: what is installed, what runs and which addresses it contacts.

## 0.15.0 (2026-10-08)

Checks:

- A literature note written from the full text may quote only what the full text says. Sub-Sub compares each quote (in quote marks or a blockquote, 25 characters or more) with the item's text in Zotero, and refuses the note when a quote is not there. Line breaks, hyphenation, quote marks and a page header in the middle of a sentence do not count as differences. Without an indexed full text, the check is skipped.
- A search sent to PubMed, Europe PMC, OpenAlex, Crossref or a web search may not be longer than 1500 characters or three lines. Text from documents is data: the Librarian's instructions now say so too, and both modes are told to send only search terms.
- When a mode's model cannot be used, Sub-Sub says that the provider may have renamed or retired it. With the free model in the Researcher, Sub-Sub says once that it is for trying, not for research you rely on.

Model test:

- The tagging score now uses the items the model was given. The scorer kept in the repository compared them with the reference for other items and gave F1 0; the figures on the site were computed separately and were right.
- The import score counts a model that previewed the import and asked first, or that left out the work already in the library, as right. The Models page had said that glm-5.3-flash missed an identifier and that longcat-2.0 and mimo-v2.5-pro imported nothing; all three imported correctly.
- The results, the blind judgements and the list of published tests are in the repository (bench-results/). `subsub-bench summary` computes the Models page from them, and the release stops when the page and the files differ.
- `subsub-bench sheet` and `subsub-bench agreement`: a blind scoring sheet for people, and their agreement with the AI judge.
- The release workflow runs the unit tests before it publishes.

Other:

- In Portuguese, the browser view titles approvals "Confirmar: etiquetar itens?" and the like, as it does in English; before, it showed the program's raw title ("aplicar tag_items?").
- The site: the whole site in European Portuguese, a two-column home page, How it works, and a section of the Privacy page for a data-protection officer.

## 0.14.0 (2026-10-08)

For students:

- `/lit` works in the Reader profile. It gives a reading list: the same search, screening and screening log, then the works to read, the order to read them in, what each one studies and questions to read it with. It states no results or conclusions.
- The site has a page for students, in English and in European Portuguese: what Sub-Sub does and does not do, how to start for free, what it costs, and the words you will meet.
- The Models page starts with which model to choose and what it costs. The Install page explains the install command. The About page says what you keep if Sub-Sub stops.

## 0.13.1 (2026-10-07)

- A change that would change nothing (for example, citekeys for items that already have one) is no longer offered for approval. Sub-Sub says why instead.

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
