---
alt: /install/
lang: pt-PT
layout: base.njk
title: Instalar
eyebrow: Começar
lead: Um só comando instala tudo o que o Sub-Sub precisa, na sua pasta de utilizador. Não precisa de direitos de administrador.
---

Ainda não conhece o Zotero, os modelos de IA ou o terminal? Leia primeiro [Para estudantes](/pt/estudantes/).

## Antes de começar

1. Instale o [Zotero 10](https://www.zotero.org/download/) ou uma versão mais recente, se ainda não o tiver.
2. Abra o Zotero.
3. No Zotero, abra as definições e o separador Avançado (Settings > Advanced).
4. Ligue a opção "Allow other applications on this computer to communicate with Zotero" (permitir que outras aplicações deste computador comuniquem com o Zotero).
5. Crie uma conta num fornecedor de modelos de IA. Veja [Modelos](/pt/modelos/). Para experimentar o Sub-Sub sem pagar, basta uma chave gratuita da Google. A mesma página explica como a obter.

## Instalar no macOS ou no Linux

1. Abra o Terminal.
2. Escreva este comando e prima Return:

<pre class="cmd"><code>curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh</code></pre>

3. Responda às perguntas da configuração. Para manter o valor entre parênteses retos, prima Return.
4. O Sub-Sub abre no navegador. Mais tarde, abra-o a partir das Aplicações (macOS) ou do menu de aplicações (Linux).

## Instalar no Windows

1. Abra o PowerShell. (Prima a tecla Windows, escreva PowerShell e prima Enter.)
2. Escreva este comando e prima Enter:

<pre class="cmd ps"><code>powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"</code></pre>

3. Responda às perguntas da configuração. Para manter o valor entre parênteses retos, prima Enter.
4. O Sub-Sub abre no navegador. Mais tarde, abra-o a partir do menu Iniciar ou do atalho do Sub-Sub no ambiente de trabalho.

## Sobre o comando de instalação

O comando transfere um script deste site e executa-o. Os conselhos de segurança avisam muitas vezes contra executar scripts da internet, e o conselho é bom para sites em que não confia. Pode verificar o seguinte:

- Pode ler o script antes de o executar: [install.sh](/install.sh) e [install.ps1](/install.ps1). É curto e tem comentários.
- Instala apenas na sua pasta de utilizador (`~/.subsub`). Não pede a palavra-passe de administrador e não altera o sistema.
- No Windows, `-ExecutionPolicy ByPass` deixa apenas este comando executar o script. Não altera a definição para outros scripts.
- Tudo o que instala é de código aberto: o Sub-Sub, o Node.js e o uv. O código-fonte do Sub-Sub está no [GitHub]({{ site.repo }}).
- Para remover tudo, veja [Remover](#remover).

Se a sua instituição gere o seu computador e bloqueia o comando, entregue ao serviço de informática a secção [Para o serviço de informática](#para-o-servico-de-informatica), ou use um computador seu.

## Iniciar o Sub-Sub

1. Abra o Zotero.
2. Abra o Sub-Sub a partir do atalho. O Sub-Sub abre no navegador. (Num terminal, `subsub web` faz o mesmo.)
3. Selecione o botão do modelo, no canto superior direito. Selecione o seu fornecedor, cole a sua chave de API e selecione Guardar. Depois selecione um modelo.
4. Confirme que o topo da página mostra o número de itens da sua biblioteca do Zotero.

Depois leia o [Guia](/pt/guia/).

Se preferir o terminal, escreva `subsub` e depois `/login`. Tudo o que faz no navegador também funciona no terminal.

## Verificar a configuração

Abra uma nova janela do terminal e escreva `subsub doctor`. Cada linha que começa por FIX diz o que deve fazer. Veja [Ajuda](/pt/ajuda/).

## O que o instalador faz

O instalador põe tudo em `~/.subsub` (no Windows, `.subsub` na sua pasta de utilizador):

- Instala o [uv](https://docs.astral.sh/uv/), se não o tiver. O uv executa o servidor do Zotero.
- Instala o Node.js 22 em `~/.subsub/node`, se não tiver o Node.js ou se a sua versão for anterior à 22.19. Compara o ficheiro transferido com as somas de verificação (checksums) que o nodejs.org publica.
- Instala o Sub-Sub (o pacote npm [@tiagojct/subsub](https://www.npmjs.com/package/@tiagojct/subsub)).
- Acrescenta `~/.subsub/bin` ao seu PATH, para que o comando `subsub` funcione em novas janelas do terminal.
- Inicia o `subsub init`, que faz algumas perguntas: o seu nome e uma linha sobre si, a língua, a pasta do Sub-Sub, a configuração (padrão, ou FMUP para a Faculdade de Medicina da Universidade do Porto), se é estudante (os estudantes começam no perfil Reader), o perfil, uma lista de etiquetas inicial, um endereço de email de contacto, a verificação de referências (Starbuck), o registo de utilização do piloto (desligado por omissão) e os modelos. Prima Enter para aceitar cada valor por omissão. No fim, o instalador executa `subsub doctor` para verificar a configuração.
- Acrescenta um atalho do Sub-Sub (`subsub shortcut`): nas Aplicações, no macOS; no menu Iniciar e no ambiente de trabalho, no Windows; no menu de aplicações, no Linux. O atalho abre o Sub-Sub no navegador.
- Abre o Sub-Sub no navegador.

Pode ler os instaladores antes de os executar: [install.sh](/install.sh) e [install.ps1](/install.ps1).

## Para o serviço de informática

Se a sua instituição gere o seu computador, entregue esta secção ao serviço de informática.

- O que instala: o Node.js 22 e o uv (código aberto) e o pacote npm @tiagojct/subsub, tudo na pasta do utilizador (`~/.subsub`, ou `.subsub` na pasta do utilizador no Windows). Não precisa de direitos de administrador, não cria serviços do sistema e não altera definições do sistema. [O que o instalador faz](#o-que-o-instalador-faz).
- O que corre: um processo Node.js (o Sub-Sub) e dois processos Python iniciados pelo uv (os servidores do Zotero), apenas enquanto o Sub-Sub está aberto. A vista no navegador é um servidor web local, apenas em 127.0.0.1, com uma chave aleatória no endereço; para 10 minutos depois de a página ser fechada. A ligação local do Zotero usa 127.0.0.1, porta 23119.
- Transferências na instalação e nas atualizações: subsub.tiagojacinto.eu, nodejs.org, astral.sh, registry.npmjs.org, pypi.org e files.pythonhosted.org.
- Ligações durante o uso: o fornecedor do modelo que o utilizador escolhe (por exemplo opencode.ai, api.mistral.ai, generativelanguage.googleapis.com) e os serviços bibliográficos eutils.ncbi.nlm.nih.gov, www.ebi.ac.uk, api.openalex.org, api.crossref.org, api.unpaywall.org, doi.org e openlibrary.org. Os PDF em acesso aberto vêm dos sites das próprias editoras e repositórios. A página [Privacidade](/pt/privacidade/) indica o que cada serviço recebe.
- Nada é enviado ao autor do Sub-Sub. Não há telemetria.
- Código-fonte: [github.com/tiagojct/subsub]({{ site.repo }}), licença MIT. Cada versão fica arquivada no Zenodo (doi:[{{ site.doi }}](https://doi.org/{{ site.doi }})).

## Instalar com o npm

Se tiver o Node.js 22.19 ou mais recente e o uv:

<pre class="cmd"><code>npm install -g @tiagojct/subsub</code></pre>

O npm também instala o pi 1.0, de que o Sub-Sub precisa. Depois escreva `subsub init`, e `subsub shortcut` para criar o atalho.

Se já usa o [pi](https://pi.dev), também pode acrescentar o Sub-Sub ao pi: `pi install npm:@tiagojct/subsub`. O Sub-Sub precisa do pi 1.0 ou mais recente.

## O que o `subsub init` cria

- Um ficheiro de definições: `~/.config/subsub/config.json`.
- As definições do servidor do Zotero: `~/.config/zotero-local-mcp/env` (a pasta do Sub-Sub, a lista de etiquetas, o endereço de email de contacto).
- A pasta do Sub-Sub, por omissão `~/Documents/Sub-Sub`, ou `Sub-Sub` dentro do seu cofre (vault) do Obsidian. Dentro dela: `Inbox/`, `Literature/`, `Syntheses/`, `Research/` e `Zotero/`, com `Zotero tags.md` (uma lista de etiquetas inicial) e `Zotero agent.md` (os formatos das notas). Pode editar os dois ficheiros.

O `subsub init` nunca substitui um ficheiro que já existe. Para alterar as suas definições mais tarde, escreva outra vez `subsub init`.

## Verificação de referências (Starbuck)

O Starbuck é um complemento que verifica as referências de um manuscrito. Está desligado por omissão. Para o ligar:

- No `subsub init`, responda On à pergunta "Reference checks (Starbuck)". Ou escreva `subsub init --starbuck on`.
- Ou, na vista no navegador, ligue o interruptor "Verificação de referências (Starbuck)" no painel da esquerda. O Sub-Sub reinicia.

O Sub-Sub transfere o Starbuck com o uv na primeira vez. Depois escreva `subsub doctor`: a linha Starbuck deve mostrar ok. O Sub-Sub passa então a ter o `/verify`. Veja o [Guia](/pt/guia/#verificar-referencias).

## Atualizar

Escreva outra vez o comando de instalação. Ou, se instalou com o npm, escreva `npm install -g @tiagojct/subsub`.

## Remover

1. Escreva `subsub shortcut --remove`. Este comando remove o atalho das Aplicações, do menu Iniciar ou do menu de aplicações, e do ambiente de trabalho.
2. Apague a pasta `~/.subsub`.
3. Remova a linha que começa por `export PATH` e contém `.subsub` de `~/.zshrc`, `~/.bashrc` ou `~/.profile`. (No Windows, remova as duas entradas `.subsub` do PATH do seu utilizador.)
4. Se já não quiser as definições, apague `~/.config/subsub` e `~/.config/zotero-local-mcp`. O registo de alterações, que o `/undo` usa, está em `~/.local/share/zotero-local-mcp`.

A sua biblioteca do Zotero e as suas notas não mudam.
