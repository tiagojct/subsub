---
required_facets: topic, status
single_facets: status
max_per_facet: topic=4, type=2
---
Tag list for the Zotero library (health informatics). Sub-Sub reads this file and refuses any tag that is not listed here. Add, rename or remove tags as your library needs: one tag per bullet, in backticks, then a short description. Put old or alternative names after "aliases:"; the librarian uses them to map old tags.

## topic

What the item is about. 1 to 4 per item.

- `topic/medical-informatics` Health and medical informatics in general. aliases: health informatics
- `topic/health-information-systems` Hospital and clinical information systems. aliases: HIS, hospital information system
- `topic/electronic-health-records` Electronic health records and clinical documentation. aliases: EHR, EMR
- `topic/interoperability` Standards, terminologies and data exchange. aliases: HL7, FHIR, SNOMED CT, openEHR
- `topic/health-data` Health data, secondary use and data quality. aliases: real-world data, data quality
- `topic/clinical-decision-support` Clinical decision support systems. aliases: CDSS, decision support
- `topic/artificial-intelligence` AI in health, general. aliases: AI, machine learning
- `topic/generative-ai` Large language models and generative AI. aliases: LLM, ChatGPT
- `topic/ai-evaluation` Evaluation and benchmarking of AI systems. aliases: benchmarking
- `topic/ai-ethics` Ethics of AI, fairness and bias. aliases: fairness, bias
- `topic/digital-health` Digital health, eHealth and mHealth. aliases: eHealth, mHealth
- `topic/telehealth` Telemedicine and remote monitoring. aliases: telemedicine, remote monitoring
- `topic/consumer-health` Patient portals, apps and patient engagement. aliases: patient engagement, patient portal
- `topic/health-literacy` Health and digital literacy. aliases: digital literacy
- `topic/usability` Usability and human factors. aliases: human factors, user experience
- `topic/evaluation` Evaluation of health information systems and technology assessment. aliases: HTA, health technology assessment
- `topic/implementation` Adoption and implementation of health IT. aliases: adoption
- `topic/data-protection` Privacy, security and data protection. aliases: GDPR, privacy, security
- `topic/regulation` Law and regulation of health technology. aliases: AI Act, MDR, medical device regulation
- `topic/medical-devices` Medical devices and software as a medical device. aliases: SaMD
- `topic/public-health-informatics` Surveillance and population health data. aliases: surveillance
- `topic/bioinformatics` Bioinformatics and genomics data. aliases: genomics
- `topic/informatics-education` Teaching health informatics and digital skills. aliases: education
- `topic/statistics` Statistics and data analysis as a subject: methods, teaching, textbooks. aliases: biostatistics
- `topic/research-methods` Research methods, reporting, integrity and meta-research. aliases: methodology, reproducibility

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
