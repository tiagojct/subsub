# Workshop

A one-hour workshop for clinical researchers, as Quarto reveal.js slides in the site's type and colours.

- `index.qmd`: European Portuguese, served at https://subsub.tiagojacinto.eu/workshop/
- `en/index.qmd`: English, served at https://subsub.tiagojacinto.eu/workshop/en/
- `assets/`: the stylesheet, fonts and images (screenshots from the site, QR codes to the clinician pages)

`quarto render` writes `_output/`; `site/scripts/deploy.sh` renders it and copies it into the site. The slides are not linked from the site and carry `noindex`.

Press S for the speaker view with notes and timings. The last slide is an appendix to copy into the invitation email.
