---
layout: base.njk
title: Models
eyebrow: Bring your own
lead: Sub-Sub works with any model provider that pi supports. You need your own account; Sub-Sub does not include a model.
---

## Connect a provider

In the browser:

1. Open Sub-Sub (the shortcut, or `subsub web`).
2. Select the model button at the top. Choose the provider, paste its API key and select Save.
3. Select a model in the list.

In the terminal:

1. Type `subsub`.
2. Type `/login` and select the provider: for example OpenCode Go, OpenRouter, Anthropic, OpenAI or Google.
3. Type `/model` to select a model.

Each mode can have its own model. The model button saves the model for the current mode; select "Use it in both modes" to set the same model for the Librarian and the Researcher. In the terminal, `/model` changes the model for the open conversation only; `subsub init` or the settings file sets it for a mode. To set the models in the settings file `~/.config/subsub/config.json`:

```json
{
  "models": {
    "librarian": "opencode-go/mimo-v2.6-flash",
    "researcher": "opencode-go/mimo-v2.6-pro"
  }
}
```

Version 0.10 used one model for all work (`"model"`). That setting still works: Sub-Sub uses that model in both modes.

## Tested models

In October 2026, 15 models on OpenCode Go did the same seven tasks on a real library of about 1000 items. Library tasks: tag 20 items, and import two works, one of them already in the library. Research tasks: a literature note, a synthesis of 15 items, a search for recent work, and a literature review with `/lit`. The research notes were judged blind (the judge saw codes, not names), from 1 to 5. Every library change was recorded and blocked.

| Model | Research (1 to 5) | Tagging F1 | Import | Invented references | Cost, all 7 tasks |
|---|---|---|---|---|---|
| kimi-k3 | 5.0 | 0.68 | both | 0 | $2.37 |
| qwen3.8-flash | 4.9 | 0.71 | both | 0 | $0.13 |
| **mimo-v2.6-pro** (Researcher) | 4.8 | 0.66 | both | 0 | $0.16 |
| **mimo-v2.6-flash** (Librarian) | 4.5 | 0.69 | both | 0 | $0.07 |
| glm-5.3 | 4.5 | 0.71 | both | 0 | $0.89 |
| qwen3.8-max | 4.5 | 0.72 | both | 0 | $1.15 |
| minimax-m3 | 4.4 | 0.69 | both | 0 | $0.47 |
| gpt-5.6-luna | 4.3 | 0.66 | both | 0 | $0.16 |
| hy3 | 4.3 | 0.67 | both | 0 | $0.19 |
| glm-5.3-flash | 4.1 | 0.71 | one of two | 1 | $0.16 |
| longcat-2.0 | 4.0 | 0.68 | none | 0 | $0.18 |
| mimo-v2.5-pro | 4.0 | 0.69 | none | 1 | $0.14 |
| qwen3.7-plus | 3.5 | 0.68 | both | 2 | $0.34 |
| gpt-6-luna | 3.1 | 0.68 | both | 0 | $0.08 |
| minimax-m2.7 | does not work with pi | | | | |

How to read the table:

- Tagging is close for all models (F1 0.66 to 0.72 against the tags already in the library, which its owner had approved in tag reviews). The models differ in the import and in the research notes.
- mimo-v2.6-pro is the Researcher's default: it scored 4.8 in September and again now, invented no references and did both library tasks. qwen3.8-flash scored a little higher at lower cost, but in September it sent malformed tool calls; it needs one more good test before it becomes the default. kimi-k3 wrote the best notes at about 15 times the cost.
- mimo-v2.6-flash is the Librarian's default: both imports right, the lowest cost, and in September its tagging matched the best. glm-5.3-flash, the Librarian's default until now, missed an identifier in the import in two tests in a row.
- An invented reference is a citekey that is not in the library, or a DOI or PMID that no search returned. One test per model is a small sample: treat differences under 0.3 as noise.

`subsub init` offers mimo-v2.6-flash for the Librarian and mimo-v2.6-pro for the Researcher when you use OpenCode Go.

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --models a,b` (OpenCode Go model names; the test uses OpenCode Go). To test different models for each group of tasks, type `subsub-bench run --librarian a,b --researcher c,d`: the Librarian models do the library tasks and the Researcher models do the research tasks.
4. Type `subsub-bench score`.
