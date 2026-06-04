# Como publicar artigos nesta pasta

Coloque seus arquivos `.md` aqui e faça um **push para o GitHub**.
O sistema publica automaticamente — sem precisar mexer em código.

---

## Formato recomendado do arquivo .md

```markdown
---
title: Controle de Acesso em Americana: Guia Completo 2026
description: Descubra como empresas de Americana estão modernizando o controle de acesso com biometria e CFTV.
tag: Serviços
tagCls: servicos
image: https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop
readMin: 5
---

## Introdução

Conteúdo do artigo aqui...

## Segundo subtítulo

Mais conteúdo...
```

---

## Sem frontmatter? Tudo bem!

Se o arquivo não tiver o bloco `---`, o sistema detecta automaticamente:
- **Título** → derivado do nome do arquivo
- **Categoria** → detectada pelas palavras no nome do arquivo
- **Imagem** → imagem padrão da categoria
- **Tempo de leitura** → calculado pelo tamanho do texto

---

## Detecção automática de categoria

| Palavras no nome do arquivo | Tag | Editoria |
|---|---|---|
| `controle-de-acesso`, `facilities`, `portaria`, `limpeza` | Serviços | servicos |
| `inovacao-tecnologica`, `tecnologia`, `digital` | Tecnologia | tecnologia |
| `startups`, `fintech`, `unicornio` | Startups | startups |
| `saude`, `hospital`, `clinica` | Saúde | saude |
| `industria`, `fabrica`, `producao` | Indústrias | industrias |
| `futebol`, `brasileirao`, `copa` | Futebol | futebol |

---

## Como publicar os 47 artigos do Google Drive

1. Baixe os arquivos `.md` do Google Drive
2. Cole nesta pasta (`content/artigos/`)
3. Faça commit + push para o GitHub
4. O GitHub Actions processa e publica automaticamente

