---
layout: base.njk
title: Modos e comandos
lang: pt-PT
alt: /profiles/
eyebrow: O que faz cada modo
lead: O Sub-Sub tem dois modos. O Investigador tem todos os comandos e ferramentas. O Bibliotecário só gere a biblioteca.
---

O modo define que ferramentas o Sub-Sub pode usar. O Investigador é o modo por omissão: lê a sua biblioteca, pesquisa a literatura, escreve notas e também altera a biblioteca. Use o Bibliotecário para sessões de etiquetagem com um modelo rápido e barato. Cada modo pode ter o seu próprio modelo.

Para mudar de modo, selecione Investigador ou Bibliotecário no topo da vista no navegador. No terminal, escreva `/researcher` ou `/librarian`.

## Investigação

| | Investigador | Bibliotecário |
|---|---|---|
| Leitura guiada de um artigo (`/read`) | sim | |
| Lista de leitura com perguntas para orientar a leitura (`/lit reading list:`) | sim | |
| Notas de literatura e sínteses (`/lit-note`, `/synthesis`) | sim | |
| Revisão da literatura com registo da triagem (`/lit`) | sim | |
| Obras que ainda não tem, novas publicações (`/gaps`, `/alert`) | sim | |
| Comparações e sínteses periódicas (`/compare`, `/digest`) | sim | |
| Verificação das citações e bibliografia de um manuscrito (`/manuscript`) | sim | |
| Revisão de um manuscrito face a uma norma de relato (`/review`) | sim | |
| Verificação de referências com o Starbuck (`/verify`) | sim | |
| Rascunho de email para pedir uma cópia a um autor (`/request-copy`) | sim | |
| Texto redigido para um manuscrito, quando o pede | sim | |

## Biblioteca

| | Investigador | Bibliotecário |
|---|---|---|
| Atribuir etiquetas aos itens, com etiquetas da sua lista de etiquetas (`/tag-batch`, `/clean-tags`) | sim | sim |
| Importar por DOI, PMID ou ISBN (`/import-queue`) | sim | sim |
| Anexar PDF de acesso aberto, acrescentar notas, arquivar itens em coleções, definir citekeys | sim | sim |
| Encontrar duplicados, verificar retratações, verificar etiquetas e metadados | sim | sim |
| Mudar o nome ou remover etiquetas, remover etiquetas automáticas | sim | sim |
| Editar campos, reparar metadados | sim | sim |
| Mover itens para o lixo do Zotero | sim | sim |

`/subsub`, `/history`, `/undo` e `/ai-statement` funcionam nos dois modos. Nos dois modos, cada alteração à biblioteca mostra primeiro uma pré-visualização e só é feita depois de selecionar Sim.

## Ferramentas

O Bibliotecário usa um servidor, o zotero: as ferramentas da biblioteca. O Investigador usa o zotero e o scholar (pesquisas na PubMed, na Europe PMC e no OpenAlex, textos completos, notas e manuscritos). Se ligar o Starbuck, o Investigador usa também o verify, para a verificação de referências. Os dois modos leem e escrevem ficheiros na sua pasta do Sub-Sub. Para um mapa, veja [Como funciona](/pt/como-funciona/).

## O que o Sub-Sub escreve

O Sub-Sub escreve notas de literatura, sínteses e revisões a partir do que leu, com uma fonte para cada afirmação. Cada nota diz o que o Sub-Sub leu: o texto completo, o resumo ou apenas os metadados.

Só redige texto para o seu manuscrito quando o pede. Cita os itens da biblioteca como `[@citekey]`, usa apenas afirmações de fontes que leu e marca o texto redigido para que o possa verificar.

## Aprender a ler a literatura

Dois comandos ajudam a ler os artigos por si. O Sub-Sub encontra as passagens e faz perguntas. A leitura e as respostas ficam a seu cargo.

- `/read [motivo] <citekey>` é uma leitura guiada de um artigo. Selecione porque vai ler o artigo: contexto, um dado, extração ou crítica. O Sub-Sub só lê o que esse motivo exige, cita as passagens com o sítio onde estão e faz perguntas. Numa extração, também acrescenta uma linha para o artigo à sua folha de extração em `Research/`. No navegador, selecione Ler um artigo. Veja [Ler um artigo](/pt/guia/#ler-um-artigo) no guia.
- `/lit reading list: <tema>` pesquisa e faz a triagem como o `/lit`. Depois escreve uma lista de leitura: as obras a ler, a ordem em que as deve ler, o que cada obra estuda (não o que encontrou) e perguntas para ler cada uma. Não apresenta resultados. No navegador, selecione Lista de leitura.

Se um curso tiver regras sobre IA, essas regras aplicam-se.

Até à versão 0.16, o Sub-Sub tinha perfis (Reader, Scholar, Author, Editor). Deixaram de existir: todos os comandos estão no Investigador. Se escrever `/profile`, o Sub-Sub diz-lhe onde está cada coisa.
