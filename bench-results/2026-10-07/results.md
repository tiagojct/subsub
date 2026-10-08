Model test results (2026-10-08). Objective checks only; the quality judgement is separate.

## tagging

| model | submitted | items_proposed | reference | reference_coverage | vs_reference.f1 | vs_reference.exact | invalid_tags | status_tags | peeked | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | 20 | library | 1 | 0.694 | 3 | 0 | 0 | 0 | 53 | 2 | 0 | 0 | 63726 | 3026 | 0.015 | n/a |
| hy3 | true | 20 | library | 1 | 0.672 | 4 | 0 | 0 | 0 | 37 | 2 | 0 | 0 | 61904 | 5039 | 0.009 | n/a |
| qwen3.8-max | true | 20 | library | 1 | 0.722 | 6 | 0 | 0 | 0 | 63 | 3 | 1 | 0 | 62048 | 3603 | 0.108 | n/a |
| kimi-k3 | true | 20 | library | 1 | 0.678 | 4 | 0 | 0 | 0 | 72 | 2 | 0 | 0 | 58116 | 5101 | 0.197 | n/a |
| longcat-2.0 | true | 20 | library | 1 | 0.679 | 4 | 0 | 0 | 0 | 70 | 2 | 0 | 0 | 61403 | 5706 | 0.012 | n/a |
| gpt-5.6-luna | true | 20 | library | 1 | 0.662 | 2 | 0 | 0 | 0 | 20 | 2 | 0 | 0 | 27688 | 1326 | 0.007 | n/a |
| qwen3.8-flash | true | 20 | library | 1 | 0.706 | 3 | 0 | 0 | 0 | 117 | 3 | 1 | 0 | 65345 | 6795 | 0.011 | n/a |
| mimo-v2.6-flash | true | 20 | library | 1 | 0.695 | 4 | 0 | 0 | 0 | 102 | 2 | 0 | 0 | 62835 | 5026 | 0.005 | n/a |
| minimax-m2.7 | false | 0 | n/a | 0 | n/a | n/a | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | 20 | library | 1 | 0.683 | 5 | 0 | 0 | 0 | 153 | 3 | 1 | 0 | 66030 | 8273 | 0.032 | n/a |
| minimax-m3 | true | 20 | library | 1 | 0.689 | 4 | 0 | 0 | 0 | 203 | 4 | 2 | 0 | 134710 | 12516 | 0.032 | n/a |
| glm-5.3-flash | true | 20 | library | 1 | 0.708 | 5 | 0 | 0 | 0 | 73 | 2 | 0 | 0 | 57681 | 2624 | 0.006 | n/a |
| mimo-v2.6-pro | true | 20 | library | 1 | 0.661 | 2 | 0 | 0 | 0 | 96 | 2 | 0 | 0 | 61333 | 3588 | 0.013 | n/a |
| gpt-6-luna | true | 20 | library | 1 | 0.683 | 3 | 0 | 0 | 0 | 22 | 2 | 0 | 0 | 27667 | 1613 | 0.004 | n/a |
| glm-5.3 | true | 20 | library | 1 | 0.706 | 5 | 0 | 0 | 0 | 93 | 2 | 0 | 0 | 60517 | 5240 | 0.070 | n/a |

## facet_fix

