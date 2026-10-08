---
layout: base.njk
title: Install
eyebrow: Get started
lead: One command installs everything Sub-Sub needs, in your own user folder. You do not need administrator rights.
---

New to Zotero, AI models or the terminal? Read [For students](/students/) first ([em português](/estudantes/)).

## Before you start

1. Install [Zotero 10](https://www.zotero.org/download/) or later, if you do not have it.
2. Start Zotero.
3. In Zotero, open Settings > Advanced.
4. Turn on "Allow other applications on this computer to communicate with Zotero".
5. Get an account with an AI model provider. See [Models](/models/). To try Sub-Sub without paying, a free Google key is enough: see [Use Sub-Sub for free](/models/#use-sub-sub-for-free).

## Install on macOS or Linux

1. Open Terminal.
2. Type this command, then press Return:

<pre class="cmd"><code>curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh</code></pre>

3. Answer the questions of the set-up. To keep the value in brackets, press Return.
4. Sub-Sub opens in your browser. Later, open it from Applications (macOS) or from your applications menu (Linux).

## Install on Windows

1. Open PowerShell. (Press the Windows key, type PowerShell, press Enter.)
2. Type this command, then press Enter:

<pre class="cmd ps"><code>powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"</code></pre>

3. Answer the questions of the set-up. To keep the value in brackets, press Enter.
4. Sub-Sub opens in your browser. Later, open it from the Start menu or from the Sub-Sub shortcut on the desktop.

## About the install command

The command downloads a script from this site and runs it. Security advice often warns against running scripts from the internet, and that is good advice for sites you do not trust. Here is what you can check:

- You can read the script before you run it: [install.sh](/install.sh) and [install.ps1](/install.ps1). It is short and has comments.
- It installs only in your own user folder (`~/.subsub`). It does not ask for an administrator password and does not change the system.
- On Windows, `-ExecutionPolicy ByPass` lets this one command run the script. It does not change the setting for other scripts.
- Everything it installs is open source: Sub-Sub, Node.js and uv. The source of Sub-Sub is on [GitHub]({{ site.repo }}).
- To remove it all, see [Remove](#remove).

If your institution manages your computer and blocks the command, ask its IT service, or use a computer of your own.

## Start Sub-Sub

1. Start Zotero.
2. Open Sub-Sub from its shortcut. It opens in your browser. (In a terminal, `subsub web` does the same.)
3. Select the model button at the top right. Select your provider, paste your API key and select Save. Then select a model.
4. Make sure that the top of the page shows the number of items in your Zotero library.

Then read the [Guide](/guide/).

If you prefer the terminal: type `subsub`, then `/login`. Everything in the browser also works in the terminal.

## Check the set-up

Open a new terminal window and type `subsub doctor`. Each line that starts with FIX tells you what to do. See [Help](/help/).

## What the installer does

The installer puts everything in `~/.subsub` (on Windows, `.subsub` in your user folder):

- It installs [uv](https://docs.astral.sh/uv/), if you do not have it. uv runs the Zotero server.
- It installs Node.js 22 in `~/.subsub/node`, if your Node.js is missing or older than 22.19. It checks the download against the checksums that nodejs.org publishes.
- It installs Sub-Sub (the npm package [@tiagojct/subsub](https://www.npmjs.com/package/@tiagojct/subsub)).
- It adds `~/.subsub/bin` to your PATH, so that the `subsub` command works in new terminal windows.
- It starts `subsub init`, which asks a few questions: your name and one line about you, the language, the Sub-Sub folder, the set-up (standard, or FMUP for the Faculty of Medicine in Porto), whether you are a student (students start with the Reader profile), the profile, a starter tag list, a contact email, reference checks (Starbuck), the usage log for the pilot (off by default) and the models. Press Enter to accept each default. At the end, the installer runs `subsub doctor` to check the set-up.
- It adds a Sub-Sub shortcut (`subsub shortcut`): in Applications on macOS, in the Start menu and on the desktop on Windows, in the applications menu on Linux. The shortcut opens Sub-Sub in your browser.
- It opens Sub-Sub in your browser.

You can read the installers before you run them: [install.sh](/install.sh) and [install.ps1](/install.ps1).

## Install with npm

If you have Node.js 22.19 or later and uv:

<pre class="cmd"><code>npm install -g @tiagojct/subsub</code></pre>

npm also installs pi 1.0, which Sub-Sub needs. Then type `subsub init`, and `subsub shortcut` for the shortcut.

If you already use [pi](https://pi.dev), you can also add Sub-Sub to pi: `pi install npm:@tiagojct/subsub`. Sub-Sub needs pi 1.0 or later.

## What `subsub init` creates

- A settings file: `~/.config/subsub/config.json`.
- The Zotero server settings: `~/.config/zotero-local-mcp/env` (the Sub-Sub folder, the tag list, the contact email).
- The Sub-Sub folder, by default `~/Documents/Sub-Sub`, or `Sub-Sub` inside your Obsidian vault. In it: `Inbox/`, `Literature/`, `Syntheses/`, `Research/`, and `Zotero/` with `Zotero tags.md` (a starter tag list) and `Zotero agent.md` (the note formats). You can edit both files.

`subsub init` never replaces a file that exists. To change your settings later, type `subsub init` again.

## Reference checks (Starbuck)

Starbuck is an add-on that checks the references of a manuscript. It is off by default. To turn it on:

- In `subsub init`, answer On to the question "Reference checks (Starbuck)". Or type `subsub init --starbuck on`.
- Or, in the browser view, turn on the switch "Reference checks (Starbuck)" in the panel on the left. Sub-Sub restarts.

Sub-Sub downloads Starbuck with uv the first time. Then type `subsub doctor`: the line Starbuck must show ok. Sub-Sub then has `/verify`. See the [Guide](/guide/#check-references).

## Update

Type the install command again. Or, if you installed with npm, type `npm install -g @tiagojct/subsub`.

## Remove

1. Type `subsub shortcut --remove`. This removes the shortcut from Applications, the Start menu or the applications menu, and from the desktop.
2. Delete the folder `~/.subsub`.
3. Remove the line that starts with `export PATH` and names `.subsub` from `~/.zshrc`, `~/.bashrc` or `~/.profile`. (On Windows: remove the two `.subsub` entries from your user PATH.)
4. If you do not want the settings any more, delete `~/.config/subsub` and `~/.config/zotero-local-mcp`. The journal of changes, which `/undo` uses, is in `~/.local/share/zotero-local-mcp`.

Your Zotero library and your notes do not change.
