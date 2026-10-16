# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and new researchers (master's students, the FMUP pilot) and clinical researchers, served equally. Students are learning to find, organise and read the literature, often in Portuguese, on a laptop between classes. Clinical researchers have little time and want a tool they can trust for literature reviews, reading notes, manuscripts and their reference library. Both work from their own Zotero library.

## Product Purpose

Sub-Sub is a research assistant that works from the user's own Zotero library. It reads what the user already has, finds what is missing in PubMed, Europe PMC and OpenAlex, writes notes in Markdown that say what it read, and keeps the library in order (imports, tags, repairs), showing each change before it happens. Success: the user reads more and better, and can check every claim, quote and change.

## Positioning

It works from the user's library and files on their own computer, with checks that are in the program rather than in the instructions to the model: every library change is previewed and needs a yes; each note says whether it was written from the full text, the abstract or the metadata; quotes are checked word for word against the full text and linked to their page of the PDF; nothing is deleted; nothing is sent to the author.

## Operating Context

- Zotero (local API) and, often, Obsidian; notes are plain Markdown files in a Sub-Sub folder.
- Used in a browser view (a local server, `subsub web`) or in a terminal (pi).
- Guided reading (`/read`), rapid reviews (`/lit`), reading lists, comparisons, manuscript checks, reference checks (Starbuck add-on).
- Taught in a one-hour workshop for clinical researchers (Quarto slides) and a test tutorial (Quarto HTML).

## Capabilities and Constraints

- Surfaces: the website (11ty, `site/`, English and European Portuguese), the tutorial (`tutorial/`, Quarto HTML), the workshop (`workshop/`, Quarto reveal.js, Portuguese and English), and the browser view (`web/`, shipped in the npm package).
- The browser view has a strict content security policy: self-hosted fonts and scripts only, no inline styles or scripts, no external requests. Its fonts ship inside the npm package, so size matters.
- Two modes, Researcher and Librarian, each shown in its own colour.
- Light and dark themes on every surface.
- Interface strings in English and European Portuguese.

## Brand Commitments

- The name Sub-Sub, with its hyphen, from the Sub-Sub-Librarian of Moby-Dick's Extracts, and the Melville epigraph from the Extracts.
- Two distinct colours for the two modes, Researcher and Librarian.
- The current icon: the card-and-lines mark (top bar and browser tab).
- Binding visual brief from the owner: capture the feeling of Moby-Dick, but modern; a typeface with true italics; no AI design tropes.
- No emojis anywhere.

## Evidence on Hand

- Real screenshots of the browser view (`site/src/assets/img/`), staged from a demo conversation.
- Model test results published on the Models page (`bench-results/`).
- No testimonials, user counts or endorsements exist; none may be invented.

## Product Principles

- Show the evidence: what was read, where a quote is, what a change will do.
- The user decides: previews, yes or no, undo; Sub-Sub does not write students' assignments.
- Plain words over cleverness, in both languages.
- Local and private by default.

## Accessibility & Inclusion

- WCAG 2.2 AA on all four surfaces, in light and dark: contrast, focus, keyboard use, reduced motion.
- Reading comfort for long notes (students and dyslexic readers): a reading mode with larger type and wider line spacing.
