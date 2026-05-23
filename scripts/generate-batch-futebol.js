/**
 * generate-batch-futebol.js
 * Gera 20 artigos jornalísticos reais via GPT-4o sobre futebol brasileiro:
 * Brasileirão, Libertadores, Seleção, Copa do Mundo 2026, Copa do Brasil,
 * mercado de transferências, SAF, futebol feminino e mais.
 *
 * Uso: node scripts/generate-batch-futebol.js
 * Requer: OPENAI_API_KEY
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── 20 TÓPICOS DE FUTEBOL ────────────────────────────────────────────────────
const BATCH = [
  // ── BRASILEIRÃO SÉRIE A ───────────────────────────────────────────────────
  {
    topic: 'Brasileirão 2026: análise das primeiras rodadas, times em destaque e quem briga pelo título da Série A',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Brasileirão', daysAgo: 0,
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=450&fit=crop',
  },
  {
    topic: 'Flamengo 2026: investimentos, contratações e a estratégia para vencer o Brasileirão e a Libertadores ao mesmo tempo',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Brasileirão', daysAgo: 1,
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=450&fit=crop',
  },
  {
    topic: 'Palmeiras em 2026: força do elenco, sistema de jogo e por que o Verdão é favorito ao Brasileirão',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Brasileirão', daysAgo: 2,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop',
  },
  {
    topic: 'Corinthians e o plano de reestruturação financeira em 2026: SAF, dívidas e a busca pela recuperação dentro das quatro linhas',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Brasileirão', daysAgo: 3,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
  },
  // ── COPA LIBERTADORES ─────────────────────────────────────────────────────
  {
    topic: 'Copa Libertadores 2026: os times brasileiros na competição, principais adversários e chances reais de título',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Libertadores', daysAgo: 0,
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=450&fit=crop',
  },
  {
    topic: 'Libertadores 2026: análise dos grupos, times argentinos e o favorito para levar o título continental',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Libertadores', daysAgo: 2,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&h=340&fit=crop',
  },
  // ── COPA DO MUNDO 2026 ────────────────────────────────────────────────────
  {
    topic: 'Copa do Mundo 2026: tudo o que você precisa saber sobre o torneio nos EUA, Canadá e México — grupos, sedes e formato',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Copa do Mundo', daysAgo: 1,
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&h=450&fit=crop',
  },
  {
    topic: 'Copa do Mundo 2026 e o impacto econômico de US$ 5 bilhões: negócios, patrocinadores e oportunidades para marcas brasileiras',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Copa do Mundo', daysAgo: 4,
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=450&fit=crop',
  },
  // ── SELEÇÃO BRASILEIRA ────────────────────────────────────────────────────
  {
    topic: 'Seleção Brasileira 2026: análise do técnico, convocações, estilo de jogo e as chances reais na Copa do Mundo',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Seleção', daysAgo: 0,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
  },
  {
    topic: 'Vinicius Jr, Rodrygo e a nova geração da Seleção: quem são os craque que vão representar o Brasil na Copa de 2026',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Seleção', daysAgo: 3,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop',
  },
  // ── COPA DO BRASIL ────────────────────────────────────────────────────────
  {
    topic: 'Copa do Brasil 2026: times favoritos, surpresas das fases iniciais e o maior prêmio em dinheiro da história da competição',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Copa do Brasil', daysAgo: 2,
    image: 'https://images.unsplash.com/photo-1551958219-acbc595d559f?w=800&h=450&fit=crop',
  },
  // ── MERCADO E TRANSFERÊNCIAS ──────────────────────────────────────────────
  {
    topic: 'Mercado de transferências do futebol brasileiro em 2026: as maiores vendas, compras e o novo patamar do futebol nacional',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Transferências', daysAgo: 1,
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=450&fit=crop',
  },
  {
    topic: 'SAF no Brasil: como a Sociedade Anônima do Futebol está transformando a gestão, as finanças e o futuro dos clubes brasileiros',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Negócios', daysAgo: 2,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  },
  {
    topic: 'Patrocínios no futebol brasileiro 2026: marcas que mais investem, valores e o retorno de imagem para as empresas',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Negócios', daysAgo: 3,
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop',
  },
  // ── REVELAÇÕES E JOVENS TALENTOS ──────────────────────────────────────────
  {
    topic: 'Os 10 maiores talentos revelados pelo futebol brasileiro em 2026: jovens que impressionam e já têm proposta da Europa',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Revelações', daysAgo: 1,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=450&fit=crop',
  },
  {
    topic: 'Futebol de base no Brasil: como Flamengo, Palmeiras e outros clubes estão formando os cracks do futuro',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Revelações', daysAgo: 4,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
  },
  // ── FUTEBOL FEMININO ──────────────────────────────────────────────────────
  {
    topic: 'Futebol feminino brasileiro em 2026: crescimento recorde, Brasileirão Feminino e a Seleção Feminina na Copa do Mundo',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Futebol Feminino', daysAgo: 2,
    image: 'https://images.unsplash.com/photo-1568819317551-31051b37f69f?w=800&h=450&fit=crop',
  },
  // ── TECNOLOGIA E ARBITRAGEM ───────────────────────────────────────────────
  {
    topic: 'VAR e a tecnologia no futebol brasileiro: evolução, polêmicas e como o sistema mudou o jogo na Série A em 2026',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Tecnologia', daysAgo: 3,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
  },
  // ── BRASILEIRÃO SÉRIE B ───────────────────────────────────────────────────
  {
    topic: 'Brasileirão Série B 2026: os favoritos ao acesso, times que surpreendem e o sonho de chegar à elite do futebol nacional',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Brasileirão', daysAgo: 4,
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=450&fit=crop',
  },
  // ── FUTEBOL NO INTERIOR ───────────────────────────────────────────────────
  {
    topic: 'Futebol no interior de São Paulo em 2026: a história dos clubes de Americana, Campinas e região no Paulista e na Série D',
    tag: 'Futebol', tagCls: 'futebol', subcat: 'Futebol Regional', daysAgo: 3,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
  },
];

// ─── TAG → PÁGINA ─────────────────────────────────────────────────────────────
const TAG_TO_PAGE = {
  'Futebol': { page: 'pages/futebol.html', label: 'Futebol' },
};

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function isoDate(d)    { return d.toISOString().split('T')[0]; }
function escHtml(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, tag, tagCls, subcat } = entry;

  const prompt = `Você é um jornalista esportivo especializado em futebol brasileiro, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br) na seção de Futebol Brasileiro.

Escreva um artigo jornalístico completo e informativo sobre: "${topic}"

DIRETRIZES ESPECÍFICAS:
- Tom: jornalístico esportivo, envolvente, com autoridade — use dados reais e plausíveis de 2026
- Tamanho: 700 a 900 palavras de conteúdo real (sem repetição)
- Use estatísticas concretas: gols, pontos na tabela, valores de transferências, datas de jogos
- Mencione nomes de jogadores, técnicos e clubes reais quando relevante
- Subcategoria desta matéria: ${subcat}
- Contexto: Brasil 2026 — Copa do Mundo acontece neste ano (EUA/Canadá/México)
- Escreva com perspectiva de quem acompanha o futebol de perto, não superficialmente
- NÃO use linguagem sensacionalista exagerada

Retorne APENAS JSON válido, sem markdown:
{
  "title": "título SEO atraente (máx 85 chars, com palavras-chave de futebol)",
  "description": "meta description (máx 155 chars, persuasiva para torcedores e curiosos)",
  "slug": "slug-sem-acentos-hifenizado-max-65-chars",
  "tag": "${tag}",
  "tagCls": "${tagCls}",
  "readMin": 5,
  "sections": [
    { "type": "intro",     "text": "parágrafo de abertura impactante com dado ou fato concreto de 2026" },
    { "type": "h2",        "text": "Primeiro subtítulo informativo" },
    { "type": "p",         "text": "análise com dados e contexto" },
    { "type": "list",      "items": ["ponto relevante 1", "ponto relevante 2", "ponto relevante 3", "ponto relevante 4"] },
    { "type": "h2",        "text": "Segundo subtítulo" },
    { "type": "p",         "text": "parágrafo com análise aprofundada" },
    { "type": "highlight", "text": "estatística ou citação de destaque" },
    { "type": "h2",        "text": "Perspectivas e o que esperar" },
    { "type": "p",         "text": "conclusão com o que o leitor pode esperar dos próximos capítulos" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 3500, temperature: 0.75,
    messages: [
      { role: 'system', content: 'Jornalista esportivo experiente especializado em futebol brasileiro. Responda SEMPRE com JSON puro e válido, sem markdown.' },
      { role: 'user',   content: prompt },
    ],
  });
  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw.replace(/^```json?\n?/,'').replace(/\n?```$/,'').trim());
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;

  let body = '';
  for (const s of article.sections) {
    if (s.type === 'intro')     body += `<p style="font-size:19px;line-height:1.85;font-weight:500;color:#1a1a1a;margin-bottom:28px;">${escHtml(s.text)}</p>\n`;
    if (s.type === 'h2')        body += `<h2 style="font-size:22px;font-weight:800;margin:36px 0 14px;">${escHtml(s.text)}</h2>\n`;
    if (s.type === 'h3')        body += `<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;">${escHtml(s.text)}</h3>\n`;
    if (s.type === 'p')         body += `<p style="font-size:16px;line-height:1.85;margin-bottom:20px;color:#333;">${escHtml(s.text)}</p>\n`;
    if (s.type === 'highlight') body += `<div style="background:#f0fff0;border-left:4px solid #27ae60;padding:20px 24px;border-radius:0 8px 8px 0;margin:28px 0;font-size:16px;font-style:italic;color:#1a4d1a;">${escHtml(s.text)}</div>\n`;
    if (s.type === 'list')      body += `<ul style="font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333;">${(s.items||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>\n`;
    if (s.type === 'quote')     body += `<blockquote style="border-left:4px solid #27ae60;padding:16px 24px;margin:28px 0;background:#f0fff0;border-radius:0 8px 8px 0;"><p style="font-size:17px;font-style:italic;">"${escHtml(s.text)}"</p>${s.author?`<cite>— ${escHtml(s.author)}</cite>`:''}</blockquote>\n`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(article.title)} | Futebol Brasileiro — Empresas &amp; Negócios</title>
<meta name="description" content="${escHtml(article.description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"/>
<link rel="canonical" href="${canonUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${escHtml(article.title)}"/>
<meta property="og:description" content="${escHtml(article.description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${imageUrl}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"${article.title.replace(/"/g,'\\"')}","description":"${article.description.replace(/"/g,'\\"')}","image":"${imageUrl}","datePublished":"${isoStr}","author":{"@type":"Organization","name":"Empresas & Negócios","url":"https://www.empresasenegocios.com.br"},"publisher":{"@type":"Organization","name":"Empresas & Negócios"},"mainEntityOfPage":"${canonUrl}","inLanguage":"pt-BR","articleSection":"Futebol"}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>
<div class="ticker-bar"><div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;overflow:hidden;"><span class="ticker-label">⚽ Futebol</span><div class="ticker-track" id="tickerTrack"><span>${escHtml(article.title)}</span><span>Brasileirão 2026 — tabela e resultados ao vivo</span><span>Libertadores — times brasileiros em destaque</span></div></div></div>
<header class="site-header">
  <div class="header-top">
    <button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
    <a href="../index.html" class="logo"><span class="logo-text">Empresas<span>&</span>Negócios</span></a>
    <div class="header-actions"><a class="btn-subscribe" href="#newsletter">Newsletter</a></div>
  </div>
  <nav class="main-nav" id="mainNav"><div class="nav-inner">
    <a href="../index.html">Início</a><a href="../pages/novidades.html">Novidades</a><a href="../pages/startups.html">Startups</a><a href="../pages/tecnologia.html">Tecnologia</a><a href="../pages/brasil.html">Brasil</a><a href="../pages/vagas.html">Vagas</a><a href="../pages/futebol.html" class="active">⚽ Futebol</a>
    <div class="nav-more-wrap"><button class="nav-more-btn" id="navMoreBtn" aria-expanded="false" aria-haspopup="true">Mais ▾</button><div class="nav-dropdown" id="navDropdown"><a href="../pages/servicos.html">Serviços</a><a href="../pages/industrias.html">Indústrias</a><a href="../pages/saude.html">Saúde</a><a href="../pages/sociedade.html">Sociedade</a><a href="../pages/cultura.html">Cultura</a><a href="../pages/mundo.html">Mundo</a><a href="../pages/campinas.html">Campinas</a><a href="../pages/esportes.html">Esportes</a><a href="../pages/tempo.html">🌤️ Tempo</a><a href="../pages/noticias-locais.html">Local</a></div></div>
  </div></nav>
</header>
<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../pages/futebol.html">⚽ Futebol</a> › <span>${escHtml(article.title.slice(0,60))}${article.title.length>60?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag futebol">${escHtml(article.tag)}</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${article.readMin} min de leitura</span><span class="dot"></span><span>Redação Esportes — Empresas &amp; Negócios</span></div>
    <img src="${imageUrl}" alt="${escHtml(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager"/>
    ${body}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:32px 0 40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title+' — '+canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
    </div>
    <!-- CTA Futebol -->
    <div style="background:#0a3d0a;border-radius:10px;padding:24px 28px;margin:8px 0 40px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <span style="font-size:36px;">⚽</span>
      <div style="flex:1;min-width:200px;">
        <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 4px;">Acompanhe o Futebol Brasileiro ao vivo</p>
        <p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Tabela, resultados e artilharia do Brasileirão e Libertadores 2026 em tempo real.</p>
      </div>
      <a href="../pages/futebol.html" style="background:#27ae60;color:#fff;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;">Ver tabela ao vivo →</a>
    </div>
  </div>
  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">⚽ Futebol no seu e-mail</div>
      <div class="widget-body"><p class="nl-desc">Resultados, tabela e análises do Brasileirão toda semana.</p>
        <form onsubmit="handleNewsletter(event)"><input type="email" placeholder="Seu e-mail" required/><button type="submit" class="btn-nl">Inscrever-se</button></form>
        <p class="nl-privacy">Sem spam. Cancele quando quiser.</p></div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">🏆 Campeonatos 2026</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;">
        <li><a href="../pages/futebol.html" style="font-size:13px;color:var(--gray-dark);display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);"><span style="background:#27ae60;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;">BRA</span>Brasileirão Série A</a></li>
        <li><a href="../pages/futebol.html" style="font-size:13px;color:var(--gray-dark);display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);"><span style="background:#d4a017;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;">LIB</span>Copa Libertadores</a></li>
        <li><a href="../pages/futebol.html" style="font-size:13px;color:var(--gray-dark);display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);"><span style="background:#8e44ad;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;">CDB</span>Copa do Brasil</a></li>
        <li><a href="../pages/futebol.html" style="font-size:13px;color:var(--gray-dark);display:flex;align-items:center;gap:8px;padding:6px 0;"><span style="background:#c0392b;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;">WC</span>Copa do Mundo 2026</a></li>
      </ul></div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;"><a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
    <div class="sidebar-widget"><div class="widget-header">📰 Mais futebol</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;">
        <li><a href="https://www.lance.com.br/futebol-nacional" target="_blank" rel="noopener" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">📋 LANCE! — Futebol Nacional</a></li>
        <li><a href="https://www.gazetaesportiva.com/futebol/regiao-sudeste/" target="_blank" rel="noopener" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">📰 Gazeta Esportiva</a></li>
        <li><a href="https://www.cbf.com.br" target="_blank" rel="noopener" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;">🏆 Site oficial CBF</a></li>
      </ul></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>⚽ Futebol &amp; Negócios no seu e-mail</h2><p>Tabela, resultados, transferências e análises do futebol brasileiro toda semana.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Futebol</h4><ul><li><a href="../pages/futebol.html">⚽ Futebol Brasileiro</a></li><li><a href="../pages/esportes.html">Esportes</a></li><li><a href="../pages/brasil.html">Brasil</a></li></ul></div>
  <div class="footer-col"><h4>Negócios</h4><ul><li><a href="../pages/startups.html">Startups</a></li><li><a href="../pages/tecnologia.html">Tecnologia</a></li><li><a href="../pages/industrias.html">Indústrias</a></li></ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul><li><a href="#">Sobre nós</a></li><li><a href="#">Anuncie</a></li><li><a href="../pages/vagas.html">Vagas</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 Empresas &amp; Negócios.</span></div></footer>
<div class="toast" id="toast"><span class="toast-icon">✅</span><span id="toastMsg">Inscrição realizada!</span></div>
<button class="back-to-top" id="backToTop">↑</button>
<script src="../js/main.js"></script>
</body></html>`;
}

// ─── ÍNDICE ────────────────────────────────────────────────────────────────────
function loadIndex() {
  const p = join(__dirname,'..','data','artigos.json');
  if (existsSync(p)) try { return JSON.parse(readFileSync(p,'utf8')); } catch {}
  return { updated:'', articles:[] };
}
function saveIndex(index) {
  index.articles.sort((a,b)=>(b.isoDate||'').localeCompare(a.isoDate||''));
  index.articles = index.articles.slice(0,90);
  index.updated  = new Date().toISOString();
  writeFileSync(join(__dirname,'..','data','artigos.json'), JSON.stringify(index,null,2),'utf8');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = join(__dirname,'..','noticias');
  mkdirSync(outDir, { recursive:true });
  const index = loadIndex();
  const today = new Date();

  console.log(`\n⚽ Gerando ${BATCH.length} artigos de futebol...\n`);
  let success=0, failed=0;

  for (let i=0; i<BATCH.length; i++) {
    const entry = BATCH[i];
    const articleDate = new Date(today);
    articleDate.setDate(today.getDate() - entry.daysAgo);

    console.log(`[${i+1}/${BATCH.length}] ⚽ ${entry.subcat} — ${entry.topic.slice(0,65)}…`);

    try {
      const article  = await generateArticle(entry);
      const isoStr   = isoDate(articleDate);
      const fileName = `${isoStr}-${article.slug}.html`;

      if (index.articles.some(a => a.slug === article.slug)) {
        console.log('   ⏭️  Já existe, pulando.'); continue;
      }

      writeFileSync(
        join(outDir, fileName),
        buildHtml(article, articleDate, entry.image, fileName),
        'utf8'
      );

      index.articles.push({
        slug: article.slug,
        title: article.title,
        description: article.description,
        date: formatDate(articleDate),
        isoDate: isoStr,
        tag: article.tag,
        tagCls: article.tagCls,
        readMin: article.readMin,
        image: entry.image,
        url: `noticias/${fileName}`,
      });

      console.log(`   ✅ ${fileName}`);
      success++;
    } catch(e) {
      console.error(`   ❌ ${e.message}`);
      failed++;
    }

    if (i < BATCH.length - 1) await sleep(3000);
  }

  saveIndex(index);
  console.log(`\n✅ Concluído! ${success} gerados, ${failed} falhas. Total no índice: ${index.articles.length}`);
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
