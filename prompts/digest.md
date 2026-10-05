---
description: "Researcher: digest of the last days: new works from the alerts and what the recent notes changed"
argument-hint: "[days, default 7] [topic]"
---
Write a digest of the last ${1:-7} days. Topic, if given: ${@:2}

1. Collect, in the notes folder:
   - the alert notes `Inbox/Literature alerts YYYY-MM-DD.md` dated in the period (the date is in the file name);
   - the notes in `Research/` whose front matter `date:` is in the period;
   - the literature notes whose front matter `created:` is in the period.
   Use ls and find to list them, and read their front matter for the dates. If a topic is given, keep only what is about it.
2. Read each note you use. Do not describe a work that you did not read in a note, an abstract (scholar_get_work) or a full text.
3. Write `Research/Digest <today, YYYY-MM-DD>.md` (do not overwrite; add -2) with these sections, in this order:
   - What changed in our understanding: what the period's notes and works add to or change in what the user knew, each point with its sources.
   - New works worth reading: at most ten from the alerts, one line each on why, with DOI or PMID and whether it is in the library. Mark the ones the alert pre-screen excluded only if you keep them, and say why.
   - Disagreements and open questions: between the new works, or between them and the earlier notes.
   - Questions for the user: decisions that need the user (what to read, what to import, what to drop).
   - Sources: [@citekey] for library items; full reference with DOI and "(not in library)" for the others.
   Front matter: title, date, type: digest, period (from and to), sources (the notes and alert files used).
4. If there is nothing in the period, say so in one line and do not write a note.
5. Offer scholar_queue_imports for the works the user wants to add.

Give the user the path and the three most important points.
