---
layout: base.njk
title: Piloto do Sub-Sub
lang: pt-PT
noindex: true
eleventyExcludeFromCollections: true
eyebrow: Para quem participa no piloto
description: Como instalar e experimentar o Sub-Sub no piloto.
lead: Obrigado por participar. Esta página explica como instalar o Sub-Sub, o que experimentar e como responder ao formulário no fim. Reserve cerca de uma hora.
# Microsoft Forms: link = the share link; embed = the src of the embed code (Collect responses > Embed).
form:
  link: ""
  embed: ""
---

## O que é o Sub-Sub

O Sub-Sub é um bibliotecário e assistente de investigação para o Zotero. Funciona no terminal do seu computador, com um modelo de IA. Tem dois modos:

- O bibliotecário organiza a biblioteca: etiquetas, importações por DOI ou PMID, correção de metadados.
- O investigador lê a biblioteca, pesquisa na PubMed e na OpenAlex e escreve notas na sua pasta de notas.

Nenhuma alteração à biblioteca acontece sem a sua aprovação. A interface do Sub-Sub está em inglês, mas as respostas e as notas podem ser em português.

## Antes de começar

1. Instale o [Zotero 10](https://www.zotero.org/download/), se ainda não o tiver.
2. Faça uma cópia de segurança da biblioteca. No Zotero, abra Definições (Settings) > Avançado (Advanced) > Ficheiros e pastas (Files and Folders) e clique em Mostrar pasta de dados (Show Data Directory). Feche o Zotero. Copie essa pasta para outro local.
3. Abra o Zotero. Em Definições > Avançado, ative a opção "Allow other applications on this computer to communicate with Zotero" (permitir que outras aplicações deste computador comuniquem com o Zotero).
4. Tenha à mão os dados de acesso ao modelo de IA indicado para o piloto.

## Instalar

Em macOS:

1. Abra a aplicação Terminal (Aplicações > Utilitários > Terminal).
2. Copie este comando, cole-o no Terminal e prima Enter:

<pre class="cmd"><code>curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh</code></pre>

Em Windows:

1. Abra o menu Iniciar, escreva PowerShell e prima Enter.
2. Copie este comando, cole-o no PowerShell e prima Enter:

<pre class="cmd ps"><code>powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"</code></pre>

O instalador instala o uv, o Node.js (se for preciso) e o Sub-Sub na sua pasta pessoal. Não pede a palavra-passe de administrador. Depois faz algumas perguntas, em inglês. Responda assim:

<div class="table-wrap">

| Pergunta | Resposta |
|---|---|
| Setup | Escreva 2 (FMUP / U.Porto) e prima Enter. |
| Your name | O seu primeiro nome. |
| One line about you | Por exemplo: estudante do 4.º ano de Medicina. Pode deixar em branco. |
| Language for replies and notes | Escreva European Portuguese. |
| Notes folder | Prima Enter para aceitar a pasta proposta, ou escreva o caminho do seu cofre do Obsidian. |
| Profile | Prima Enter (Reader). |
| Starter tag list | Prima Enter (health sciences). |
| Email for Unpaywall and Crossref | O seu email da U.Porto. Serve para encontrar PDF em acesso aberto. |
| Models | Prima Enter (Choose later). |

</div>

No fim, feche a janela e abra uma nova. O comando `subsub` só fica disponível numa janela nova.

## Ligar o modelo de IA

1. Escreva `subsub` e prima Enter.
2. Escreva `/login` e prima Enter.
3. Selecione o fornecedor indicado para o piloto. Siga as instruções no ecrã.
4. Escreva `/model` e selecione o modelo indicado para o piloto.

## Verificar a instalação

1. Abra uma janela nova do terminal.
2. Escreva `subsub doctor` e prima Enter.
3. Cada linha começa por ok, NOTE ou FIX. Faça o que cada linha FIX indica.
4. Escreva `subsub doctor` outra vez, até não haver linhas FIX.

A página [Help](/help/) explica cada linha, em inglês.

## O que experimentar

Faça as tarefas por esta ordem. Durante as tarefas, anote o que correu mal e o que foi útil. No fim, vai responder a um [formulário](#formulario).

### 1. Perguntar à biblioteca

1. Escreva `subsub`. O Sub-Sub começa no modo investigador.
2. Pergunte: `O que tenho sobre` e um tema da sua biblioteca.
3. No Zotero, confirme que as referências da resposta existem.

### 2. Etiquetar dez itens

1. Escreva `/librarian`.
2. Escreva `/tag-batch 10`. O Sub-Sub escreve uma nota de revisão na pasta Inbox, dentro da sua pasta de notas.
3. Abra a nota. Cada linha tem o item, as etiquetas atuais, as etiquetas propostas e o motivo.
4. Corrija a coluna das etiquetas propostas. Para deixar um item como está, escreva `skip`.
5. No Sub-Sub, escreva: `aplica a revisão Inbox/Zotero tag review 01.md`.
6. Leia a pré-visualização. Para aplicar, selecione Yes. Para cancelar, selecione No.

### 3. Importar um artigo

1. No modo bibliotecário, escreva `import` e um DOI. Por exemplo, a declaração PRISMA 2020: `import 10.1136/bmj.n71`.
2. Leia a pré-visualização. Selecione Yes.

### 4. Escrever uma nota de leitura

1. Escreva `/researcher`.
2. Escreva `/lit-note` e a citekey de um item com PDF. As respostas do Sub-Sub mostram as citekeys entre `[@` e `]`.
3. Abra a nota na pasta Literature. Com o perfil Reader, a nota tem citações com a página e perguntas para si.
4. Confirme duas citações no PDF.

### 5. Desfazer uma alteração

1. Escreva `/history`. Aparecem as alterações recentes.
2. Escreva `/undo` e selecione Yes. A última alteração é revertida.

## Formulário

No fim das tarefas, responda ao formulário. Demora cerca de 10 minutos. Responda mesmo que não tenha conseguido instalar: essa é a informação mais útil. O formulário pede a sua conta da U.Porto.

Tenha à mão:

- as notas que tirou durante as tarefas;
- o texto exato das mensagens de erro;
- o resultado de `subsub doctor`, se houve linhas FIX.

Não escreva chaves de API, palavras-passe nem dados de doentes no formulário.

{% if form.link or form.embed %}
<p><a class="button" href="{{ form.link or form.embed }}" target="_blank" rel="noopener">Abrir o formulário numa janela nova</a></p>
{% if form.embed %}
<iframe class="form-embed" src="{{ form.embed }}" title="Formulário do piloto do Sub-Sub" loading="lazy" allowfullscreen></iframe>
{% endif %}
{% else %}
<p class="note">O formulário fica disponível aqui antes do início do piloto.</p>
{% endif %}

Se ficar bloqueado e precisar de ajuda durante o piloto, envie um email para [tiagojacinto@med.up.pt](mailto:tiagojacinto@med.up.pt).

## Cuidados

- O Sub-Sub não apaga nada. Os itens vão para o lixo do Zotero, e `/undo` reverte uma alteração.
- O fornecedor do modelo recebe o que as ferramentas lhe devolvem: títulos, autores, resumos e partes do texto completo. Não use o Sub-Sub com documentos confidenciais nem com dados de doentes. Veja [Privacy](/privacy/), em inglês.
- As regras da sua unidade curricular e da faculdade sobre o uso de IA aplicam-se ao que entregar. O [FMUP · IA](https://tiagojacinto.eu/fmup-ia/) é uma proposta de quadro de referência para o uso de IA generativa na FMUP, ainda em revisão institucional.

## Desinstalar

1. Na sua pasta pessoal, apague a pasta `.subsub`.
2. Para apagar também as definições, apague as pastas `.config/subsub` e `.config/zotero-local-mcp`.
3. Para apagar o histórico de alterações que `/undo` usa, apague a pasta `.local/share/zotero-local-mcp`.

A biblioteca do Zotero e a pasta de notas não mudam.
