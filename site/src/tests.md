---
alt: /pt/testes/
layout: base.njk
title: Tests
eyebrow: What was tested, and what we found
lead: Before version 0.20, Sub-Sub 0.19.0 was tested on a library of 103 records, and so was Starbuck, the reference checker that works with it. This page gives the questions, the results and the limits.
---

## Who ran the tests

The author of Sub-Sub and Starbuck ran them. The protocol, the versions and the test library were fixed before the first test run. The results are not an independent audit. A short report is being prepared for the LLMSSH 2026 symposium.

## What Sub-Sub was asked to do

Twenty tasks, each run three times (60 runs), on a test library of 103 records on the history of respiratory medicine. The tasks were: list the items on a topic, answer a question from the library, summarise a paper, draft a paragraph, find problems in a library (the editor tasks), and answer a question that the library cannot answer. Web tools were off, so Sub-Sub had only the library. All 60 runs finished and cost 0.47 USD in total with one model.

Two language-model raters rated every answer without knowing which version made it. The author then rated every item on which they differed, and a random fifth of the rest.

## What the tests found in Sub-Sub 0.19.0

- Searching the library: precision 0.98 and recall 0.87. It missed items whose titles use a synonym of your words.
- Editor tasks: it named all the problem items that were planted in the library.
- Citations: none of the 94 citations in the answers was invented, and none came from outside the library. 94% supported the claim they were attached to.
- Drafts: 37% to 53% of the factual sentences were only partly supported, or not supported, by the works they cited. This is the weakest result.
- Out-of-library questions: all six answers said that the library has nothing on the topic, and none invented a source.

## What changed for 0.20

- Search: it now searches with your own words, then with close synonyms and other word forms, and says which words it used. On the four search tasks, recall rose from 0.87 to 0.96 and precision fell from 0.98 to 0.91. On 16 tasks together, precision was 0.90 against 0.85 and recall 0.94 against 0.90. The wider search sometimes lists items that are only near the topic. Check the list.
- Drafts: it now chooses a quote for each sentence first and writes the sentence from the quote. A table, "Quotes for the check", follows the draft. In a test on 18 drafts, the share of sentences not fully supported fell to 12% to 14%. In a second test on nine drafts of other tasks it was 14% and 16%, against 35% and 37% for 0.19.0. On one of the three tasks there was no change.
- Reference checks: "not found by search" is now reported as "not confirmed".
- Answer quality as a whole: the average score (0 to 2) went from 1.72 and 1.67 to 1.82 and 1.74 for the two raters. The gain is within the noise of a small sample. The test shows that the changes did not lower the quality of answers that were already good.

## What the tests found in Starbuck 0.2.0

Starbuck checks the references of a manuscript against Crossref, OpenAlex, PubMed and book catalogues. It was tested on 300 references from open-access articles in biomedicine, social sciences and humanities (English and Portuguese), 90 of them altered.

- All 36 invented or recombined references were flagged or left as unverifiable.
- It could not verify 30% of the existing references: 4% in biomedicine, 29% in social sciences and 67% in humanities. Books and works in Portuguese were the most often unverifiable. No reference with a DOI was.
- Claim support (level 4) marked 12 of 15 misattributed citations as not supported. It marked only 5 of 15 distorted claims, and it marked 8 of 30 unaltered pairs as partly or not supported.

## What this means when you use Sub-Sub

- Read the "Quotes for the check" table under every draft. It helps you check each sentence. It does not guarantee that the draft is right.
- Read "not confirmed" as "check this one". Books, theses, reports and Portuguese works are often missing from the databases.
- Treat claim verdicts as sentences to read again, not as verdicts. Sub-Sub does not change your text because of one.
- When Sub-Sub lists what you have on a topic, scan the list for items that are near the topic but not about it.

## Limits

- One test library, one language model and one version of each tool.
- The raters are language models. The author rated the disagreements and a random sample, and the language-model raters were stricter than the author.
- The test library is small, and a few errors move a percentage by a lot.
- The changes for 0.20 were designed on development tasks and checked on the 20 tasks and on extra drafts. They were not tested on a different library.

## Not tested yet

Sub-Sub with web and literature search tools on, asked for works outside the library. A test of whether the works it cites exist and support the sentences is planned for after the abstract is submitted.
