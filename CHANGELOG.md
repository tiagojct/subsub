# Changes

Sub-Sub follows the version numbers of npm. From version 1.0: a change in the third number (1.0.1) only fixes; a change in the second (1.1.0) adds features and removes or renames nothing that the Stability page lists; a change in the first (2.0.0) can break that list. Before 1.0, a change in the second number (0.13) could change how you use Sub-Sub.

## 1.0.2 (2026-11-12)

Fixes only. The commands, settings keys, folder layouts and tool names do not change.

- `subsub init`: an option without its value (`--folder` alone) or an unknown option stops init with a message. Before, `--folder` alone made a folder named `true`, and `--email` alone saved the email address `true`. `--name=Ana` works as `--name Ana`. A value that is not one of the choices (for example `--tags health`) stops init and lists the choices; before, init went on without a tag list.
- `subsub init` makes the Zotero server settings file readable only by you, also without a Brave key: the file can hold NCBI and OpenAlex keys.
- `subsub doctor` reads `~` in `SUBSUB_AGENT_DIR`, as Sub-Sub does. Before, it reported a missing model login. Its fix for a server folder is `uv sync --directory "<folder>"`, which also works in Windows PowerShell.
- `/feedback` takes your home and Sub-Sub folders out of the draft also when a path uses `/` on Windows, other letter case, or the `\\` of the servers' JSON. A folder whose name only starts with yours (`/Users/anabela` for `/Users/ana`) stays.
- A preview with a field or row that the server left out is shown without it. Before, the change was refused.
- `subsub usage` leaves out lines of the log that are not events.
- The web view: the chat stays in view when you hide the sidebar on a wide window; a reply that streams after a reload no longer replaces the reply before it; a link with a lone `%` no longer shows the whole reply as plain text; a page that connects while a dialog opens shows the dialog; a double click answers one dialog only, and a dialog ignores clicks for its first 0.7 seconds, as it ignores keys; a double click on an action or library button sends the request once; a message that could not be sent comes back into the box; a library search of more than 200 characters gets its results; "busy" is shown in the language of the page; the export holds the markdown of the replies, without the Copy and Download CSV buttons; a CSV cell that starts with `=`, `+`, `-` or `@` (and is not a number) is saved as text, so Excel does not run it; the page works when the browser blocks site data; a tool call that never ran stops pulsing when the turn ends; the menu button uses the same width rule as the page, so the sidebar opens also with a large text size in the browser.
- `subsub tui`: a dialog closes when pi stops, so a key no longer ends the client; a paste works in the login, library, notes and list fields, and Backspace removes a whole emoji; `/import-queue` goes to Sub-Sub; a command that waits for your answers (`/read`) no longer reports a timeout after 30 seconds; a provider error that Sub-Sub does not word itself (for example a model that is gone) is shown when the turn ends; a link to a note that is gone no longer ends the client; a closed terminal window or a kill gives the terminal back; a second screen opened while the first loads no longer stays stuck; long or wide text (Chinese, Japanese, emoji) and text with line breaks fit their rows; notices of several lines keep their lines.
- pi that cannot start (a working folder that is gone) is reported in the web view and the terminal client instead of ending them.
- The write gate protects the settings files under every name in every settings folder, also in a folder that mixes the two styles of names, on a file system that tells case apart.
- `subsub-bench`: a run whose pi cannot start, a refused tag submit, tags sent as one string, an option without a valid number, score sheets saved by Excel with semicolons and decimal commas, and a Starbuck report from an earlier score are handled.
- Tests for these fixes, except the ones in the web page.

## 1.0.1 (2026-11-11)

Fixes only. The commands, settings keys, folder layouts and tool names do not change.

