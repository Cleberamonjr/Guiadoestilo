# Fashionpedia — crédito e condições de uso

Este aplicativo utiliza a **ontologia Fashionpedia** (categorias, partes de peças e atributos), originalmente criada pelo Fashionpedia Consortium.

- Projeto: https://fashionpedia.github.io/home/
- Licença da ontologia e das anotações: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — https://creativecommons.org/licenses/by/4.0/
- Declaração do projeto: https://fashionpedia.github.io/home/data_license.html
- JSON original preservado em `knowledge/fashionpedia-ontology.v1.json`.
- Origem do arquivo: https://github.com/KMnP/fashionpedia-api/blob/master/data/demo/category_attributes_descriptions.json
- Adaptações originais do Guia do Estilo: `knowledge/fashionpedia-bridge.js` (mapeamento entre categorias, interface em português e tags confirmadas pelo usuário); `knowledge/garment-taxonomy.v1.json` (base editorial independente).

**Escopo utilizado:** 46 categorias, sendo 27 categorias de peças e 19 partes/detalhes, e 294 atributos. A versão do JSON é a disponibilizada pelo repositório acima, sem alteração da ontologia original.

**Imagens:** o projeto Fashionpedia não detém necessariamente direitos sobre todas as imagens de seu dataset. Nenhuma fotografia ou máscara de segmentação original da Fashionpedia é distribuída por esta integração. O usuário registra suas próprias imagens.

**Restrições de afirmação:** integração de taxonomia não equivale a treinamento de modelo de visão. O app não afirma detectar automaticamente 294 atributos. O usuário confirma as tags; sugestões de IA, quando oferecidas, precisam ser revisadas.

**Licença de outros datasets:** a licença do dataset FashionStylist é CC BY-NC 4.0 (uso não comercial); por isso, seus registros e imagens não foram importados.
