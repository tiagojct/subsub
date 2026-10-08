---
layout: base.njk
title: Perfis
lang: pt-PT
alt: /profiles/
eyebrow: Quanto faz o Sub-Sub
lead: Um perfil define o que o Sub-Sub escreve por si e que ferramentas oferece. Os nomes descrevem o trabalho, não a pessoa.
---

Um perfil aplica-se nos dois modos, o Investigador e o Bibliotecário. Muda duas coisas. Na investigação, define o que o Sub-Sub escreve por si. Nas alterações à biblioteca, só o perfil Reader é diferente: não tem alterações em massa e usa lotes mais pequenos. Os perfis Scholar, Author e Editor fazem as mesmas alterações à biblioteca.

## Investigação (Investigador)

| | Reader | Scholar | Author | Editor |
|---|---|---|---|---|
| Explica cada passo | sim | | | |
| Notas de leitura: citações com o número da página, e perguntas para si | sim | sim | sim | sim |
| Resumos, notas de literatura, sínteses | | sim | sim | sim |
| Pesquisa bibliográfica com registo da triagem (`/lit`) | lista de leitura | revisão | revisão | revisão |
| Comparações e sínteses periódicas (`/compare`, `/digest`) | | sim | sim | sim |
| Verificação de referências com o Starbuck (`/verify`) | sim | sim | sim | sim |
| Rascunho de email para pedir uma cópia a um autor (`/request-copy`) | sim | sim | sim | sim |
| Verificação das citações e bibliografia de um manuscrito | | | sim | sim |
| Comentários sobre a argumentação de um manuscrito | | | sim | sim |
| Revisão de um manuscrito face a uma diretriz de relato (`/review`) | | | sim | sim |
| Texto redigido para um manuscrito, quando o pede | | | | sim |

## Biblioteca (os dois modos)

| | Reader | Scholar | Author | Editor |
|---|---|---|---|---|
| Explica cada passo | sim | | | |
| Atribuir etiquetas aos itens, com etiquetas da sua lista de etiquetas | sim | sim | sim | sim |
| Importar por DOI, PMID ou ISBN | sim | sim | sim | sim |
| Anexar PDF de acesso aberto, acrescentar notas, arquivar itens em coleções, definir citekeys | sim | sim | sim | sim |
| Encontrar duplicados, verificar retratações, verificar etiquetas e metadados | sim | sim | sim | sim |
| Mudar o nome ou remover etiquetas, remover etiquetas automáticas | | sim | sim | sim |
| Editar campos, reparar metadados | | sim | sim | sim |
| Mover itens para o lixo do Zotero | | sim | sim | sim |
| Itens por nota de revisão de etiquetas | 10 | 25 | 25 | 25 |

Nos dois modos e em todos os perfis, cada alteração à biblioteca mostra primeiro uma pré-visualização e só é executada depois de selecionar Sim. `/history` e `/undo` funcionam em todos os perfis.

## Reader

Para quem quer fazer a leitura e a escrita: um estudante que começa numa área, ou qualquer pessoa que entra numa área nova. O Sub-Sub diz o que vai fazer antes de cada passo. Uma nota de leitura tem a referência, citações diretas com o número da página e, debaixo de cada citação, uma pergunta para responder. O Sub-Sub não escreve resumos nem texto que possa entregar como seu.

No perfil Reader, `/lit` dá uma lista de leitura, não uma revisão. O Sub-Sub planeia a pesquisa, pesquisa na sua biblioteca e na PubMed, na Europe PMC e no OpenAlex, faz a triagem dos resultados e guarda o registo da triagem, como nos outros perfis. Depois escreve as obras a ler, a ordem em que as deve ler, uma linha sobre o que cada obra estuda (não o que encontrou) e perguntas para ler cada uma. Não apresenta resultados nem conclusões.

Nas alterações à biblioteca, o perfil Reader atribui etiquetas, importa e anexa PDF, com 10 itens por nota de revisão. Não pode mudar o nome nem remover etiquetas, editar campos, reparar metadados ou mover itens para o lixo. Para isso, mude o perfil para Scholar.

## Scholar

O perfil predefinido. Notas de literatura e sínteses a partir do que o Sub-Sub leu, com uma fonte para cada afirmação, e todas as alterações à biblioteca, incluindo as alterações em massa. Não redige texto para os seus manuscritos.

## Author

O perfil Scholar, mais ajuda com os seus manuscritos: verifica as citações face à sua biblioteca, exporta a bibliografia para Quarto ou Pandoc, e comenta a argumentação, a estrutura e a evidência que falta. Os parágrafos ficam a seu cargo.

## Editor

Tudo. Quando o pede, redige texto para um manuscrito, cita os itens da biblioteca como `[@citekey]`, usa apenas afirmações de fontes que leu e marca o texto redigido para que o possa verificar.

## Mudar o perfil

- Escreva `/profile` para ver o perfil atual.
- Escreva `/profile reader` (ou `scholar`, `author`, `editor`) para o mudar. O Sub-Sub guarda a alteração.

Se escrever um comando que o seu perfil não executa, o Sub-Sub recusa-o e indica os perfis que o executam.

Um perfil é uma escolha sua e não o prende: pode mudá-lo a qualquer momento. Se um curso tiver regras sobre IA, essas regras aplicam-se, seja qual for o perfil.
