---
layout: base.njk
title: Para estudantes
lang: pt-PT
alt: /students/
eyebrow: Novo no Zotero ou em ferramentas de IA
description: O que é o Sub-Sub para um estudante, o que não faz, como começar sem pagar e as palavras que vai encontrar.
lead: O Sub-Sub ajuda a encontrar, organizar e ler artigos. Não escreve os seus trabalhos. Pode experimentá-lo sem pagar.
---

In English: [For students](/students/).

## O que é, em palavras simples

Guarda os seus artigos no Zotero, um gestor de referências gratuito. O Sub-Sub é um assistente que trabalha com essa coleção. Pede-lhe as coisas em linguagem corrente, por exemplo "o que tenho sobre asma em crianças?" ou "procura ensaios recentes sobre espirometria em casa". Responde a partir dos seus artigos, procura na PubMed os artigos que não tem e acrescenta ao Zotero os que escolher. Cada nota que escreve diz o que leu: o artigo completo, só o resumo, ou só o título e os autores.

O Sub-Sub abre no navegador, como um site, mas corre no seu computador. Fala português e inglês: escolha a língua na configuração.

## O que não faz

- Não escreve os seus trabalhos nem a sua tese. Os estudantes começam no perfil Reader (leitor): o Sub-Sub dá-lhe citações com o número da página e perguntas para responder enquanto lê, e uma lista de leitura para uma revisão da literatura. Não escreve resumos nem conclusões que possa entregar como seus.
- Não substitui a leitura do artigo. Uma nota feita com um modelo gratuito pode ser pobre. Confirme cada citação na página antes de a usar.
- Não muda a sua biblioteca do Zotero sem perguntar. Vê cada alteração antes e escolhe Sim ou Não. Pode anulá-la depois.

