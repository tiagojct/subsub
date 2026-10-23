---
name: Sub-Sub
description: A research assistant for Zotero that shows its evidence, drawn as a natural-history plate.
colors:
  sheet: "#e9ece6"
  sunk-field: "#dfe3dc"
  plate-field: "#f4f5f1"
  copperplate-ink: "#16202a"
  ink-muted: "#44505b"
  ink-faint: "#5d6870"
  fine-rule: "#c6ccc6"
  plate-mark: "#7d878e"
  prussian-blue: "#2c5d87"
  prussian-wash: "#d8e2eb"
  madder: "#a8432d"
  madder-wash: "#f0ddd6"
  sap-green: "#4f6a2e"
  sap-wash: "#dfe7d2"
  gamboge: "#86601a"
  gamboge-wash: "#f2e5c6"
  command-paper: "#e3e7e3"
  command-dim: "#8e9aa1"
  steel-ground: "#12171c"
  steel-sunk: "#0d1115"
  steel-field: "#192128"
  steel-line: "#dce1de"
  steel-muted: "#a6b0b3"
  steel-faint: "#8d989d"
  steel-fine-rule: "#2c363f"
  steel-plate-mark: "#66727c"
  steel-prussian: "#86b4da"
  steel-prussian-wash: "#1e3042"
  steel-madder: "#e6866d"
  steel-madder-wash: "#3d2620"
  steel-sap: "#a3c078"
  steel-sap-wash: "#253220"
  steel-gamboge: "#e2b45a"
  steel-gamboge-wash: "#3a3019"
typography:
  display:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.35rem, 4.6vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.03
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.1rem, 4.6vw, 3.2rem)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.65rem, 3vw, 2.35rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'onum', 'pnum'"
  body-reading:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "1.2rem"
    fontWeight: 400
    lineHeight: 1.9
    letterSpacing: "normal"
  running-head:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.08em"
    fontFeature: "'c2sc', 'smcp', 'onum'"
  interface:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.3
  mono:
    fontFamily: "'Atkinson Hyperlegible Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  plate: "2px"
  field: "3px"
spacing:
  wrap: "76rem"
  measure: "46rem"
  reading-measure: "36rem"
  sidebar: "17rem"
components:
  button-primary:
    backgroundColor: "{colors.copperplate-ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "0.6rem 1.1rem"
  button-primary-hover:
    backgroundColor: "{colors.prussian-blue}"
    textColor: "{colors.sheet}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.copperplate-ink}"
    rounded: "{rounded.plate}"
    padding: "0.6rem 1.1rem"
  app-button-primary:
    backgroundColor: "{colors.prussian-blue}"
    textColor: "{colors.plate-field}"
    rounded: "{rounded.plate}"
    padding: "0.4rem 0.85rem"
  app-button-primary-hover:
    backgroundColor: "{colors.copperplate-ink}"
    textColor: "{colors.sheet}"
  app-button-secondary:
    backgroundColor: "{colors.plate-field}"
    textColor: "{colors.copperplate-ink}"
    rounded: "{rounded.plate}"
    padding: "0.4rem 0.85rem"
  mode-researcher:
    backgroundColor: "{colors.prussian-wash}"
    textColor: "{colors.prussian-blue}"
    padding: "0.3rem 0.8rem"
  mode-librarian:
    backgroundColor: "{colors.madder-wash}"
    textColor: "{colors.madder}"
    padding: "0.3rem 0.8rem"
  command-block:
    backgroundColor: "{colors.copperplate-ink}"
    textColor: "{colors.command-paper}"
    typography: "{typography.mono}"
    rounded: "{rounded.plate}"
    padding: "0.85rem 4.75rem 0.85rem 1rem"
  plate-mark:
    backgroundColor: "{colors.plate-field}"
    padding: "clamp(1.1rem, 3.2vw, 2.75rem)"
  preview-field:
    backgroundColor: "{colors.sheet}"
    typography: "{typography.mono}"
    padding: "0.8rem 0.95rem"
---

# Design System: Sub-Sub

## Overview

**Creative North Star: "The Natural-History Plate"**

Sub-Sub is drawn as an engraved plate from an 1839 natural history: a cool grey-green sheet, a lighter plate field inside a plate mark, copperplate ink for type and fine rules, and a few transparent hand-coloured washes as the only colour. The product is shown as a specimen. Its parts carry figure numbers in the margin and leader lines, and an italic caption below explains them. Every claim is a figure that can be checked.

