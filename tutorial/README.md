# Tutorial

A page to test every Sub-Sub command and every part of the browser view, step by step, with the result to expect at each step. In English, as a Quarto HTML page in the site's type and colours.

- `index.qmd`: the tutorial, served at https://subsub.tiagojacinto.eu/tutorial/
- `assets/checks.js`: makes the step boxes tickable and keeps the ticks in the browser (localStorage)
- `theme.scss`, `theme-dark.scss`: the site's colours; the fonts load from the site

`quarto render` writes `_output/`; `site/scripts/deploy.sh` renders it and copies it into the site. The page is not linked from the site and carries `noindex`.

When a command changes, change its steps here too.
