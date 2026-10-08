# Workshop

A one-hour workshop for clinical researchers, as Quarto reveal.js slides in the site's type and colours.

- `index.qmd`: European Portuguese, served at https://subsub.tiagojacinto.eu/workshop/
- `en/index.qmd`: English, served at https://subsub.tiagojacinto.eu/workshop/en/
- `assets/`: the stylesheet, fonts and images (screenshots from the site, QR codes to the clinician pages)

`quarto render` writes `_output/`; `site/scripts/deploy.sh` renders it and copies it into the site. The slides are not linked from the site and carry `noindex`.

Press S for the speaker view with notes and timings. On the exercise slides, click the minutes ("4 min") to start a countdown.

Two appendix slides follow the end: a command card to hand out, and the text for the invitation email. For a PDF or a printed handout, open the slides with `?print-pdf` at the end of the address and print to PDF (one slide per page, backgrounds on).
