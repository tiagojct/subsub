---
alt: /clinicians/
lang: pt-PT
layout: base.njk
title: Para investigadores clínicos
eyebrow: Se faz investigação a par da clínica
description: O que o Sub-Sub faz por um investigador clínico, o que não é, como o instalar num computador do hospital e como declarar o seu uso a uma revista.
lead: O Sub-Sub encontra, lê e verifica os artigos da sua investigação, a partir da sua própria biblioteca do Zotero. Não precisa de saber de IA nem do terminal para o usar; pode ser preciso que alguém o instale uma vez por si.
---

In English: [For clinical researchers](/clinicians/).

## O que faz por si

| Precisa de | Peça ao Sub-Sub | O que recebe |
|---|---|---|
| Saber o que está publicado sobre uma pergunta, para um protocolo ou uma introdução | `/lit` e a pergunta, por exemplo `/lit espirometria em casa em crianças com asma` | Uma nota com a resposta, uma tabela de evidência (desenho, população, resultado, e se o Sub-Sub leu o texto completo), as pesquisas e um registo de triagem |
| Ler bem um artigo | `/lit-note` e palavras do título do artigo | Uma nota com os pontos principais, os métodos e citações com números de página, cada citação verificada no PDF |
| Verificar o seu manuscrito face à norma de publicação | `/review` e o ficheiro do manuscrito | Comentários à luz da CONSORT, STROBE, STARD, PRISMA, TRIPOD, CHEERS, SRQR ou COREQ, ao lado do seu ficheiro; o seu texto não muda |
| Verificar as referências antes de submeter | `/verify` e o ficheiro do manuscrito | Para cada referência: existe, o título, o primeiro autor e o ano coincidem, foi retratada ou corrigida |
| Declarar à revista o uso de IA | `/ai-statement` e para que o usou | Um rascunho de declaração com a versão do Sub-Sub, o seu DOI e o modelo, para completar e colar |

Também pode pedir em linguagem corrente ("procura estudos de coorte recentes sobre FeNO em crianças"). Nos nossos testes, uma nota ou uma revisão levou cerca de {{ modeltest.researcher.models[facts.defaults.researcher].minutes_per_task | num(0) }} minutos de trabalho do Sub-Sub. O seu tempo vai para ler e verificar o que ele escreveu. O `/review` precisa do perfil Author ou Editor; veja [Perfis](/pt/perfis/). O `/verify` precisa da verificação de referências, que se liga no `subsub init`.

## O que não é

- Não é uma revisão sistemática. O `/lit` é uma revisão rápida: a triagem é feita por uma IA, sem segundo revisor e sem avaliação formal do risco de viés. Cada nota diz isso. Use-o para delimitar uma pergunta ou como primeira pesquisa; numa revisão sistemática, faça a triagem em duplicado, avalie o risco de viés e relate segundo a PRISMA.
- Não se destina a dados de doentes, nem é apoio à decisão clínica. Trabalha sobre publicações.
- Não escreve o seu artigo, a menos que escolha o perfil Editor e o peça. Mesmo assim, verifique e reescreva cada linha.
- Não substitui o seu juízo. Mostra o que leu; é o investigador que decide o que a evidência quer dizer.

## Instalar no seu computador

- No seu próprio computador: o [guia de instalação](/pt/instalar/) leva cerca de dez minutos. Cola um comando; depois, o Sub-Sub abre a partir de um atalho, no navegador.
- Num computador do hospital ou da faculdade: o serviço de informática pode ter de o autorizar. Entregue-lhe a secção [Para o serviço de informática](/pt/instalar/#para-o-servico-de-informatica). Instala apenas na sua pasta de utilizador, não precisa de direitos de administrador e não nos envia nada.
- Se preferir que alguém lhe mostre: para uma sessão de formação no seu departamento ou serviço, ou ajuda com a instalação para um grupo, escreva para tiagojacinto@med.up.pt.

## A sua biblioteca não precisa de estar arrumada

Não precisa de etiquetas para começar. O `/lit`, o `/lit-note`, o `/review` e o `/verify` funcionam em qualquer biblioteca do Zotero. As etiquetas ajudam mais tarde, quando quiser que o Sub-Sub agrupe os artigos por tema.

Se as suas referências estão no EndNote ou no Mendeley, passe-as primeiro para o Zotero. Os guias do próprio Zotero explicam como: [a partir do EndNote](https://www.zotero.org/support/kb/importing_records_from_endnote) e [a partir do Mendeley](https://www.zotero.org/support/kb/mendeley_import) (em inglês). Depois peça ao Sub-Sub, em linguagem corrente:

1. "Dá-me um resumo da minha biblioteca." Conta os itens, e os que não têm etiquetas nem chaves de citação.
2. "Procura duplicados." Mostra cada grupo com as suas provas; junta-os no Zotero.
3. "Corrige os metadados dos itens sem DOI." Mostra cada alteração primeiro.

## Proteção de dados e ética

O Sub-Sub envia ao fornecedor do modelo as suas mensagens e o que lê por si: títulos, resumos, passagens de artigos e passagens do seu manuscrito quando o verifica. Não o use com dados de doentes. Se o seu departamento ou a comissão de ética perguntar, a página [Privacidade](/pt/privacidade/#para-um-encarregado-de-protecao-de-dados) tem uma secção para o encarregado de proteção de dados. Para manter os seus dados na União Europeia, use os modelos da Mistral ([Modelos](/pt/modelos/#qual-escolher)).

## As revistas e o uso de IA

A maioria das revistas pede aos autores que digam como usaram ferramentas de IA, e considera os autores responsáveis pelo conteúdo. Com o Sub-Sub:

1. Verifique cada referência e cada afirmação que tire das suas notas no próprio artigo. As notas dizem o que o Sub-Sub leu, e o `/verify` verifica as referências.
2. Escreva `/ai-statement` e para que o usou, por exemplo `/ai-statement the literature search and reading notes`. O rascunho sai em inglês, a língua da maioria das revistas. Complete-o e coloque-o onde a revista pede, muitas vezes nos Métodos ou nos Agradecimentos.
3. Para citar o próprio Sub-Sub: Jacinto T. Sub-Sub: a research assistant for Zotero [software]. Porto: Faculdade de Medicina da Universidade do Porto; 2026. doi:[{{ site.doi }}](https://doi.org/{{ site.doi }}).

## Que modelo, numa linha

Se não tiver a certeza: aceite os modelos predefinidos que o `subsub init` propõe (cerca de {{ facts.opencodeGo.monthly }} dólares por mês), ou escolha a Mistral se os seus dados tiverem de ficar na UE. A página [Modelos](/pt/modelos/#qual-escolher) tem os pormenores.
