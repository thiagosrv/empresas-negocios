# Tutorial: Publicar o Site e Ativar a Automação RSS

## Situação atual
- ✅ Site completo criado (13 páginas)
- ✅ Script RSS testado: **8/8 feeds funcionando**
- ✅ GitHub Actions configurado (roda toda hora automaticamente)
- ✅ `data/noticias.json` já populado com notícias reais
- ⏳ Você precisa: subir para o GitHub e ativar o Actions

---

## PASSO 1 — Abrir o Terminal na pasta do projeto

1. Abra a pasta `Empresas e Negocios` no Windows Explorer
2. Clique na barra de endereço do Explorer, digite `cmd` e pressione Enter
3. Um terminal preto vai abrir já na pasta certa

---

## PASSO 2 — Subir o projeto para o GitHub

Cole esses comandos **um por vez** no terminal:

```
git init
git add .
git commit -m "feat: site completo com automação RSS"
git branch -M main
git remote add origin https://github.com/thiagosrv/empresas-negocios.git
git push -u origin main
```

**Se pedir login:** use seu usuário e senha do GitHub.
**Se der erro de senha:** o GitHub exige um "Token" em vez de senha — veja o Passo 2B abaixo.

### Passo 2B — Criar Token do GitHub (se precisar)
1. Acesse: https://github.com/settings/tokens/new
2. Em "Note": escreva `empresas-negocios`
3. Em "Expiration": escolha `No expiration`
4. Marque a caixa `repo` (primeira da lista)
5. Clique em `Generate token`
6. **Copie o token gerado** (começa com `ghp_...`)
7. Use esse token no lugar da senha quando o terminal pedir

---

## PASSO 3 — Ativar permissões do GitHub Actions

1. Acesse: https://github.com/thiagosrv/empresas-negocios
2. Clique em **Settings** (aba no topo)
3. No menu lateral, clique em **Actions** → **General**
4. Role até "Workflow permissions"
5. Selecione **"Read and write permissions"**
6. Clique em **Save**

> ⚠️ Sem isso, o robô não consegue salvar as notícias no repositório.

---

## PASSO 4 — Rodar a automação pela primeira vez (manualmente)

1. Acesse: https://github.com/thiagosrv/empresas-negocios/actions
2. No menu lateral esquerdo, clique em **"Fetch RSS Feeds"**
3. Clique no botão **"Run workflow"** (lado direito)
4. Clique novamente em **"Run workflow"** (botão verde)
5. Aguarde ~1 minuto
6. Quando aparecer ✅ verde, as notícias estão atualizadas

**A partir daí, o GitHub roda automaticamente toda hora.**

---

## PASSO 5 — Hospedar o site (escolha uma opção)

### Opção A: GitHub Pages (grátis, mais simples)

1. No repositório, clique em **Settings**
2. No menu lateral, clique em **Pages**
3. Em "Branch": selecione `main` e a pasta `/ (root)`
4. Clique em **Save**
5. Aguarde 2-3 minutos
6. O site estará em: `https://thiagosrv.github.io/empresas-negocios`

> Para usar o domínio `empresasenegocios.com.br`, vá em **Custom domain**,
> digite seu domínio e siga as instruções para configurar o DNS.

### Opção B: Upload manual por FTP (se já tem hospedagem)

1. Faça o upload de **todos os arquivos e pastas** do projeto para o seu servidor
2. Inclua a pasta `data/` (contém as notícias)
3. Inclua a pasta `node_modules/` NÃO precisa subir (ela é só para rodar o script)
4. O GitHub Actions atualiza o `data/noticias.json` automaticamente no repositório
5. Você precisa configurar um segundo passo no workflow para fazer deploy no seu servidor

---

## Como funciona a automação (resumo)

```
Toda hora cheia:
  GitHub Actions acorda
  → Roda scripts/fetch-rss.js
  → Busca notícias de 8 sites
  → Salva em data/noticias.json
  → Faz commit automático no repositório
  → Site lê esse arquivo e exibe as notícias
```

**Feeds ativos (todos testados e funcionando):**
| Feed | Grupo | Status |
|------|-------|--------|
| G1 Campinas | campinas | ✅ |
| Jornal Americanense | campinas | ✅ |
| Agência Brasil | campinas | ✅ |
| Gazeta Esportiva | esportes | ✅ |
| ESPN Brasil | esportes | ✅ |
| Agência Brasil (Economia) | negócios | ✅ |
| InfoMoney | negócios | ✅ |
| Exame | negócios | ✅ |

---

## Testar o script localmente (quando quiser)

Abra o terminal na pasta do projeto e rode:
```
npm run fetch-rss
```

Vai atualizar o `data/noticias.json` na hora, sem esperar o GitHub.

---

## Dúvidas frequentes

**P: O site mostra "Aguardando primeira atualização"?**
R: Execute o Passo 4 (rodar o workflow manualmente).

**P: O Actions está falhando (❌ vermelho)?**
R: Verifique se completou o Passo 3 (permissões de escrita).

**P: Quero adicionar um novo site de notícias?**
R: Abra `scripts/fetch-rss.js`, copie uma linha do array `FEEDS` e troque o
   nome, URL e grupo. Rode `npm run fetch-rss` para testar.

**P: Como ver os logs da automação?**
R: Acesse https://github.com/thiagosrv/empresas-negocios/actions e clique
   em qualquer execução para ver o log completo.
