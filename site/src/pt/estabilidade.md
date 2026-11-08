---
alt: /stability/
lang: pt-PT
layout: base.njk
title: Estabilidade
eyebrow: O que a versão 1.0 garante
lead: A partir da versão 1.0, os nomes e as definições desta página não mudam dentro da versão 1. Uma alteração que os quebre exige a versão 2.
---

## A regra

O Sub-Sub usa os números de versão do npm.

- Uma mudança no terceiro número (1.0.1) corrige uma falha. Não acrescenta nada.
- Uma mudança no segundo número (1.1.0) pode acrescentar funcionalidades. Não retira nem muda o nome de nada da lista fixa abaixo.
- Uma mudança no primeiro número (2.0.0) pode quebrar a lista fixa.
- Quando uma forma nova substitui uma antiga, o Sub-Sub continua a ler a forma antiga durante toda a versão 1. A pasta antiga `Systems/` para os ficheiros de definições é um exemplo.

## Fixo na versão 1

Comandos no terminal:

- `subsub`, `subsub --librarian`, `subsub web` (também `subsub serve`), `subsub tui`
- `subsub init`, `subsub doctor`, `subsub usage`, `subsub shortcut`
- `subsub review preview` e `subsub review apply`
- `subsub --version` e a opção `--here`

Comandos dentro do Sub-Sub:

- `/librarian`, `/researcher`, `/notes`, `/library`, `/actions`, `/subsub`
- `/ai-statement`, `/read`, `/feedback`, `/history`, `/undo`
- Os 15 comandos de pedidos: `/alert`, `/check-library`, `/clean-tags`, `/compare`, `/digest`, `/gaps`, `/import-queue`, `/lit-note`, `/lit`, `/manuscript`, `/request-copy`, `/review`, `/synthesis`, `/tag-batch`, `/verify`

Os nomes são fixos. O texto dos pedidos e dos papéis não é. Pode mudar em qualquer versão, porque melhora com os testes.

Ficheiros e definições:

- O ficheiro de definições `~/.config/subsub/config.json`, ou o ficheiro indicado em `SUBSUB_CONFIG`.
- A pasta `~/.subsub/agent`, ou a pasta indicada em `SUBSUB_AGENT_DIR`. A variável `SUBSUB_UV` também se mantém.
- Estas chaves no ficheiro de definições: `userName`, `about`, `language`, `setup`, `serverDir`, `envFile`, `vault`, `models`, `defaultMode`, `vaultContext`, `sharedRules`, `startTimeout`, `uvPath`, `look`, `quotes`, `themes`, `themesLibrarian`, `costLimit`.

Pastas na sua pasta do Sub-Sub. As duas organizações funcionam e as duas se mantêm:

- Com maiúsculas: `Sub-Sub/`, `Inbox/`, `Zotero tags.md`, `Zotero agent.md`, `Literature alerts.md`.
- Em minúsculas: `sub-sub/`, `inbox/`, `zotero-tags.md`, `zotero-agent.md`, `literature-alerts.md`.

Ferramentas:

- Os prefixos `zotero_` e `scholar_`, e os nomes das ferramentas do `zotero-local-mcp`.
- O servidor do Zotero tem o seu próprio número de versão. Cada versão do Sub-Sub indica a versão exata que executa. Retirar ou mudar o nome de uma ferramenta exige o Sub-Sub 2.0.

Regras de segurança:

- Cada alteração à sua biblioteca é mostrada primeiro, e o Sub-Sub só a aplica quando escolhe Sim.
- Cada alteração envia a versão do item, por isso um campo que edite ao mesmo tempo não é substituído.
- Cada alteração fica no registo, e `/undo` desfaz a última.
- Nada é apagado. Os itens vão para o lixo do Zotero.
- As bibliotecas de grupo são só de leitura.
- Só se acrescentam etiquetas da sua lista de etiquetas.

## Não fixo

- Os modelos por omissão.
- O aspeto dos ecrãs: cores, glifos e disposição.
- A ferramenta de testes `subsub-bench`.
- Os comandos `/subsub-refresh` e `/subsub-find`. A vista no navegador e o terminal em ecrã inteiro usam-nos.

## Experimental

Estes elementos podem mudar em qualquer versão. A documentação assinala-os.

- O prefixo `verify_` e o complemento Starbuck.
- As chaves de definições `addons`, `starbuckDir` e `usageLog`.

## pi

O Sub-Sub corre sobre o pi. Cada versão do Sub-Sub aceita uma versão secundária do pi (a 1.0 usa o pi 1.5) e as suas versões de correção. Quando instala o Sub-Sub com o npm, o npm instala esse pi. O comando `subsub` usa a sua própria cópia do pi, por isso a atualização de outro pi no seu computador não o altera. Se acrescentar o Sub-Sub ao seu próprio pi com `pi install`, use a versão secundária do pi que a página de instalação indica.

Uma versão secundária nova do pi pode exigir uma versão secundária nova do Sub-Sub. A lista fixa não muda quando isto acontece. Todas as semanas corre um teste do Sub-Sub contra o pi mais recente, para que um problema apareça antes de o encontrar.
