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

SHA=$(git rev-parse --short HEAD)
N=$(ssh "$HOST" "mkdir -p $DIR/releases && ls $DIR/releases | wc -l")
REL="$((N + 1))-$SHA"

rsync -az --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r _site/ "$HOST:$DIR/releases/$REL/"
ssh "$HOST" "cd $DIR && ln -sfn releases/$REL current && echo \"current -> \$(readlink current)\""
