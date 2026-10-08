Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google/gemini-3.1-flash-lite | true | 20 | library | 1 | 0.639 | 1 | 0 | 0 | 0 | 16 | 2 | 0 | 0 | 62583 | 3636 | 0.019 | n/a |
| google/gemini-3.5-flash-lite | true | 20 | library | 1 | 0.661 | 1 | 0 | 0 | 0 | 22 | 3 | 0 | 0 | 68384 | 7311 | 0.031 | n/a |
| google/gemma-4-31b-it | false | 0 | library | 1 | 0 | 0 | 0 | 0 | 0 | 10 | 1 | 0 | 0 | 11070 | 205 | 0 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google/gemini-3.1-flash-lite | true | false | 2 | 2 | 1 | 0 | 1 | true | 10 | 2 | 0 | 0 | 34930 | 800 | 0.004 | n/a |
| google/gemini-3.5-flash-lite | true | false | 2 | 2 | 1 | 0 | 1 | true | 12 | 2 | 0 | 0 | 35169 | 1142 | 0.007 | n/a |
| google/gemma-4-31b-it | false | false | 2 | 0 | 0 | 0 | n/a | false | 2 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
