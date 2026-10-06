---
layout: base.njk
title: Models
eyebrow: Bring your own
lead: Sub-Sub works with any model provider that pi supports. You need your own account; Sub-Sub does not include a model.
---

## Connect a provider

1. Type `subsub`.
2. Type `/login` and select the provider: for example OpenCode Go, OpenRouter, Anthropic, OpenAI or Google.
3. Type `/model` to select a model.

Each mode can have its own model. `/model` and the model button set the model for the current mode. In the browser, select "Use it in both modes" to set the same model for the Librarian and the Researcher. To set the models in the settings file `~/.config/subsub/config.json`:

```json
{
  "models": {
    "librarian": "opencode-go/glm-5.3-flash",
    "researcher": "opencode-go/mimo-v2.6-pro"
  }
}
```

Version 0.10 used one model for all work (`"model"`). That setting still works: Sub-Sub uses that model in both modes.

## Tested models

These models were tested on a real library of about 1000 items in September 2026, on the same tasks, with the answers judged blind.

| Model | Result |
|---|---|
| `opencode-go/mimo-v2.6-pro` | No invented references, good notes. The default for the Researcher. |
| `opencode-go/glm-5.3-flash` | Accurate tags, correct tool calls, low cost in the tagging tasks. The default for the Librarian. |

In October 2026, in Sub-Sub 0.10, both were tested again on 20 tagged items (the models did not see the tags) and on an import. Tagging was close: F1 0.69 for mimo-v2.6-pro and 0.67 for glm-5.3-flash, against the tags already in the library; both proposed about one tag more per item than the library has. In the import, mimo-v2.6-pro imported the new work and reported the duplicate; glm-5.3-flash sent no identifiers. Tagging with glm-5.3-flash cost about 40% less.

`subsub init` offers glm-5.3-flash for the Librarian and mimo-v2.6-pro for the Researcher when you use OpenCode Go.

A new test of 15 models is under way; this page will show its results.

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --models a,b` (OpenCode Go model names; the test uses OpenCode Go). To test different models for each group of tasks, type `subsub-bench run --librarian a,b --researcher c,d`: the Librarian models do the library tasks and the Researcher models do the research tasks.
4. Type `subsub-bench score`.
