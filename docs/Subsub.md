Sub-Sub is a Zotero librarian and research assistant that runs in pi. It uses the same Python servers as the OpenCode setup ([[Zotero MCP]]), so the library safety is the same: previews, version checks, journal and undo, the tag vocabulary. The OpenCode setup keeps working in parallel.

- Code: ~/Projects/subsub (git). Servers: ~/Projects/zotero-local-mcp
- Shared rules: [[Zotero agent]]. Tag vocabulary: [[Zotero tags]]
- Settings: ~/.config/subsub/config.json (written by `subsub init`) and ~/.config/opencode/zotero.env (same file as OpenCode)
- Models: librarian opencode-go/glm-5.3-flash, researcher opencode-go/mimo-v2.6-pro
- Public docs: the README in ~/Projects/subsub (source for subsub.tiagojacinto.eu)

## Differences from the OpenCode setup

- Approval is enforced in code. Before any library change, Sub-Sub asks the server for the preview and shows it in a dialog. The change runs only after you select Yes. The model cannot skip this.
- The model does not need to do a dry run first. You see one dialog per change.
- Library tools run one at a time, so each preview includes the effect of earlier changes in the same step.
- The researcher does not have the library write tools at all. It can only add a linked note (with a dialog) and add works to the import queue.
- bash is off in both modes. File writes outside the vault, and writes to the rule files, config folders and code folders, need a Yes.

## Install

1. Make sure that Node is version 22.19 or later: type `node --version`.
2. Type `cd ~/Projects/subsub && npm install --omit=dev`.
3. Type `npm link`. This adds the `subsub` command.
4. Optional: type `pi remove ~/Projects/subsub`. Then plain `pi` stays a plain coding agent without Sub-Sub.
5. Type `subsub`. If pi already has your OpenCode Go key, Sub-Sub uses the same key. If not, type `/login`, select OpenCode Zen and Go, and paste the key.
6. Type `/subsub`. Make sure that the result shows "Zotero: reachable" and the model mimo-v2.6-pro.
7. Type `subsub init` once. Keep the notes folder (the vault), the tag list, the email and the models. For the profile, select Editor.
8. Type `subsub doctor`. Make sure that no line shows FIX.

If you change the Node version with fnm, do step 3 again.

## Use

1. Start Zotero.
2. Type `subsub`. From the home folder, Sub-Sub starts in the vault. From a different folder (for example a manuscript folder), it starts in that folder. To stay in the home folder, type `subsub --here`.
3. Sub-Sub starts in the researcher mode. To start in the librarian mode, type `subsub --librarian`.
4. To change the mode, type `/librarian` or `/researcher`. The mode also changes the model.
5. When a dialog shows a preview, read it. Select Yes to apply the change, or No to stop it. After No, tell Sub-Sub what to change.
6. To continue the last session, type `subsub -c`. To select an older session, type `subsub -r`.

Sub-Sub always replies in English and writes its notes in English. Quotations and titles of works stay in their original language.

Sub-Sub keeps its pi settings, sessions and packages in ~/.subsub/agent, separate from plain pi (~/.pi/agent).

Commands:

- `/subsub`: Zotero connection and library overview
- `/profile`: shows or changes the profile
- `/history`: recent library changes
- `/undo`: shows the last change, asks, and reverts it. `/undo <id>` reverts a specific change from `/history`.

Templates (type the name, then the argument):

- Librarian: `/tag-batch [size]`, `/clean-tags`, `/import-queue [note path]`
- Researcher: `/lit-note <citekey>`, `/synthesis <topic>`, `/gaps <topic>`, `/manuscript <path>`, `/alert`

## Profiles

The profile sets how much Sub-Sub does. To see the profile, type `/profile`. To change it, type `/profile reader` (or scholar, author, editor). The change is saved.

