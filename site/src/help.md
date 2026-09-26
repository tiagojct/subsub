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
| NOTE Contact email | Type `subsub init` and give an email address. Without it, Sub-Sub cannot find open-access PDFs. |
| FIX Model login | Type `subsub`, then `/login`. |

## Other problems

- "command not found: subsub": open a new terminal window. If the problem continues, type the install command again.
- Zotero asks for permission when Sub-Sub first changes something: select Always Allow.
- "cannot use opencode-go/…": you are not logged in to that provider, or the model name is wrong. Type `/login`, or change `models` in the settings file.
- A tool is "not part of the Reader profile": type `/profile` to see the profile, and `/profile scholar` to change it.
- A tool is "not available in researcher mode": type `/librarian`.
- A review note was "already applied": Sub-Sub does not apply a note twice. To apply it again, ask for it explicitly.

## Report a problem

Open an issue on [GitHub](https://github.com/tiagojct/subsub/issues). Include the output of `subsub doctor` and `subsub --version`. Do not include API keys.
