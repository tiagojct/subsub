---
description: "Researcher: compare sources on a question (a source matrix: claim, evidence type, caveats, confidence)"
argument-hint: "<question, or citekeys, DOIs or PMIDs>"
---
Compare the sources on: $ARGUMENTS

Make a short slug: lower case, hyphens, at most five words. Use today's date (YYYY-MM-DD).

1. Find the sources.
   - If the user gave citekeys, DOIs or PMIDs, use exactly those.
   - Otherwise: library first (zotero_find_items), then scholar_search_multi with three phrasings. Choose 3 to 10 sources and say why.
2. Read each source before you describe it: zotero_get_fulltext for library items, scholar_read_oa_fulltext (methods and results) for open-access works, scholar_get_work for the abstract of the others. Note whether you read the full text or only the abstract.
3. Build the matrix, one row per source:
   | # | Source | Claim on the question | Evidence type | Population and setting | Caveats | Confidence |
   - Evidence type: for example randomised trial, cohort, case-control, cross-sectional, diagnostic accuracy, systematic review, guideline, expert opinion, modelling.
   - Caveats: risk of bias, small sample, surrogate outcome, short follow-up, industry funding, abstract only.
   - Confidence: high, moderate or low, with one reason.
4. Below the matrix, write: where the sources agree; where they disagree and the most likely reason (population, design, outcome definition, analysis); what no source answers. Cite source numbers in every sentence. Write "inference:" before a statement that no single source makes.
5. Check the sources: verify_check_references when the verify_ tools are available, otherwise scholar_get_work for each identifier. Never write "verified" for a check you did not run.
6. Write one note: `Research/<date> <slug> comparison.md` in the notes folder (do not overwrite; add -2). Front matter: title, date, type: comparison, sources (the identifiers), verification (PASS, PASS WITH NOTES or BLOCKED), reference_check (path of the Starbuck report, or none). End with a Sources section: [@citekey] for library items, full reference with DOI and "(not in library)" for the others.
7. If a step fails, finish the note anyway and mark the step "BLOCKED: <what failed>".

Give the user the path and three lines on what the comparison shows.
