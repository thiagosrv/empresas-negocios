#!/usr/bin/env node
// scripts/daily-news.js
// Busca RSS de 5 portais → ranking por relevância → reescreve com GPT-4o-mini → publica no site

import https    from 'https';
import http     from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const OPENAI_KEY  = process.env.OPENAI_API_KEY;
const SITE_URL    = 'https://www.empresasenegocios.com.br';
const MAX_ARTS    = 10;  // artigos por execução
const MAX_TOKENS  = 550; // ~200 palavras de saída

if (!OPENAI_KEY) { console.error('❌  OPENAI_API_KEY não definida'); process.exit(1); }

// ─── FEEDS RSS ────────────────────────────────────────────────────────────────
const FEEDS = [
  { url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml',    tag: 'Brasil',     tagCls: 'brasil'     },
  { url: 'https://g1.globo.com/dynamo/economia/rss2.xml',             tag: 'Economia',   tagCls: ''           },
  { url: 'https://www.infomoney.com.br/feed/',                        tag: 'Financeiro', tagCls: 'financeiro' },
  { url: 'https://exame.com/feed/',                                   tag: 'Negócios',   tagCls: ''           },
  { url: 'https://www.poder360.com.br/feed/',                         tag: 'Política',   tagCls: 'governo'    },
  { url: 'https://rss.uol.com.br/feed/economia.xml',                  tag: 'Economia',   tagCls: ''           },
  { url: 'https://www.terra.com.br/rss/economia.xml',                 tag: 'Negócios',   tagCls: ''           },
  { url: 'https://ge.globo.com/dynamo/futebol/brasileiro-serie-a/rss2.xml', tag: 'Esportes', tagCls: 'futebol' },
  { url: 'https://www.metropoles.com/feed/',                          tag: 'Brasil',     tagCls: 'brasil'     },
];

// ─── PALAVRAS-CHAVE DE PESO ───────────────────────────────────────────────────
const KEYWORDS = [
  'selic','ibovespa','pib','inflação','ipca','dólar','câmbio','reforma tributária',
  'imposto','governo','banco central','petrobras','embraer','vale','startup',
  'tecnologia','inteligência artificial','ia','desemprego','emprego','juros',
  'investimento','bolsa','crise','crescimento','exportação','comércio',
];

// ─── HTTP GET COM REDIRECT ────────────────────────────────────────────────────
function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error('muitos redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return get(res.headers.location, redirects - 1).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── PARSE RSS ────────────────────────────────────────────────────────────────
function parseRSS(xml, feed) {
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#\d+;/g,' ').trim();
  const grab  = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i'));
    return m ? strip(m[1]) : '';
  };
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block   = m[1];
    const title   = grab(block, 'title');
    const desc    = grab(block, 'description').slice(0, 600);
    const pubDate = grab(block, 'pubDate');
    if (!title || title.length < 10) continue;
    const age = pubDate ? Date.now() - new Date(pubDate).getTime() : Infinity;
    items.push({ title, desc, age, tag: feed.tag, tagCls: feed.tagCls });
  }
  return items;
}

// ─── SCORE DE RELEVÂNCIA ──────────────────────────────────────────────────────
function score(item) {
  const text = (item.title + ' ' + item.desc).toLowerCase();
  let s = 0;
  if      (item.age < 6  * 3_600_000) s += 100;
  else if (item.age < 12 * 3_600_000) s += 60;
  else if (item.age < 24 * 3_600_000) s += 20;
  else return -1;
  KEYWORDS.forEach(k => { if (text.includes(k)) s += 12; });
  if (item.title.length > 20 && item.title.length < 120) s += 10;
  return s;
}

// ─── CHAMADA GPT-4o-mini ──────────────────────────────────────────────────────
function rewrite(title, context) {
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: [
          'Você é redator do portal Empresas & Negócios (empresasenegocios.com.br).',
          'Escreva artigos em português brasileiro com tom jornalístico e objetivo.',
          'Use entre 190 e 220 palavras, divididas em 3 parágrafos sem títulos.',
          'Não use markdown, asteriscos nem bullet points.',
          'Inclua dados e contexto real da notícia fornecida.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Escreva um artigo completo sobre esta notícia:\n\nTítulo: ${title}\n\nContexto: ${context || 'Sem contexto adicional.'}\n\nEscreva 3 parágrafos de texto corrido, sem subtítulos, entre 190-220 palavras.`,
      },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.choices?.[0]?.message?.content?.trim() || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escJ(s) { return String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n'); }

function toSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim().replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 55);
}

// ─── GERA HTML DO ARTIGO ──────────────────────────────────────────────────────
const IMAGES = {
  brasil:     'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  financeiro: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  governo:    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  default:    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
};

