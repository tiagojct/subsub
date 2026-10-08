Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| qwen3.8-flash | true | 20 | library | 1 | 0.710 | 3 | 0 | 0 | 0 | 87 | 3 | 1 | 0 | 63816 | 5342 | 0.010 | n/a |
| mimo-v2.6-flash | true | 20 | library | 1 | 0.717 | 4 | 0 | 0 | 0 | 91 | 2 | 0 | 0 | 63243 | 5208 | 0.006 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| qwen3.8-flash | true | true | 2 | 2 | 1 | 0 | n/a | true | 28 | 3 | 0 | 0 | 34135 | 789 | 0.004 | n/a |
| mimo-v2.6-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 14 | 1 | 0 | 0 | 23714 | 316 | 0.000 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 1038 | true | false | 0 | 143 | 11 | 2 | 0 | 373042 | 6117 | 0.030 | n/a |
| qwen3.8-flash | true | 1031 | true | false | 0 | 130 | 11 | 2 | 0 | 395675 | 6825 | 0.021 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 1970 | 12 | 11 | 0 | 153 | 11 | 0 | 0 | 219003 | 7079 | 0.018 | n/a |
| qwen3.8-flash | true | 1931 | 12 | 11 | 0 | 123 | 8 | 0 | 0 | 152271 | 6056 | 0.008 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 6 | 0 | 0 | 0 | 0 | 1 | 127 | 12 | 0 | 0 | 236385 | 4915 | 0.013 | n/a |
| qwen3.8-flash | true | 7 | 2 | 0 | 0 | 0 | 1 | 59 | 4 | 0 | 0 | 94507 | 2554 | 0.005 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 2690 | 18 | 18 | 14 | 0 | 0 | true | 2 | 9 | 1 | 9 | 0 | n/a | n/a | 597 | 36 | 2 | 0 | 925876 | 26283 | 0.057 | n/a |
| qwen3.8-flash | true | 2697 | 22 | 16 | 21 | 0 | 0 | true | 2 | 12 | 5 | 6 | 0 | n/a | n/a | 427 | 30 | 2 | 0 | 1223720 | 21255 | 0.047 | n/a |
