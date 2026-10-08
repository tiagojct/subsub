Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| deepseek-v4.1-flash | false | 0 | n/a | 0 | n/a | n/a | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| mimo-v2.6-pro | true | 20 | blind | 1 | 0.841 | 5 | 0 | 0 | 0 | 92 | 2 | 0 | 0 | 52969 | 4131 | 0.014 | n/a |
| qwen3.8-flash | true | 20 | blind | 1 | 0 | 0 | 0 | 0 | 0 | 71 | 2 | 0 | 0 | 29321 | 4315 | 0.007 | n/a |
| mimo-v2.6-flash | true | 20 | blind | 1 | 0.853 | 6 | 0 | 0 | 0 | 141 | 2 | 0 | 0 | 58083 | 9411 | 0.007 | n/a |
| glm-5.3-flash | true | 20 | blind | 1 | 0.836 | 6 | 0 | 0 | 0 | 20 | 2 | 0 | 0 | 48174 | 2667 | 0.005 | n/a |
| minimax-m3 | true | 20 | blind | 1 | 0 | 0 | 0 | 0 | 0 | 125 | 15 | 12 | 0 | 667013 | 31063 | 0.087 | n/a |

## facet_fix

| model | expected | fixed | extra_items | change_calls | preview_errors | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| deepseek-v4.1-flash | 4 | 0 | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| mimo-v2.6-pro | 4 | 0 | 0 | 0 | 0 | 97 | 9 | 0 | 0 | 84724 | 2315 | 0.006 | n/a |
| qwen3.8-flash | 4 | 2 | 0 | 1 | 0 | 31 | 5 | 0 | 0 | 53007 | 1133 | 0.003 | n/a |
| mimo-v2.6-flash | 4 | 2 | 0 | 1 | 0 | 50 | 6 | 0 | 0 | 62310 | 2156 | 0.002 | n/a |
| glm-5.3-flash | 4 | 2 | 0 | 1 | 0 | 36 | 5 | 0 | 0 | 49155 | 1750 | 0.005 | n/a |
| minimax-m3 | 4 | 0 | 0 | 0 | 0 | 26 | 10 | 1 | 0 | 129837 | 4049 | 0.018 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| deepseek-v4.1-flash | false | false | 2 | 0 | 0 | 0 | n/a | false | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| mimo-v2.6-pro | true | false | 2 | 2 | 1 | 0 | n/a | true | 42 | 4 | 0 | 0 | 38723 | 1029 | 0.002 | n/a |
| qwen3.8-flash | false | false | 2 | 2 | 1 | 0 | n/a | false | 28 | 4 | 0 | 0 | 36289 | 771 | 0.001 | n/a |
| mimo-v2.6-flash | true | false | 2 | 2 | 1 | 0 | n/a | true | 13 | 1 | 0 | 0 | 18688 | 391 | 0.000 | n/a |
| glm-5.3-flash | false | false | 2 | 2 | 1 | 0 | n/a | false | 27 | 6 | 3 | 0 | 63924 | 1255 | 0.006 | n/a |
| minimax-m3 | true | false | 2 | 2 | 1 | 0 | n/a | true | 32 | 10 | 0 | 0 | 101129 | 1557 | 0.011 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| glm-5.3 | true | 918 | true | false | 0 | 62 | 7 | 0 | 0 | 178098 | 3080 | 0.108 | n/a |
| deepseek-v4-pro | false | 0 | false | false | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| kimi-k2.6 | true | 714 | true | false | 0 | 92 | 9 | 0 | 0 | 216251 | 3886 | 0.104 | n/a |
| mimo-v2.6-pro | true | 988 | true | false | 0 | 162 | 10 | 0 | 0 | 171795 | 4157 | 0.024 | n/a |
| qwen3.7-plus | true | 989 | true | false | 0 | 55 | 9 | 0 | 0 | 324519 | 4004 | 0.059 | n/a |
| minimax-m3 | true | 1087 | true | false | 0 | 32 | 7 | 0 | 0 | 206660 | 6860 | 0.036 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| glm-5.3 | true | 1560 | 12 | 11 | 0 | 74 | 7 | 1 | 0 | 94098 | 3961 | 0.065 | n/a |
| deepseek-v4-pro | false | 0 | 12 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| kimi-k2.6 | true | 1549 | 12 | 6 | 0 | 108 | 14 | 2 | 0 | 263038 | 4461 | 0.109 | n/a |
| mimo-v2.6-pro | true | 1667 | 12 | 11 | 0 | 287 | 18 | 5 | 0 | 321002 | 9515 | 0.033 | n/a |
| qwen3.7-plus | true | 1568 | 12 | 7 | 0 | 89 | 29 | 3 | 0 | 527857 | 5857 | 0.073 | n/a |
| minimax-m3 | true | 2272 | 12 | 11 | 0 | 91 | 12 | 3 | 0 | 199486 | 5849 | 0.030 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| glm-5.3 | true | 5 | 0 | 0 | 0 | 0 | 2 | 32 | 6 | 0 | 0 | 66230 | 2043 | 0.052 | n/a |
| deepseek-v4-pro | false | 0 | 0 | 0 | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| kimi-k2.6 | true | 5 | 0 | 0 | 0 | 0 | 6 | 130 | 9 | 0 | 0 | 178278 | 4685 | 0.080 | n/a |
| mimo-v2.6-pro | true | 5 | 3 | 0 | 0 | 0 | 2 | 116 | 9 | 3 | 0 | 138848 | 3183 | 0.016 | n/a |
| qwen3.7-plus | true | 5 | 0 | 0 | 0 | 0 | 2 | 55 | 5 | 0 | 0 | 75482 | 3386 | 0.020 | n/a |
| minimax-m3 | true | 5 | 5 | 0 | 0 | 0 | 2 | 45 | 6 | 0 | 0 | 66711 | 2881 | 0.013 | n/a |
