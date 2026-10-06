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

O Sub-Sub é um bibliotecário e assistente de investigação para o Zotero. Funciona no seu computador e abre no seu navegador, com um modelo de IA. Na mesma conversa:

- lê a biblioteca, pesquisa na PubMed, na Europe PMC e na OpenAlex e escreve notas na sua pasta Sub-Sub;
- organiza a biblioteca: etiquetas, importações por DOI ou PMID, correção de metadados.

O interruptor Alterações à biblioteca, no topo da página, liga ou desliga a segunda parte.

Nenhuma alteração à biblioteca acontece sem a sua aprovação. Com a língua definida para português europeu, os botões, as respostas e as notas ficam em português. As pré-visualizações das alterações e algumas mensagens técnicas ficam em inglês.

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
| Sub-Sub folder | Prima Enter para aceitar a pasta proposta. Se usa o Obsidian, escreva o caminho do seu cofre: o Sub-Sub cria lá dentro uma pasta Sub-Sub e não mexe no resto do cofre. |
| Profile | Prima Enter (Reader). |
| Starter tag list | Prima Enter (health sciences). |
| Email | O seu email da U.Porto. Serve para encontrar PDF em acesso aberto. |
| Reference checks | Prima Enter (Off). |
| Models | Prima Enter (Choose later). |

</div>

No fim, o Sub-Sub abre no seu navegador. Depois, abra-o pelo atalho Sub-Sub:

- em macOS, nas Aplicações, no Launchpad ou com o Spotlight;
- em Windows, no menu Iniciar ou no ambiente de trabalho.

Em Windows, o atalho abre também uma janela minimizada na barra de tarefas. Não a feche enquanto usa o Sub-Sub. O Sub-Sub para sozinho 10 minutos depois de fechar a página.

## Ligar o modelo de IA

1. No Sub-Sub, selecione o botão do modelo, no canto superior direito. Antes da primeira ligação, mostra "Sem modelo".
2. Em Fornecedor, selecione o fornecedor indicado para o piloto.
3. Cole a chave de API e selecione Guardar.
4. Na lista de modelos, selecione o modelo indicado para o piloto.

A chave fica guardada no seu computador e só é enviada a esse fornecedor.

## Verificar a instalação

No topo da página, confirme que aparece o número de itens da sua biblioteca, por exemplo "Zotero: 250 itens". Se aparecer "O Zotero não está aberto", abra o Zotero.

Se alguma coisa falhar:

1. Abra uma janela nova do terminal.
2. Escreva `subsub doctor` e prima Enter.
3. Cada linha começa por ok, NOTE ou FIX. Faça o que cada linha FIX indica.
4. Escreva `subsub doctor` outra vez, até não haver linhas FIX.

A página [Help](/help/) explica cada linha, em inglês.

## O que experimentar

Faça as tarefas por esta ordem. Durante as tarefas, anote o que correu mal e o que foi útil. No fim, vai responder a um [formulário](#formulario).

### 1. Perguntar à biblioteca

1. Abra o Sub-Sub.
2. Na caixa de mensagem, escreva `O que tenho sobre` e um tema da sua biblioteca. Prima Enter.
3. No Zotero, confirme que as referências da resposta existem.

### 2. Etiquetar dez itens

1. No topo da página, confirme que o interruptor Alterações à biblioteca está ligado.
2. No painel da esquerda, em Biblioteca, selecione Etiquetar 10 itens. O Sub-Sub escreve uma nota de revisão na pasta Inbox, dentro da sua pasta Sub-Sub.
3. Abra a nota, por exemplo com o Obsidian ou com um editor de texto. Cada linha tem o item, as etiquetas atuais, as etiquetas propostas e o motivo.
4. Corrija a coluna das etiquetas propostas. Para deixar um item como está, escreva `skip`.
5. No Sub-Sub, escreva: `aplica a revisão Inbox/Zotero tag review 01.md`.
6. Leia a pré-visualização. As etiquetas a acrescentar aparecem a verde e as etiquetas a retirar aparecem a vermelho.
7. Para aplicar, selecione Sim. Para cancelar, selecione Não.

### 3. Importar um artigo

1. Escreva `import` e um DOI. Por exemplo, a declaração PRISMA 2020: `import 10.1136/bmj.n71`.
2. Leia a pré-visualização. Selecione Sim.

### 4. Escrever uma nota de leitura

1. No painel da esquerda, em Investigação, selecione Nota de leitura. A caixa de mensagem fica com `/lit-note`.
2. Acrescente a citekey de um item com PDF e prima Enter. As respostas do Sub-Sub mostram as citekeys entre `[@` e `]`.
3. Quando a nota estiver escrita, selecione Abrir na linha "escrever um ficheiro". Com o perfil Reader, a nota tem citações com a página e perguntas para si.
4. Confirme duas citações no PDF.

### 5. Desfazer uma alteração

1. No painel da esquerda, selecione Alterações recentes.
2. Selecione Desfazer a última alteração. Leia a pré-visualização e selecione Sim.

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

1. Num terminal, escreva `subsub shortcut --remove`. Isto retira o atalho.
2. Na sua pasta pessoal, apague a pasta `.subsub`.
3. Para apagar também as definições, apague as pastas `.config/subsub` e `.config/zotero-local-mcp`.
4. Para apagar o histórico de alterações que `/undo` usa, apague a pasta `.local/share/zotero-local-mcp`.

A biblioteca do Zotero e a pasta Sub-Sub não mudam.
