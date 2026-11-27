/**
 * academic-news.js
 * 1 artigo/dia (dias alternados = ~15x/mês) com foco acadêmico e profissional.
 * Cidades-alvo: Campinas, Piracicaba, Americana, Santa Bárbara, Limeira,
 *               Valinhos, Vinhedo, Paulínia e região.
 * Fontes: USP, Unicamp, FAPESP, PEGN, InfoMoney, InfraFM, VocêNoQAP.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http  from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const SITE_URL   = 'https://www.empresasenegocios.com.br/';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) { console.error('❌  OPENAI_API_KEY não definida.'); process.exit(1); }

// ─── FONTES ACADÊMICAS / PROFISSIONAIS ───────────────────────────────────────
const FEEDS = [
  { name: 'Jornal da USP',      url: 'https://jornal.usp.br/feed/',                                        group: 'universidade' },
  { name: 'Jornal Unicamp',     url: 'https://www.unicamp.br/unicamp/noticias/feed',                        group: 'universidade' },
  { name: 'Unicamp Alt',        url: 'https://jornal.unicamp.br/feed/',                                     group: 'universidade' },
  { name: 'Agência FAPESP',     url: 'https://agencia.fapesp.br/feed/',                                     group: 'ciencia'      },
  { name: 'Revista PEGN',       url: 'https://revistapegn.globo.com/rss',                                   group: 'negocios'     },
  { name: 'PEGN Feed',          url: 'https://revistapegn.globo.com/feed/',                                 group: 'negocios'     },
  { name: 'InfoMoney',          url: 'https://www.infomoney.com.br/feed/',                                   group: 'financeiro'   },
  { name: 'Exame',              url: 'https://exame.com/feed/',                                             group: 'negocios'     },
  { name: 'InfraFM',            url: 'https://www.infrafm.com.br/feed/',                                    group: 'infraestrutura'},
  { name: 'VocêNoQAP',          url: 'https://vocenoqap.com.br/feed/',                                      group: 'carreira'     },
  { name: 'VocêRH',             url: 'https://www.voce-rh.com.br/feed/',                                    group: 'carreira'     },
  { name: 'Agência Brasil Edu', url: 'https://agenciabrasil.ebc.com.br/rss/educacao/feed.xml',              group: 'educacao'     },
  { name: 'G1 Campinas',        url: 'https://g1.globo.com/rss/g1/sp/campinas-regiao/',                     group: 'regional'     },
  { name: 'G1 Piracicaba',      url: 'https://g1.globo.com/rss/g1/sp/piracicaba-regiao/',                   group: 'regional'     },
];

const MAX_PER_FEED = 8;

// ─── CIDADES E KEYWORDS ───────────────────────────────────────────────────────
const CIDADES = [
  'campinas', 'piracicaba', 'americana', 'santa bárbara', 'santa barbara',
  'limeira', 'valinhos', 'vinhedo', 'paulínia', 'paulinia',
  'sumaré', 'sumare', 'hortolândia', 'hortolandia', 'indaiatuba',
  'nova odessa', 'cosmópolis', 'artur nogueira',
  'interior de são paulo', 'interior sp', 'região metropolitana de campinas',
  'unicamp', 'usp campinas', 'puccamp', 'unip campinas',
];

const ACADEMIC_KEYWORDS = [
  'pesquisa', 'inovação', 'universidade', 'faculdade', 'graduação', 'pós-graduação',
  'startup', 'empreendedorismo', 'mercado de trabalho', 'empregabilidade', 'carreira',
  'concurso', 'vagas', 'contratação', 'qualificação', 'capacitação', 'curso',
  'tecnologia', 'inteligência artificial', 'ia', 'automação', 'digitalização',
  'exportação', 'faturamento', 'parque tecnológico', 'incubadora', 'aceleradora',
  'fapesp', 'cnpq', 'bolsa', 'patente', 'desenvolvimento econômico',
];

// ─── SCORE ────────────────────────────────────────────────────────────────────
function score(item) {
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
  let s = 0;

  if (item.group === 'regional')    s += 60;
  if (item.group === 'universidade') s += 40;
  if (item.group === 'ciencia')     s += 35;
  if (item.group === 'carreira')    s += 30;

  CIDADES.forEach(c => { if (text.includes(c)) s += 20; });
  ACADEMIC_KEYWORDS.forEach(k => { if (text.includes(k)) s += 8; });

  if (item.title.length < 15) return -1;
  return s;
}

// ─── HTTP FETCH ───────────────────────────────────────────────────────────────
function fetchUrl(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    const lib     = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EmpresasNegocios-RSS/2.0; +https://empresasenegocios.com.br)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    };
    lib.get(url, options, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        return fetchUrl(res.headers.location, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject)
      .setTimeout(12000, function() { this.destroy(new Error('timeout')); });
  });
}

// ─── PARSER RSS SIMPLES ───────────────────────────────────────────────────────
function parseRSS(xml, feed) {
  const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const grab  = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i'));
    return m ? strip(m[1]) : '';
  };
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < MAX_PER_FEED) {
    const block = m[1] || m[2];
    const title = grab(block, 'title');
    const summary = (grab(block, 'description') || grab(block, 'summary') || grab(block, 'content')).slice(0, 500);
    if (!title || title.length < 10) continue;
    items.push({ title, summary, source: feed.name, group: feed.group });
  }
  return items;
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escJ(s) { return String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n'); }
function toSlug(t) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}
function isoDate(d)      { return d.toISOString().slice(0, 10); }
function formatDatePt(d) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); }

// ─── IMAGENS E CATEGORIAS ─────────────────────────────────────────────────────
const IMAGES = {
  universidade: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
  ciencia:      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
  carreira:     'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80',
  negocios:     'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
  financeiro:   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  regional:     'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
  default:      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
};

const TAG_INFO = {
  universidade:   { label: 'Educação',    page: 'pages/brasil.html',    tagCls: 'brasil'     },
  ciencia:        { label: 'Tecnologia',  page: 'pages/tecnologia.html', tagCls: 'tecnologia' },
  carreira:       { label: 'Negócios',    page: 'pages/novidades.html',  tagCls: 'negocios'   },
  negocios:       { label: 'Negócios',    page: 'pages/novidades.html',  tagCls: 'negocios'   },
  financeiro:     { label: 'Economia',    page: 'pages/novidades.html',  tagCls: 'economia'   },
  infraestrutura: { label: 'Indústrias',  page: 'pages/industrias.html', tagCls: 'industrias' },
  regional:       { label: 'Campinas',    page: 'pages/campinas.html',   tagCls: 'campinas'   },
  default:        { label: 'Negócios',    page: 'pages/novidades.html',  tagCls: 'negocios'   },
};

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
function callGPT(messages) {
  const body = JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 3200,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${OPENAI_KEY}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const usage = json.usage;
          if (usage) console.log(`\n📊  Tokens: input=${usage.prompt_tokens} output=${usage.completion_tokens} total=${usage.total_tokens}`);
          resolve(json.choices?.[0]?.message?.content?.trim() || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateArticle(source) {
  const system = [
    'Você é editor-chefe do portal Empresas & Negócios (empresasenegocios.com.br),',
    'especialista em cobertura acadêmica, profissional e de inovação na região de Campinas',
    'e interior de São Paulo (Unicamp, USP, Piracicaba, Americana, Santa Bárbara D\'Oeste,',
    'Limeira, Valinhos, Vinhedo, Paulínia e cidades vizinhas).',
    '',
    'Escreva um artigo jornalístico editorial COMPLETO em português brasileiro.',
    'Foco: impacto acadêmico, profissional, de carreira e inovação para empresas e',
    'profissionais do interior de São Paulo.',
    'O artigo deve ter entre 650 e 950 palavras.',
    'Se a notícia for nacional, conecte ao impacto regional (Campinas/interior SP).',
    '',
    'Retorne APENAS um objeto JSON com exatamente este formato:',
    '{',
    '  "title": "Título SEO otimizado (máx 70 chars), inclua cidade ou instituição se relevante",',
    '  "description": "Meta description (140-160 chars)",',
    '  "slug": "slug-em-kebab-case-sem-acentos-max-60-chars",',
    '  "tag": "uma de: Educação | Tecnologia | Negócios | Economia | Indústrias | Campinas | Carreira",',
    '  "tagCls": "uma de: brasil | tecnologia | negocios | economia | industrias | campinas | servicos",',
    '  "readMin": número_inteiro,',
    '  "sections": [',
    '    {"type": "intro", "text": "parágrafo de abertura forte (80-120 palavras)"},',
    '    {"type": "h2", "text": "Subtítulo"},',
    '    {"type": "p", "text": "parágrafo (60-100 palavras)"},',
    '    {"type": "h2", "text": "Subtítulo"},',
    '    {"type": "p", "text": "parágrafo"},',
    '    {"type": "highlight", "text": "dado ou citação de impacto para destaque"},',
    '    {"type": "p", "text": "parágrafo"},',
    '    {"type": "h2", "text": "O que isso significa para profissionais de Campinas e região"},',
    '    {"type": "p", "text": "parágrafo com impacto regional concreto"},',
    '    {"type": "h2", "text": "Como se preparar / O que fazer"},',
    '    {"type": "p", "text": "parágrafo com orientação prática"},',
    '    {"type": "p", "text": "parágrafo de conclusão com perspectiva"}',
    '  ]',
    '}',
    '',
    'Regras: mínimo 5 seções h2, 650-950 palavras total, português brasileiro formal,',
    'tom analítico e profissional, sem markdown/asteriscos nos textos de parágrafo.',
  ].join('\n');

  const user = [
    `Notícia fonte:\nTítulo: ${source.title}`,
    `Fonte: ${source.source} (${source.group})`,
    source.summary ? `Resumo: ${source.summary}` : '',
    '',
    'Escreva o artigo completo seguindo as instruções do sistema.',
  ].filter(Boolean).join('\n');

  const raw  = await callGPT([{ role: 'system', content: system }, { role: 'user', content: user }]);
  const data = JSON.parse(raw);
  if (!data.sections || !Array.isArray(data.sections)) throw new Error('JSON sem campo sections');
  return data;
}

// ─── HTML ─────────────────────────────────────────────────────────────────────
function buildBody(sections) {
  return sections.map(sec => {
    switch (sec.type) {
      case 'intro':
        return `<p style="font-size:19px;line-height:1.85;margin-bottom:24px;color:#111c2d;font-weight:400">${esc(sec.text)}</p>`;
      case 'h2':
        return `<h2 style="font-size:clamp(20px,3vw,26px);font-weight:800;line-height:1.3;margin:40px 0 16px;color:#0a0f1e">${esc(sec.text)}</h2>`;
      case 'h3':
        return `<h3 style="font-size:18px;font-weight:700;line-height:1.35;margin:28px 0 12px;color:#0a0f1e">${esc(sec.text)}</h3>`;
      case 'p': case 'conclusion':
        return `<p style="font-size:17px;line-height:1.85;margin-bottom:20px;color:#111c2d">${esc(sec.text)}</p>`;
      case 'highlight':
        return `<blockquote style="border-left:4px solid #0057e7;background:#f0f4ff;padding:18px 22px;margin:28px 0;font-size:18px;font-style:italic;color:#0a0f1e;border-radius:0 8px 8px 0">${esc(sec.text)}</blockquote>`;
      case 'list':
        return `<ul style="margin:0 0 20px;padding-left:22px;">${(sec.items||[]).map(i=>`<li style="font-size:17px;line-height:1.75;margin-bottom:8px;color:#111c2d">${esc(i)}</li>`).join('')}</ul>`;
      default:
        return sec.text ? `<p style="font-size:17px;line-height:1.85;margin-bottom:20px;color:#111c2d">${esc(sec.text)}</p>` : '';
    }
  }).join('\n    ');
}

function buildHtml(article, today, fileName) {
  const isoStr   = isoDate(today);
  const dateStr  = formatDatePt(today);
  const canonUrl = `${SITE_URL}noticias/${fileName}`;
  const catInfo  = TAG_INFO[article.tagCls] || TAG_INFO.default;
  const imgUrl   = IMAGES[article._group] || IMAGES[article.tagCls] || IMAGES.default;
  const body     = buildBody(article.sections);
  const readMin  = article.readMin || Math.round(article.sections.map(s=>s.text||'').join(' ').split(/\s+/).length / 200);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(article.title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${esc(article.description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"/>
<link rel="canonical" href="${canonUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${esc(article.title)}"/>
<meta property="og:description" content="${esc(article.description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${imgUrl}"/>
<meta property="og:site_name" content="Empresas &amp; Negócios"/>
<meta property="og:locale" content="pt_BR"/>
<meta property="article:published_time" content="${isoStr}T10:00:00-03:00"/>
<meta property="article:section" content="${esc(catInfo.label)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"${escJ(article.title)}","description":"${escJ(article.description)}","image":"${imgUrl}","datePublished":"${isoStr}T10:00:00-03:00","dateModified":"${isoStr}T10:00:00-03:00","author":{"@type":"Organization","name":"Empresas &amp; Negócios","url":"${SITE_URL}"},"publisher":{"@type":"Organization","name":"Empresas &amp; Negócios","url":"${SITE_URL}"},"mainEntityOfPage":"${canonUrl}","inLanguage":"pt-BR"}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"${SITE_URL}"},{"@type":"ListItem","position":2,"name":"${escJ(catInfo.label)}","item":"${SITE_URL}${catInfo.page}"},{"@type":"ListItem","position":3,"name":"${escJ(article.title)}","item":"${canonUrl}"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>
<div class="ticker-bar"><div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;overflow:hidden;"><span class="ticker-label">Últimas</span><div class="ticker-track" id="tickerTrack"><span>${esc(article.title)}</span></div></div></div>
<header class="site-header">
  <div class="header-top">
    <button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
    <a href="../index.html" class="logo"><span class="logo-text">Empresas<span>&</span>Negócios</span></a>
    <div class="header-actions"><a class="btn-subscribe" href="#newsletter">Newsletter</a></div>
  </div>
  <nav class="main-nav" id="mainNav"><div class="nav-inner">
    <a href="../index.html">Início</a><a href="../pages/novidades.html">Novidades</a><a href="../pages/startups.html">Startups</a><a href="../pages/tecnologia.html">Tecnologia</a><a href="../pages/brasil.html">Brasil</a><a href="../pages/vagas.html">Vagas</a><a href="../pages/futebol.html">⚽ Futebol</a>
    <div class="nav-more-wrap"><button class="nav-more-btn" id="navMoreBtn" aria-expanded="false" aria-haspopup="true">Mais ▾</button><div class="nav-dropdown" id="navDropdown"><a href="../pages/servicos.html">Serviços</a><a href="../pages/industrias.html">Indústrias</a><a href="../pages/saude.html">Saúde</a><a href="../pages/sociedade.html">Sociedade</a><a href="../pages/cultura.html">Cultura</a><a href="../pages/mundo.html">Mundo</a><a href="../pages/campinas.html">Campinas</a><a href="../pages/esportes.html">Esportes</a><a href="../pages/tempo.html">🌤️ Tempo</a><a href="../pages/noticias-locais.html">Local</a></div></div>
  </div></nav>
</header>
<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../${catInfo.page}">${esc(catInfo.label)}</a> › <span>${esc(article.title.slice(0,55))}${article.title.length>55?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag ${esc(article.tagCls)}">${esc(catInfo.label)}</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${esc(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${readMin} min de leitura</span><span class="dot"></span><span>Redação Empresas &amp; Negócios</span></div>
    <img src="${imgUrl}" alt="${esc(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager" fetchpriority="high"/>
    ${body}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:32px 0 40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title+' — '+canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
    </div>
  </div>
  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">📧 Newsletter</div>
      <div class="widget-body"><p class="nl-desc">Negócios e economia no seu e-mail todo dia.</p>
        <form onsubmit="handleNewsletter(event)"><input type="email" placeholder="Seu e-mail" required/><button type="submit" class="btn-nl">Inscrever-se</button></form>
        <p class="nl-privacy">Sem spam.</p></div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;"><a href="https://psprotecao.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="PS Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
    <div class="sidebar-widget"><div class="widget-header">📂 Editorias</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;">
        <li><a href="../pages/campinas.html"    style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">📍 Campinas e Região</a></li>
        <li><a href="../pages/tecnologia.html"  style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">💻 Tecnologia</a></li>
        <li><a href="../pages/startups.html"    style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🚀 Startups</a></li>
        <li><a href="../pages/industrias.html"  style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🏭 Indústrias</a></li>
        <li><a href="../pages/vagas.html"       style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;">💼 Vagas</a></li>
      </ul></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro do que importa</h2><p>Receba as principais notícias de negócios, economia e inovação toda manhã.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/startups.html">Startups</a></li><li><a href="../pages/tecnologia.html">Tecnologia</a></li><li><a href="../pages/brasil.html">Brasil</a></li></ul></div>
  <div class="footer-col"><h4>Mais</h4><ul><li><a href="../pages/industrias.html">Indústrias</a></li><li><a href="../pages/novidades.html">Novidades</a></li><li><a href="../pages/vagas.html">Vagas</a></li><li><a href="../pages/saude.html">Saúde</a></li></ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul><li><a href="#">Sobre nós</a></li><li><a href="#">Anuncie</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 Empresas &amp; Negócios.</span></div></footer>
<div class="toast" id="toast"><span class="toast-icon">✅</span><span id="toastMsg">Inscrição realizada!</span></div>
<button class="back-to-top" id="backToTop">↑</button>
<script src="../js/main.js"></script>
</body></html>`;
}

// ─── ARTIGOS.JSON ─────────────────────────────────────────────────────────────
function loadArtigos() {
  const p = join(ROOT, 'data', 'artigos.json');
  if (!existsSync(p)) return [];
  try { const r = JSON.parse(readFileSync(p,'utf8')); return Array.isArray(r) ? r : (r.articles||[]); }
  catch { return []; }
}
function saveArtigos(artigos, newEntry) {
  writeFileSync(join(ROOT,'data','artigos.json'), JSON.stringify([newEntry, ...artigos], null, 2), 'utf8');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎓  Academic News — artigo profissional/acadêmico (Campinas & Região)');
  console.log('────────────────────────────────────────────────────────────────────\n');

  // 1. Busca RSS de todas as fontes acadêmicas
  const allItems = [];
  for (const feed of FEEDS) {
    try {
      const xml   = await fetchUrl(feed.url);
      const items = parseRSS(xml, feed);
      console.log(`  ✓ ${feed.name.padEnd(20)} ${items.length} itens`);
      allItems.push(...items);
    } catch (e) {
      console.log(`  ✗ ${feed.name.padEnd(20)} ${e.message}`);
    }
  }

  console.log(`\n📋  ${allItems.length} itens coletados no total`);
  if (!allItems.length) { console.error('❌  Nenhum item encontrado. Encerrando.'); process.exit(1); }

  // 2. Deduplication por título
  const seen   = new Set();
  const unique = allItems.filter(item => {
    const k = item.title.toLowerCase().slice(0, 50);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // 3. Score e rank
  const ranked = unique
    .map(item => ({ ...item, _score: score(item) }))
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score);

  console.log(`🔥  ${ranked.length} candidatos após scoring\n`);

  // 4. Carrega artigos existentes
  const artigos      = loadArtigos();
  const existingKeys = new Set(artigos.map(a => a.title.toLowerCase().slice(0, 50)));

  let chosen = null;
  for (const item of ranked) {
    if (existingKeys.has(item.title.toLowerCase().slice(0, 50))) {
      console.log(`  ↷ Já publicado: ${item.title.slice(0, 65)}`);
      continue;
    }
    chosen = item;
    break;
  }

  if (!chosen) {
    console.log('\n⚠️  Nenhum candidato novo. Encerrando sem publicar.');
    process.exit(0);
  }

  console.log(`\n✅  Escolhido [score ${chosen._score}]:`);
  console.log(`    ${chosen.title}`);
  console.log(`    Fonte: ${chosen.source} | Grupo: ${chosen.group}\n`);

  // 5. Gera artigo com GPT-4o
  console.log('🤖  Gerando artigo com GPT-4o...');
  let article;
  try { article = await generateArticle(chosen); }
  catch (e) { console.error('❌  Erro GPT:', e.message); process.exit(1); }

  article._group = chosen.group;
  console.log(`\n📝  "${article.title}"`);
  console.log(`    Seções: ${article.sections.length} | Tag: ${article.tag} | ${article.readMin} min`);

  // 6. Salva HTML
  const today    = new Date();
  const isoStr   = isoDate(today);
  const slug     = toSlug(article.slug || article.title);
  const fileName = `${isoStr}-acad-${slug}.html`;   // prefixo "acad-" evita conflito com quality-news
  const filePath = join(ROOT, 'noticias', fileName);

  if (existsSync(filePath)) {
    console.log(`\n⏭️  Arquivo já existe: ${fileName}`);
    process.exit(0);
  }

  mkdirSync(join(ROOT, 'noticias'), { recursive: true });
  writeFileSync(filePath, buildHtml(article, today, fileName), 'utf8');
  console.log(`\n💾  HTML salvo: noticias/${fileName}`);

  // 7. Atualiza artigos.json
  const catInfo  = TAG_INFO[article.tagCls] || TAG_INFO.default;
  const imgUrl   = IMAGES[chosen.group] || IMAGES[article.tagCls] || IMAGES.default;
  const newEntry = {
    id:          `acad-${isoStr}-${slug}`,
    title:       article.title,
    description: article.description,
    date:        isoStr,
    tag:         article.tag,
    tagCls:      article.tagCls,
    readMin:     article.readMin,
    image:       imgUrl,
    url:         `noticias/${fileName}`,
  };

  saveArtigos(artigos, newEntry);
  console.log(`📊  artigos.json atualizado (${artigos.length + 1} entradas)`);
  console.log(`\n🚀  Publicado: ${SITE_URL}noticias/${fileName}\n`);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
