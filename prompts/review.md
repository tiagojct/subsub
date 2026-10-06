---
description: "Critical review of a manuscript (FATAL, MAJOR, MINOR issues, annotations, revision plan); comments only"
argument-hint: "<path to .qmd, .md or .docx>"
---
Review the manuscript $1 as a critical reader before submission. Comment only: do not rewrite the user's paragraphs and do not change the file.

1. Read the whole manuscript (the read tool; for .docx, ask the user to convert it with `quarto pandoc $1 -o draft.md`). Identify the study design and the reporting guideline that applies: CONSORT (randomised trials), STROBE (observational studies), PRISMA (systematic reviews), STARD (diagnostic accuracy), TRIPOD or TRIPOD+AI (prediction models), CHEERS (economic evaluations), SRQR or COREQ (qualitative research). Say which one you used and why.
2. Check, with the line or section where each issue is:
   - Question and aims: clear, and matched by the design.
   - Reporting: the items of the guideline that are missing or incomplete.
   - Risk of bias: selection, confounding, measurement, missing data, selective reporting.
   - Outcomes: defined before analysis, measured the same way in all groups, clinically meaningful.
   - Statistics: sample size, the right test or model, effect sizes with confidence intervals (not only P values), multiple comparisons, handling of missing data.
   - Claims beyond the data: causal language for associations, results generalised past the population studied, conclusions not supported by the results.
   - References: if the verify_ tools are available, run verify_check_manuscript on $1 and include its Fail and Check results. Do not judge whether a source supports a claim unless you read the source.
3. Rank every issue:
   - FATAL: the main conclusion does not follow, or the study cannot answer its question.
   - MAJOR: needs new analysis, new data or substantial rewriting.
   - MINOR: wording, presentation, small reporting gaps.
4. Write the review next to the manuscript as `<name>-review.md` (do not overwrite; add -2). Structure:
   - Summary (three to five sentences: design, main finding, overall judgement)
   - Strengths
   - FATAL issues, MAJOR issues, MINOR issues: each with its location, a short quotation of the text, the problem, and what would fix it
   - Reporting checklist: the guideline items missing or incomplete
   - Reference check (Starbuck results, or "not run")
   - Revision plan: the order in which to fix the issues
   Front matter: title, date, type: manuscript-review, manuscript (path), guideline, verification (PASS, PASS WITH NOTES or BLOCKED).
5. Quote the manuscript exactly. Do not invent line numbers: use section names when the file has no line numbers in view.
6. If a check cannot run, write "BLOCKED: <what failed>" in that section and keep going.

Give the user the path, the number of FATAL, MAJOR and MINOR issues, and the three most important ones.
