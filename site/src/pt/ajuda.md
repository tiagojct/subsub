---
layout: base.njk
title: Ajuda
lang: pt-PT
alt: /help/
eyebrow: Quando algo não funciona
lead: Comece pelo subsub doctor. Verifica a configuração e diz como resolver cada problema.
---

## subsub doctor

Escreva `subsub doctor`. Cada linha começa por `ok`, `NOTE` ou `FIX`. Faça a correção que a linha indica. Depois escreva `subsub doctor` outra vez.

| Linha | O que fazer |
|---|---|
| FIX Node | Instale o Node.js 22.19 ou posterior, ou escreva outra vez o comando de instalação. |
| FIX Settings | Escreva `subsub init`. |
| FIX uv | Instale o [uv](https://docs.astral.sh/uv/), ou escreva outra vez o comando de instalação. |
| FIX Zotero server | Verifique a ligação à internet: no primeiro arranque, o Sub-Sub descarrega o servidor do Zotero. Depois escreva `subsub doctor` outra vez. |
| FIX Zotero | Abra o Zotero 10. No Zotero, abra Settings > Advanced e ligue a opção "Allow other applications on this computer to communicate with Zotero". |
| FIX Tag list | Escreva `subsub init`. Este comando cria uma lista de etiquetas inicial. |
| NOTE Tag list: no topic/ tags | No Sub-Sub, peça: `propose topics for my tag list`. |
| NOTE Sub-Sub folder | A pasta é um cofre (vault) inteiro do Obsidian, ou a lista de etiquetas e os formatos das notas ainda estão em `Systems/` (anterior à versão 0.9). Escreva `subsub init`: este comando move os ficheiros do Sub-Sub para uma pasta `Sub-Sub`, com os ficheiros de definições em `Zotero/`. |
| NOTE Contact email | Escreva `subsub init` e indique um endereço de email. Sem ele, o Sub-Sub não consegue encontrar PDF em acesso aberto. |
| FIX Starbuck | Só aparece quando a verificação de referências está ligada. Verifique a ligação à internet: no primeiro arranque, o Sub-Sub descarrega o Starbuck. Depois escreva `subsub doctor` outra vez. Para desligar a verificação de referências, escreva `subsub init`. |
| FIX Model login | Abra o Sub-Sub, selecione o botão do modelo e guarde uma chave de API. Em alternativa, escreva `subsub` e depois `/login`. |

## Outros problemas

- "command not found: subsub": abra uma nova janela do terminal. Se o problema continuar, escreva outra vez o comando de instalação.
- No Windows, o PowerShell diz "running scripts is disabled on this system": escreva `subsub.cmd` em vez de `subsub` (por exemplo, `subsub.cmd doctor`), ou escreva outra vez o comando de instalação, que resolve o problema.
- O atalho não faz nada, ou a página diz "Open Sub-Sub with its shortcut": abra outra vez o Sub-Sub a partir do atalho (o endereço da página muda sempre que o Sub-Sub arranca). Se o problema continuar, escreva `subsub web` num terminal e leia a mensagem. A vista no navegador escreve um registo em `~/.subsub/web.log`.
- O atalho deixou de funcionar depois de uma atualização ou de uma mudança de pasta: escreva `subsub shortcut`.
- No Windows, o atalho também abre uma janela minimizada na barra de tarefas. Essa janela é o próprio Sub-Sub: se a fechar, o Sub-Sub para.
- A página diz "O Sub-Sub parou.": selecione Recomeçar. Se parar de novo, escreva `subsub doctor`.
- O Zotero pede autorização quando o Sub-Sub altera algo pela primeira vez: selecione Always Allow.
- "This Go model requires Global regions": a sua área de trabalho (workspace) do OpenCode só permite algumas regiões. No OpenCode, abra as definições de privacidade (Privacy) da área de trabalho e selecione Global, ou escolha outro modelo.
- O Sub-Sub diz que a pesquisa na web não está configurada: mesmo assim, encontra referências no Crossref, no Google Books, no Internet Archive, na Open Library e no Wikidata. Para pesquisar na web, obtenha uma chave em [brave.com/search/api](https://brave.com/search/api/) e escreva `subsub init`.
- "cannot use opencode-go/…": não tem sessão iniciada nesse fornecedor, ou o nome do modelo está errado. Selecione o botão do modelo e guarde uma chave (no terminal, `/login`), ou altere `models` no ficheiro de definições.
- O `/profile` diz "O Sub-Sub já não tem perfis": todos os comandos estão agora no Investigador. Se estiver no Bibliotecário, escreva `/researcher`. Para ler um artigo com orientação, escreva `/read`. Veja [Modos e comandos](/pt/perfis/).
- Um comando ou uma ferramenta de pesquisa "faz parte do Investigador": escreva `/researcher`, ou selecione Investigador no topo da vista no navegador.
- O `/verify` diz que a verificação de referências precisa do Starbuck: ligue "Verificação de referências (Starbuck)" no painel à esquerda da vista no navegador, ou escreva `subsub init --starbuck on`.
- O Sub-Sub recusa uma nota de literatura: a nota tem de dizer o que o Sub-Sub leu (evidence: full text, abstract ou metadata, isto é, texto completo, resumo ou metadados), e só pode indicar números de página quando o Sub-Sub leu o texto completo. Uma nota escrita a partir do texto completo só pode citar o que o texto completo diz: o Sub-Sub compara cada citação com o texto do item no Zotero. Peça ao Sub-Sub para corrigir a nota.
- Uma nota de revisão foi "already applied": o Sub-Sub não aplica uma nota duas vezes. Para a aplicar outra vez, peça-o de forma explícita.
- O Sub-Sub diz que não redige texto para trabalhos de avaliação: é intencional. Use o `/read` para ler os artigos com orientação e o `/lit reading list:` para uma lista de obras a ler. Para um manuscrito ou uma tese, o Sub-Sub redige texto quando o pede.
- O `/read` com o motivo crítica diz que só leu o resumo: uma crítica precisa do texto completo. Anexe o PDF no Zotero, use o Sub-Sub na rede da sua instituição ou escreva `/request-copy` e a citekey.
- Apagou uma conversa por engano: Apagar move o ficheiro para `~/.subsub/trash`, na mesma subpasta. Mova-o de volta para o mesmo sítio em `~/.subsub/agent/sessions/`.

## Artigos que não estão em acesso aberto

O Sub-Sub encontra cópias em acesso aberto através do Unpaywall e da Europe PMC. Para os outros artigos:

- Na FMUP ou na U.Porto, use o Sub-Sub na rede da U.Porto. Nessa rede, a ligação do DOI abre a versão do editor através das assinaturas da biblioteca. Veja [FMUP](/pt/fmup/).
- Escreva `/request-copy` e a citekey, o DOI ou o PMID. O Sub-Sub prepara um rascunho de email para o autor correspondente. Envie-o a partir do seu email.

O Sub-Sub não usa fontes sem licença.

## Comunicar um problema

Abra um relatório de problema (issue) no [GitHub](https://github.com/tiagojct/subsub/issues). Inclua o resultado de `subsub doctor` e de `subsub --version`. Não inclua chaves de API.
