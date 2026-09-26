---
required_facets: topic, status
single_facets: status
max_per_facet: topic=4, type=2
---
Tag list for the Zotero library (any field; no topics yet: ask the librarian to propose them from your library). Sub-Sub reads this file and refuses any tag that is not listed here. Add, rename or remove tags as your library needs: one tag per bullet, in backticks, then a short description. Put old or alternative names after "aliases:"; the librarian uses them to map old tags.

## topic

What the item is about. 1 to 4 per item.


## method

How the work was done. Only when it applies.

- `method/statistical-modelling` The work fits regression or other statistical models. aliases: regression
- `method/machine-learning` The work trains or evaluates machine-learning models. aliases: ML
- `method/experiment` Controlled experiment. aliases: experimental
- `method/survey` Questionnaire survey. aliases: questionnaire
- `method/interviews` Interviews and focus groups. aliases: focus groups
- `method/observation` Field work or observation. aliases: ethnography, fieldwork
- `method/document-analysis` Analysis of texts, archives or documents. aliases: archival research, content analysis
- `method/simulation` Simulation or modelling.
- `method/programming` Programming and software tools. aliases: programming

## type

What kind of study or document it is.

- `type/empirical-study` Original study with new data. aliases: original research
- `type/systematic-review` Systematic review or meta-analysis.
- `type/review` Narrative or scoping review. aliases: Review
- `type/theory` Theoretical or conceptual work. aliases: essay
- `type/method-paper` A paper that presents a method or tool.
- `type/case-study` Case study.
- `type/editorial` Editorial, commentary, letter or book review. aliases: Comment, Letter
- `type/dataset` Dataset.
- `type/software` Software.
- `type/report` Technical or institutional report.
- `type/thesis` Thesis or dissertation.
- `type/book` Book. aliases: monograph, textbook
- `type/chapter` Book chapter.
- `type/web-document` Web page, blog post or online document.

## status

Reading status. Exactly one per item.

- `status/to-read` Not read yet.
- `status/reading` Reading now.
- `status/read` Read.