| model | expected | fixed | extra_items | change_calls | preview_errors | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | 37 | 0 | 0 | 0 | 0 | 123 | 6 | 0 | 0 | 107772 | 5074 | 0.019 | n/a |
| hy3 | 37 | 0 | 0 | 0 | 0 | 285 | 13 | 1 | 0 | 389777 | 27455 | 0.039 | n/a |
| qwen3.8-max | 37 | 0 | 0 | 0 | 0 | 116 | 10 | 0 | 0 | 185534 | 5644 | 0.143 | n/a |
| kimi-k3 | 37 | 18 | 0 | 1 | 0 | 83 | 8 | 0 | 0 | 153573 | 9874 | 0.301 | n/a |
| longcat-2.0 | 37 | 18 | 0 | 1 | 0 | 138 | 14 | 1 | 0 | 466692 | 7630 | 0.026 | n/a |
| gpt-5.6-luna | 37 | 18 | 0 | 1 | 0 | 56 | 10 | 1 | 0 | 146933 | 4238 | 0.017 | n/a |
| qwen3.8-flash | 37 | 0 | 0 | 0 | 0 | 125 | 10 | 1 | 0 | 274039 | 6748 | 0.015 | n/a |
| mimo-v2.6-flash | 37 | 18 | 0 | 2 | 0 | 320 | 14 | 1 | 0 | 427232 | 8825 | 0.011 | n/a |
| minimax-m2.7 | 37 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | 37 | 18 | 0 | 2 | 0 | 198 | 11 | 1 | 0 | 334166 | 9711 | 0.049 | n/a |
| minimax-m3 | 37 | 0 | 0 | 0 | 0 | 499 | 13 | 4 | 0 | 552446 | 43618 | 0.109 | n/a |
| glm-5.3-flash | 37 | 37 | 0 | 2 | 0 | 135 | 7 | 0 | 0 | 118774 | 5292 | 0.011 | n/a |
| mimo-v2.6-pro | 37 | 18 | 0 | 1 | 0 | 305 | 8 | 0 | 0 | 147086 | 8057 | 0.017 | n/a |
| gpt-6-luna | 37 | 18 | 0 | 1 | 0 | 82 | 11 | 0 | 0 | 191171 | 6731 | 0.010 | n/a |
| glm-5.3 | 37 | 18 | 0 | 1 | 0 | 95 | 8 | 0 | 0 | 134591 | 4884 | 0.079 | n/a |

## import

| model | import_right | asked_first | ids_expected | ids_sent | new_sent | extra_ids | would_import | duplicate_reported | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | true | 2 | 2 | 1 | 0 | n/a | true | 12 | 2 | 0 | 0 | 38542 | 339 | 0.001 | n/a |
| hy3 | true | false | 2 | 2 | 1 | 0 | 1 | true | 15 | 1 | 0 | 0 | 23540 | 390 | 0.002 | n/a |
| qwen3.8-max | true | false | 2 | 2 | 1 | 0 | 1 | true | 17 | 2 | 0 | 0 | 32957 | 487 | 0.013 | n/a |
| kimi-k3 | true | false | 2 | 2 | 1 | 0 | 1 | true | 26 | 2 | 0 | 0 | 31442 | 561 | 0.055 | n/a |
| longcat-2.0 | true | true | 2 | 2 | 1 | 0 | n/a | true | 25 | 2 | 0 | 0 | 33688 | 330 | 0.004 | n/a |
| gpt-5.6-luna | true | false | 2 | 2 | 1 | 0 | 1 | true | 22 | 2 | 0 | 0 | 16873 | 363 | 0.003 | n/a |
| qwen3.8-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 25 | 4 | 0 | 0 | 44489 | 987 | 0.001 | n/a |
| mimo-v2.6-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 20 | 1 | 0 | 0 | 23607 | 351 | 0.000 | n/a |
| minimax-m2.7 | false | false | 2 | 0 | 0 | 0 | n/a | false | 1 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | false | 2 | 2 | 1 | 0 | 1 | true | 15 | 1 | 0 | 0 | 21743 | 430 | 0.002 | n/a |
| minimax-m3 | true | false | 2 | 2 | 1 | 0 | 1 | true | 18 | 2 | 0 | 0 | 32971 | 822 | 0.003 | n/a |
| glm-5.3-flash | true | false | 2 | 2 | 1 | 0 | 1 | true | 45 | 2 | 0 | 0 | 33688 | 386 | 0.003 | n/a |
| mimo-v2.6-pro | true | false | 2 | 2 | 1 | 0 | 1 | true | 31 | 2 | 0 | 0 | 35777 | 652 | 0.006 | n/a |
| gpt-6-luna | true | false | 2 | 2 | 1 | 0 | 1 | true | 15 | 2 | 0 | 0 | 16822 | 396 | 0.001 | n/a |
| glm-5.3 | true | false | 2 | 2 | 1 | 0 | 1 | true | 15 | 2 | 0 | 0 | 22780 | 437 | 0.009 | n/a |

