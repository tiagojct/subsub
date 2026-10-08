---
layout: base.njk
title: Privacidade e segurança
lang: pt-PT
alt: /privacy/
eyebrow: O que fica, o que sai
lead: O Sub-Sub corre no seu computador. A sua biblioteca fica no Zotero. Escolhe o fornecedor do modelo e aprova cada alteração.
---

## O que fica no seu computador

- A sua biblioteca do Zotero. O Sub-Sub lê-a e altera-a apenas através da API local do Zotero, no seu computador (127.0.0.1). Nunca usa a sua conta zotero.org.
- As suas notas, a sua lista de etiquetas e as suas definições.
- O registo de alterações (`~/.local/share/zotero-local-mcp`), que o `/undo` usa.

O Sub-Sub não envia dados de utilização, estatísticas nem relatórios de erros para lado nenhum. Também desliga o relatório de instalação do pi, o programa em que se baseia.

Para o piloto, pode ligar um registo de utilização (`subsub init`, Usage log). Fica no seu computador, em `~/.subsub/usage-log.jsonl`, e guarda horas, contagens, comandos e nomes de ferramentas, nunca o que escreveu nem o que o Sub-Sub respondeu. O `subsub usage` mostra-o. O Sub-Sub não o envia; decide se o partilha.

## O que vai para o fornecedor do modelo

O modelo de IA corre no fornecedor que escolher. Recebe as suas mensagens e o que as ferramentas lhe devolvem: títulos, autores, resumos, etiquetas e partes de um texto completo quando pede uma nota sobre ele. Quando verifica afirmações com `/verify <file> claims`, recebe também as frases do seu manuscrito que citam e as passagens das fontes. Escolha um fornecedor cujos termos sirvam o seu material. Para trabalho confidencial, use um serviço de modelos institucional ou um modelo local (veja [Modelos](/pt/modelos/)). Os níveis gratuitos têm os seus próprios termos: fora da União Europeia, do Reino Unido e da Suíça, a Google pode usar os pedidos enviados com uma chave gratuita para melhorar os seus produtos, e os fornecedores de alguns modelos gratuitos do OpenRouter podem guardar os pedidos.

## O que vai para outros serviços

| Serviço | O que recebe | Quando |
|---|---|---|
| PubMed (NCBI) | Os seus termos de pesquisa; DOI e PMID | Pesquisas, importações, reparação de metadados; o endereço do autor para `/request-copy` (lido apenas do registo da PubMed) |
| Europe PMC | Os seus termos de pesquisa, DOI e PMID | Pesquisas, importações, texto completo em acesso aberto |
| OpenAlex | Os seus termos de pesquisa, DOI | Pesquisas, grafo de citações, alertas, verificação de retratações |
| Crossref | DOI, títulos | Importações, reparação de metadados, verificação de retratações |
| Unpaywall | DOI | PDF de acesso aberto |
| Open Library | ISBN; títulos e autores | Importação de livros; encontrar a referência de um ficheiro sem item principal |
| Google Books, Internet Archive, Wikidata | Títulos, nomes de publicações e datas | Encontrar a referência de um ficheiro sem item principal |
| Brave Search (Estados Unidos) | Títulos, nomes de publicações e datas | O mesmo, apenas se guardou uma chave do Brave Search no `subsub init` |
| Crossref, DataCite, PubMed, OpenAlex, arXiv, Open Library, Europe PMC | Os identificadores e os títulos das obras citadas, e o seu email de contacto | Verificação de referências (Starbuck), apenas se ligar o complemento |
| npm, PyPI | Transferência de pacotes | Instalação e atualização |

Estes serviços recebem identificadores e termos de pesquisa, não as suas notas nem a sua biblioteca. Se indicar um email de contacto no `subsub init`, cada pedido a estes serviços leva-o, como eles pedem (o Unpaywall exige-o). Sem ele, o Sub-Sub não consegue encontrar PDF de acesso aberto.