function buildHTML({ title, desc, bodyText, url, isoDate, tag, tagCls }) {
  const canon = `${SITE_URL}${url}`;
  const img   = IMAGES[tagCls] || IMAGES.default;
  const dateF = new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const paras = bodyText
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 20)
    .map(p => `<p style="font-size:17px;line-height:1.8;margin-bottom:20px;color:#111c2d">${esc(p)}</p>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canon)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canon)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:site_name" content="Empresas &amp; Negócios">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"NewsArticle",
"headline":"${escJ(title)}","description":"${escJ(desc)}",
"image":"${img}","datePublished":"${isoDate}","dateModified":"${isoDate}",
"author":{"@type":"Organization","name":"Redação E&N"},
"publisher":{"@type":"Organization","name":"Empresas & Negócios","url":"${SITE_URL}"}}
</script>
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/editorial.css">
</head>
<body>
<div id="site-header" style="min-height:98px;background:#000"></div>
<main class="container editorial-layout" style="padding-top:40px">
  <article class="content-col">
    <div style="margin-bottom:24px">
      <span class="tag ${tagCls}" style="display:inline-block;margin-bottom:8px">${esc(tag)}</span>
      <h1 style="font-family:var(--ed-font-head,Montserrat,sans-serif);font-size:clamp(24px,4vw,38px);font-weight:800;line-height:1.2;margin:0 0 12px;letter-spacing:-.02em;color:#000">${esc(title)}</h1>
      <p class="meta"><time datetime="${isoDate}">${dateF}</time><span class="dot"></span><span>Redação E&amp;N</span><span class="dot"></span><span>3 min de leitura</span></p>
    </div>
    <img src="${esc(img)}" alt="${esc(title)}" width="800" height="450"
         style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;margin-bottom:28px"
         loading="eager" fetchpriority="high">
    ${paras}
    <section style="margin-top:48px;padding-top:32px;border-top:2px solid #000">
      <h2 style="font-family:var(--ed-font-head,Montserrat,sans-serif);font-size:20px;font-weight:800;margin-bottom:24px">Leia também</h2>
      <div id="art-relacionados" data-artigos="4" data-artigos-tagcls="${tagCls}" data-artigos-allow-repeat="true"></div>
    </section>
  </article>
  <aside class="sidebar">
    <div class="sidebar-widget">
      <h3 class="widget-title">Empresas &amp; Negócios</h3>
      <p>Notícias e análises sobre negócios, economia e inovação no Brasil.</p>
    </div>
    <div class="sidebar-widget" style="margin-top:24px">
      <a href="https://wa.me/5519999115496" target="_blank" rel="noopener"
         style="display:block;background:#000;color:#fff;padding:14px 20px;text-align:center;font-weight:700;border-radius:4px;text-decoration:none">
        Publicar artigo no E&amp;N →
      </a>
    </div>
  </aside>
</main>
<script src="../js/layout.js"></script>
<script src="../js/artigos.js"></script>
<script src="../js/main.js"></script>
</body>
</html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📰  Empresas & Negócios — Publicador Automático');
  console.log('────────────────────────────────────────────────');

  // 1. Busca todos os feeds
  const allItems = [];
  for (const feed of FEEDS) {
    try {
      const xml   = await get(feed.url);
      const items = parseRSS(xml, feed);
      console.log(`  ✓ ${feed.tag.padEnd(12)} ${items.length} itens`);
      allItems.push(...items);
    } catch (e) {
      console.log(`  ✗ ${feed.tag.padEnd(12)} ${e.message}`);
    }
  }

  // 2. Deduplica por título (primeiras 50 chars)
  const seen   = new Set();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 3. Rank por score
  const ranked = unique
    .map(item => ({ ...item, _score: score(item) }))
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score);

  console.log(`\n🔥  ${ranked.length} artigos candidatos (últimas 24h)`);
  if (!ranked.length) { console.log('Nada novo. Encerrando.'); return; }

  // 4. Carrega artigos existentes para evitar duplicatas
  const ARTIGOS_PATH = 'data/artigos.json';
  const raw          = JSON.parse(readFileSync(ARTIGOS_PATH, 'utf8'));
  const artigos      = Array.isArray(raw) ? raw : (raw.articles || []);
  const existingKeys = new Set(artigos.map(a => a.title.toLowerCase().slice(0, 50)));

  const newEntries = [];
  const today      = new Date().toISOString().slice(0, 10);

  // 5. Processa os melhores artigos
  for (const item of ranked) {
    if (newEntries.length >= MAX_ARTS) break;

    const titleKey = item.title.toLowerCase().slice(0, 50);
    if (existingKeys.has(titleKey)) {
      console.log(`  ↷ Já publicado: ${item.title.slice(0, 60)}`);
      continue;
    }

    const slug = toSlug(item.title);
    const filename = `${today}-${slug}.html`;
    const fp       = `noticias/${filename}`;
    const url      = `/noticias/${filename}`;

    if (existsSync(fp)) {
      console.log(`  ↷ Arquivo existe: ${filename}`);
      continue;
    }

    console.log(`\n✍️   Reescrevendo [score ${item._score}]: ${item.title.slice(0, 70)}...`);

    let bodyText;
    try {
      bodyText = await rewrite(item.title, item.desc);
    } catch (e) {
      console.log(`  ✗ GPT erro: ${e.message}`);
      continue;
    }

    if (!bodyText || bodyText.length < 150) {
      console.log('  ✗ Resposta GPT insuficiente, pulando');
      continue;
    }

    const desc = (item.desc || item.title).slice(0, 160);
    const img  = IMAGES[item.tagCls] || IMAGES.default;

    const html = buildHTML({ title: item.title, desc, bodyText, url, isoDate: today, tag: item.tag, tagCls: item.tagCls });
    writeFileSync(fp, html, 'utf8');

    const id = `auto-${today}-${slug.slice(0, 30)}`;
    newEntries.push({ id, title: item.title, description: desc, date: today, tag: item.tag, tagCls: item.tagCls, readMin: 3, url, image: img });

    console.log(`  ✅  ${fp}`);
  }

  // 6. Atualiza artigos.json
  if (newEntries.length) {
    const updated = [...newEntries, ...artigos];
    writeFileSync(ARTIGOS_PATH, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`\n📋  artigos.json atualizado (+${newEntries.length} entradas)`);
    console.log(`🎉  ${newEntries.length} artigo(s) publicado(s) com sucesso!`);
  } else {
    console.log('\nℹ️   Nenhum artigo novo para publicar hoje.');
  }
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