## lit_note

| model | written | words | read_fulltext | cites_itself | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | 733 | true | false | 0 | 114 | 10 | 2 | 0 | 473391 | 4537 | 0.035 | n/a |
| hy3 | true | 807 | true | false | 0 | 105 | 10 | 3 | 0 | 282693 | 6243 | 0.022 | n/a |
| qwen3.8-max | true | 921 | true | false | 0 | 129 | 9 | 1 | 0 | 202545 | 5303 | 0.224 | n/a |
| kimi-k3 | true | 1311 | true | false | 0 | 239 | 10 | 2 | 0 | 396618 | 8786 | 0.451 | n/a |
| longcat-2.0 | true | 895 | true | false | 0 | 97 | 13 | 4 | 0 | 700408 | 4974 | 0.037 | n/a |
| gpt-5.6-luna | true | 922 | true | false | 0 | 83 | 14 | 2 | 0 | 539758 | 4435 | 0.033 | n/a |
| qwen3.8-flash | true | 1618 | true | false | 0 | 154 | 9 | 1 | 0 | 295236 | 10025 | 0.022 | n/a |
| mimo-v2.6-flash | true | 1020 | true | false | 0 | 139 | 9 | 1 | 0 | 328498 | 7686 | 0.011 | n/a |
| minimax-m2.7 | false | 0 | false | false | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | 935 | true | false | 0 | 136 | 10 | 2 | 0 | 501799 | 6302 | 0.071 | n/a |
| minimax-m3 | true | 1451 | true | false | 0 | 89 | 12 | 2 | 0 | 422694 | 8172 | 0.048 | n/a |
| glm-5.3-flash | true | 730 | true | false | 0 | 135 | 9 | 2 | 0 | 366232 | 4039 | 0.030 | n/a |
| mimo-v2.6-pro | true | 1018 | true | false | 0 | 129 | 13 | 2 | 0 | 461995 | 6489 | 0.038 | n/a |
| gpt-6-luna | true | 499 | true | false | 0 | 41 | 16 | 2 | 0 | 331406 | 2905 | 0.014 | n/a |
| glm-5.3 | true | 874 | true | false | 0 | 93 | 9 | 1 | 0 | 306874 | 4814 | 0.162 | n/a |

## synthesis

| model | written | words | topic_items | topic_items_cited | citekeys_unknown | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | 1869 | 12 | 10 | 0 | 155 | 14 | 1 | 0 | 350825 | 5111 | 0.033 | n/a |
| hy3 | true | 1933 | 12 | 11 | 0 | 99 | 6 | 0 | 0 | 124491 | 13306 | 0.019 | n/a |
| qwen3.8-max | true | 1791 | 12 | 11 | 0 | 90 | 8 | 1 | 0 | 115756 | 5247 | 0.136 | n/a |
| kimi-k3 | true | 2465 | 12 | 11 | 0 | 288 | 18 | 2 | 0 | 284852 | 11029 | 0.464 | n/a |
| longcat-2.0 | true | 2162 | 12 | 0 | 0 | 240 | 26 | 2 | 0 | 1010292 | 14340 | 0.053 | n/a |
| gpt-5.6-luna | true | 2938 | 12 | 11 | 0 | 94 | 38 | 1 | 0 | 489016 | 7682 | 0.038 | n/a |
| qwen3.8-flash | true | 3348 | 12 | 11 | 0 | 222 | 38 | 0 | 0 | 814089 | 11621 | 0.032 | n/a |
| mimo-v2.6-flash | true | 1862 | 12 | 11 | 0 | 120 | 9 | 0 | 0 | 144730 | 6623 | 0.007 | n/a |
| minimax-m2.7 | false | 0 | 12 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | 2252 | 12 | 11 | 1 | 179 | 21 | 2 | 0 | 343830 | 8845 | 0.068 | n/a |
| minimax-m3 | true | 3345 | 12 | 11 | 0 | 120 | 27 | 4 | 0 | 992213 | 8201 | 0.097 | n/a |
| glm-5.3-flash | true | 1788 | 12 | 11 | 0 | 137 | 22 | 0 | 0 | 198307 | 5216 | 0.016 | n/a |
| mimo-v2.6-pro | true | 2161 | 12 | 11 | 0 | 213 | 11 | 0 | 0 | 213691 | 6464 | 0.022 | n/a |
| gpt-6-luna | false | 0 | 12 | 0 | 0 | 18 | 2 | 0 | 0 | 24254 | 1032 | 0.003 | n/a |
| glm-5.3 | true | 2346 | 12 | 11 | 0 | 180 | 16 | 1 | 0 | 327807 | 9745 | 0.155 | n/a |

