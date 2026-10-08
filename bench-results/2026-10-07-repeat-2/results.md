Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash | true | 20 | library | 1 | 0.741 | 6 | 0 | 0 | 0 | 123 | 2 | 0 | 0 | 64978 | 7122 | 0.005 | n/a |
| qwen3.8-flash | true | 20 | library | 1 | 0.698 | 2 | 0 | 0 | 0 | 85 | 3 | 1 | 0 | 62515 | 4654 | 0.009 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 12 | 1 | 0 | 0 | 23719 | 367 | 0.000 | n/a |
| qwen3.8-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 34 | 4 | 0 | 0 | 54158 | 867 | 0.005 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 878 | true | false | 0 | 138 | 13 | 2 | 0 | 491978 | 5826 | 0.035 | n/a |
| qwen3.8-flash | true | 999 | true | false | 0 | 108 | 11 | 2 | 0 | 418618 | 6382 | 0.026 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 2041 | 12 | 11 | 0 | 290 | 15 | 0 | 0 | 405174 | 8501 | 0.021 | n/a |
| qwen3.8-flash | true | 1995 | 12 | 11 | 0 | 126 | 9 | 1 | 0 | 160665 | 6924 | 0.013 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 5 | 5 | 0 | 0 | 0 | 1 | 122 | 8 | 0 | 0 | 182305 | 4436 | 0.014 | n/a |
| qwen3.8-flash | true | 7 | 2 | 0 | 0 | 0 | 1 | 91 | 10 | 0 | 0 | 130606 | 3619 | 0.007 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.6-pro | true | 2891 | 26 | 26 | 13 | 0 | 0 | true | 2 | 4 | 1 | 16 | 0 | n/a | n/a | 663 | 31 | 0 | 0 | 730122 | 25187 | 0.059 | n/a |
| qwen3.8-flash | true | 3164 | 25 | 25 | 16 | 0 | 0 | true | 2 | 11 | 3 | 14 | 0 | n/a | n/a | 615 | 49 | 7 | 0 | 2661550 | 32313 | 0.078 | n/a |
