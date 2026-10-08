---
alt: /guide/
lang: pt-PT
layout: base.njk
title: Guia
eyebrow: A primeira meia hora
lead: Etiquete os seus primeiros itens, importe um artigo, escreva uma nota de literatura e anule uma alteração. Abra o Zotero antes do Sub-Sub.
---

## Começar

1. Abra o Sub-Sub a partir do atalho (ou escreva `subsub web`). O Sub-Sub abre no navegador.
2. Selecione Resumo da biblioteca. O resultado mostra a ligação ao Zotero e a sua biblioteca: os itens, os itens sem etiquetas e os itens que esperam revisão.
3. Fale com o Sub-Sub em linguagem corrente. Escreva `/` na caixa de mensagem para ver todos os comandos.

O Sub-Sub tem dois modos. O Investigador é o modo por omissão. Lê a sua biblioteca, pesquisa a literatura, escreve notas e também altera a biblioteca. O Bibliotecário só gere a biblioteca: etiquetas, importações, metadados, PDF e coleções. Para mudar de modo, selecione Investigador ou Bibliotecário no topo. Cada modo pode ter o seu próprio modelo. Nos dois modos, cada alteração à biblioteca mostra primeiro uma pré-visualização e só é feita depois de selecionar Sim.

O menu do perfil e o botão do modelo estão no canto superior direito. O painel da esquerda tem os comandos mais usados e as suas conversas anteriores. No modo Investigador, os comandos estão em dois grupos, Investigação e Biblioteca. No modo Bibliotecário, só aparece o grupo Biblioteca.

Este guia dá os comandos que escreve. No navegador, a maior parte deles também são botões.

Para um mapa das partes (as aplicações, os servidores, os modos, os perfis e as pastas), veja [Como funciona](/pt/como-funciona/).

### No terminal

Escreva `subsub`. O Sub-Sub começa no modo Investigador. Para começar no modo Bibliotecário, escreva `subsub --librarian`. Para mudar de modo, escreva `/librarian` ou `/researcher`. Quando inicia o Sub-Sub a partir da sua pasta pessoal, o Sub-Sub trabalha na sua pasta do Sub-Sub. A partir de outra pasta (por exemplo, a pasta de um manuscrito), trabalha nessa pasta. Para ficar na pasta pessoal, escreva `subsub --here`.

## Etiquetar os primeiros itens

O Sub-Sub só usa as etiquetas da sua lista de etiquetas. A lista inicial para qualquer área ainda não tem temas, porque os seus temas dependem da sua biblioteca. A lista para as ciências da saúde já tem alguns. Se a sua lista não tiver etiquetas `topic/`, comece aqui:

1. Escreva: `propõe temas para a minha lista de etiquetas`. O Sub-Sub lê os títulos dos seus itens e escreve `Inbox/Zotero topic proposal.md` com 15 a 30 temas.
2. Copie os temas que quer para `Zotero/Zotero tags.md`, no formato desse ficheiro.

Depois, etiquete:

1. Escreva `/librarian` (ou fique no modo Investigador: também pode etiquetar).
2. Escreva `/tag-batch 10`. O Sub-Sub lê dez itens sem tema e escreve uma nota de revisão de etiquetas: `Inbox/Zotero tag review 01.md`.
3. Abra a nota. Cada linha tem o item, as etiquetas atuais, as etiquetas propostas e uma justificação.
4. Edite a coluna das etiquetas propostas (Proposed tags). Para deixar um item como está, escreva `skip`.
5. Escreva: `aplica a nota de revisão de etiquetas Inbox/Zotero tag review 01.md`.
6. Leia a pré-visualização. Para aplicar as alterações, selecione Sim. Para parar, selecione Não e diga o que deve mudar.

As etiquetas têm de estar na sua lista de etiquetas, `Zotero/Zotero tags.md`. O Sub-Sub recusa outras etiquetas. Para acrescentar uma etiqueta, edite esse ficheiro.

Para aplicar várias notas de revisão de uma vez, escreva isto num terminal: `subsub review apply 1-5` (os números das notas).

## Anular uma alteração

Na vista no navegador, cada alteração aplicada tem um botão Anular na sua linha. Selecione-o, leia a pré-visualização e depois selecione Sim.

Ou escreva os comandos:

1. Escreva `/history`. Vê as alterações recentes, cada uma com um ID.
2. Escreva `/undo` para anular a última alteração, ou `/undo <ID>` para anular uma alteração anterior.
3. Leia a pré-visualização e depois selecione Sim.

A anulação ignora os itens que alterou no Zotero depois da alteração. Uma coleção nova vai para o lixo do Zotero; os itens dessa coleção ficam na biblioteca.

## Importar um artigo