## search

| model | written | dois | pmids | ungrounded | already_in_library | queued | searches | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | 5 | 0 | 0 | 0 | 0 | 1 | 55 | 2 | 0 | 0 | 70193 | 1634 | 0.007 | n/a |
| hy3 | true | 5 | 0 | 0 | 0 | 0 | 1 | 47 | 8 | 0 | 0 | 94439 | 3035 | 0.008 | n/a |
| qwen3.8-max | true | 8 | 3 | 5 | 0 | 0 | 1 | 71 | 5 | 0 | 0 | 109683 | 3012 | 0.082 | n/a |
| kimi-k3 | true | 5 | 1 | 0 | 0 | 0 | 1 | 135 | 10 | 0 | 0 | 107681 | 3876 | 0.147 | n/a |
| longcat-2.0 | true | 5 | 0 | 0 | 0 | 0 | 1 | 99 | 9 | 0 | 0 | 125897 | 3846 | 0.013 | n/a |
| gpt-5.6-luna | true | 5 | 0 | 5 | 0 | 0 | 1 | 52 | 10 | 0 | 0 | 100934 | 1674 | 0.011 | n/a |
| qwen3.8-flash | true | 6 | 3 | 0 | 0 | 0 | 2 | 85 | 10 | 0 | 0 | 154629 | 3478 | 0.007 | n/a |
| mimo-v2.6-flash | true | 5 | 0 | 5 | 0 | 0 | 1 | 88 | 11 | 0 | 0 | 149664 | 3084 | 0.005 | n/a |
| minimax-m2.7 | false | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | 5 | 0 | 0 | 0 | 0 | 2 | 129 | 11 | 0 | 0 | 100679 | 5781 | 0.021 | n/a |
| minimax-m3 | true | 5 | 4 | 0 | 0 | 0 | 1 | 65 | 7 | 0 | 0 | 119238 | 3734 | 0.022 | n/a |
| glm-5.3-flash | true | 5 | 3 | 0 | 0 | 0 | 2 | 35 | 4 | 0 | 0 | 101266 | 1541 | 0.008 | n/a |
| mimo-v2.6-pro | true | 5 | 0 | 0 | 0 | 0 | 1 | 112 | 12 | 0 | 0 | 180727 | 3938 | 0.013 | n/a |
| gpt-6-luna | true | 5 | 0 | 0 | 0 | 0 | 2 | 65 | 14 | 0 | 0 | 135208 | 2328 | 0.007 | n/a |
| glm-5.3 | true | 5 | 0 | 0 | 0 | 0 | 1 | 66 | 7 | 0 | 0 | 89791 | 2503 | 0.058 | n/a |

## lit

