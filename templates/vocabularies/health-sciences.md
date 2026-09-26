---
required_facets: topic, status
single_facets: status
max_per_facet: topic=4, type=2
---
Tag list for the Zotero library (health sciences). Sub-Sub reads this file and refuses any tag that is not listed here. Add, rename or remove tags as your library needs: one tag per bullet, in backticks, then a short description. Put old or alternative names after "aliases:"; the librarian uses them to map old tags.

## topic

What the item is about. 1 to 4 per item.

- `topic/cardiovascular` Heart and blood vessels. aliases: cardiology, hypertension
- `topic/respiratory` Lungs and airways. aliases: pulmonology, asthma, COPD
- `topic/neurology` Brain and nervous system. aliases: stroke, dementia
- `topic/mental-health` Psychiatry and mental health. aliases: psychiatry, depression, anxiety
- `topic/oncology` Cancer. aliases: cancer
- `topic/infectious-disease` Infections and vaccines. aliases: infection, vaccination, COVID-19
- `topic/endocrinology` Diabetes, obesity and hormones. aliases: diabetes, obesity
- `topic/gastroenterology` Digestive system and liver. aliases: hepatology
- `topic/nephrology` Kidneys and urinary tract. aliases: kidney
- `topic/musculoskeletal` Bones, joints and muscles. aliases: rheumatology, orthopaedics
- `topic/immunology` Immune system and allergy. aliases: allergy
- `topic/haematology` Blood. aliases: hematology
- `topic/reproductive-health` Obstetrics, gynaecology and sexual health. aliases: obstetrics, gynecology, pregnancy
- `topic/pediatrics` Children and adolescents. aliases: paediatrics, children
- `topic/ageing` Older adults and ageing. aliases: aging, geriatrics
- `topic/critical-care` Intensive care and emergency medicine. aliases: ICU, emergency
- `topic/surgery` Surgery and anaesthesia. aliases: anesthesia
- `topic/pharmacology` Drugs and their effects. aliases: pharmacotherapy, drugs
- `topic/genetics` Genetics and genomics. aliases: genomics
- `topic/nutrition` Nutrition and diet. aliases: diet
- `topic/physiology` Normal function of the body. aliases: human physiology
- `topic/public-health` Public health and prevention. aliases: prevention
- `topic/epidemiology` Epidemiology and population studies.
- `topic/health-services` Organisation, quality and costs of health care. aliases: health care quality, health economics
- `topic/health-policy` Health policy and regulation. aliases: regulation
- `topic/medical-education` Education of health professionals. aliases: medical education
- `topic/ethics` Ethics in medicine and research. aliases: bioethics
- `topic/digital-health` Digital health, eHealth and mHealth. aliases: eHealth, mHealth, telemedicine
- `topic/artificial-intelligence` AI in health. aliases: AI, LLM, machine learning
- `topic/statistics` Statistics and data analysis as a subject: methods, teaching, textbooks. aliases: biostatistics
- `topic/research-methods` Research methods, reporting, integrity and meta-research. aliases: methodology, reproducibility
- `topic/history-of-medicine` History of medicine. aliases: history

## method

How the work was done. Only when it applies.

- `method/statistical-modelling` The work fits regression or other statistical models. A paper or book about statistics gets topic/statistics instead. aliases: regression
- `method/machine-learning` The work trains or evaluates machine-learning models (not a paper about AI in general). aliases: ML, machine learning
- `method/nlp` Natural language processing. aliases: NLP, text mining
- `method/survey` Questionnaire survey. aliases: questionnaire
- `method/interviews` Interviews and focus groups. aliases: focus groups
- `method/delphi` Delphi or consensus method. aliases: consensus
- `method/psychometrics` Instrument development and validation.
- `method/usability-testing` Usability and user testing. aliases: usability
- `method/simulation` Simulation or modelling study.
- `method/laboratory` Laboratory or bench experiments, including animal studies. aliases: in vitro, in vivo
- `method/imaging` Medical imaging is the main source of data. aliases: MRI, CT, ultrasound
- `method/programming` Programming and software tools. aliases: programming, R, Python

## type

What kind of study or document it is.

- `type/rct` The item reports a randomised controlled trial (not a review or commentary about trials). aliases: RCT, Randomized Controlled Trial
- `type/cohort` Cohort study. aliases: Cohort Studies, longitudinal
- `type/case-control` Case-control study.
- `type/cross-sectional` Cross-sectional study. aliases: Cross-Sectional Studies
- `type/diagnostic-accuracy` Diagnostic accuracy study.
- `type/validation-study` Validation study (instrument, model or equation).
- `type/qualitative` Qualitative study.
- `type/mixed-methods` Mixed-methods study.
- `type/systematic-review` Systematic review. aliases: Systematic Review
- `type/meta-analysis` Meta-analysis. aliases: Meta-Analysis
- `type/scoping-review` Scoping review.
- `type/narrative-review` Narrative review. aliases: Review
- `type/guideline` The item is a guideline, statement or technical standard (not a paper about guidelines). aliases: Practice Guideline
- `type/protocol` Study protocol.
- `type/editorial` Editorial, commentary, letter or book review. aliases: Editorial, Comment, Letter
- `type/case-report` Case report.
- `type/web-document` Web page, blog post or online document. aliases: blog post
- `type/technical-report` Technical or institutional report.
- `type/thesis` Thesis or dissertation.
- `type/textbook` Textbook.
- `type/monograph` Monograph or non-fiction book.
- `type/edited-book` Edited book or book chapter.

## status

Reading status. Exactly one per item.

- `status/to-read` Not read yet.
- `status/reading` Reading now.
- `status/read` Read.
