---
alt: /pt/clinicos/
layout: base.njk
title: For clinical researchers
eyebrow: If you do research next to clinical work
description: What Sub-Sub does for a clinical researcher, what it is not, how to get it on a hospital computer, and how to declare its use to a journal.
lead: Sub-Sub finds, reads and checks the papers for your research, from your own Zotero library. You do not need to know about AI or the terminal to use it; someone may need to install it for you once.
---

Em português: [Para investigadores clínicos](/pt/clinicos/).

## What it does for you

| You need to | Ask Sub-Sub | What you get |
|---|---|---|
| Know what is published on a question, for a protocol or a background section | `/lit` and the question, for example `/lit home spirometry in children with asthma` | A note with the answer, an evidence table (design, population, finding, and whether Sub-Sub read the full text), the searches and a screening log |
| Read one paper well | `/lit-note` and the paper's title words | A note with the key points, the methods and quotes with page numbers, each quote checked against the PDF |
| Check your manuscript against the reporting guideline | `/review` and the manuscript file | Comments against CONSORT, STROBE, STARD, PRISMA, TRIPOD, CHEERS, SRQR or COREQ, next to your file; your text does not change |
| Check the references before you submit | `/verify` and the manuscript file | For each reference: does it exist, do the title, first author and year match, was it retracted or corrected |
| Declare the use of AI to the journal | `/ai-statement` and what you used it for | A draft statement with the Sub-Sub version, its DOI and the model, to complete and paste |

You can type these in plain language too ("find recent cohort studies on FeNO in children"). In our tests, a note or a review took about {{ modeltest.researcher.models[facts.defaults.researcher].minutes_per_task | num(0) }} minutes of Sub-Sub's time. Your time goes into reading and checking what it wrote. `/review` needs the Author or Editor profile; see [Profiles](/profiles/). `/verify` needs reference checks, which you turn on in `subsub init`.

## What it is not

- It is not a systematic review. `/lit` is a rapid review: one AI screens, with no second reviewer and no formal risk-of-bias assessment. Each note says so. Use it to scope a question or for a first search; for a systematic review, screen in duplicate, assess the risk of bias and report to PRISMA yourself.
- It is not for patient data, and it is not clinical decision support. It works on publications.
- It does not write your paper unless you choose the Editor profile and ask. Even then, you check and rewrite every line.
- It does not replace your judgement. It shows what it read; you decide what the evidence means.

## Getting it on your computer

- On your own computer: the [install guide](/install/) takes about ten minutes. You paste one command; after that, Sub-Sub opens from a shortcut, in your browser.
- On a hospital or faculty computer: the IT service may have to allow it. Give them the section [For your IT service](/install/#for-your-it-service). It installs only in your user folder, needs no administrator rights and sends nothing to us.
- If you would rather have someone show you: for a workshop for your department or service, or help with a set-up for a group, write to tiagojacinto@med.up.pt.

## Your library does not need to be tidy

You do not need tags to start. `/lit`, `/lit-note`, `/review` and `/verify` work on any Zotero library. Tags help later, when you want Sub-Sub to group your papers by topic.

If your references are in EndNote or Mendeley, move them to Zotero first. Zotero's own guides explain it: [from EndNote](https://www.zotero.org/support/kb/importing_records_from_endnote) and [from Mendeley](https://www.zotero.org/support/kb/mendeley_import). Then ask Sub-Sub, in plain words:

1. "Give me an overview of my library." It counts the items, and the ones without tags or citation keys.
2. "Find duplicates." It shows each group with its evidence; you merge them in Zotero.
3. "Repair the metadata of items without a DOI." It shows each change first.

## Data protection and ethics

Sub-Sub sends the model provider your messages and what it reads for you: titles, abstracts, passages of papers, and passages of your manuscript when you check it. Do not use it with patient data. If your department or ethics committee asks, the [Privacy](/privacy/#for-a-data-protection-officer) page has a section for a data-protection officer. To keep your data in the European Union, use the Mistral models ([Models](/models/#which-to-choose)).

## Journals and the use of AI

Most journals ask authors to say how they used AI tools, and they hold the authors responsible for the content. With Sub-Sub:

1. Check every reference and every claim you take from its notes against the paper. The notes say what Sub-Sub read, and `/verify` checks the references.
2. Type `/ai-statement` and what you used it for, for example `/ai-statement the literature search and reading notes`. Complete the draft and put it where the journal asks, often in the Methods or the Acknowledgements.
3. To cite Sub-Sub itself: Jacinto T. Sub-Sub: a research assistant for Zotero [software]. Porto: Faculdade de Medicina da Universidade do Porto; 2026. doi:[{{ site.doi }}](https://doi.org/{{ site.doi }}).

## Which model, in one line

If you are not sure: accept the defaults that `subsub init` offers (about {{ facts.opencodeGo.monthly }} dollars a month), or choose Mistral if your data must stay in the EU. The [Models](/models/#which-to-choose) page has the details.
