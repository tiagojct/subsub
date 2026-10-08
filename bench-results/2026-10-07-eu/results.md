Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | true | 20 | library | 1 | 0.588 | 2 | 0 | 0 | 0 | 19 | 2 | 0 | 0 | 60339 | 1758 | 0.007 | n/a |
| mistral/mistral-medium-3.5 | true | 20 | library | 1 | 0.650 | 3 | 0 | 0 | 0 | 60 | 2 | 0 | 0 | 67064 | 8555 | 0.112 | n/a |
| mistral/mistral-large-2512 | true | 20 | library | 1 | 0.655 | 2 | 2 | 0 | 0 | 18 | 2 | 0 | 0 | 59306 | 886 | 0.015 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | true | false | 2 | 2 | 1 | 0 | 1 | true | 15 | 2 | 0 | 0 | 36707 | 514 | 0.001 | n/a |
| mistral/mistral-medium-3.5 | true | false | 2 | 2 | 1 | 0 | 1 | true | 14 | 1 | 0 | 0 | 24158 | 720 | 0.042 | n/a |
| mistral/mistral-large-2512 | true | false | 2 | 2 | 1 | 0 | 1 | true | 36 | 8 | 1 | 0 | 120062 | 1140 | 0.021 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | true | 698 | true | false | 0 | 33 | 6 | 2 | 0 | 155285 | 3614 | 0.008 | n/a |
| mistral/mistral-medium-3.5 | true | 1369 | true | true | 0 | 101 | 8 | 1 | 0 | 452997 | 7353 | 0.314 | n/a |
| mistral/mistral-large-2512 | false | 0 | true | false | 0 | 119 | 12 | 3 | 0 | 409632 | 6439 | 0.150 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | false | 0 | 12 | 0 | 0 | 19 | 15 | 2 | 0 | 158906 | 1183 | 0.007 | n/a |
| mistral/mistral-medium-3.5 | true | 2641 | 12 | 10 | 0 | 127 | 19 | 4 | 0 | 447074 | 6812 | 0.207 | n/a |
| mistral/mistral-large-2512 | true | 1871 | 12 | 11 | 0 | 77 | 9 | 2 | 0 | 145009 | 4404 | 0.061 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | true | 5 | 0 | 0 | 0 | 0 | 1 | 22 | 2 | 0 | 0 | 66695 | 1741 | 0.003 | n/a |
| mistral/mistral-medium-3.5 | true | 5 | 0 | 0 | 0 | 0 | 1 | 54 | 5 | 0 | 0 | 141549 | 2109 | 0.111 | n/a |
| mistral/mistral-large-2512 | true | 10 | 0 | 5 | 0 | 0 | 1 | 26 | 3 | 0 | 0 | 71495 | 986 | 0.029 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistral/mistral-small-2603 | true | 1395 | 10 | 10 | 9 | 0 | 0 | true | 1 | 9 | 0 | 3 | 0 | n/a | n/a | 98 | 18 | 1 | 0 | 753367 | 7758 | 0.021 | n/a |
| mistral/mistral-medium-3.5 | true | 3084 | 25 | 25 | 17 | 0 | 0 | true | 1 | 9 | 1 | 12 | 0 | n/a | n/a | 208 | 26 | 2 | 0 | 1881539 | 17277 | 0.288 | n/a |
| mistral/mistral-large-2512 | true | 1008 | 10 | 10 | 8 | 0 | 0 | false | 1 | 11 | 0 | 0 | 2 | n/a | n/a | 224 | 26 | 5 | 0 | 458367 | 12724 | 0.101 | n/a |
