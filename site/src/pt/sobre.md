---
layout: base.njk
title: Sobre
lang: pt-PT
alt: /about/
eyebrow: O nome, o autor, a licença
---

## O nome

Moby-Dick abre com os Extratos (Extracts): citações sobre baleias, "supplied by a Sub-Sub-Librarian", um pobre diabo que "appears to have gone through the long Vaticans and street-stalls of the earth, picking up whatever random allusions to whales he could anyways find in any book whatsoever". O Sub-Sub faz o mesmo pela sua biblioteca, com menos desespero.

## O autor

O Sub-Sub é feito por Tiago Jacinto, professor auxiliar na Faculdade de Medicina da Universidade do Porto (MEDCIDS, RISE-Health), primeiro para a sua própria biblioteca e depois para estudantes e colegas. Contacto: [tiagojacinto@med.up.pt](mailto:tiagojacinto@med.up.pt).

## Feito com

- O [pi](https://pi.dev), o agente que o Sub-Sub estende.
- O [Zotero](https://www.zotero.org) e a sua API local.
- A [PubMed](https://pubmed.ncbi.nlm.nih.gov), o [OpenAlex](https://openalex.org), o [Crossref](https://www.crossref.org), o [Unpaywall](https://unpaywall.org) e a [Open Library](https://openlibrary.org).
- A [Europe PMC](https://europepmc.org), para pesquisas e texto completo em acesso aberto.
- O [Google Books](https://books.google.com), o [Internet Archive](https://archive.org), o [Wikidata](https://www.wikidata.org) e, com a sua chave, o [Brave Search](https://brave.com/search/api/), para as referências dos ficheiros sem item principal.
- O [Starbuck](https://github.com/tiagojct/starbuck), o complemento opcional para a verificação de referências.
- Os comandos `/lit`, `/compare` e `/review` e as regras de integridade do Sub-Sub adaptam texto do [Feynman](https://github.com/Companion-Inc/feynman) (licença MIT). As secções do `/digest` vêm do [alberto-research](https://github.com/gabriel-affonso/alberto-research) (licença MIT).
- O tipo de letra [IBM Plex](https://www.ibm.com/plex/) (SIL Open Font License), para este site e para a vista no navegador.
- Os sistemas de design Glauca e Try-Works, para os temas do terminal.

## Se o Sub-Sub parar

O Sub-Sub é mantido por uma só pessoa. Se deixar de ser atualizado, não perde nada:

- As suas referências, os PDF e as etiquetas estão no Zotero, que não precisa do Sub-Sub.
- As suas notas, listas de leitura e revisões são ficheiros Markdown na sua pasta do Sub-Sub. Qualquer editor de texto os abre.
- O registo de alterações está em ficheiros JSON simples em `~/.local/share/zotero-local-mcp/journal`.
- O código-fonte é aberto, com a licença MIT, por isso qualquer pessoa o pode continuar.

Uma versão instalada continua a funcionar até que o Zotero, o pi ou um fornecedor do modelo mudem de uma forma que a impeça de funcionar.

## Código-fonte e licença

O Sub-Sub e o seu servidor do Zotero são de código aberto, com a licença MIT:

- [github.com/tiagojct/subsub](https://github.com/tiagojct/subsub) (npm: [@tiagojct/subsub](https://www.npmjs.com/package/@tiagojct/subsub))
- [github.com/tiagojct/zotero-local-mcp](https://github.com/tiagojct/zotero-local-mcp) (PyPI: [zotero-local-mcp](https://pypi.org/project/zotero-local-mcp/)). O servidor também funciona sozinho, com qualquer cliente MCP.

As citações de Moby-Dick (1851) estão no domínio público.
