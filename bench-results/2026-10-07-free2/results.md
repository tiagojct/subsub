Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | true | 20 | library | 1 | 0.577 | 0 | 0 | 0 | 0 | 205 | 3 | 0 | 0 | 95547 | 4620 | 0 | n/a |
| google/gemini-3.1-flash-lite | true | 20 | library | 1 | 0.631 | 0 | 0 | 0 | 0 | 8 | 2 | 0 | 0 | 58766 | 813 | 0.010 | n/a |
| openrouter/google/gemma-4-31b-it:free | false | 0 | n/a | 0 | n/a | n/a | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.8-flash | false | 0 | library | 1 | 0 | 0 | 0 | 0 | 0 | 1500 | 1 | 0 | 0 | 11098 | 142 | 0.009 | n/a |
| google/gemini-3.5-flash-lite | true | 20 | library | 1 | 0.631 | 2 | 0 | 0 | 0 | 46 | 2 | 0 | 0 | 63606 | 4586 | 0.023 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | true | false | 2 | 2 | 1 | 0 | 1 | true | 29 | 2 | 0 | 0 | 40501 | 551 | 0 | n/a |
| google/gemini-3.1-flash-lite | true | false | 2 | 2 | 1 | 0 | 1 | true | 18 | 4 | 0 | 0 | 58556 | 367 | 0.006 | n/a |
| openrouter/google/gemma-4-31b-it:free | false | false | 2 | 0 | 0 | 0 | n/a | false | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.8-flash | false | false | 2 | 0 | 0 | 0 | n/a | false | 624 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.5-flash-lite | true | false | 2 | 2 | 1 | 0 | 1 | true | 39 | 2 | 0 | 0 | 34921 | 936 | 0.006 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | false | 0 | false | false | 0 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.1-flash-lite | true | 441 | true | false | 0 | 45 | 5 | 1 | 0 | 125470 | 2055 | 0.020 | n/a |
| openrouter/google/gemma-4-31b-it:free | false | 0 | false | false | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.8-flash | false | 0 | false | false | 0 | 1222 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.5-flash-lite | false | 0 | true | false | 0 | 15 | 5 | 0 | 0 | 130389 | 747 | 0.019 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google/gemini-3.1-flash-lite | true | 838 | 12 | 11 | 0 | 79 | 5 | 0 | 0 | 140901 | 1706 | 0.018 | n/a |
| google/gemini-3.8-flash | false | 0 | 12 | 0 | 0 | 625 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.5-flash-lite | false | 0 | 12 | 0 | 0 | 25 | 6 | 0 | 0 | 112123 | 5710 | 0.028 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | true | 5 | 0 | 0 | 0 | 0 | 1 | 152 | 2 | 0 | 0 | 73872 | 2325 | 0 | n/a |
| google/gemini-3.1-flash-lite | true | 5 | 0 | 0 | 0 | 0 | 1 | 46 | 2 | 0 | 0 | 62759 | 727 | 0.006 | n/a |
| openrouter/google/gemma-4-31b-it:free | false | 0 | 0 | 0 | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| google/gemini-3.5-flash-lite | false | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google/gemini-3.1-flash-lite | true | 645 | 7 | 7 | 6 | 0 | 0 | true | 1 | 0 | n/a | n/a | n/a | n/a | n/a | 92 | 6 | 0 | 0 | 162574 | 2893 | 0.019 | n/a |
| google/gemini-3.5-flash-lite | false | 0 | 0 | 0 | 0 | 0 | 0 | false | 0 | 0 | n/a | n/a | n/a | n/a | n/a | 1 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
