#!/bin/sh
# Sub-Sub installer for macOS and Linux. https://subsub.tiagojacinto.eu
#
#   curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh
#
# Everything goes into your home folder; no administrator rights are needed.
#  1. uv (https://docs.astral.sh/uv/), if it is not installed yet.
#  2. Node.js 22, in ~/.subsub/node, if your Node.js is missing or older than 22.19.
#     The download is checked against the SHA-256 sums that nodejs.org publishes.
#  3. Sub-Sub (@tiagojct/subsub from npm), in ~/.subsub.
#  4. A line in your shell start file that puts ~/.subsub/bin on the PATH.
#  5. subsub init, which asks a few questions.
#  6. A Sub-Sub shortcut that opens Sub-Sub in the browser (subsub shortcut).
#
# Settings (environment variables): SUBSUB_HOME (default ~/.subsub),
# SUBSUB_VERSION (default latest), SUBSUB_NO_MODIFY_PATH=1, SUBSUB_SKIP_INIT=1,
# SUBSUB_OWN_NODE=1 (always use ~/.subsub/node), SUBSUB_NO_SHORTCUT=1,
# SUBSUB_NO_OPEN=1 (do not open Sub-Sub at the end).
set -eu

SUBSUB_HOME="${SUBSUB_HOME:-$HOME/.subsub}"
SUBSUB_VERSION="${SUBSUB_VERSION:-latest}"
NODE_DIST="${SUBSUB_NODE_DIST:-https://nodejs.org/dist/latest-v22.x}"
UV_INSTALLER="${SUBSUB_UV_INSTALLER:-https://astral.sh/uv/install.sh}"
PATH_LINE="export PATH=\"$SUBSUB_HOME/bin:$SUBSUB_HOME/node/bin:\$PATH\""

say() { printf '%s\n' "$*"; }
fail() { printf 'Sub-Sub installer: %s\n' "$*" >&2; exit 1; }

download() { # url file
	if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"
	elif command -v wget >/dev/null 2>&1; then wget -q "$1" -O "$2"
	else fail "curl or wget is needed."; fi
}

sha256() {
	if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
	else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

node_ok() { # true when the node on PATH is 22.19 or later
	command -v node >/dev/null 2>&1 || return 1
	v=$(node -p 'process.versions.node' 2>/dev/null) || return 1
	major=${v%%.*}; rest=${v#*.}; minor=${rest%%.*}
	[ "$major" -gt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 19 ]; }
}

case "$(uname -s)" in
	Darwin) os=darwin ;;
	Linux) os=linux ;;
	*) fail "this installer is for macOS and Linux. On Windows, use install.ps1 (see the website)." ;;
esac
case "$(uname -m)" in
	x86_64 | amd64) arch=x64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*) fail "unsupported processor: $(uname -m)." ;;
esac

mkdir -p "$SUBSUB_HOME"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# 1. uv
if command -v uv >/dev/null 2>&1 || [ -x "$HOME/.local/bin/uv" ] || [ -x "$HOME/.cargo/bin/uv" ]; then
	say "uv: already installed."
else
	say "uv: installing (astral.sh) ..."
	download "$UV_INSTALLER" "$tmp/uv-install.sh"
	sh "$tmp/uv-install.sh" || fail "the uv installer failed."
fi

# 2. Node.js
if [ "${SUBSUB_OWN_NODE:-0}" != 1 ] && node_ok; then
	say "Node.js: using $(command -v node) ($(node -v))."
	NPM=npm
elif [ "${SUBSUB_OWN_NODE:-0}" != 1 ] && [ -x "$SUBSUB_HOME/node/bin/node" ] && PATH="$SUBSUB_HOME/node/bin:$PATH" node_ok; then
	say "Node.js: using $SUBSUB_HOME/node."
	PATH="$SUBSUB_HOME/node/bin:$PATH"; export PATH
	NPM="$SUBSUB_HOME/node/bin/npm"
