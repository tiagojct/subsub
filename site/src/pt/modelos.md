---
layout: base.njk
title: Modelos
lang: pt-PT
alt: /models/
eyebrow: Traga o seu
lead: O Sub-Sub funciona com qualquer fornecedor de modelos que o pi suporte. Precisa de uma conta sua; o Sub-Sub não inclui um modelo.
---

## Qual escolher

| Quer | Escolha | Custo |
|---|---|---|
| Experimentar o Sub-Sub | Google, `{{ facts.freeModel }}`, com uma chave gratuita ([como](#usar-o-sub-sub-sem-pagar)) | Grátis, com limites por minuto e por dia |
| Usá-lo com regularidade | [OpenCode Go]({{ facts.opencodeGo.url }}), com os modelos predefinidos testados (o `subsub init` define-os) | Uma assinatura: cerca de {{ facts.opencodeGo.monthly }} dólares por mês, {{ facts.opencodeGo.firstMonth }} no primeiro mês. Os modelos predefinidos gastam cerca de {{ facts.defaultTaskCents }} cêntimos por tarefa. |
| Manter os seus dados na UE | Mistral, `{{ facts.euModel }}` ([detalhes](#para-onde-vao-os-seus-dados)) | Paga o que usa: cerca de {{ facts.euTaskCents }} cêntimos por tarefa |

Preços e planos confirmados em {{ facts.checked | monthYear("pt") }}. Confirme a página do fornecedor antes de pagar. Se não tiver a certeza, comece com a chave gratuita da Google. Pode mudar depois com o botão do modelo; a sua biblioteca e as suas notas não mudam. O resto desta página explica como os testes foram feitos.

## Ligar um fornecedor

No navegador:

1. Abra o Sub-Sub (o atalho, ou `subsub web`).
2. Selecione o botão do modelo, no topo. Escolha o fornecedor, cole a chave de API e selecione Save.
3. Selecione um modelo na lista.

No terminal:

1. Escreva `subsub`.
2. Escreva `/login` e selecione o fornecedor: por exemplo OpenCode Go, OpenRouter, Anthropic, OpenAI ou Google.
3. Escreva `/model` para selecionar um modelo.

Cada modo pode ter o seu próprio modelo. O botão do modelo guarda o modelo para o modo atual; selecione "Use it in both modes" para definir o mesmo modelo para o Bibliotecário e para o Investigador. No terminal, `/model` muda o modelo apenas para a conversa aberta; o `subsub init` ou o ficheiro de definições define-o para um modo. Para definir os modelos no ficheiro de definições `~/.config/subsub/config.json`:

```json
{
  "models": {
    "librarian": "opencode-go/mimo-v2.6-flash",
    "researcher": "opencode-go/mimo-v2.6-pro"
  }
}
```

A versão 0.10 usava um só modelo para todo o trabalho (`"model"`). Essa definição ainda funciona: o Sub-Sub usa esse modelo nos dois modos.

## Usar o Sub-Sub sem pagar

Para experimentar o Sub-Sub, ou para um uso ligeiro, basta uma chave gratuita da Google.

1. Abra [aistudio.google.com/apikey](https://aistudio.google.com/apikey) e entre com uma conta Google. Tem de ter 18 anos ou mais.
2. Selecione "Create API key" e copie a chave. A Google não pede cartão.
3. No Sub-Sub, selecione o botão do modelo. Escolha Google Gemini, cole a chave e selecione Save.
4. Selecione `google/gemini-3.1-flash-lite`. A lista de modelos marca-o como "tested, free" (testado, grátis).

O `subsub init` faz o mesmo: em Models, escolha "Free, to try Sub-Sub". Define o `gemini-3.1-flash-lite` para os dois modos e pede a chave.

Conheça os limites antes de depender dele:

- O nível gratuito limita a quantidade de texto que pode enviar por minuto e o número de pedidos que pode fazer por dia. As tarefas longas atingem primeiro o limite por minuto, por exemplo uma nota de literatura a partir de um texto completo, ou uma síntese de muitos itens. Quando isso acontece, o Sub-Sub avisa: espere um minuto e peça-lhe para continuar. O limite diário é reposto à meia-noite, hora do Pacífico.
- Quando muitas pessoas usam um modelo, a Google recusa por vezes os pedidos durante alguns minutos ("high demand"). Tente de novo mais tarde.
- Na União Europeia, no Reino Unido e na Suíça, a Google não usa os pedidos do nível gratuito para melhorar os seus produtos. Noutros países pode usá-los, por isso não envie trabalho não publicado através de uma chave gratuita nesses países.
- No nosso teste (outubro de 2026), o `gemini-3.1-flash-lite` atribuiu etiquetas com F1 {{ modeltest.eu.models['gemini-3.1-flash-lite'].f1 | num(2) }} e importou corretamente. As suas notas de investigação foram pobres ({{ modeltest.eu.models['gemini-3.1-flash-lite'].research | num(1) }} em 5, veja [Para onde vão os seus dados](#para-onde-vao-os-seus-dados)): servem para experimentar o Sub-Sub, não para investigação em que precise de confiar. O mais recente `gemini-3.5-flash-lite` também atribuiu bem as etiquetas, mas a Google recusou-o muitas vezes por "high demand"; o `gemini-3.8-flash` não terminou nenhuma tarefa no nível gratuito. O modelo predefinido do Bibliotecário no OpenCode Go atribui melhor as etiquetas (F1 {{ modeltest.librarian.models[facts.defaults.librarian].f1_low | num(2) }} a {{ modeltest.librarian.models[facts.defaults.librarian].f1_high | num(2) }} em quatro execuções) e não têm limite diário, por alguns cêntimos por tarefa.

O OpenRouter também tem modelos gratuitos: os nomes terminam em `:free`. Permitem 50 pedidos por dia (1000 depois de comprar 10 dólares de crédito), e os fornecedores de alguns deles podem guardar os seus pedidos. No nosso teste foram menos fiáveis do que o nível gratuito da Google: o `gemma-4-31b-it:free` recusou todos os pedidos (limite de pedidos), e o `nemotron-3-ultra-550b-a55b:free` esteve muitas vezes sobrecarregado, atribuiu etiquetas com F1 0.58 e não terminou uma nota de literatura.

## Modelos testados

Leia estes testes pelo que podem dizer. Correram numa só biblioteca: cerca de 1000 itens de medicina e informática da saúde, do autor do Sub-Sub. As pontuações das etiquetas comparam com as etiquetas que o seu dono aprovou. Um modelo de IA avaliou as notas de investigação às cegas, sem ver os nomes dos modelos; ninguém comparou ainda as suas pontuações com as de pessoas (veja [Como são feitos os números](#como-sao-feitos-os-numeros)). A maioria dos modelos correu uma vez por tarefa. Por isso, os testes mostram que modelos funcionam bem com as ferramentas do Sub-Sub e quais não funcionam; não ordenam os modelos que funcionam. Noutra área, ou com outra biblioteca, a ordem pode mudar. A maioria dos modelos abaixo é adequada; escolha entre eles pelo custo, pelo destino dos seus dados (veja [Para onde vão os seus dados](#para-onde-vao-os-seus-dados)) e por um teste na sua própria biblioteca ([Testar modelos na sua biblioteca](#testar-modelos-na-sua-biblioteca)).

Em outubro de 2026, 15 modelos do OpenCode Go fizeram as mesmas sete tarefas nessa biblioteca. Tarefas de biblioteca: atribuir etiquetas a 20 itens, corrigir os itens sem etiqueta de tema ou de estado, e importar duas obras, uma delas já presente na biblioteca. Tarefas de investigação: uma nota de literatura, uma síntese de 15 itens, uma pesquisa de trabalhos recentes, e uma revisão da literatura com `/lit`. As notas de investigação foram avaliadas às cegas (o juiz viu códigos, não nomes), de 1 a 5. Cada alteração à biblioteca foi registada e bloqueada.

A tabela segue a ordem da pontuação de investigação, mas as diferenças inferiores a 0.3 estão dentro da variação entre execuções do mesmo modelo.

{% set t = modeltest.october -%}
| Modelo | Investigação (1 a 5) | F1 das etiquetas | Importação | Referências inventadas | Custo, as 7 tarefas |
|---|---|---|---|---|---|
{% for name in t.order %}{% set m = t.models[name] %}{% if m.works %}| {{ name }}{{ " (predefinido, Investigador)" if name == facts.defaults.researcher }}{{ " (predefinido, Bibliotecário)" if name == facts.defaults.librarian }} | {{ m.research | num(1) }} | {{ m.f1 | num(2) }} | {{ {"right": "certa", "asked": "certa, perguntou antes", "one": "uma de duas", "none": "nenhuma"}[m.import] }} | {{ m.invented_refs }} | ${{ m.cost | num(2) }} |
{% else %}| {{ name }} | não funciona com o pi | | | | |
{% endif %}{% endfor %}
Como ler a tabela:

- As etiquetas ficam próximas em todos os modelos (F1 {{ t.f1_low | num(2) }} a {{ t.f1_high | num(2) }} face às etiquetas que já estavam na biblioteca, que o seu dono tinha aprovado em revisões de etiquetas). Os modelos diferem nas notas de investigação.
- Todos os modelos que funcionam importaram corretamente: enviaram a obra nova e indicaram a que já estava na biblioteca. "Perguntou antes" quer dizer que o modelo mostrou a pré-visualização e perguntou antes de aplicar a importação, por isso responde mais uma vez.
- O {{ facts.defaults.researcher }} é o modelo predefinido do Investigador. O qwen3.8-flash teve uma pontuação um pouco mais alta neste teste, com um custo menor, por isso os dois foram testados mais três vezes: veja [Os modelos predefinidos, testados de novo](#os-modelos-predefinidos-testados-de-novo). O kimi-k3 escreveu as melhores notas, por cerca de 15 vezes o custo.
- O {{ facts.defaults.librarian }} é o modelo predefinido do Bibliotecário: a importação certa, o custo mais baixo, e em setembro as suas etiquetas igualaram as melhores.
- Uma referência inventada é uma citekey que não está na biblioteca, ou um DOI ou PMID que nenhuma pesquisa devolveu. Um teste por modelo é uma amostra pequena: trate as diferenças inferiores a 0.3 como ruído.

Quando usa o OpenCode Go, o `subsub init` propõe o {{ facts.defaults.librarian }} para o Bibliotecário e o {{ facts.defaults.researcher }} para o Investigador.

## Os modelos predefinidos, testados de novo

No primeiro teste, o qwen3.8-flash teve uma pontuação um pouco mais alta do que o mimo-v2.6-pro e custou menos. Uma execução por tarefa é uma amostra pequena, por isso os candidatos de cada modo fizeram as mesmas tarefas mais três vezes. Depois, um juiz às cegas avaliou as quatro execuções de cada modelo na mesma escala (incluindo as notas de outubro, por isso estes números diferem um pouco dos da tabela acima).

{% set a = modeltest.researcher.models["mimo-v2.6-pro"] -%}
{% set b = modeltest.researcher.models["qwen3.8-flash"] -%}
| Investigador | mimo-v2.6-pro | qwen3.8-flash |
|---|---|---|
| Investigação, média de {{ a.research_notes }} notas (mínimo a máximo) | {{ a.research | num(2) }} ({{ a.research_low }} a {{ a.research_high }}) | {{ b.research | num(2) }} ({{ b.research_low }} a {{ b.research_high }}) |
| Nota de literatura | {{ a.research_by_task.lit_note }} | {{ b.research_by_task.lit_note }} |
| Síntese | {{ a.research_by_task.synthesis }} | {{ b.research_by_task.synthesis }} |
| Pesquisa | {{ a.research_by_task.search }} | {{ b.research_by_task.search }} |
| Revisão da literatura (`/lit`) | {{ a.research_by_task.lit }} | {{ b.research_by_task.lit }} |
| Referências inventadas | {{ a.invented_refs }} | {{ b.invented_refs }} |
| Chamadas a ferramentas recusadas por argumentos errados | {{ a.refused_calls }} de {{ a.tool_calls }} | {{ b.refused_calls }} de {{ b.tool_calls }} |
| Custo por tarefa | ${{ a.cost_per_task | num(3) }} | ${{ b.cost_per_task | num(3) }} |
| Minutos por tarefa | {{ a.minutes_per_task | num(1) }} | {{ b.minutes_per_task | num(1) }} |

{% set c = modeltest.librarian.models["mimo-v2.6-flash"] -%}
{% set d = modeltest.librarian.models["qwen3.8-flash"] -%}
| Bibliotecário | mimo-v2.6-flash | qwen3.8-flash |
|---|---|---|
| F1 das etiquetas, quatro execuções | {{ c.f1_low | num(2) }} a {{ c.f1_high | num(2) }} | {{ d.f1_low | num(2) }} a {{ d.f1_high | num(2) }} |
| Importações certas | {{ c.imports_right }} de {{ c.imports }} | {{ d.imports_right }} de {{ d.imports }}{{ " (" + d.imports_asked + " perguntou antes)" if d.imports_asked }} |
| Chamadas a ferramentas recusadas por argumentos errados | {{ c.refused_calls }} | {{ d.refused_calls }} (todas numa ferramenta que só existe no teste) |
| Custo por tarefa | ${{ c.cost_per_task | num(3) }} | ${{ d.cost_per_task | num(3) }} |

O que isto mostra:

- A qualidade da investigação é a mesma. A diferença, {{ (a.research - b.research) | abs | num(2) }}, é muito menor do que a variação entre execuções do mesmo modelo (até 1.5 pontos).
- Como Investigador, o qwen3.8-flash é cerca de um quarto mais barato e mais rápido. Mas em todos os `/lit` enviou à verificação de referências argumentos que a ferramenta não aceita: adivinhou nomes de campos, até sete vezes, antes de conseguir passar. Conseguiu sempre, e o custo acima inclui as novas tentativas. O mimo-v2.6-pro acertou nos argumentos à primeira.
- Como Bibliotecário, o qwen3.8-flash custa cerca do dobro do mimo-v2.6-flash pelas mesmas etiquetas e importações.

Por isso, os modelos predefinidos mantêm-se: o mimo-v2.6-flash para o Bibliotecário e o mimo-v2.6-pro para o Investigador. Um modelo que adivinha argumentos é um risco com as ferramentas menos usadas. Se quiser um custo mais baixo na investigação, o qwen3.8-flash é uma boa escolha: selecione-o com o botão do modelo no modo Investigador.

## Para onde vão os seus dados

O fornecedor do modelo recebe as suas mensagens e o que as ferramentas devolvem: títulos, resumos, etiquetas e passagens de textos completos. O local onde o fornecedor os processa tem importância perante o RGPD e para o trabalho não publicado.

| Fornecedor | Onde os dados são processados |
|---|---|
| Mistral | Na União Europeia |
| OpenAI, Anthropic, Google | Fora da UE, sobretudo nos Estados Unidos, nos termos de cada fornecedor para os utilizadores da UE |
| DeepSeek | Na China |
| OpenCode Go, OpenRouter | Depende do modelo: cada modelo corre noutra empresa, nos Estados Unidos, na China ou noutro país |

Os modelos predefinidos testados (mimo no OpenCode Go) são baratos e têm bons resultados, mas não mantêm os seus dados na UE. Para material que deve ficar na UE, use a Mistral. A janela do modelo mostra esta linha para cada fornecedor quando o liga.

Em outubro de 2026, três modelos da Mistral fizeram as mesmas seis tarefas que os outros, na mesma biblioteca, e um modelo de IA como juiz avaliou às cegas as notas de investigação, ao lado do modelo predefinido e do modelo gratuito da Google:

{% set t = modeltest.eu -%}
| Modelo | Investigação (1 a 5) | Referências inventadas | F1 das etiquetas | Importação | Custo, 6 tarefas |
|---|---|---|---|---|---|
{% for name in t.order %}{% set m = t.models[name] %}| {{ name }}{{ " (predefinido, para comparação)" if name == facts.defaults.researcher }}{{ " (grátis)" if m.free }} | {{ m.research | num(1) }} | {{ m.invented_refs }} | {{ m.f1 | num(2) }} | {{ "certa" if m.import == "right" or m.import == "asked" else m.import }} | {{ "grátis" if m.free else "$" + (m.cost | num(2)) }} |
{% endfor %}
- O mistral-medium-3.5 é a escolha da UE para os dois modos: escreveu todas as notas, sem referências inventadas, e a síntese leu os 15 textos completos. Custa cerca de {{ (modeltest.eu.models['mistral-medium-3.5'].cost_per_task / modeltest.eu.models[facts.defaults.researcher].cost_per_task) | round }} vezes mais do que o modelo predefinido, cerca de {{ facts.euTaskCents }} cêntimos por tarefa.
- O mistral-large-2512 escreveu uma nota sobre o artigo errado quando uma consulta falhou, e deu citekeys que não existem. O mistral-small-2603 não escreveu a síntese e numerou referências que não estavam na sua lista.
- O modelo gratuito da Google chega para experimentar as tarefas de biblioteca. As suas notas de investigação são pobres: leu pouco dos textos completos e disse que tinha lido mais. Use um modelo pago para investigação em que precise de confiar.

O `subsub init` propõe-no: em Models, escolha "Mistral, servers in the EU". Obtenha uma chave em [console.mistral.ai](https://console.mistral.ai/api-keys).

## Como são feitos os números

Todos os números das tabelas acima vêm dos resultados publicados no repositório, em [bench-results]({{ site.repo }}/tree/main/bench-results): as pontuações de cada execução (`results.json`), as avaliações às cegas com as razões do juiz (`judging/`) e a lista dos testes que esta página apresenta (`published.json`). O `subsub-bench summary` calcula as tabelas a partir desses ficheiros, e um teste impede uma nova versão quando a página e os ficheiros diferem. Os registos das execuções ficam privados: contêm passagens dos textos completos.

As pontuações de investigação vêm de um só juiz de IA. Para o verificar, duas pessoas vão avaliar às cegas uma amostra das mesmas notas (`subsub-bench sheet`), e o `subsub-bench agreement` vai comparar as suas pontuações com as do juiz. Até lá, leia as pontuações de investigação como a opinião de um leitor cuidadoso, não como uma medição.

Correções. A 8 de outubro de 2026 encontrámos dois erros no nosso avaliador automático. Nenhum mudou um modelo predefinido. As pontuações das etiquetas desta página estavam certas, mas o avaliador guardado no repositório comparava as etiquetas dos modelos com a referência de outro conjunto de itens. Agora avalia os itens que cada modelo recebeu. O avaliador das importações só contava as importações que o modelo aplicou. Um modelo que mostrou a pré-visualização e perguntou antes, ou que deixou de fora a obra já presente na biblioteca, contava como errado. Esta página dizia que o glm-5.3-flash falhou um identificador e que o longcat-2.0 e o mimo-v2.5-pro não importaram nada. Os três importaram corretamente.

## Modelos locais

O pi pode usar um modelo local através do Ollama ou de outro servidor com uma API compatível com a da OpenAI (um fornecedor personalizado no `models.json` do pi). Assim, o seu texto fica no seu computador. Os modelos locais pequenos erram muitas vezes nas chamadas a ferramentas, por isso teste um antes de depender dele.

## Testar modelos na sua biblioteca

O `subsub-bench` corre as mesmas tarefas com vários modelos na sua própria biblioteca. Cada alteração à biblioteca é registada e bloqueada, por isso nada muda. Os resultados mostram a exatidão das etiquetas, as referências inventadas, os tokens, o custo e o tempo.

1. Abra o Zotero.
2. Escreva `subsub-bench prepare`.
3. Escreva `subsub-bench run --models a,b`. Um nome sem fornecedor é um modelo do OpenCode Go; para outro fornecedor, escreva fornecedor/modelo, por exemplo `mistral/mistral-small-2603`. Para testar modelos diferentes em cada grupo de tarefas, escreva `subsub-bench run --librarian a,b --researcher c,d`: os modelos do Bibliotecário fazem as tarefas de biblioteca e os modelos do Investigador fazem as tarefas de investigação.
4. Escreva `subsub-bench score`.
