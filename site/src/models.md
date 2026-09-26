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

To use a different model for each mode, add them to the settings file `~/.config/subsub/config.json`:

```json
{
  "models": {
    "librarian": "opencode-go/glm-5.3-flash",
    "researcher": "opencode-go/mimo-v2.6-pro"
  }
}
```

## Tested models

These models were tested on a real library of about 1000 items in September 2026, on the same tasks, with the answers judged blind.

| Mode | Model | Why |
|---|---|---|
| Librarian | `opencode-go/glm-5.3-flash` | Accurate tags, correct tool calls, low cost |
| Researcher | `opencode-go/mimo-v2.6-pro` | No invented references, good notes |

`subsub init` offers these two when you use OpenCode Go.

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --librarian a,b --researcher c,d` (OpenCode Go model names; the test uses OpenCode Go).
4. Type `subsub-bench score`.