1. Em qualquer dos modos, escreva `import` e um identificador: um DOI (por exemplo `import 10.1038/s41591-018-0300-7`), `pmid:` e um ID da PubMed, ou `isbn:` e um ISBN.
2. Leia a pré-visualização. Mostra a nova citekey e diz se a obra já está na sua biblioteca.
3. Selecione Sim. O item recebe a marca de revisão `_agent`, por isso o próximo lote de etiquetas inclui-o.

## Ficheiros sem item principal

Um PDF ou uma nota que acrescentou ao Zotero como ficheiro independente não tem item principal: não tem título, autores nem data na biblioteca, e não tem citekey. O Sub-Sub pode criar o item principal por si.

1. Em qualquer dos modos, escreva `cria um item principal adequado para os meus ficheiros sem item principal`. Para começar por alguns, indique-os pelo nome ou diga "os primeiros cinco".
2. O Sub-Sub lê cada ficheiro. Procura a obra na Crossref, no Google Books, no Internet Archive, na Open Library e na Wikidata, e também na web se guardou uma chave da Brave Search no `subsub init`. Só guarda um resultado quando este corresponde ao ficheiro.
3. Leia a pré-visualização. Para cada ficheiro, mostra um item novo (tipo, citekey, publicação, data, número) ou um item que já está na sua biblioteca.
4. Selecione Sim. O ficheiro passa para debaixo do seu item principal; um item novo recebe as coleções do ficheiro e a marca de revisão `_agent`.

A anulação devolve os ficheiros ao sítio onde estavam e move os itens novos para o lixo do Zotero. O Sub-Sub não consegue ler uma digitalização sem camada de texto: nesse caso, usa o nome do ficheiro e diz isso. No Zotero, clique com o botão direito num ficheiro e escolha Reindex Item se o ficheiro tiver texto que o Zotero ainda não indexou.

## Escrever uma nota de literatura

Use o modo Investigador nesta parte. O modo Bibliotecário não pesquisa nem escreve notas.

1. Pergunte: `O que tenho sobre espirometria em casa?`. A resposta lista citekeys da sua biblioteca.
2. Escreva `/lit-note smith2021`. O Sub-Sub lê o texto completo (ou o resumo, e diz isso) e escreve `Literature/smith2021.md` na sua pasta do Sub-Sub.
3. Escreva `/synthesis <tema>` para uma nota sobre vários itens, ou `/gaps <tema>` para procurar na PubMed e no OpenAlex obras que ainda não tem.

Cada nota de literatura diz o que o Sub-Sub leu: o texto completo, o resumo ou apenas os metadados. Os números de página vêm apenas do texto completo. O Sub-Sub recusa uma nota que não cumpra esta regra.

O que o Sub-Sub escreve depende do seu [perfil](/pt/perfis/). Os formatos das notas estão em `Zotero/Zotero agent.md`. Pode editá-los.

## Rever a literatura

1. Escreva `/lit` e a sua pergunta, por exemplo `/lit espirometria em casa em crianças com asma`.
2. O Sub-Sub pesquisa primeiro a sua biblioteca. Depois faz uma única pesquisa conjunta na PubMed, na Europe PMC e no OpenAlex, com termos que fazem uma primeira triagem dos resultados.
3. Faz a triagem de cada obra e mantém um registo de triagem em `Research/.plans/`.
4. Lê as obras antes de as resumir. A tabela de evidência diz, para cada fonte, se o Sub-Sub leu o texto completo, o resumo ou apenas os metadados.
5. Procura lacunas, verifica as referências e escreve uma nota em `Research/`.
6. Lista as obras que vale a pena acrescentar. Diga quais quer, e o Sub-Sub importa-as na mesma conversa, com uma só pré-visualização para todas. Depois oferece-se para as etiquetar.

O `/lit` é uma revisão rápida, não uma revisão sistemática: a triagem é feita por uma IA, sem segundo revisor, sem protocolo registado e sem avaliação formal do risco de viés. Cada nota diz isso numa secção, "What this review is". Use-o para delimitar uma pergunta, para uma secção de introdução ou como primeira pesquisa. Para uma revisão sistemática, parta das suas pesquisas e do registo de triagem, e depois faça a triagem em duplicado, avalie o risco de viés e relate segundo a PRISMA.

Outros comandos de investigação:

