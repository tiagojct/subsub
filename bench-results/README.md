# Model test results

The published part of Sub-Sub's model tests. The site's Models page computes its tables from these files (`subsub-bench summary`); see docs/model-test.md.

- `published.json`: the tests that the Models page reports.
- `<date>/results.json` and `results.md`: the scores of each run, per model and task. `key.json` maps the run codes (M123) to the models.
- `judging/<id>/scores.json`: the blind judgements of the research outputs (1 to 5, invented references, the judge's reasons). `key.json` maps each label to its run, model and task.

Not published: the run logs and outputs (`runs/`), which hold passages of the full texts of the items, and the task files, which list items of the author's library.

The tests ran on one library, about 1000 items in medicine and health informatics. One AI model judged the research outputs blind; people have not yet checked those scores (`subsub-bench sheet`, `subsub-bench agreement`).
