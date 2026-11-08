---
alt: /pt/estabilidade/
layout: base.njk
title: Stability
eyebrow: What version 1.0 promises
lead: From version 1.0, the names and settings on this page do not change inside version 1. A change that breaks them needs version 2.
---

## The rule

Sub-Sub uses the version numbers of npm.

- A change in the third number (1.0.1) fixes a fault. It adds nothing.
- A change in the second number (1.1.0) can add features. It does not remove or rename anything on the frozen list below.
- A change in the first number (2.0.0) can break the frozen list.
- When a new form replaces an old one, Sub-Sub reads the old form for the whole of version 1. The old `Systems/` folder for the settings files is one example.

## Frozen in version 1

Commands in the terminal:

- `subsub`, `subsub --librarian`, `subsub web` (also `subsub serve`), `subsub tui`
- `subsub init`, `subsub doctor`, `subsub usage`, `subsub shortcut`
- `subsub review preview` and `subsub review apply`
- `subsub --version` and the option `--here`

Commands inside Sub-Sub:

- `/librarian`, `/researcher`, `/notes`, `/library`, `/actions`, `/subsub`
- `/ai-statement`, `/read`, `/feedback`, `/history`, `/undo`
- The 15 prompt commands: `/alert`, `/check-library`, `/clean-tags`, `/compare`, `/digest`, `/gaps`, `/import-queue`, `/lit-note`, `/lit`, `/manuscript`, `/request-copy`, `/review`, `/synthesis`, `/tag-batch`, `/verify`

The names are frozen. The wording of the prompts and of the roles is not. It can change in any release, because it improves with tests.

Files and settings:

- The settings file `~/.config/subsub/config.json`, or the file named in `SUBSUB_CONFIG`.
- The folder `~/.subsub/agent`, or the folder named in `SUBSUB_AGENT_DIR`. The variable `SUBSUB_UV` also stays.
- These keys in the settings file: `userName`, `about`, `language`, `setup`, `serverDir`, `envFile`, `vault`, `models`, `defaultMode`, `vaultContext`, `sharedRules`, `startTimeout`, `uvPath`, `look`, `quotes`, `themes`, `themesLibrarian`, `costLimit`.

Folders in your Sub-Sub folder. Both layouts work and both stay:

- TitleCase: `Sub-Sub/`, `Inbox/`, `Zotero tags.md`, `Zotero agent.md`, `Literature alerts.md`.
- Lowercase: `sub-sub/`, `inbox/`, `zotero-tags.md`, `zotero-agent.md`, `literature-alerts.md`.

Tools:

- The tool prefixes `zotero_` and `scholar_`, and the tool names of `zotero-local-mcp`.
- The Zotero server has its own version number. Each Sub-Sub release names the exact version it runs. Removing or renaming a tool needs Sub-Sub 2.0.

Safety rules:

- Each change to your library is shown first, and Sub-Sub applies it only when you select Yes.
- Each change sends the item version, so a field you edit at the same time is not overwritten.
- Each change is in the journal, and `/undo` reverts the last one.
- Nothing is deleted. Items go to the Zotero trash.
- Group libraries are read-only.
- Only tags from your tag list can be added.

## Not frozen

- The default models.
- The look of the screens: colours, glyphs and layout.
- The benchmark tool `subsub-bench`.
- The commands `/subsub-refresh` and `/subsub-find`. The browser view and the full-screen terminal use them.

## Experimental

These can change in any release. The documents mark them.

- The tool prefix `verify_` and the add-on Starbuck.
- The settings keys `addons`, `starbuckDir` and `usageLog`.

## pi

Sub-Sub runs on pi. Each Sub-Sub release accepts one minor version of pi (1.0 uses pi 1.5) and its patch releases. When you install Sub-Sub with npm, npm installs that pi. The `subsub` command uses its own copy of pi, so an update of another pi on your computer does not change it. If you add Sub-Sub to your own pi with `pi install`, use the pi minor version that the install page names.

A new minor version of pi can need a new minor version of Sub-Sub. The frozen list does not change when this happens. Each week a test runs Sub-Sub against the newest pi, so a problem shows before you meet it.
