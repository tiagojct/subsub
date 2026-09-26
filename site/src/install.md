---
layout: base.njk
title: Install
eyebrow: Get started
lead: One command installs everything Sub-Sub needs, in your own user folder. You do not need administrator rights.
---

## Before you start

1. Install [Zotero 10](https://www.zotero.org/download/) or later, if you do not have it.
2. Start Zotero.
3. In Zotero, open Settings > Advanced.
4. Turn on "Allow other applications on this computer to communicate with Zotero".
5. Get an account with an AI model provider. See [Models](/models/).

## Install on macOS or Linux

1. Open Terminal.
2. Type this command, then press Return:

<pre class="cmd"><code>curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh</code></pre>

3. Answer the questions of the set-up. To keep the value in brackets, press Return.
4. Open a new Terminal window.
5. Type `subsub doctor`. Each line that starts with FIX tells you what to do.

## Install on Windows

1. Open PowerShell. (Press the Windows key, type PowerShell, press Enter.)
2. Type this command, then press Enter:

<pre class="cmd ps"><code>powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"</code></pre>

3. Answer the questions of the set-up. To keep the value in brackets, press Enter.
4. Open a new PowerShell window.
5. Type `subsub doctor`. Each line that starts with FIX tells you what to do.

## Start Sub-Sub

1. Start Zotero.
2. Type `subsub`.
3. Type `/login`. Select your model provider and follow the steps.
4. Type `/subsub`. Make sure that the result shows "Zotero: reachable".

Then read the [Guide](/guide/).

## What the installer does

The installer puts everything in `~/.subsub` (on Windows, `.subsub` in your user folder):

- It installs [uv](https://docs.astral.sh/uv/), if you do not have it. uv runs the Zotero server.
- It installs Node.js 22 in `~/.subsub/node`, if your Node.js is missing or older than 22.19. It checks the download against the checksums that nodejs.org publishes.
- It installs Sub-Sub (the npm package [@tiagojct/subsub](https://www.npmjs.com/package/@tiagojct/subsub)).
- It adds `~/.subsub/bin` to your PATH, so that the `subsub` command works in new terminal windows.
- It starts `subsub init`, which asks for your name, a notes folder, a profile and a starter tag list.

You can read the installers before you run them: [install.sh](/install.sh) and [install.ps1](/install.ps1).

## Install with npm

If you have Node.js 22.19 or later and uv:

<pre class="cmd"><code>npm install -g @tiagojct/subsub</code></pre>

Then type `subsub init`.

If you already use [pi](https://pi.dev), you can also add Sub-Sub to pi: `pi install npm:@tiagojct/subsub`.

## What `subsub init` creates

- A settings file: `~/.config/subsub/config.json`.
- The Zotero server settings: `~/.config/zotero-local-mcp/env` (notes folder, tag list, contact email).
- In your notes folder: `Inbox/`, `Systems/Zotero tags.md` (a starter tag list) and `Systems/Zotero agent.md` (the note formats). You can edit both files.

`subsub init` never replaces a file that exists. To change your settings later, type `subsub init` again.

## Update

Type the install command again. Or, if you installed with npm, type `npm install -g @tiagojct/subsub`.

## Remove

1. Delete the folder `~/.subsub`.
2. Remove the line that starts with `export PATH` and names `.subsub` from `~/.zshrc`, `~/.bashrc` or `~/.profile`. (On Windows: remove the two `.subsub` entries from your user PATH.)
3. If you do not want the settings any more, delete `~/.config/subsub` and `~/.config/zotero-local-mcp`.

Your Zotero library and your notes do not change.