As pesquisas só acontecem no modo Investigador. O Bibliotecário também contacta estes serviços, mas apenas para importar, reparar e verificar os itens com que trabalha, e para encontrar a referência de um ficheiro sem item principal. Para esses ficheiros, o Sub-Sub envia o título, a publicação e a data que leu no ficheiro, nunca outro texto dele.

O Sub-Sub não envia emails. O `/request-copy` escreve um rascunho na sua pasta do Sub-Sub; decide se o envia.

## Para um encarregado de proteção de dados

- Responsável pelo tratamento: a pessoa que usa o Sub-Sub. O Sub-Sub é um programa no computador dessa pessoa, não um serviço; o seu autor não recebe dados.
- Subcontratantes: o fornecedor do modelo que o utilizador escolhe, nos termos desse fornecedor (veja [Para onde vão os seus dados](/pt/modelos/#para-onde-vao-os-seus-dados)), e os serviços bibliográficos da tabela acima.
- Dados enviados ao fornecedor do modelo: as mensagens do utilizador e o que as ferramentas devolvem (registos bibliográficos, resumos, etiquetas, passagens de textos completos, passagens do manuscrito do utilizador quando verifica afirmações). O Sub-Sub não se destina a dados de doentes, nem os procura.
- Localização: a Mistral trata os dados na União Europeia; os outros fornecedores sobretudo nos Estados Unidos ou noutros países. Para material que tem de ficar na UE, use a Mistral, um serviço de modelos da instituição ou um modelo local.
- Conservação: o Sub-Sub guarda as conversas, as notas e o registo de alterações apenas no computador do utilizador. A conservação no fornecedor do modelo segue os termos deste.
- Registos: nenhum é enviado. O registo de utilização do piloto está desligado, a menos que o utilizador o ligue, fica no computador e não contém conteúdo.

## Segurança

- Cada alteração à biblioteca aparece primeiro numa pré-visualização e só é executada depois de a aprovar. A verificação está no programa; o modelo não a pode saltar.
- Se editar um item no Zotero enquanto a pré-visualização está aberta, o Sub-Sub mostra-lhe a nova pré-visualização antes de alterar alguma coisa. Cada alteração envia também a versão do item, por isso um campo que edite no momento da escrita não é substituído.
- Cada alteração fica no registo de alterações e pode ser anulada, incluindo uma coleção nova (anular move-a para o lixo do Zotero).
- Nada é apagado. Os itens vão para o lixo do Zotero; as etiquetas são retiradas dos itens.
- Só se podem acrescentar etiquetas da sua lista de etiquetas.
- O Bibliotecário não tem ferramentas de pesquisa.
- O texto dos resumos, dos textos completos, das páginas web e dos resultados de pesquisa é tratado como dados. As instruções do Sub-Sub dizem ao modelo que nunca siga instruções que encontre nesse texto.
- Uma pesquisa enviada a um serviço externo é verificada no programa: uma consulta com mais de 1500 carateres ou com mais de três linhas é recusada, para que passagens das suas notas ou dos textos completos não saiam como "pesquisa".
- Uma nota de literatura escrita a partir do texto completo só pode citar o que o texto completo diz. O Sub-Sub compara cada citação com o texto do item no Zotero e recusa a nota quando uma citação não está lá.
- O Sub-Sub não tem acesso à shell. A escrita fora da sua pasta do Sub-Sub e da pasta atual, e a escrita em ficheiros de definições e de regras, precisam do seu sim.
- A vista no navegador é um pequeno servidor no seu próprio computador. Só escuta em 127.0.0.1, por isso outros computadores não lhe conseguem aceder. O endereço que a abre contém uma chave aleatória; outros sites não conseguem ler a página nem responder a uma aprovação. Desliga-se sozinha 10 minutos depois de fechar a página.
- Uma chave de API que guarde na vista no navegador fica no seu computador, no mesmo ficheiro que o `/login` usa (`~/.subsub/agent/auth.json`, que só pode ser lido por si). Só é enviada a esse fornecedor.