The same world runs on four surfaces in four registers: the website (persuade, then read), the tutorial (read), the workshop slides (present) and the browser view (operate). Dark mode is the steel plate itself, with a blue-black ground, pale engraved line and brighter washes. The density is that of a printed paper. Type does the work and colour marks meaning. Decoration is limited to what an engraver would cut.

The world refuses the category's split hero (headline beside a screenshot, feature cards below) and the usual AI design tropes. It must also not become precious: the controls stay plain and legible.

**Key Characteristics:**
- Washes are the only colour, and each wash has one meaning.
- State is drawn by line: solid, dashed, dotted, struck.
- Running heads in small capitals replace labels above headings.
- A serif with a true italic for text and captions, a hyperlegible sans for controls.
- Square corners, flat surfaces, fine rules.

## Colors

A cool, low-chroma sheet and blue-black ink, with four mineral washes that each carry exactly one meaning.

### Primary
- **Prussian Blue** (prussian-blue, wash prussian-wash): the Researcher mode, links, focus rings, the selection, the brand mark and the hyphen in the name. In the browser view it is the accent while the Researcher mode is on.

### Secondary
- **Madder** (madder, wash madder-wash): the Librarian mode only. It colours the Librarian button, the Librarian's card and lines in diagrams, and the browser view's accent while the Librarian mode is on. It never means error or removal.

### Tertiary
- **Sap Green** (sap-green, wash sap-wash): applied, checked, full text, a step done, a copied command, an added value in a preview.
- **Gamboge** (gamboge, wash gamboge-wash): a preview, pending, written from the abstract, a step still to do, an expected result on a slide.

### Neutral
- **Sheet** (sheet): the page ground on every surface.
- **Plate Field** (plate-field): the lighter field inside a plate mark, cards, the drawn window, code in the tutorial.
- **Sunk Field** (sunk-field): inline code and hover fills; one step below the sheet.
- **Copperplate Ink** (copperplate-ink): text, running-head rules, heavy table rules, the primary website button, the command block ground.
- **Ink Muted / Ink Faint** (ink-muted, ink-faint): secondary text, list markers, figure numbers at rest.
- **Fine Rule** (fine-rule): the engraved hairline between rows and sections.
- **Plate Mark** (plate-mark): field borders, the plate mark, leader lines at rest.
- **Command Paper / Command Dim** (command-paper, command-dim): text and prompt glyph inside the dark command block.
- **Steel** (steel-*): the dark theme. Each steel token replaces its light counterpart one for one; the washes lighten so they keep AA contrast on the blue-black ground.

### Named Rules
**The One Wash, One Meaning Rule.** Prussian blue is the Researcher and links; madder is the Librarian; sap green is applied, checked or full text; gamboge is preview, pending or abstract. No wash is used for decoration or for a second meaning.

**The Ink Error Rule.** An error is drawn in ink: a hollow mark and a word, in the text colour, at weight 600. Errors are never red, because madder belongs to the Librarian.

**The Struck Removal Rule.** A removal is struck through (1px line-through) in muted ink, with no fill. It is never coloured.

**The Own Colour Rule.** Each mode button in the browser view keeps its own colour whether it is chosen or not. The chosen one also gets its wash and a 2px underline in its colour.

## Typography

**Display Font:** Literata, roman and true italic, wght 400 to 700, opsz 12 to 72 (with Georgia, Times New Roman)
**Body Font:** Literata on the website, tutorial and slides, and for replies and notes in the browser view
**Interface Font:** Atkinson Hyperlegible Next, wght 400 to 700 (with system-ui)
**Mono Font:** Atkinson Hyperlegible Mono, wght 400 to 600, for commands, paths, front matter and previews

All three are self-hosted Latin-subset woff2 files on every surface (site/src/assets/fonts, web/fonts, workshop/assets/fonts). The tutorial loads them from the website. The browser view's CSP allows no other origin.

**Character:** A book serif with period resonance and a true italic, paired with a sans built for legibility. The serif reads; the sans operates.