| model | written | words | evidence_rows | evidence_labelled | dois | pmids | ungrounded | screening_log | multi_searches | fulltext_reads | starbuck.fail | starbuck.check | starbuck.uncited_sentences | starbuck.citation_recall | starbuck.citation_precision | seconds | tool_calls | tool_errors | wrong_mode | tokens_in | tokens_out | cost | error |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mimo-v2.5-pro | true | 2115 | 15 | 15 | 14 | 0 | 0 | true | 1 | 14 | 0 | 4 | 1 | n/a | n/a | 315 | 26 | 1 | 0 | 536462 | 12554 | 0.035 | n/a |
| hy3 | true | 3458 | 31 | 31 | 29 | 0 | 0 | true | 2 | 8 | 0 | 6 | 1 | n/a | n/a | 431 | 38 | 1 | 0 | 1110936 | 39898 | 0.085 | n/a |
| qwen3.8-max | true | 2933 | 24 | 24 | 22 | 0 | 0 | true | 2 | 8 | 0 | 6 | 0 | n/a | n/a | 532 | 29 | 0 | 0 | 644094 | 20642 | 0.438 | n/a |
| kimi-k3 | true | 2383 | 22 | 22 | 21 | 0 | 0 | true | 2 | 7 | 0 | 4 | 0 | n/a | n/a | 592 | 33 | 0 | 0 | 588427 | 20759 | 0.754 | n/a |
| longcat-2.0 | true | 2328 | 15 | 14 | 14 | 0 | 0 | true | 1 | 10 | 0 | 5 | 0 | n/a | n/a | 219 | 28 | 1 | 0 | 454811 | 11261 | 0.031 | n/a |
| gpt-5.6-luna | true | 2119 | 14 | 14 | 13 | 1 | 0 | true | 2 | 8 | 0 | 1 | 2 | n/a | n/a | 161 | 32 | 0 | 0 | 442963 | 9989 | 0.050 | n/a |
| qwen3.8-flash | true | 2513 | 22 | 22 | 21 | 0 | 0 | true | 2 | 6 | 0 | 5 | 0 | n/a | n/a | 369 | 28 | 1 | 0 | 968636 | 20681 | 0.038 | n/a |
| mimo-v2.6-flash | true | 3439 | 23 | 23 | 15 | 0 | 0 | true | 3 | 9 | 1 | 11 | 0 | n/a | n/a | 616 | 48 | 1 | 0 | 1386724 | 36629 | 0.028 | n/a |
| minimax-m2.7 | false | 0 | 0 | 0 | 0 | 0 | 0 | false | 0 | 0 | n/a | n/a | n/a | n/a | n/a | 3 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| qwen3.7-plus | true | 1878 | 22 | 22 | 12 | 0 | 0 | true | 1 | 10 | 0 | 15 | 0 | n/a | n/a | 471 | 28 | 0 | 0 | 549553 | 24006 | 0.096 | n/a |
| minimax-m3 | true | 3468 | 22 | 20 | 24 | 0 | 0 | true | 2 | 25 | 1 | 2 | 1 | n/a | n/a | 396 | 58 | 3 | 0 | 1712952 | 23668 | 0.161 | n/a |
| glm-5.3-flash | true | 2774 | 20 | 18 | 20 | 0 | 0 | true | 2 | 8 | 0 | 2 | 0 | n/a | n/a | 437 | 35 | 0 | 0 | 857525 | 16448 | 0.088 | n/a |
| mimo-v2.6-pro | true | 2849 | 25 | 25 | 11 | 0 | 0 | true | 2 | 10 | 0 | 17 | 0 | n/a | n/a | 694 | 32 | 0 | 0 | 855717 | 25362 | 0.052 | n/a |
| gpt-6-luna | true | 1942 | 12 | 12 | 8 | 0 | 0 | true | 4 | 12 | 0 | 5 | 0 | n/a | n/a | 362 | 44 | 3 | 0 | 1354239 | 32408 | 0.044 | n/a |
| glm-5.3 | true | 2690 | 17 | 17 | 10 | 0 | 0 | true | 2 | 11 | 0 | 9 | 1 | n/a | n/a | 345 | 28 | 1 | 0 | 862942 | 15220 | 0.357 | n/a |