else
	say "Node.js: installing Node.js 22 in $SUBSUB_HOME/node ..."
	download "$NODE_DIST/SHASUMS256.txt" "$tmp/SHASUMS256.txt"
	line=$(grep " node-v22\.[0-9.]*-$os-$arch\.tar\.gz\$" "$tmp/SHASUMS256.txt" | head -n 1)
	[ -n "$line" ] || fail "no Node.js 22 download for $os-$arch."
	sum=${line%% *}; file=${line##* }
	download "$NODE_DIST/$file" "$tmp/$file"
	[ "$(sha256 "$tmp/$file")" = "$sum" ] || fail "the Node.js download does not match its checksum."
	tar -xzf "$tmp/$file" -C "$tmp"
	rm -rf "$SUBSUB_HOME/node"
	mv "$tmp/${file%.tar.gz}" "$SUBSUB_HOME/node"
	PATH="$SUBSUB_HOME/node/bin:$PATH"; export PATH
	NPM="$SUBSUB_HOME/node/bin/npm"
	say "Node.js: $("$SUBSUB_HOME/node/bin/node" -v) installed."
fi

# 3. Sub-Sub
say "Sub-Sub: installing @tiagojct/subsub@$SUBSUB_VERSION in $SUBSUB_HOME ..."
"$NPM" install --global --prefix "$SUBSUB_HOME" --no-fund --no-audit --no-update-notifier --loglevel=error "@tiagojct/subsub@$SUBSUB_VERSION" \
	|| fail "npm could not install @tiagojct/subsub."
PATH="$SUBSUB_HOME/bin:$PATH"; export PATH
say "Sub-Sub: $("$SUBSUB_HOME/bin/subsub" --version)."

# 4. PATH in the shell start files
if [ "${SUBSUB_NO_MODIFY_PATH:-0}" != 1 ]; then
	for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.profile"; do
		case "$rc" in
			*/.zshrc) [ -f "$rc" ] || [ "$os" = darwin ] || continue ;;
			*/.profile) [ -f "$rc" ] || [ ! -f "$HOME/.bashrc" ] || continue ;;
			*) [ -f "$rc" ] || continue ;;
		esac
		if ! grep -qsF "$SUBSUB_HOME/bin" "$rc"; then
			printf '\n# Sub-Sub\n%s\n' "$PATH_LINE" >> "$rc"
			say "PATH: added $SUBSUB_HOME/bin to $rc."
		fi
	done
fi

# 5. Settings
ASKED=0
if [ "${SUBSUB_SKIP_INIT:-0}" = 1 ]; then
	say "Skipped subsub init (SUBSUB_SKIP_INIT=1)."
elif [ -r /dev/tty ] && (exec </dev/tty) 2>/dev/null; then
	say ""
	if "$SUBSUB_HOME/bin/subsub" init </dev/tty; then ASKED=1; else say "subsub init did not finish. Type subsub init later."; fi
else
	say "No terminal for questions: type subsub init after the installer."
fi

# The web view and the shortcut came with Sub-Sub 0.6.
WEB=0
VER=$("$SUBSUB_HOME/bin/subsub" --version 2>/dev/null | sed -n 's/^subsub \([0-9][0-9]*\)\.\([0-9][0-9]*\).*/\1 \2/p')
if [ -n "$VER" ]; then
	set -- $VER
	if [ "$1" -gt 0 ] || [ "$2" -ge 6 ]; then WEB=1; fi
fi

# 6. Shortcut: Sub-Sub in Applications (macOS) or in the applications menu (Linux)
if [ "$WEB" != 1 ]; then
	:
elif [ "${SUBSUB_NO_SHORTCUT:-0}" = 1 ]; then
	say "Skipped the shortcut (SUBSUB_NO_SHORTCUT=1)."
else
	say ""
	"$SUBSUB_HOME/bin/subsub" shortcut || say "Could not add the shortcut. Type subsub shortcut later."
fi

say ""
say "Done. To open Sub-Sub in your browser, open Sub-Sub from Applications or your applications menu, or type: subsub web"
say "To check the set-up, open a new terminal window and type: subsub doctor"
say "Docs: https://subsub.tiagojacinto.eu"

# 7. After an interactive set-up, open Sub-Sub now.
if [ "$WEB" = 1 ] && [ "$ASKED" = 1 ] && [ "${SUBSUB_NO_OPEN:-0}" != 1 ]; then
	nohup "$SUBSUB_HOME/bin/subsub" web >/dev/null 2>&1 &
	say "Sub-Sub is opening in your browser."
fi
