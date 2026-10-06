---
layout: base.njk
title: Help
eyebrow: When something does not work
lead: Start with subsub doctor. It checks the set-up and says how to fix each problem.
---

## subsub doctor

Type `subsub doctor`. Each line starts with `ok`, `NOTE` or `FIX`. Do the fix that the line shows, then type `subsub doctor` again.

| Line | What to do |
|---|---|
| FIX Node | Install Node.js 22.19 or later, or type the install command again. |
| FIX Settings | Type `subsub init`. |
| FIX uv | Install [uv](https://docs.astral.sh/uv/), or type the install command again. |
| FIX Zotero server | Check the internet connection: the first start downloads the Zotero server. Then type `subsub doctor` again. |
| FIX Zotero | Start Zotero 10. In Zotero, open Settings > Advanced and turn on "Allow other applications on this computer to communicate with Zotero". |
| FIX Tag list | Type `subsub init`. It creates a starter tag list. |
| NOTE Tag list: no topic/ tags | In the librarian mode, ask: `propose topics for my tag list`. |
| NOTE Sub-Sub folder | The folder is a whole Obsidian vault, or the tag list and note formats are still in `Systems/` (before version 0.9). Type `subsub init`: it moves Sub-Sub's files into a `Sub-Sub` folder, with the settings files in `Zotero/`. |
| NOTE Contact email | Type `subsub init` and give an email address. Without it, Sub-Sub cannot find open-access PDFs. |
| FIX Starbuck | Only when reference checks are on. Check the internet connection: the first start downloads Starbuck. Then type `subsub doctor` again. To turn reference checks off, type `subsub init`. |
| FIX Model login | Open Sub-Sub, select the model button and save an API key. Or type `subsub`, then `/login`. |

## Other problems

- "command not found: subsub": open a new terminal window. If the problem continues, type the install command again.
- The shortcut does nothing, or the page says "Open Sub-Sub with its shortcut": open Sub-Sub from the shortcut again (the page address changes each time Sub-Sub starts). If the problem continues, type `subsub web` in a terminal and read the message. The browser view writes a log to `~/.subsub/web.log`.
- The shortcut stopped working after an update or a move: type `subsub shortcut`.
- On Windows, the shortcut also opens a minimised window in the taskbar. That window is Sub-Sub itself: closing it stops Sub-Sub.
- The page says "Sub-Sub stopped": select Start again. If it stops again, type `subsub doctor`.
- Zotero asks for permission when Sub-Sub first changes something: select Always Allow.
- "cannot use opencode-go/…": you are not logged in to that provider, or the model name is wrong. Type `/login`, or change `models` in the settings file.
- A tool or a command is "not part of the Reader profile": type `/profile` to see the profile, and `/profile scholar` to change it. The message names the profiles that have it. For example, `/lit` is not in Reader, and `/review` is only in Author and Editor.
- A tool is "not available in researcher mode": type `/librarian`.
- `/verify` says that reference checks need Starbuck: turn on "Reference checks (Starbuck)" in the panel on the left of the browser view, or type `subsub init --starbuck on`.
- Sub-Sub refuses a literature note: the note must say what Sub-Sub read (evidence: full text, abstract or metadata), and it can give page numbers only when it read the full text. Ask Sub-Sub to correct the note.
- A review note was "already applied": Sub-Sub does not apply a note twice. To apply it again, ask for it explicitly.

## Papers that are not open access

Sub-Sub finds open-access copies through Unpaywall and Europe PMC. For other papers:

- At FMUP or U.Porto, use Sub-Sub on the U.Porto network. There, the DOI link opens the publisher's version through the library's subscriptions. See [FMUP](/fmup/).
- Type `/request-copy` and the citekey, DOI or PMID. Sub-Sub drafts an email to the corresponding author. You send it.

Sub-Sub does not use unlicensed sources.

## Report a problem

Open an issue on [GitHub](https://github.com/tiagojct/subsub/issues). Include the output of `subsub doctor` and `subsub --version`. Do not include API keys.
