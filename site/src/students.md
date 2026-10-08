---
layout: base.njk
title: For students
eyebrow: New to Zotero or to AI tools
description: What Sub-Sub is for a student, what it does not do, how to start for free, and the words you will meet.
lead: Sub-Sub helps you find, organise and read papers. It does not write your work. You can try it for free.
---

Em português: [Para estudantes](/estudantes/).

## What it is, in plain words

You keep your papers in Zotero, a free reference manager. Sub-Sub is an assistant that works with that collection. You ask it in plain language, for example "what do I have on asthma in children?" or "find recent trials on home spirometry". It answers from your papers, searches PubMed for papers you do not have, and adds the ones you choose to Zotero. Each note it writes says what it read: the full paper, only the abstract, or only the title and authors.

Sub-Sub opens in your web browser, like a website, but it runs on your own computer. It speaks Portuguese and English.

## What it does not do

- It does not write your assignments or your thesis. Students start with the Reader profile: Sub-Sub gives you quotes with page numbers and questions to answer as you read, and a reading list for a literature review. It does not write summaries or conclusions that you could hand in.
- It does not replace reading the paper. A note from a free model can be thin. Check each quote against the page before you use it.
- It does not change your Zotero library without asking. You see every change first and select Yes or No. You can undo it later.

The rules of your course and of your faculty about AI apply to what you hand in, whatever Sub-Sub does. If you are not sure, ask your teacher before you use it for graded work.

## Is it for me?

It helps most when you do a literature review, prepare a seminar or a thesis, or keep more than a few dozen papers. For one quick question about one paper, a general chatbot is simpler.

| | A general chatbot | Sub-Sub |
|---|---|---|
| Where the papers come from | What you paste or upload | Your Zotero library, and PubMed, Europe PMC and OpenAlex |
| References | Can invent references | Cites only works it found; each note says what it read |
| Your library | Not involved | Imports, tags and files papers, with your approval |
| Set-up | None | About 15 minutes, once |
| Cost | Free or a subscription | Free to try; about 10 dollars a month for regular use |

An empty Zotero library is fine. After you install Sub-Sub, type `/gaps` and your topic. Sub-Sub finds papers on it, and imports the ones you choose.

## Start for free

You need a computer with macOS, Windows or Linux, and about 15 minutes.

1. Install [Zotero](https://www.zotero.org/download/) and start it.
2. In Zotero, open Settings > Advanced. Turn on "Allow other applications on this computer to communicate with Zotero".
3. Get a free Google key. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in and select "Create API key". Copy the key. Google does not ask for a card. You must be 18 or older.
4. Install Sub-Sub with the command on the [Install](/install/) page. If the command looks strange, read [About the install command](/install/#about-the-install-command) first.
5. Answer the questions. When Sub-Sub asks who you are, select "A student". In Models, select "Free, to try Sub-Sub" and paste the key.
6. Sub-Sub opens in your browser. Make sure that the top of the page shows the number of items in your Zotero library.

At FMUP or the University of Porto, select the "FMUP / U.Porto" set-up. See [FMUP](/fmup/).

## Three things to try first

1. Select Library overview. Sub-Sub shows what is in your library.
2. Type `/lit` and a question, for example `/lit home spirometry in children with asthma`. You get a reading list: the works to read, the order to read them in, and questions to read them with.
3. Type `/lit-note` and the citekey of a paper. You get a reading note: quotes with page numbers, and a question under each quote.

Then read the [Guide](/guide/).

## What it costs

- To try it: free, with the Google key above. The free tier stops long tasks after a few minutes. Wait a minute, then ask Sub-Sub to continue.
- For regular use: an [OpenCode Go](https://opencode.ai/go) subscription, about 10 dollars a month (5 dollars the first month; check the current terms there). The tested models cost about 3 cents a task, so the monthly allowance is much more than a student uses.
- For unpublished or confidential material: Mistral, with servers in the European Union, or a model service of your institution. See [Where your data goes](/models/#where-your-data-goes).

Sub-Sub itself is free and open source.

## When something does not work

Open a terminal and type `subsub doctor`. Each line that starts with FIX says what to do. See [Help](/help/). If that does not solve it, [report the problem](https://github.com/tiagojct/subsub/issues) with the output of `subsub doctor`.

## If Sub-Sub stops

Your papers stay in Zotero. Your notes are plain text files (Markdown) in a folder on your computer, and any text editor opens them. If Sub-Sub is no longer updated, you keep everything. See [About](/about/#if-sub-sub-stops).

## Words you will meet

| Word | What it means |
|---|---|
| Zotero | A free program that keeps your papers, their references and their PDFs. Sub-Sub works with it. |
| Item, parent item | One reference in Zotero, for example a paper or a book. A PDF is attached to its item, the parent item. |
| Citekey | A short name for a reference, for example `smith2021`. Sub-Sub uses it to name a paper in a note. |
| Model | The AI that writes the answers. |
| Provider | The company where the model runs, for example Google. |
| API key | A password that lets Sub-Sub use your account at the provider. Keep it private. |
| Tag | A label on an item in Zotero, for example `topic/asthma`. Sub-Sub uses only the tags in your tag list. |
| Terminal | A window where you type commands. You need it once, to install. After that, Sub-Sub opens from its shortcut. |
| Markdown | Plain text with a few marks for headings and lists. Sub-Sub's notes are Markdown files. [Obsidian](https://obsidian.md) shows them well, but any editor opens them. |
| Profile | How much Sub-Sub writes for you. Students start with Reader. See [Profiles](/profiles/). |
