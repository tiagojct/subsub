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

Sub-Sub uses one model. To set it in the settings file `~/.config/subsub/config.json`:

```json
{
  "model": "opencode-go/mimo-v2.6-pro"
}
```

Before version 0.10, Sub-Sub had two modes, each with its own model (`"models"`). That setting still works: Sub-Sub uses the researcher's model.

## Tested models

These models were tested on a real library of about 1000 items in September 2026, on the same tasks, with the answers judged blind.

| Model | Result |
|---|---|
| `opencode-go/mimo-v2.6-pro` | No invented references, good notes. The default since 0.10. |
| `opencode-go/glm-5.3-flash` | Accurate tags, correct tool calls, low cost in the tagging tasks. |

`subsub init` offers mimo-v2.6-pro when you use OpenCode Go. For a long tagging session, you can switch to glm-5.3-flash with the model button (or `/model` in the terminal).

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --models a,b` (OpenCode Go model names; the test uses OpenCode Go). To compare different models on the library and the research tasks, use `--librarian a,b --researcher c,d`.
4. Type `subsub-bench score`.