As regras do seu curso e da sua faculdade sobre IA aplicam-se ao que entrega, faça o Sub-Sub o que fizer. Se tiver dúvidas, pergunte ao docente antes de o usar num trabalho avaliado. Na FMUP, veja também a secção sobre as regras de uso de IA na página [FMUP](/pt/fmup/#regras-para-o-uso-de-ia), com o Themis, que ajuda a escrever a declaração de uso de IA.

## É para mim?

Ajuda mais quando faz uma revisão da literatura, prepara um seminário ou uma tese, ou guarda mais do que algumas dezenas de artigos. Para uma pergunta rápida sobre um só artigo, um chatbot geral é mais simples.

| | Um chatbot geral | Sub-Sub |
|---|---|---|
| De onde vêm os artigos | O que cola ou carrega | A sua biblioteca do Zotero, e a PubMed, a Europe PMC e o OpenAlex |
| Referências | Pode inventar referências | Cita só obras que encontrou; cada nota diz o que leu |
| A sua biblioteca | Não entra | Importa, etiqueta e arquiva artigos, com a sua aprovação |
| Instalação | Nenhuma | Cerca de 15 minutos, uma vez |
| Custo | Grátis ou assinatura | Grátis para experimentar; cerca de {{ facts.opencodeGo.monthly }} dólares por mês para uso regular |

Uma biblioteca do Zotero vazia não é problema. Depois de instalar o Sub-Sub, escreva `/gaps` e o seu tema. O Sub-Sub encontra artigos sobre ele e importa os que escolher.

## Começar sem pagar

Precisa de um computador com macOS, Windows ou Linux, e de cerca de 15 minutos.

1. Instale o [Zotero](https://www.zotero.org/download/) e abra-o.
2. No Zotero, abra as definições e o separador Avançado. Ligue a opção que permite a outras aplicações deste computador comunicar com o Zotero ("Allow other applications on this computer to communicate with Zotero").
3. Obtenha uma chave gratuita da Google. Abra [aistudio.google.com/apikey](https://aistudio.google.com/apikey), entre com a sua conta e escolha "Create API key". Copie a chave. A Google não pede cartão. Tem de ter 18 anos ou mais.
4. Instale o Sub-Sub com o comando da página [Instalar](/pt/instalar/). Se o comando lhe parecer estranho, leia primeiro [Sobre o comando de instalação](/pt/instalar/#sobre-o-comando-de-instalacao).
5. Responda às perguntas. Quando o Sub-Sub perguntar quem é, escolha "A student". Em Models, escolha "Free, to try Sub-Sub" e cole a chave.
6. O Sub-Sub abre no navegador. Confirme que o topo da página mostra o número de itens da sua biblioteca do Zotero.

Na FMUP ou na Universidade do Porto, escolha a configuração "FMUP / U.Porto". Veja [FMUP](/pt/fmup/).

## Três coisas para experimentar primeiro

1. Escolha Resumo da biblioteca. O Sub-Sub mostra o que tem na biblioteca.
2. Escreva `/lit` e uma pergunta, por exemplo `/lit espirometria em casa em crianças com asma`. Recebe uma lista de leitura: as obras a ler, a ordem em que as deve ler e perguntas para as ler.
3. Escreva `/lit-note` e a citekey de um artigo. Recebe uma nota de leitura: citações com o número da página e uma pergunta debaixo de cada citação.

Depois leia o [Guia](/pt/guia/).

## Quanto custa

- Para experimentar: nada, com a chave da Google acima. O nível gratuito interrompe as tarefas longas ao fim de alguns minutos. Espere um minuto e peça ao Sub-Sub para continuar.
- Para uso regular: uma assinatura do [OpenCode Go]({{ facts.opencodeGo.url }}), cerca de {{ facts.opencodeGo.monthly }} dólares por mês ({{ facts.opencodeGo.firstMonth }} dólares no primeiro mês; preços confirmados em {{ facts.checked | monthYear("pt") }}, por isso confirme as condições atuais no site). Os modelos testados custam cerca de {{ facts.defaultTaskCents }} cêntimos por tarefa, por isso o limite mensal chega bem para um estudante.
- Para material não publicado ou confidencial: a Mistral, com servidores na União Europeia, ou um serviço de modelos da sua instituição. Veja [Para onde vão os seus dados](/pt/modelos/#para-onde-vao-os-seus-dados).

O Sub-Sub é gratuito e de código aberto.

## Quando algo não funciona

Abra um terminal e escreva `subsub doctor`. Cada linha que começa por FIX diz o que fazer. Veja [Ajuda](/pt/ajuda/). Se não resolver, [comunique o problema](https://github.com/tiagojct/subsub/issues) com o resultado de `subsub doctor`.

## Se o Sub-Sub parar

Os seus artigos ficam no Zotero. As suas notas são ficheiros de texto simples (Markdown) numa pasta do seu computador, e qualquer editor de texto as abre. Se o Sub-Sub deixar de ser atualizado, não perde nada. Veja [Sobre](/pt/sobre/#se-o-sub-sub-parar).

## Palavras que vai encontrar

| Palavra | O que quer dizer |
|---|---|
| Zotero | Um programa gratuito que guarda os seus artigos, as referências e os PDF. O Sub-Sub trabalha com ele. |
| Item, item principal (parent item) | Uma referência no Zotero, por exemplo um artigo ou um livro. Um PDF fica anexado ao seu item, o item principal. |
| Citekey | Um nome curto para uma referência, por exemplo `smith2021`. O Sub-Sub usa-o para nomear um artigo numa nota. |
| Modelo | A IA que escreve as respostas. |
| Fornecedor (provider) | A empresa onde o modelo corre, por exemplo a Google. |
| Chave API (API key) | Uma palavra-passe que deixa o Sub-Sub usar a sua conta no fornecedor. Não a partilhe. |
| Etiqueta (tag) | Uma marca num item do Zotero, por exemplo `topic/asthma`. O Sub-Sub só usa as etiquetas da sua lista. |
| Terminal | Uma janela onde se escrevem comandos. Precisa dele uma vez, para instalar. Depois, o Sub-Sub abre a partir do atalho. |
| Markdown | Texto simples com algumas marcas para títulos e listas. As notas do Sub-Sub são ficheiros Markdown. O [Obsidian](https://obsidian.md) mostra-os bem, mas qualquer editor os abre. |
| Perfil | Quanto o Sub-Sub escreve por si. Os estudantes começam no Reader. Veja [Perfis](/pt/perfis/). |
