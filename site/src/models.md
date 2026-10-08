---
alt: /pt/modelos/
layout: base.njk
title: Models
eyebrow: Bring your own
lead: Sub-Sub works with any model provider that pi supports. You need your own account; Sub-Sub does not include a model.
---

## Which to choose

| You want to | Choose | Cost |
|---|---|---|
| Try Sub-Sub | Google, `{{ facts.freeModel }}`, with a free key ([how](#use-sub-sub-for-free)) | Free, with limits per minute and per day |
| Use it regularly | [OpenCode Go]({{ facts.opencodeGo.url }}), with the tested defaults (`subsub init` sets them) | A subscription: about {{ facts.opencodeGo.monthly }} dollars a month, {{ facts.opencodeGo.firstMonth }} the first month. The defaults use about {{ facts.defaultTaskCents }} cents a task. |
| Keep your data in the EU | Mistral, `{{ facts.euModel }}` ([details](#where-your-data-goes)) | Pay per use: about {{ facts.euTaskCents }} cents a task |

Prices and plans checked {{ facts.checked | monthYear }}. Check the provider's page before you pay. If you are not sure, start with the free Google key. Change later with the model button; your library and notes do not change. The rest of this page explains how the tests were done.

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

## Use Sub-Sub for free

To try Sub-Sub, or for light use, a free Google key is enough.

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account. You must be 18 or older.
2. Select "Create API key" and copy the key. Google does not ask for a card.
3. In Sub-Sub, select the model button. Choose Google Gemini, paste the key and select Save.
4. Select `google/gemini-3.1-flash-lite`. The model list marks it "tested, free".

`subsub init` does the same: in Models, choose "Free, to try Sub-Sub". It sets `gemini-3.1-flash-lite` for both modes and asks for the key.

Know the limits before you rely on it:

- The free tier limits how much text you can send each minute, and how many requests you can make each day. Long tasks reach the per-minute limit first, for example a literature note from a full text, or a synthesis of many items. When that happens, Sub-Sub says so: wait a minute and ask it to continue. The daily limit resets at midnight, Pacific time.
- When many people use a model, Google sometimes refuses requests for a few minutes ("high demand"). Try again later.
- In the European Union, the United Kingdom and Switzerland, Google does not use free-tier prompts to improve its products. In other countries it may, so do not send unpublished work through a free key there.
- In our test (October 2026), `gemini-3.1-flash-lite` tagged with F1 0.63 and imported correctly. Its research notes were thin (2.5 of 5, see [Where your data goes](#where-your-data-goes)): fine for trying Sub-Sub, not for research you rely on. The newer `gemini-3.5-flash-lite` tagged as well, but Google often refused it for "high demand"; `gemini-3.8-flash` did not finish a task on the free tier. The tested OpenCode Go models tag better (F1 0.69 to 0.74) and have no daily limit, for a few cents a task.

OpenRouter also has free models: their names end in `:free`. They allow 50 requests a day (1000 after you buy 10 dollars of credit), and the providers of some of them may keep your prompts. In our test they were less reliable than the Google free tier: `gemma-4-31b-it:free` refused every request (rate limit), and `nemotron-3-ultra-550b-a55b:free` was often overloaded, tagged with F1 0.58 and did not finish a literature note.

## Tested models

Read these tests for what they can tell you. They ran on one library: about 1000 items in medicine and health informatics, owned by Sub-Sub's author. The tag scores compare with the tags that its owner approved. An AI model judged the research notes, blind to the names of the models. Most models ran once per task. So the tests show which models work well with Sub-Sub's tools and which do not; they do not rank the models that work. In another field, or with another library, the order can change. Most of the models below are adequate; choose among them by cost, by where your data goes (see [Where your data goes](#where-your-data-goes)) and by a test on your own library ([Test models on your library](#test-models-on-your-library)).

In October 2026, 15 models on OpenCode Go did the same seven tasks on that library. Library tasks: tag 20 items, and import two works, one of them already in the library. Research tasks: a literature note, a synthesis of 15 items, a search for recent work, and a literature review with `/lit`. The research notes were judged blind (the judge saw codes, not names), from 1 to 5. Every library change was recorded and blocked.

The table is in the order of the research score, but differences under 0.3 are within the variation between runs of the same model.

| Model | Research (1 to 5) | Tagging F1 | Import | Invented references | Cost, all 7 tasks |
|---|---|---|---|---|---|
| kimi-k3 | 5.0 | 0.68 | both | 0 | $2.37 |
| qwen3.8-flash | 4.9 | 0.71 | both | 0 | $0.13 |
| mimo-v2.6-pro (default, Researcher) | 4.8 | 0.66 | both | 0 | $0.16 |
| mimo-v2.6-flash (default, Librarian) | 4.5 | 0.69 | both | 0 | $0.07 |
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
- mimo-v2.6-pro is the Researcher's default. qwen3.8-flash scored a little higher in this test at lower cost, so both were tested three more times: see [The defaults, tested again](#the-defaults-tested-again). kimi-k3 wrote the best notes at about 15 times the cost.
- mimo-v2.6-flash is the Librarian's default: both imports right, the lowest cost, and in September its tagging matched the best. glm-5.3-flash, the Librarian's default until now, missed an identifier in the import in two tests in a row.
- An invented reference is a citekey that is not in the library, or a DOI or PMID that no search returned. One test per model is a small sample: treat differences under 0.3 as noise.

`subsub init` offers mimo-v2.6-flash for the Librarian and mimo-v2.6-pro for the Researcher when you use OpenCode Go.

## The defaults, tested again

In the first test, qwen3.8-flash scored a little higher than mimo-v2.6-pro and cost less. One run per task is a small sample, so the candidates for each mode did the same tasks three more times. A blind judge then scored all four runs of each model on one scale (the October notes too, so these numbers differ slightly from the table above).

| Researcher | mimo-v2.6-pro | qwen3.8-flash |
|---|---|---|
| Research, mean of 16 notes (lowest to highest) | 4.34 (3 to 5) | 4.31 (3.5 to 5) |
| Literature note | 4.0 | 4.25 |
| Synthesis | 3.75 | 4.0 |
| Search | 4.75 | 4.25 |
| Literature review (`/lit`) | 4.88 | 4.75 |
| Invented references | 1 | 1 |
| Tool calls refused for wrong arguments | 1 of 288 | 14 of 285 |
| Cost per task | $0.032 | $0.025 |
| Minutes per task | 4.7 | 3.4 |

| Librarian | mimo-v2.6-flash | qwen3.8-flash |
|---|---|---|
| Tagging F1, four runs | 0.69 to 0.74 | 0.70 to 0.72 |
| Imports right | 4 of 4 | 4 of 4 |
| Tool calls refused for wrong arguments | 0 | 4 (all on a tool that exists only in the test) |
| Cost per task | $0.003 | $0.007 |

What this shows:

- The research quality is the same. The difference, 0.03, is much smaller than the spread between runs of the same model (up to 1.5 points).
- qwen3.8-flash is about a quarter cheaper and faster as the Researcher. But in every `/lit` it sent the reference check arguments that the tool does not accept: it guessed field names, up to seven times, before it got through. It always got through, and the cost above includes the retries. mimo-v2.6-pro got the arguments right the first time.
- As the Librarian, qwen3.8-flash costs twice as much as mimo-v2.6-flash for the same tags and imports.

So the defaults stay: mimo-v2.6-flash for the Librarian, mimo-v2.6-pro for the Researcher. A model that guesses arguments is a risk with tools that are used less often. If you want a lower cost for research, qwen3.8-flash is a good choice: select it with the model button in the Researcher.

## Where your data goes

The model provider receives your messages and what the tools return: titles, abstracts, tags, and passages of full texts. Where the provider processes them matters under the GDPR, and for unpublished work.

| Provider | Where the data is processed |
|---|---|
| Mistral | The European Union |
| OpenAI, Anthropic, Google | Outside the EU, mostly in the United States, under each provider's terms for EU users |
| DeepSeek | China |
| OpenCode Go, OpenRouter | It depends on the model: each model runs at another company, in the United States, China or elsewhere |

The tested defaults (mimo on OpenCode Go) are cheap and do well, but they do not keep your data in the EU. For material that should stay in the EU, use Mistral. The model dialog shows this line for each provider when you connect it.

In October 2026, three Mistral models did the same six tasks as the others, on the same library, and an AI judge scored the research notes blind, next to the default and the free Google model:

| Model | Research (1 to 5) | Invented references | Tagging F1 | Import | Cost, 6 tasks |
|---|---|---|---|---|---|
| mimo-v2.6-pro (default, for comparison) | 4.6 | 0 | 0.66 | both | $0.16 |
| mistral-medium-3.5 | 4.0 | 0 | 0.65 | both | $1.07 |
| mistral-large-2512 | 2.6 | 9 | 0.65 | both | $0.38 |
| mistral-small-2603 | 2.4 | 6 | 0.59 | both | $0.05 |
| gemini-3.1-flash-lite (free) | 2.5 | 0 | 0.63 | both | free |

- mistral-medium-3.5 is the EU choice for both modes: every note written, no invented references, and the synthesis read all 15 full texts. It costs about six times as much as the default, about 18 cents a task.
- mistral-large-2512 wrote a note on the wrong paper when a lookup failed, and gave citekeys that do not exist. mistral-small-2603 wrote no synthesis and numbered references that were not in its list.
- The free Google model is good enough to try the library tasks. Its research notes are thin: it read little of the full texts and said it had read more. Use a paid model for research you rely on.

`subsub init` offers it: in Models, choose "Mistral, servers in the EU". Get a key at [console.mistral.ai](https://console.mistral.ai/api-keys).

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --models a,b`. A name without a provider is an OpenCode Go model; for another provider, write provider/model, for example `mistral/mistral-small-2603`. To test different models for each group of tasks, type `subsub-bench run --librarian a,b --researcher c,d`: the Librarian models do the library tasks and the Researcher models do the research tasks.
4. Type `subsub-bench score`.
