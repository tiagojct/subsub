#!/bin/sh
# Deploys the built site to the VPS at subsub.tiagojacinto.eu, the same way as the
# other static sites there: each deploy is a new directory under releases/, named
# <n>-<commit>, and Caddy serves whatever the `current` symlink points to. Old
# releases stay, so going back means pointing `current` at an earlier one.
#
# The hostname, Caddy route, tunnel ingress and DNS record are set up once on the
# VPS with ~/add-site.py (static root /srv/subsub.tiagojacinto.eu/current inside
# the Caddy container). See site/README.md.
set -eu

HOST=vps
DIR=/opt/vps/caddy/srv/subsub.tiagojacinto.eu
cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Commit your changes first: the release is named after the commit." >&2
  exit 1
fi

npm run build
node scripts/check.mjs

# The workshop slides (../workshop, Quarto): served at /workshop/ and /workshop/en/,
# not linked from the site and marked noindex. Copied after the link check.
if command -v quarto >/dev/null 2>&1; then
  (cd ../workshop && quarto render >/dev/null)
  rm -rf _site/workshop && cp -R ../workshop/_output _site/workshop
else
  echo "quarto not found: the workshop is not in this release" >&2
fi

SHA=$(git rev-parse --short HEAD)
# The next number is one more than the highest number in use, so deleting old
# releases never makes a number repeat.
N=$(ssh "$HOST" "mkdir -p $DIR/releases && ls $DIR/releases" | sed -n 's/^\([0-9][0-9]*\)-.*/\1/p' | sort -n | tail -1)
REL="$((${N:-0} + 1))-$SHA"

rsync -az --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r _site/ "$HOST:$DIR/releases/$REL/"
ssh "$HOST" "cd $DIR && ln -sfn releases/$REL current && echo \"current -> \$(readlink current)\""
