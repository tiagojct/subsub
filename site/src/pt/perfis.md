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

## Só no Investigador

O Investigador tem todos os comandos e ferramentas. Estes precisam dele:

- `/read`: leitura guiada de um artigo.
- `/lit reading list:`: uma lista de leitura com perguntas para orientar a leitura.
- `/lit-note`, `/synthesis`: notas de literatura e sínteses.
- `/lit`: uma revisão da literatura com registo da triagem.
- `/gaps`, `/alert`: obras que ainda não tem, e novas publicações.
- `/compare`, `/digest`: comparações e resumos periódicos.
- `/manuscript`: verificação das citações e bibliografia de um manuscrito.
- `/review`: revisão de um manuscrito face a uma norma de relato.
- `/verify`: verificação de referências com o Starbuck.
- `/request-copy`: um rascunho de email para pedir uma cópia a um autor.
- Texto redigido para um manuscrito ou uma tese, quando o pede (nunca para trabalhos de avaliação).

## Nos dois modos

- Atribuir etiquetas aos itens, com etiquetas da sua lista de etiquetas (`/tag-batch`, `/clean-tags`).
- Importar por DOI, PMID ou ISBN (`/import-queue`).
- Anexar PDF de acesso aberto, acrescentar notas, arquivar itens em coleções, definir citekeys.
- Encontrar duplicados, verificar retratações, verificar etiquetas e metadados.
- Mudar o nome ou retirar etiquetas, retirar etiquetas automáticas.
- Editar campos, corrigir metadados.
- Mover itens para o lixo do Zotero.
- `/subsub`, `/history`, `/undo` e `/ai-statement`.

Nos dois modos, cada alteração à biblioteca mostra primeiro uma pré-visualização e só é feita depois de selecionar Sim.

## Ferramentas

O Bibliotecário usa um servidor, o zotero: as ferramentas da biblioteca. O Investigador usa o zotero e o scholar (pesquisas na PubMed, na Europe PMC e no OpenAlex, textos completos, notas e manuscritos). Se ligar o Starbuck, o Investigador usa também o verify, para a verificação de referências. Os dois modos leem e escrevem ficheiros na sua pasta do Sub-Sub. Para um mapa, veja [Como funciona](/pt/como-funciona/).

## O que o Sub-Sub escreve

O Sub-Sub escreve notas de literatura, sínteses e revisões a partir do que leu, com uma fonte para cada afirmação. Cada nota diz o que o Sub-Sub leu: o texto completo, o resumo ou apenas os metadados.

Não redige texto para trabalhos de avaliação, mesmo que o peça. Só redige texto para o seu manuscrito ou tese quando o pede. Cita os itens da biblioteca como `[@citekey]`, usa apenas afirmações de fontes que leu e marca o texto redigido para que o possa verificar.

## Aprender a ler a literatura

Dois comandos ajudam-no a ler os artigos. O Sub-Sub encontra as passagens e faz perguntas. A leitura e as respostas ficam a seu cargo.

- `/read [motivo] <citekey, DOI ou PMID>` é uma leitura guiada de um artigo. Selecione porque vai ler o artigo: contexto, um dado, extração ou crítica. O Sub-Sub só lê o que esse motivo exige, cita as passagens com o sítio onde estão e faz perguntas. Numa extração, também acrescenta uma linha para o artigo à sua folha de extração em `Research/`. No navegador, selecione Ler um artigo, ou Ler ao lado de um resultado da pesquisa na biblioteca. Veja [Ler um artigo](/pt/guia/#ler-um-artigo) no guia.
- `/lit reading list: <tema>` pesquisa e faz a triagem como o `/lit`. Depois escreve uma lista de leitura: as obras a ler, a ordem em que as deve ler, o que cada obra estuda (não o que encontrou) e perguntas para ler cada uma. Não apresenta resultados. No navegador, selecione Lista de leitura.

As regras do seu curso sobre IA aplicam-se ao que entrega.

Até à versão 0.16, o Sub-Sub tinha perfis (Reader, Scholar, Author, Editor). Deixaram de existir: todos os comandos estão no Investigador. Se escrever `/profile`, o Sub-Sub diz-lhe onde está cada coisa.
