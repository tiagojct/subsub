# Model test

The model test runs several models on the same tasks against your library and compares them. Nothing in the library changes: each library change is recorded with its preview and then blocked. Notes go to bench-results/<date>/ in the checkout, not to the Sub-Sub folder.

Tasks:

- Library tasks: tag 20 items against a blind reference (reference.md shows the items without their tags; the tags go in reference.json); fix the items without topic or status; import identifiers, one of them already in the library.
- Research tasks: a literature note on one item with full text; a synthesis on one topic; a search for recent papers that are not in the library.

Procedure:

1. Start Zotero.
2. Type `subsub-bench prepare`. This picks the tasks.
3. Type `caffeinate -i subsub-bench run`. This takes 1 to 2 hours. caffeinate keeps the Mac awake. If the run stops, type the same command again: finished runs are not repeated.
4. Type `subsub-bench score`. The result is results.md in the results folder.

Options for `run`: `--models a,b` for all tasks, or `--librarian a,b` and `--researcher c,d` for each group of tasks (OpenCode Go model ids), `--only tagging,import`, `--parallel 3`, `--timeout 900`. Library tasks run in the Librarian. Research tasks run in the Researcher.

Each model gets a code (for example M417), so the notes can be judged blind. key.json has the codes.

## Tests

- `npm install && npm test`: unit tests.
- `npm run test:e2e`: real pi and the `subsub` command with a scripted model and a fake Zotero.
