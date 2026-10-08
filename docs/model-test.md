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

Tagging is scored on the items that the server gave the model (zotero_bakeoff_items), against reference.json (the blind reference) or library-tags-reference.json (the owner's reviewed tags), whichever covers them. `score` warns when no reference covers the items, or when tasks.json describes another state of the library than the runs saw. Then F1 or "fixed" means nothing. `score --no-starbuck` keeps the reference checks of the last score.

## Published results

The site's Models page shows only figures computed from files in bench-results/:

- `published.json`: the tests the page reports (run folders, judging, models, tasks).
- `<date>/results.json`, `results.md`, `key.json`: the scores of each run. The run logs (`runs/`) stay private: they hold passages of full texts.
- `judging/<id>/scores.json` and `key.json`: the blind judgements (score 1 to 5, invented references, the judge's reasons) and what each label was.

Steps after a test:

1. Judge the research outputs blind. Write the scores to `judging/<id>/scores.json` and the key to `judging/<id>/key.json`, in the format of the existing files.
2. Add the test to `published.json`.
3. Type `subsub-bench summary`. It writes `site/src/_data/modeltest.json`; the Models page reads its tables from that file.
4. Type `npm test`. A unit test fails when the page's data and the results differ, and the release workflow runs the tests before it publishes.

## Checking the judge

The research scores come from one AI judge. To compare it with people:

1. Type `subsub-bench sheet --judging 2026-10-07-repeats --n 12 --out ~/scoring`. The folder gets 12 outputs under new labels, a README with the scale, and scores.csv. It also gets sheet-key.json: keep that file away from the scorers.
2. Each scorer copies scores.csv to scores-<initials>.csv and fills in the scores, without seeing the other sheets.
3. Type `subsub-bench agreement --sheet ~/scoring`. It shows, for each pair (each scorer and the judge, and the scorers with each other), the mean difference, the share within half a point and the quadratic-weighted kappa. It writes agreement.json.

## Before a release that changes a prompt

Run the default models on the short tasks and compare them with the last published test:

1. Type `subsub-bench run --dir bench-results/<date>-release --librarian <Librarian default> --researcher <Researcher default> --only tagging,import,lit_note`. Copy tasks.json, reference.json and library-tags-reference.json from the last test folder first.
2. Type `subsub-bench score --dir bench-results/<date>-release`.
3. Compare the F1, the import and the literature note with the published test. A drop of more than 0.05 in F1, a wrong import or a note that the quote check refuses is a reason to look at the prompt change again.

## Tests

- `npm install && npm test`: unit tests.
- `npm run test:e2e`: real pi and the `subsub` command with a scripted model and a fake Zotero.