- The approval gate now also holds for a library tool that Sub-Sub does not know by name, for example a tool of a newer Zotero server or of a local server folder. Before, such a tool ran without a question. Now Sub-Sub shows its preview when the tool has a dry run, and otherwise asks before it runs.
- The quote check of literature notes no longer stops for the rest of the session when Zotero is closed or a read of the full text fails. Sub-Sub reads the full text again for the next note. A full text that Sub-Sub could not read to the end is not used for the check, so quotes from the unread part are not reported as missing. Sub-Sub now reads up to 3 million characters (was 1.2 million).
- The quote check sees an edit of a note as pi applies it. pi also matches text with other quote marks, dashes or spaces; before, the check then saw the old note and let an invented quote through.
- `/undo` shows a notice when the undo cannot run (for example, the Zotero server stopped), instead of an error.
- The web view answers bad requests (bad JSON, bad encoding in an address or a cookie) with a clear 400 error instead of a server error.
- Settings, API keys and the web view's running file are written to a temporary file and then moved into place, so a crash never leaves half a file. A file with keys is made readable only by you, also when it existed before.
- A wrong type in the settings file (for example a number for `vault`) stops Sub-Sub with a message that names the setting. A `startTimeout` that is not a positive number keeps the default of 45 seconds.
- `subsub web --idle` with a value that is not a number keeps the default of 10 minutes (before, the server never stopped). `--port` accepts only a valid port number.
- `~\` at the start of a path works on Windows.
- The Zotero servers see Sub-Sub's real version as the client version.
- The MCP SDK is 1.32.2 (was 1.30.1). Updates of locked dependencies remove the security notices from `npm audit`.
- Tests: the gate for tools that are not on a list, the full-text reads, edits matched as pi matches them, the web view's request rules, file writes and modes, and wrong settings types. The end-to-end tests now run against the Zotero server release that users get (0.8.0), not the server's main branch, and check that each tool of the real servers is on one of Sub-Sub's lists. The tests on GitHub also check the types.
- The GitHub workflows use current versions of their actions, pinned to exact commits, with read-only permissions where they need no more. The release workflow uses a fixed npm version.
- The test tutorial names Sub-Sub 1.0.

## 1.0.0 (2026-11-08)

Version 0.26.0 was not published. Its changes are part of this version.

- Version 1 is stable. The commands, the settings keys, the folder layouts, the tool names and the safety rules do not change inside version 1. The [Stability page](https://subsub.tiagojacinto.eu/stability/) has the full list, and says what is not frozen and what is experimental.
- Sub-Sub runs on pi 1.5.0 (was 1.4.0) and accepts its patch releases. The weekly test against the newest pi stays. In plain pi, use pi 1.5.
- Zotero server 0.8.0 (was 0.7.0): the lowercase Sub-Sub layout and the relink of notes.
- The lowercase Sub-Sub layout (0.26.0, below).
- When Sub-Sub starts, it takes other copies of Sub-Sub out of the `packages` list in its `settings.json`. Two copies in one session register the same flags, and pi stops.
- The install pages name pi 1.5.
- A Stability page (English and Portuguese) and a Stability section in the README.
- Tests: the settings fix, and the full unit and end-to-end tests on pi 1.5.0 on Linux, macOS and Windows.

## 0.26.0 (2026-11-03, not published; part of 1.0.0)

- Lowercase Sub-Sub layout. Sub-Sub reads the style from the folder names: a Sub-Sub folder with `inbox/`, `literature/`, `syntheses/`, `research/` or `zotero/` uses lowercase names. The settings files are then `zotero-tags.md`, `zotero-agent.md` and `literature-alerts.md`, and the notes that Sub-Sub itself writes (feedback drafts, AI use statements) get slug names, for example `2026-11-03_ai-use-statement.md`. In a vault, `sub-sub/` is used when it exists.
- In the lowercase style the system prompt has a section "Folder names" that tells the model to read the folder names of the prompts in lowercase and to name new notes as slugs.
- The TitleCase layout (`Sub-Sub/`, `Inbox/`, `Zotero tags.md`) works as before.
- Tests: style detection by folder names (not by `existsSync`, which ignores case on macOS), the slug rule against the test vectors, the lowercase settings paths and the prompt section.

## 0.25.0 (2026-11-01)

- Sub-Sub runs on pi 1.4.0 (was 1.0.4). Install pi 1.4 to use the package in plain pi.
- The `subsub` command, `subsub web` and `subsub tui` turn off pi's MCP support (`--no-mcp`). A server in an `mcp.json` file would get your library content and could change the library without Sub-Sub's previews. To use other MCP servers with Sub-Sub, add the Sub-Sub package to plain pi.
- Inside plain pi, Sub-Sub blocks its own Zotero servers when pi reaches them through MCP (for example zotero-local-mcp in your `mcp.json`, as `mcp__zotero__tag_items`). These calls skipped the mode check and the previews. The model is told to use the Sub-Sub tool (`zotero_tag_items`) instead.
- The themes use pi's new schema address, `https://pi.dev/schemas/theme.schema.json`.
- Tests: `--no-mcp` for Sub-Sub sessions and not for pi's own commands, the block of the MCP copies of Sub-Sub's tools, and the themes against pi's theme schema.

## 0.24.1 (2026-11-01)

- In the terminal, the tool line of a library search with several queries (your words and their synonyms, 0.24.0) shows the words it searched. It showed nothing after the tool name.

## 0.24.0 (2026-11-01)

With the Zotero server 0.7.0.