### Hierarchy
- **Display** (Literata 500, clamp(2.35rem, 4.6vw, 3.75rem), 1.03): the h1 in the legend of Plate I. Roman, never italic.
- **Headline** (Literata 500, clamp(2.1rem, 4.6vw, 3.2rem), 1.06): page h1s on the website; the tutorial title uses the same weight and tracking.
- **Title** (Literata 500, clamp(1.65rem, 3vw, 2.35rem), 1.12): plate h2s on the home page; prose h2s are 1.65rem with a plate-mark rule above.
- **Body** (Literata 400, 1.0625rem, 1.6, oldstyle proportional figures): website and tutorial text. Tables and code switch to lining tabular figures.
- **Running head** (Literata 400, 1.02rem, all small caps, 0.08em): plate heads, table of contents titles, table heads, the dialog's section heads.
- **Interface** (Atkinson Hyperlegible Next 400, 15px, 1.5): the browser view's controls and lists.
- **Label** (Atkinson Hyperlegible Next 600, 0.95rem): buttons, tabs, navigation (navigation at 0.9rem, 400).
- **Mono** (Atkinson Hyperlegible Mono 400, 0.86rem, 1.55): commands and code.
- **Reading mode** (Literata 400, 1.2rem, 1.9, word-spacing 0.06em): long notes in the browser view and the tutorial body.

### Named Rules
**The Roman Heading Rule.** Headings are roman. True italics are for captions, figure numbers and labels, quotes and blockquotes, the subtitle, and the middle of a running head.

**The Small Capitals Rule.** Plate numbers, figure references, table heads and running heads use real small capitals (all-small-caps, 0.07 to 0.08em tracking), never uppercase letters with tracking.

**The Unbroken Name Rule.** The name Sub-Sub never breaks, least of all at its hyphen (white-space: nowrap on every occurrence in running text).

## Layout

The website sits in a 76rem wrap with 1.25rem gutters (0.5rem on phones for plates). A plate is a field inside a plate mark: plate-field ground, 1px plate-mark border, padding clamp(1.1rem, 3.2vw, 2.75rem). Plate I is a two-column grid from 62rem: the legend at 2fr, the specimen at 3fr. Below that it stacks. Text measures are 36rem for the legend, 42 to 46rem for page leads and prose, and 28ch for plate h2s. Section rhythm is clamp(2.5rem, 6vw, 4.5rem) of block padding.

Documentation pages use a 46rem prose column with a sticky table of contents to the right, set off by a 1px left rule. Numbered steps hang their number in the margin in italic.

The browser view is a full-height grid: a 17rem side column, the conversation at a 46rem measure, and a notes pane of minmax(20rem, 36%) when open. The side column collapses. Breakpoints are 76rem, 64rem, 52rem and 34rem on the site; 64rem, 52rem and 30rem in the browser view.

Reading mode sets a 36rem measure, larger type and wider leading, in the browser view's notes pane and in the tutorial, and is remembered in localStorage (subsub-reading; the tutorial keeps its own key).

## Elevation & Depth

The system is flat. Depth is a lighter field inside a ruled mark, never a shadow. Dialogs rise over a 50% blue-black backdrop with no shadow. The 2px inset underline on the chosen mode and the 3px wash ring on the focused composer are state marks, not elevation.

### Named Rules
**The Engraved Surface Rule.** No drop shadows, no blur, no glassmorphism, no gradients. The one exception is the fine engraved hatch (1px lines every 3px at 9% ink) on the drawn window bar of Plate I.

## Shapes

Corners are square, as cut from a plate: 2px on buttons, fields, code and command blocks, 3px on the browser view's message bubble, composer and menus. Segmented controls and list rows inside a ruled box are 0. Borders are 1px engraved lines (fine-rule or plate-mark); emphasis comes from weight (2px, 3px) or from ink, never from radius. Circles appear only as small drawn marks: status dots, figure pins, and the hollow error mark.

### Named Rules
**The Line State Rule.** State is drawn by line before colour: solid for full text and applied, dashed for abstract and preview, dotted for metadata, struck through for removed or done. The same four lines appear on the website's Plate II, in the browser view's evidence line, on the workshop's evidence ladder and in the tutorial's checklist.

## Components

### Buttons
- **Shape:** square (2px).
- **Website primary:** ink fill, sheet text, Atkinson 600 at 0.95rem; hover turns Prussian blue.
- **Website quiet:** transparent with a plate-mark border; hover inks the border.
- **Browser view primary:** the mode's accent fill (Prussian blue or madder) with plate-field text; hover turns ink. Secondary is plate-field with a plate-mark border. Ghost is muted text with a sunk-field hover.
- **Focus:** 2px outline in the accent, 2 to 3px offset, on every surface.

### Mode Switch
- A segmented control in a 1px plate-mark box on plate-field. Each button carries its own colour, chosen or not; the chosen one adds its wash, weight 600 and a 2px inset underline. The browser view's top bar carries a 3px top rule in the active mode's colour.

