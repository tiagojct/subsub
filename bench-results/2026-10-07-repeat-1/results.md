Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash | true | 20 | library | 1 | 0.712 | 5 | 0 | 0 | 0 | 85 | 2 | 0 | 0 | 61354 | 3294 | 0.005 | n/a |
| qwen3.8-flash | true | 20 | library | 1 | 0.715 | 3 | 0 | 0 | 0 | 96 | 3 | 1 | 0 | 64037 | 5414 | 0.010 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 18 | 1 | 0 | 0 | 23723 | 356 | 0.002 | n/a |
| qwen3.8-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 55 | 6 | 0 | 0 | 73596 | 1992 | 0.006 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 861 | true | true | 0 | 110 | 10 | 1 | 0 | 304119 | 5163 | 0.035 | n/a |
| qwen3.8-flash | true | 1000 | true | false | 0 | 137 | 11 | 3 | 0 | 369396 | 6962 | 0.023 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 1691 | 12 | 11 | 0 | 206 | 13 | 0 | 0 | 299532 | 6588 | 0.025 | n/a |
| qwen3.8-flash | true | 1831 | 12 | 11 | 0 | 124 | 18 | 1 | 0 | 315022 | 6463 | 0.017 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 8 | 0 | 0 | 0 | 0 | 1 | 119 | 11 | 0 | 0 | 154157 | 3507 | 0.016 | n/a |
| qwen3.8-flash | true | 7 | 3 | 0 | 0 | 0 | 2 | 100 | 10 | 0 | 0 | 151232 | 3944 | 0.008 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 3194 | 31 | 31 | 17 | 0 | 0 | true | 2 | 8 | 0 | 20 | 0 | n/a | n/a | 695 | 49 | 1 | 0 | 856514 | 29542 | 0.063 | n/a |
| qwen3.8-flash | true | 2943 | 22 | 22 | 19 | 1 | 0 | true | 2 | 6 | 1 | 12 | 0 | n/a | n/a | 440 | 29 | 4 | 0 | 1108966 | 22464 | 0.042 | n/a |