- Reader: explains each step. Reading notes are quotes with page numbers, plus questions. No summaries or syntheses. No bulk library changes.
- Scholar: literature notes, syntheses, searches and alerts. The full librarian.
- Author: Scholar plus manuscripts: citation check, bibliography, comments on the argument. It does not write the paragraphs.
- Editor: everything, including drafted manuscript text when you ask.

## Tag review notes

The librarian writes proposed tags in review notes in Inbox/ ("Zotero tag review NN.md"). Edit the Proposed tags column. Write skip to leave an item as it is.

To apply one note, in the librarian mode, type: apply the tag review Inbox/Zotero tag review NN.md.

To apply many notes:

1. Start Zotero.
2. Type `subsub review preview 13-31` (the numbers of the notes). This shows what each note will change. Nothing changes.
3. Type `subsub review apply 13-31`. Read the preview, then type y.
4. If Zotero asks for permission, select Always Allow.

Use note numbers, not a pattern such as "*.md": a pattern also takes older notes that have no Applied line, and applying an old note again replaces later tag changes.

Notes that were already applied are left out. Each applied note gets an "Applied" line with the journal ID. To revert a note, type `/undo <journal ID>` in Sub-Sub. If a note shows "changed since the note was written", the tags of those items changed in Zotero after the note was made; applying the note replaces those changes.

## Look

When you start Sub-Sub with the `subsub` command, it shows a banner, a status line (mode, model, Zotero items, items to review) and a line from Moby-Dick. Each mode has its own theme: try-works for the librarian, Glauca for the researcher, in the dark or light version that matches your terminal. The theme changes for the session only; your pi theme setting stays.

To change this, add to ~/.config/subsub/config.json:

- `"quotes": false`: no Moby-Dick line.
- `"themes": false`: keep your own pi theme.
- `"look": false`: no banner and no themes.

The themes are in ~/Projects/subsub/themes. To make them again after a change in Gam, see scripts/make-themes.py.

## Model test

The model test runs several models on the same tasks against your library and compares them. Nothing in the library changes: each library change is recorded with its preview and then blocked. Notes go to ~/Projects/subsub/bench-results/<date>/, not to the vault.

Tasks:

- Librarian: tag 20 items against a blind reference (reference.md shows the items without their tags; the tags go in reference.json); fix the items without topic or status; import identifiers, one of them already in the library.
- Researcher: a literature note on one item with full text; a synthesis on one topic; a search for recent papers that are not in the library.

Procedure:

1. Start Zotero.
2. Type `subsub-bench prepare`. This picks the tasks.
3. Type `caffeinate -i subsub-bench run`. This takes 1 to 2 hours. caffeinate keeps the Mac awake. If the run stops, type the same command again: finished runs are not repeated.
4. Type `subsub-bench score`. The result is results.md in the results folder.

Options for `run`: `--librarian a,b` and `--researcher c,d` (OpenCode Go model ids), `--only tagging,import`, `--parallel 3`, `--timeout 900`.

Each model gets a code (for example M417), so the notes can be judged blind. key.json has the codes.

## Problems

- To find a setup problem, type `subsub doctor`. Each line marked FIX says what to do.
- "the zotero server did not start": run `cd ~/Projects/zotero-local-mcp && uv sync`. If pi does not find uv, add `"uvPath": "/path/to/uv"` to ~/.config/subsub/config.json (type `which uv` to see the path).
- "cannot use opencode-go/...": the OpenCode Go key is missing. In Sub-Sub, type `/login` again.
- "command not found: subsub": type `cd ~/Projects/subsub && npm link`.
- To update Sub-Sub after new code arrives, type `cd ~/Projects/subsub && npm install --omit=dev`. Do not use `subsub update`.
- A tool call is refused with "not available in researcher mode": type `/librarian`.
- `subsub review` says "No note matches": check the note numbers in Inbox/. A path is written from the vault folder, in quotes (for example "Inbox/Zotero tag review 13.md").

## Tests

- `cd ~/Projects/subsub && npm install && npm test`: unit tests.
- `npm run test:e2e`: real pi and the `subsub` command with a scripted model and a fake Zotero.