### Running Head
- Small capitals with a 1px ink rule beneath: "Sub-Sub" left, an italic middle naming the plate's subject, "Plate N." right. It opens every plate on the home page, the doc pages, the tutorial's progress line (sticky), the browser view's empty state and approval dialog (there the rule is dashed gamboge: a preview), and the workshop's slide titles. It replaces kickers and eyebrows.

### Evidence Line
- A mono line that names what a note was written from, with the value underlined 2px: solid sap for full text, dashed gamboge for abstract, dotted muted for metadata.

### Preview Field
- A proposed library change before the yes: mono 0.78rem on the sheet, 1px dashed gamboge border, square. Additions in sap on sap wash; removals struck in muted ink. Once applied, the record line becomes solid sap.

### Command Block
- Ink ground, command-paper text, 2px corners, a "$ " (or "> " for PowerShell) prompt in command-dim. The copy button sits inside; once copied it turns sap.

### Tables
- As in a printed paper: 1.5px ink rules above and below (2px on slides), a 1px ink rule under the head, fine rules between rows, small-caps head in weight 400, lining tabular figures.

### Navigation
- Website header: sticky, sheet ground, 1px plate-mark rule beneath. Links in Atkinson 0.9rem, muted; hover and current page get ink and a 1px underline offset 0.4em. Below 76rem the menu drops to a stacked list with fine rules.

### The Plate (signature)
- The Plate I specimen: the browser view drawn in HTML at large scale, Fig. 1 to Fig. 5 numbered in an italic margin with leader lines. Pointing at a number, or at its caption entry, draws its line (0.5s, cubic-bezier(0.22, 1, 0.36, 1)), inks its part in its wash, and rests the other parts at 30% opacity. Keyboard and touch do the same. Reduced motion shows the lines without drawing.

## The terminal

The terminal draws the same plate with the same washes and the same rules, from the colours above (`scripts/make-themes.mjs` writes the pi themes in `themes/` from this file; `npm test` checks that they match, that every text colour has 4.5:1 against the sheet and every line 3:1).

- The accent is Prussian blue for the Researcher and madder for the Librarian; the theme follows the mode. Links stay blue. Sap green is applied or added, gamboge is a preview or pending.
- State is drawn by line as on the web: a solid rule is done or full text, a dashed rule is pending, a preview or an abstract, a dotted rule is metadata. The working indicator moves from dotted to dashed to solid, and stands still when `SUBSUB_REDUCE_MOTION` is set.
- Errors have no colour: ink, a hollow mark and a word (`o could not search the library`). A closed Zotero is the same. A removal is muted ink, struck through, with its `-` in front for terminals that ignore the strike.
- The approval screen is the only place where a letter changes the library: `y` applies, `n` or Esc leaves it, Enter does nothing, and keys in the first half second are ignored.
- Terminals without truecolor get colours picked from the xterm palette (`-256` themes). Terminals that cannot draw box glyphs get ASCII (`SUBSUB_ASCII=1`). Neither loses a meaning: every colour also has a glyph or a word.

## Do's and Don'ts

### Do:
- **Do** give each wash one meaning, and use the same meaning on every surface.
- **Do** draw state by line (solid, dashed, dotted, struck) so it reads without colour.
- **Do** open a plate or page with a running head in small capitals over a 1px ink rule.
- **Do** keep headings roman and keep true italics for captions, figure labels, quotes and running-head middles.
- **Do** set tables as in a printed paper: heavy rules above and below, a fine rule under the head, small-caps head.
- **Do** keep the name Sub-Sub on one line.
- **Do** offer reading mode for long text: 1.2rem, 1.9 leading, 0.06em word spacing, 36rem measure, remembered across visits.
- **Do** give every figure a text equivalent and keep every interaction usable by keyboard and touch.

### Don't:
- **Don't** put kickers, eyebrows or any label above a heading; the running head does that job.
- **Don't** use red, or madder, for errors or removals; errors are ink with a hollow mark and a word, removals are struck.
- **Don't** use shadows, blur, glass or gradients; the only gradient is the engraved hatch on Plate I's window bar.
- **Don't** round corners past 3px or use pill shapes for buttons and fields.
- **Don't** use uppercase with tracking for labels; use small capitals.
- **Don't** set the h1 in italic.
- **Don't** use a split hero with feature cards, or emoji, anywhere.