- `/compare <pergunta ou citekeys>` escreve uma matriz de fontes: para cada fonte, a afirmação, o tipo de evidência, as ressalvas e o grau de confiança.
- `/review <ficheiro>` comenta o seu próprio manuscrito à luz da norma de publicação que se aplica: CONSORT, STROBE, PRISMA, STARD, TRIPOD, CHEERS, ou SRQR ou COREQ. Escreve apenas comentários, ao lado do manuscrito, em `<nome>-review.md`, e não altera o manuscrito.
- `/digest [dias] [tema]` resume os alertas e as notas dos últimos dias (7 por omissão).
- `/ai-statement [para que o usou]` escreve um rascunho da declaração sobre o uso de IA que as revistas pedem, com a versão do Sub-Sub, o seu DOI e os seus modelos, em `Research/`. Complete as partes entre parênteses retos. Funciona em todos os perfis.
- `/request-copy <citekey, DOI ou PMID>` prepara um rascunho de email para o autor correspondente, a pedir uma cópia de um artigo que não está em acesso aberto. O endereço vem do registo da PubMed. O Sub-Sub escreve o rascunho em `Inbox/`; depois, envie-o.

Alguns perfis não executam todos estes comandos. Veja [Perfis](/pt/perfis/).

## Verificar referências

A verificação de referências usa o Starbuck, um complemento. Está desligado por omissão. Para o ligar, responda On à pergunta "Reference checks (Starbuck)" no `subsub init` (ou escreva `subsub init --starbuck on`). No navegador, use o interruptor "Verificação de referências (Starbuck)" no painel da esquerda. O Sub-Sub reinicia.

1. Escreva `/verify <ficheiro>`, por exemplo `/verify draft.qmd`.
2. O Starbuck verifica cada obra citada: se existe, se corresponde à citação e se continua válida (retratações, correções).
3. O Starbuck também lista as frases que afirmam um resultado sem citação.
4. Para verificar se cada fonte sustenta a frase que a cita, escreva `/verify <ficheiro> claims`. O modelo tem de citar a passagem em que se baseia. O Starbuck confirma que a citação está na fonte, palavra por palavra.

O Sub-Sub não altera o manuscrito. O Starbuck escreve um relatório HTML numa pasta `_starbuck` ao lado do manuscrito.

## Comandos

| Comando | O que faz |
|---|---|
| `/librarian`, `/researcher` | Muda de modo (cada modo pode ter o seu próprio modelo) |
| `/profile` | Mostra ou muda o perfil |
| `/subsub` | Ligação ao Zotero e resumo da biblioteca |
| `/history`, `/undo` | Alterações recentes; anular uma delas |
| `/ai-statement [usos]` | Um rascunho da declaração sobre o uso de IA para um manuscrito |
| `/tag-batch [tamanho]`, `/clean-tags`, `/import-queue` | Tarefas predefinidas da biblioteca (os dois modos) |
| `/lit-note <citekey>`, `/synthesis <tema>`, `/gaps <tema>`, `/manuscript <ficheiro>`, `/alert` | Tarefas predefinidas de investigação (Investigador) |
| `/lit <pergunta>`, `/compare <pergunta>`, `/review <ficheiro>`, `/digest [dias]`, `/request-copy <citekey>` | Tarefas predefinidas de investigação (Investigador) |
| `/verify <ficheiro> [claims]` | Verificação de referências (Investigador; precisa do Starbuck) |
| `subsub -c`, `subsub -r` | Continua a última sessão; seleciona uma sessão anterior (terminal) |
| `subsub web` | Abre o Sub-Sub no navegador |
| `subsub shortcut` | Volta a criar o atalho do Sub-Sub, por exemplo depois de uma mudança de lugar |

## A sua pasta do Sub-Sub

O Sub-Sub guarda as notas e as definições numa só pasta, `Sub-Sub`. Há duas coisas que ficam noutro sítio: a revisão de um manuscrito (`/review`) fica ao lado do manuscrito, e um relatório do Starbuck fica numa pasta `_starbuck` ao lado do manuscrito. Por omissão, a pasta `Sub-Sub` está na sua pasta Documentos. Se usa o Obsidian, o `subsub init` põe-na dentro do seu cofre (vault), e o Sub-Sub não mexe no resto do cofre.

| Caminho | Conteúdo |
|---|---|
| `Inbox/` | Notas de revisão, a fila de importação, propostas |
| `Literature/` | Uma nota por item, com o nome da citekey |
| `Syntheses/` | Notas sobre vários itens |
| `Research/` | Revisões da literatura, comparações, resumos periódicos; planos e registos de triagem em `Research/.plans/` |
| `Zotero/Zotero tags.md` | A sua lista de etiquetas |
| `Zotero/Zotero agent.md` | Formatos das notas e regras comuns |
| `Zotero/Literature alerts.md` | As pesquisas para os alertas semanais (opcional) |

Antes da versão 0.9, os ficheiros de `Zotero/` estavam em `Systems/`, e a pasta podia ser um cofre inteiro. Escreva `subsub init` para os mudar de lugar. O `subsub init` só move os ficheiros que o Sub-Sub criou e nunca substitui um ficheiro.
