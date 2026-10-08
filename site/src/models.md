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
- In our test (October 2026), `gemini-3.1-flash-lite` tagged with F1 {{ modeltest.eu.models['gemini-3.1-flash-lite'].f1 | num(2) }} and imported correctly. Its research notes were thin ({{ modeltest.eu.models['gemini-3.1-flash-lite'].research | num(1) }} of 5, see [Where your data goes](#where-your-data-goes)): fine for trying Sub-Sub, not for research you rely on. The newer `gemini-3.5-flash-lite` tagged as well, but Google often refused it for "high demand"; `gemini-3.8-flash` did not finish a task on the free tier. The Librarian's default on OpenCode Go tags better (F1 {{ modeltest.librarian.models[facts.defaults.librarian].f1_low | num(2) }} to {{ modeltest.librarian.models[facts.defaults.librarian].f1_high | num(2) }} in four runs) and have no daily limit, for a few cents a task.

OpenRouter also has free models: their names end in `:free`. They allow 50 requests a day (1000 after you buy 10 dollars of credit), and the providers of some of them may keep your prompts. In our test they were less reliable than the Google free tier: `gemma-4-31b-it:free` refused every request (rate limit), and `nemotron-3-ultra-550b-a55b:free` was often overloaded, tagged with F1 0.58 and did not finish a literature note.

## Tested models

Read these tests for what they can tell you. They ran on one library: about 1000 items in medicine and health informatics, owned by Sub-Sub's author. The tag scores compare with the tags that its owner approved. An AI model judged the research notes, blind to the names of the models; no person has yet checked its scores against their own (see [How the figures are made](#how-the-figures-are-made)). Most models ran once per task. So the tests show which models work well with Sub-Sub's tools and which do not; they do not rank the models that work. In another field, or with another library, the order can change. Most of the models below are adequate; choose among them by cost, by where your data goes (see [Where your data goes](#where-your-data-goes)) and by a test on your own library ([Test models on your library](#test-models-on-your-library)).

In October 2026, 15 models on OpenCode Go did the same seven tasks on that library. Library tasks: tag 20 items, fix the items that have no topic or status tag, and import two works, one of them already in the library. Research tasks: a literature note, a synthesis of 15 items, a search for recent work, and a literature review with `/lit`. The research notes were judged blind (the judge saw codes, not names), from 1 to 5. Every library change was recorded and blocked.

The table is in the order of the research score, but differences under 0.3 are within the variation between runs of the same model.

{% set t = modeltest.october -%}
| Model | Research (1 to 5) | Tagging F1 | Import | Invented references | Cost, all 7 tasks |
|---|---|---|---|---|---|
{% for name in t.order %}{% set m = t.models[name] %}{% if m.works %}| {{ name }}{{ " (default, Researcher)" if name == facts.defaults.researcher }}{{ " (default, Librarian)" if name == facts.defaults.librarian }} | {{ m.research | num(1) }} | {{ m.f1 | num(2) }} | {{ {"right": "right", "asked": "right, asked first", "one": "one of two", "none": "none"}[m.import] }} | {{ m.invented_refs }} | ${{ m.cost | num(2) }} |
{% else %}| {{ name }} | does not work with pi | | | | |
{% endif %}{% endfor %}
How to read the table:

- Tagging is close for all models (F1 {{ t.f1_low | num(2) }} to {{ t.f1_high | num(2) }} against the tags already in the library, which its owner had approved in tag reviews). The models differ in the research notes.
- Every model that works imported correctly: it sent the new work and reported the one already in the library. "Asked first" means the model showed the preview and asked before it applied the import, so you answer once more.
- {{ facts.defaults.researcher }} is the Researcher's default. qwen3.8-flash scored a little higher in this test at lower cost, so both were tested three more times: see [The defaults, tested again](#the-defaults-tested-again). kimi-k3 wrote the best notes at about 15 times the cost.
- {{ facts.defaults.librarian }} is the Librarian's default: the import right, the lowest cost, and in September its tagging matched the best.
- An invented reference is a citekey that is not in the library, or a DOI or PMID that no search returned. One test per model is a small sample: treat differences under 0.3 as noise.

`subsub init` offers {{ facts.defaults.librarian }} for the Librarian and {{ facts.defaults.researcher }} for the Researcher when you use OpenCode Go.

## The defaults, tested again

In the first test, qwen3.8-flash scored a little higher than mimo-v2.6-pro and cost less. One run per task is a small sample, so the candidates for each mode did the same tasks three more times. A blind judge then scored all four runs of each model on one scale (the October notes too, so these numbers differ slightly from the table above).

{% set a = modeltest.researcher.models["mimo-v2.6-pro"] -%}
{% set b = modeltest.researcher.models["qwen3.8-flash"] -%}
| Researcher | mimo-v2.6-pro | qwen3.8-flash |
|---|---|---|
| Research, mean of {{ a.research_notes }} notes (lowest to highest) | {{ a.research | num(2) }} ({{ a.research_low }} to {{ a.research_high }}) | {{ b.research | num(2) }} ({{ b.research_low }} to {{ b.research_high }}) |
| Literature note | {{ a.research_by_task.lit_note }} | {{ b.research_by_task.lit_note }} |
| Synthesis | {{ a.research_by_task.synthesis }} | {{ b.research_by_task.synthesis }} |
| Search | {{ a.research_by_task.search }} | {{ b.research_by_task.search }} |
| Literature review (`/lit`) | {{ a.research_by_task.lit }} | {{ b.research_by_task.lit }} |
| Invented references | {{ a.invented_refs }} | {{ b.invented_refs }} |
| Tool calls refused for wrong arguments | {{ a.refused_calls }} of {{ a.tool_calls }} | {{ b.refused_calls }} of {{ b.tool_calls }} |
| Cost per task | ${{ a.cost_per_task | num(3) }} | ${{ b.cost_per_task | num(3) }} |
| Minutes per task | {{ a.minutes_per_task | num(1) }} | {{ b.minutes_per_task | num(1) }} |

{% set c = modeltest.librarian.models["mimo-v2.6-flash"] -%}
{% set d = modeltest.librarian.models["qwen3.8-flash"] -%}
| Librarian | mimo-v2.6-flash | qwen3.8-flash |
|---|---|---|
| Tagging F1, four runs | {{ c.f1_low | num(2) }} to {{ c.f1_high | num(2) }} | {{ d.f1_low | num(2) }} to {{ d.f1_high | num(2) }} |
| Imports right | {{ c.imports_right }} of {{ c.imports }} | {{ d.imports_right }} of {{ d.imports }}{{ " (" + d.imports_asked + " asked first)" if d.imports_asked }} |
| Tool calls refused for wrong arguments | {{ c.refused_calls }} | {{ d.refused_calls }} (all on a tool that exists only in the test) |
| Cost per task | ${{ c.cost_per_task | num(3) }} | ${{ d.cost_per_task | num(3) }} |

What this shows:

- The research quality is the same. The difference, {{ (a.research - b.research) | abs | num(2) }}, is much smaller than the spread between runs of the same model (up to 1.5 points).
- qwen3.8-flash is about a quarter cheaper and faster as the Researcher. But in every `/lit` it sent the reference check arguments that the tool does not accept: it guessed field names, up to seven times, before it got through. It always got through, and the cost above includes the retries. mimo-v2.6-pro got the arguments right the first time.
- As the Librarian, qwen3.8-flash costs about twice as much as mimo-v2.6-flash for the same tags and imports.

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

{% set t = modeltest.eu -%}
| Model | Research (1 to 5) | Invented references | Tagging F1 | Import | Cost, 6 tasks |
|---|---|---|---|---|---|
{% for name in t.order %}{% set m = t.models[name] %}| {{ name }}{{ " (default, for comparison)" if name == facts.defaults.researcher }}{{ " (free)" if m.free }} | {{ m.research | num(1) }} | {{ m.invented_refs }} | {{ m.f1 | num(2) }} | {{ "right" if m.import == "right" or m.import == "asked" else m.import }} | {{ "free" if m.free else "$" + (m.cost | num(2)) }} |
{% endfor %}
- mistral-medium-3.5 is the EU choice for both modes: every note written, no invented references, and the synthesis read all 15 full texts. It costs about {{ (modeltest.eu.models['mistral-medium-3.5'].cost_per_task / modeltest.eu.models[facts.defaults.researcher].cost_per_task) | round }} times as much as the default, about {{ facts.euTaskCents }} cents a task.
- mistral-large-2512 wrote a note on the wrong paper when a lookup failed, and gave citekeys that do not exist. mistral-small-2603 wrote no synthesis and numbered references that were not in its list.
- The free Google model is good enough to try the library tasks. Its research notes are thin: it read little of the full texts and said it had read more. Use a paid model for research you rely on.

`subsub init` offers it: in Models, choose "Mistral, servers in the EU". Get a key at [console.mistral.ai](https://console.mistral.ai/api-keys).

## How the figures are made

Every figure in the tables above comes from the published results in the repository, in [bench-results]({{ site.repo }}/tree/main/bench-results): the scores of each run (`results.json`), the blind judgements with the judge's reasons (`judging/`), and the list of tests this page reports (`published.json`). `subsub-bench summary` computes the tables from those files, and a test stops a release when the page and the files differ. The run logs stay private: they hold passages of the full texts.

The research scores come from one AI judge. To check it, two people will score a sample of the same notes blind (`subsub-bench sheet`), and `subsub-bench agreement` will compare their scores with the judge's. Until then, read the research scores as one careful reader's opinion, not a measurement.

Corrections. On 8 October 2026 we found two errors in our scorer. Neither changed a default. The tag scores on this page were right, but the scorer kept in the repository compared the models' tags with the reference for another set of items. It now scores the items each model was given. The import scorer counted only imports that a model applied. A model that previewed the import and asked first, or that left out the work already in the library, was counted wrong. This page had said that glm-5.3-flash missed an identifier, and that longcat-2.0 and mimo-v2.5-pro imported nothing. All three imported correctly.

## Local models

pi can use a local model through Ollama or another server with an OpenAI-compatible API (a custom provider in pi's `models.json`). Your text then stays on your computer. Small local models often make mistakes with tool calls, so test one before you rely on it.

## Test models on your library

`subsub-bench` runs the same tasks for several models against your own library. Every library change is recorded and blocked, so nothing changes. The results show tag accuracy, invented references, tokens, cost and time.

1. Start Zotero.
2. Type `subsub-bench prepare`.
3. Type `subsub-bench run --models a,b`. A name without a provider is an OpenCode Go model; for another provider, write provider/model, for example `mistral/mistral-small-2603`. To test different models for each group of tasks, type `subsub-bench run --librarian a,b --researcher c,d`: the Librarian models do the library tasks and the Researcher models do the research tasks.
4. Type `subsub-bench score`.
