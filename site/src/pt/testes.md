---
alt: /tests/
layout: base.njk
title: Testes
lang: pt-PT
eyebrow: O que foi testado e o que se encontrou
lead: Antes da versão 0.20, o Sub-Sub 0.19.0 foi testado numa biblioteca de 103 registos, tal como o Starbuck, o verificador de referências que trabalha com ele. Esta página dá as perguntas, os resultados e os limites.
---

## Quem fez os testes

O autor do Sub-Sub e do Starbuck fez os testes. O protocolo, as versões e a biblioteca de teste ficaram fixos antes da primeira execução de teste. Os resultados não são uma auditoria independente. Está a ser preparado um resumo para o simpósio LLMSSH 2026.

## O que se pediu ao Sub-Sub

Vinte tarefas, cada uma executada três vezes (60 execuções), numa biblioteca de teste com 103 registos sobre a história da medicina respiratória. As tarefas foram: listar os itens sobre um tema, responder a uma pergunta a partir da biblioteca, resumir um artigo, redigir um parágrafo, encontrar problemas numa biblioteca (as tarefas de editor) e responder a uma pergunta que a biblioteca não consegue responder. As ferramentas de web estavam desligadas, por isso o Sub-Sub só tinha a biblioteca. As 60 execuções terminaram e custaram 0,47 USD no total, com um só modelo.

Dois avaliadores, modelos de linguagem, avaliaram cada resposta sem saber qual a versão que a produziu. Depois o autor avaliou todos os itens em que eles discordaram e uma quinta parte ao acaso dos restantes.

## O que os testes encontraram no Sub-Sub 0.19.0

- Pesquisa na biblioteca: precisão de 0,98 e cobertura de 0,87. Falhou itens cujos títulos usam um sinónimo das suas palavras.
- Tarefas de editor: nomeou todos os itens com problemas que foram colocados na biblioteca.
- Citações: nenhuma das 94 citações nas respostas era inventada, e nenhuma vinha de fora da biblioteca. 94 % apoiavam a afirmação a que estavam associadas.
- Rascunhos: 37 % a 53 % das frases factuais estavam só em parte apoiadas, ou não estavam apoiadas, pelas obras citadas. É o resultado mais fraco.
- Perguntas fora da biblioteca: as seis respostas disseram que a biblioteca não tem nada sobre o tema, e nenhuma inventou uma fonte.

## O que mudou na 0.20

- Pesquisa: passa a pesquisar com as suas palavras, depois com sinónimos próximos e outras formas das palavras, e diz que palavras usou. Nas quatro tarefas de pesquisa, a cobertura subiu de 0,87 para 0,96 e a precisão desceu de 0,98 para 0,91. Em 16 tarefas no conjunto, a precisão foi 0,90 contra 0,85 e a cobertura 0,94 contra 0,90. A pesquisa mais larga lista por vezes itens que só estão perto do tema. Confirme a lista.
- Rascunhos: passa a escolher primeiro uma citação para cada frase e a escrever a frase a partir da citação. Uma tabela, "Quotes for the check", segue o rascunho. Num teste com 18 rascunhos, a parte das frases não totalmente apoiadas desceu para 12 % a 14 %. Num segundo teste com nove rascunhos de outras tarefas foi 14 % e 16 %, contra 35 % e 37 % na 0.19.0. Numa das três tarefas não houve alteração.
- Verificação de referências: "not found by search" passa a ser indicado como "não confirmado".
- Qualidade das respostas no conjunto: a pontuação média (0 a 2) passou de 1,72 e 1,67 para 1,82 e 1,74 nos dois avaliadores. O ganho está dentro do ruído de uma amostra pequena. O teste mostra que as alterações não baixaram a qualidade de respostas que já eram boas.

## O que os testes encontraram no Starbuck 0.2.0

O Starbuck verifica as referências de um manuscrito em relação ao Crossref, ao OpenAlex, ao PubMed e a catálogos de livros. Foi testado com 300 referências de artigos de acesso aberto em biomedicina, ciências sociais e humanidades (em inglês e em português), 90 delas alteradas.

- As 36 referências inventadas ou recombinadas foram todas assinaladas ou ficaram como não verificáveis.
- Não conseguiu verificar 30 % das referências que existem: 4 % em biomedicina, 29 % em ciências sociais e 67 % em humanidades. Os livros e as obras em português foram os que mais vezes ficaram por verificar. Nenhuma referência com DOI o foi.
- O apoio de afirmações (nível 4) marcou 12 de 15 citações mal atribuídas como não apoiadas. Marcou apenas 5 de 15 afirmações distorcidas e marcou 8 de 30 pares não alterados como apoiados em parte ou não apoiados.

## O que isto significa quando usa o Sub-Sub

- Leia a tabela "Quotes for the check" sob cada rascunho. Ela ajuda a verificar cada frase. Não garante que o rascunho está certo.
- Leia "não confirmado" como "verifique este". Livros, teses, relatórios e obras em português faltam muitas vezes nas bases de dados.
- Trate os veredictos sobre afirmações como frases a reler, não como veredictos. O Sub-Sub não altera o seu texto por causa de um deles.
- Quando o Sub-Sub lista o que tem sobre um tema, procure na lista os itens que estão perto do tema mas não tratam dele.

## Limites

- Uma biblioteca de teste, um modelo de linguagem e uma versão de cada ferramenta.
- Os avaliadores são modelos de linguagem. O autor avaliou as discordâncias e uma amostra ao acaso, e os modelos foram mais exigentes do que o autor.
- A biblioteca de teste é pequena, e poucos erros movem muito uma percentagem.
- As alterações da 0.20 foram desenhadas em tarefas de desenvolvimento e verificadas nas 20 tarefas e em rascunhos adicionais. Não foram testadas numa biblioteca diferente.

## Ainda por testar

O Sub-Sub com as ferramentas de pesquisa na web e na literatura ligadas, a pedir obras fora da biblioteca. Está planeado, para depois de o resumo ser submetido, um teste para ver se as obras que cita existem e apoiam as frases.
