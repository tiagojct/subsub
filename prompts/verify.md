---
description: "Check the references of a manuscript or of a Sub-Sub report"
argument-hint: "<path to .qmd or .md> [claims]"
---
Check the references of $1 with Starbuck.

1. If the verify_ tools are not available, tell the user that reference checks need Starbuck: add "addons": ["starbuck"] to the Sub-Sub settings file and start Sub-Sub again. Then stop.
2. Call verify_check_manuscript with path $1.
3. Report the summary: how many references failed, need checking, have notes and passed.
4. For each Fail and each Check, give the citation key, Starbuck's reason and its suggested action. Keep Starbuck's result; do not make it stronger or weaker.
5. List the cited keys without a bibliography entry.
6. Give the path of the HTML report.
7. If the second argument is "claims", or the user asks whether the sources support the text:
   1. Call verify_prepare_claims with path $1. Get all pages (offset, limit).
   2. Judge each claim with status ready from its passages only: supported, partly_supported, not_supported or cannot_assess. Copy the passage you rely on character for character into quote.
   3. Call verify_record_claims once, with the verdicts of all claims.
   4. Report the claims that are not supported or only partly supported, with the line and the reason. Say for each whether the evidence was the full text or the abstract only.
8. Do not change the manuscript. Offer fixes and wait for the user's answer.
