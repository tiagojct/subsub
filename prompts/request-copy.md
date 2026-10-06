---
description: "Draft an email asking the corresponding author for a copy of a paper (you send it)"
argument-hint: "<citekey, DOI or PMID>"
---
Draft an email to ask the corresponding author of $1 for a copy of the paper.

1. Find the work: zotero_get_item for a citekey or Zotero key, otherwise scholar_get_work. If it is open access (open_access, or scholar_read_oa_fulltext gives the full text), tell the user where to read it and stop: no email is needed.
2. Find the address with scholar_find_contact. Use only an address it returns. Never guess or build an address from a name. If it returns none, give the user the article link and say: look for "Correspondence" on the article page; then stop.
3. Write the draft to `Inbox/Copy request <citekey or DOI>.md` in the Sub-Sub folder (do not overwrite; add -2):

```markdown
---
title: "Copy request: <short title>"
date: <YYYY-MM-DD>
type: copy-request
work: "<DOI or PMID>"
to: "<address>"
status: draft
---

[Open in the mail program](mailto:<address>?subject=<subject, URL-encoded>&body=<body, URL-encoded>)

To: <address> (<author name>, from the PubMed record)
Subject: Request for a copy of "<short title>"

Dear Dr <family name>,

<two or three sentences: who the user is (name, and the line about the user if set), why the paper matters for their work, and the request for a copy for personal research use.>

Best regards,
<the user's name>
```

4. Write the email in English unless the user asks for another language, or the author's affiliation and the user's language are both Portuguese. Keep it short and polite. Do not claim things about the user that you do not know.
5. Do not send anything. Tell the user the path, and that the link opens the draft in their mail program.