- Inside plain pi, Sub-Sub no longer turns off the tools of pi and of your other extensions: it adds its own and swaps only those when the mode changes (issue #1). The `subsub` command, `subsub web` and `subsub tui` keep only Sub-Sub's tools, as before.
- Without Zotero. Sub-Sub starts when Zotero is closed, and `subsub doctor` shows a NOTE, not a FIX. The library line says "Zotero is closed: search only". The Researcher can then search PubMed, Europe PMC and OpenAlex, read open-access full texts and write notes; the Librarian needs Zotero. Sub-Sub is still made to start from your Zotero library. A new FAQ in the README and on the Help page says this.
- Searching the library: one search with your words and their synonyms. The items that only a synonym found are listed under their own head, "Found only by a synonym", because they can be only near the topic.
- Another provider that speaks the OpenAI API: your institution's server, or a local one (Ollama, LM Studio). Connect it in `subsub init`, in the browser view (the model button, "Another provider") or with `/login` in `subsub tui`. Sub-Sub saves it in `models.json`, readable only by you; a server on another computer must use https. This is also how the FMUP model service will connect.
- Group libraries, read-only. The library search covers your library and the group libraries in Zotero, and marks each item from a group with the group's name. Sub-Sub can read, quote and write notes on items in a group; it cannot change them.
- `subsub tui`: `/login` connects a provider (an API key, shown as stars, or another provider), and `/resume` opens the earlier conversations.
- A cost limit. With `"costLimit": 2` (US dollars) in the settings, Sub-Sub says when a conversation has used 80% of it, and from the limit on it asks before each new request to the model. It never stops an answer that is running. The browser view then shows the cost next to the model.
- `/check-library` (Check the library in the actions): duplicates, retracted or corrected works and files without a parent item, in one report, then one preview to tag the retracted works `_retracted`. Sub-Sub does not merge or delete.
- `/lit` counts the duplicates removed and the works already in your library, in the screening log and the flow diagram. At the end it offers a RIS file of the screened works, for a second screening in Rayyan or Covidence. Bibliographies can now be RIS as well as CSL JSON, and can include works that are not in your library (by DOI, PMID or ISBN).
- Tests: plain pi with other tools, the prompt without Zotero, the library search with groups, the provider checks, `/login` in `subsub tui` with the key hidden, the cost limit, and the new command.

## 0.23.0 (2026-10-24)

- The browser view is set like the website. Replies and notes have the website's headings (a fine rule above each section), its numbered steps and a slightly larger text. A note opens on the lighter field of a page, and the list of notes is grouped by folder under small-capital heads, with the date on the right. The empty conversation has the website's running head and a larger heading. Notes and the model in the top bar are plain text buttons, as in the website's menu. A command you send (`/read ...`) is shown in the mono. The working line is drawn dotted, dashed and solid, as in the terminal, instead of a moving gradient. Scrollbars are thin. On a phone, Notes is no longer cut to "No..." (the theme button is in the side panel there).
- In the browser view, the sections of the side panel (Library, Actions, Conversations) and the two groups of actions (Research, Library) fold at their heading. With the others folded, the list of conversations takes the whole panel. The browser remembers which ones you folded.

## 0.22.0 (2026-10-24)

- `subsub tui`: Sub-Sub on the whole terminal. It is a full-screen client of pi's RPC mode, like the browser view, with the look of `subsub`: a conversation that scrolls (mouse wheel, PgUp and PgDn), a side panel from 110 columns (mode, library, keys, earlier conversations), an editor that completes commands, and the footer. Alt+N, Alt+L, Alt+A and Alt+M open the notes, the library search and the actions, and switch the mode, as in `subsub`. `/sessions` and `/new` change the conversation, `/model` chooses the model, `/restart` starts pi again in the same conversation, `/quit` leaves. Ctrl+O shows the output of tool rows, Esc stops a running answer, and Ctrl+C twice quits. `--light` or `--dark` set the colours when the terminal does not say (the default is dark), and `--librarian` starts in the Librarian.
- In `subsub tui`, every question that Sub-Sub asks is answered on screen: the approval screen for a library change (`y` applies it, `n` or Esc leaves it, Enter does nothing, keys in the first half second are ignored), lists and typed answers. Nothing is applied without a yes. pi's own screens (`/login`, `/settings`, `/tree`, `/resume`, `/fork`, `/share`, `/export`) are not in it: use `subsub` or `subsub web` for them.
- Shortcuts: F2, F3, F4 and F5 open the notes, the library search and the actions, and switch the mode, in `subsub` and in `subsub tui`. Alt+N, Alt+L, Alt+A and Alt+M (0.21.0) need a terminal that sends Alt as Escape plus the letter; macOS Terminal and iTerm2 do not by default (Option types a symbol), so on a Mac they did nothing. On a Mac the F keys need Fn unless you set them as standard function keys in System Settings.
- Fixed: when pi is started with Sub-Sub's own folder as its folder (the browser view and `subsub tui` do this), an empty `auth.json` could be replaced by a link to itself, and the model then could not read its credentials ("Credential store read failed ... ELOOP"). It is no longer linked.
- Internal: the code that talks to pi in RPC mode (`Agent`, the library state and search, the command hints) is in `src/rpc.ts`, shared by the browser view and the terminal client. Tests: screen snapshots of the client at 80 and 120 columns, and a test that runs `subsub tui` in a terminal with a fake model and a fake Zotero (macOS and Linux).

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
