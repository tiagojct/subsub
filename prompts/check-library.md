---
description: "Check the library: duplicates, retracted or corrected works, and files without a parent item"
---
Check my whole library in three parts, then give me one report.

1. Duplicates: run zotero_find_duplicates. For each group, give the items with their evidence (identifiers, fields, files, citekeys) and say which record is the fullest. Do not call items duplicates on a similar title alone. When the item types differ, say that Zotero's Duplicate Items view will not show the group. I merge them in Zotero; do not change these items.
2. Retractions and corrections: run zotero_check_retractions, and call it again while still_unchecked > 0. List the retracted works and the expressions of concern first, then the corrections. Give the notice for each (type, date, DOI).
3. Files and notes without a parent item: run zotero_standalone_items and give the count by kind, with the first ten names.

The report: one short section for each part, with counts first. Say how many items were checked and how many had no DOI (those cannot be checked for retractions). If a part found nothing, say so in one line.

Then, if there are retracted works or expressions of concern, propose the tag _retracted for them with one zotero_tag_items call (dry_run=false), so that I see one preview for all of them. Do not tag corrections. For the files without a parent item, offer the steps of "Files and notes without a parent item"; do not start them without my answer.
