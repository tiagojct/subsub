---
description: "Researcher: literature review on a health research question (library first, then PubMed, Europe PMC, OpenAlex)"
argument-hint: "<question or topic>"
---
Do a literature review on: $ARGUMENTS

Make a short slug from the topic: lower case, hyphens, at most five words. Use today's date (YYYY-MM-DD).

## 1. Plan

1. Write the question in one sentence. If it is a clinical question, state population, exposure or intervention, comparison and outcome when they apply.
2. Decide the scale:
   - Narrow question ("what is X", one fact, one test): at most 10 tool calls, a short answer, no plan file.
   - Review question: write the plan to `Research/.plans/<slug>.md` in the notes folder: the question, the search phrasings, the study designs that answer it (for example randomised trials, cohorts, diagnostic accuracy studies, systematic reviews), the years, and a task list.
3. Tell the user the plan in three lines. Then continue at once. Do not wait for an answer unless the user asked to see the plan first.

## 2. Gather

1. Library first: zotero_find_items for the topic (and the topic tags). Note what the library already has.
2. Outside: scholar_search_multi with three or four phrasings of the question (synonyms, the test or drug name, the condition name, MeSH terms). Use year limits when the question needs recent work.
3. Choose the works to read. Prefer systematic reviews, guidelines and primary studies with the right design. Say why you leave out a work that looks relevant.
4. Read before you summarise:
   - Library items: zotero_get_fulltext, or the abstract when there is no full text.
   - Open-access works: scholar_read_oa_fulltext, first the section list, then only the sections you need (usually methods and results).
   - Other works: scholar_get_work for the abstract.
5. Keep an evidence table as you read. Give each source a number that does not change: [1], [2], ...

## 3. Synthesise

- Separate what the sources agree on, where they disagree (and why: population, design, outcome definition, follow-up), and what is still open.
- Every factual sentence cites at least one source number. Write "inference:" before a statement that combines sources and is not stated in any of them.
- Say for each source whether you read the full text or only the abstract.
- Give numbers (effect sizes, accuracy, sample sizes) only from what you read, with the source.
- Do not draft text for the user's own manuscript.

## 4. Verify

- If the verify_ tools are available: verify_check_references with the identifiers of every source in the evidence table. Fix the sources that fail. Report the ones that need checking.
- If not: check each DOI or PMID with scholar_get_work.
- Never write "verified" for a check you did not run.

## 5. Deliver

Write one note: `Research/<date> <slug>.md` in the notes folder. Do not overwrite an existing note; add -2 to the name. Use this structure:

```markdown
---
title: "<question>"
date: <YYYY-MM-DD>
type: literature-review
question: "<question in one sentence>"
searches: ["<phrasing 1>", "<phrasing 2>", "<phrasing 3>"]
sources_found: <number of unique works>
sources_read: <number>
sources_used: <number>
verification: PASS | PASS WITH NOTES | BLOCKED
reference_check: "<path of the Starbuck report, or none>"
---

## Answer
(three to six sentences, with source numbers)

## Evidence table
| # | Source | Design | Population | Key finding | Read | In library |
|---|---|---|---|---|---|---|

## Agreement
## Disagreement
## Open questions
## Methods
(where you searched, the phrasings, what you included and left out, and why)

## Sources
1. [@citekey] for library items; for other works: Authors, year, title, journal. doi:... (not in library)
```

If a step fails (a service does not answer, a full text cannot be read), do not stop. Finish the note, mark the step "BLOCKED: <what failed>", and set verification: BLOCKED.

Before you answer, read the note back to confirm that it exists. Then give the user the path, the answer in three lines, and the works worth adding to the library (offer scholar_queue_imports).
