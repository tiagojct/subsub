# subsub.tiagojacinto.eu

The Sub-Sub website: an 11ty site with the Glauca design (pages) and Try-Works (terminal pictures). The installers `install.sh` and `install.ps1` are in `src/` and are served from the site root.

## Build

```sh
cd site
npm install
npm run build     # writes _site/
npm run serve     # http://localhost:8080, rebuilds on change
```

The footer shows the Sub-Sub version (from `../package.json`), the Zotero server version (`SERVER_VERSION` in `../src/config.ts`) and the pi version. Rebuild and deploy after a release.

## Deploy

The site is static and is served by Caddy on the VPS, like the other sites there.

Each deploy:

```sh
cd site
npm run deploy
```

`scripts/deploy.sh` refuses to run with uncommitted changes, builds the site, copies `_site/` to `/opt/vps/caddy/srv/subsub.tiagojacinto.eu/releases/<n>-<commit>/` and points `current` at it. To go back, point `current` at an earlier release.

## Installers

`.github/workflows/installers.yml` runs both installers on clean Linux, macOS and Windows runners when they change, and every Monday against the published npm package.

Test `install.sh` locally without changing your shell settings:

```sh
SUBSUB_HOME=/tmp/subsub-test SUBSUB_NO_MODIFY_PATH=1 SUBSUB_SKIP_INIT=1 sh src/install.sh
```
