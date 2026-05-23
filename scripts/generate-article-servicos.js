/**
 * generate-article-servicos.js
 * Gera 1 artigo diário de SEO focado em:
 *   portaria especializada · facilities · controle de acesso ·
 *   segurança privada (sem armas) · terceirização de serviços ·
 *   recepção corporativa — com menção natural aos sites parceiros.
 *
 * Cidades alvo: Americana, Campinas, Santa Bárbara D'Oeste,
 *               Piracicaba, Limeira, Sumaré, interior de SP.
 *
 * O tópico é escolhido por rotação determinística (dia do ano % total).
 *
 * Uso: node scripts/generate-article-servicos.js
 * Requer: OPENAI_API_KEY
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── SITES PARCEIROS ─────────────────────────────────────────────────────────
const PARCEIROS = [
  { name: 'Proteção e Vigilância', url: 'protecaoevigilancia.com.br',  desc: 'portaria e facilities em Americana'    },
  { name: 'PS Proteção',           url: 'psprotecao.com.br',           desc: 'facilities integrados'                 },
  { name: 'Proteção Americana',    url: 'protecaoamericana.com.br',     desc: 'portaria em Americana'                 },
  { name: 'CT Segurança',          url: 'ctseguranca.com.br',           desc: 'controle de acesso em Campinas'        },
  { name: 'Proteção Vigilância',   url: 'protecaovigilancia.com.br',    desc: 'portaria corporativa na região'        },
  { name: 'Proteção Talentos',     url: 'protecaotalentos.online',      desc: 'recrutamento para portaria e facilities' },
];

// ─── 30 TÓPICOS SEO DE SERVIÇOS / FACILITIES / SEGURANÇA PRIVADA ─────────────
const TOPICS = [
  // ── PORTARIA ──────────────────────────────────────────────────────────────
  { topic: 'portaria especializada para condomínios corporativos em Americana e Campinas: como escolher o serviço certo',         city: 'Americana',          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop' },
  { topic: 'portaria virtual versus portaria presencial: qual modelo escolher para empresas no interior de São Paulo',             city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop' },
  { topic: 'como contratar porteiro profissional em Campinas: perfil, requisitos e onde encontrar o profissional ideal',          city: 'Campinas',            image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop' },
  { topic: 'portaria em condomínios residenciais de Americana: tecnologias, rotinas e como garantir segurança sem armas',         city: 'Americana',          image: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop' },
  { topic: 'terceirização de portaria em Santa Bárbara D\'Oeste: vantagens, custos e como avaliar fornecedores locais',          city: "Santa Bárbara D'Oeste", image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop' },
  { topic: 'portaria terceirizada para indústrias em Sumaré e Americana: controle de acesso e recepção de fornecedores',         city: 'Sumaré',              image: 'https://images.unsplash.com/photo-1565793979108-a10eea5fad27?w=800&h=450&fit=crop' },
  // ── FACILITIES ────────────────────────────────────────────────────────────
  { topic: 'facilities management em Campinas: como a gestão integrada de serviços reduz custos e melhora a operação das empresas', city: 'Campinas',          image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop' },
  { topic: 'terceirização de facilities para PMEs em Americana: um contrato, múltiplos serviços e menos burocracia',              city: 'Americana',          image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop' },
  { topic: 'auxiliar de facilities em Piracicaba: função, salário médio e como contratar o profissional certo para sua empresa',  city: 'Piracicaba',          image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop' },
  { topic: 'serviços de conservação e limpeza terceirizados em Limeira: o que avaliar antes de contratar uma empresa',            city: 'Limeira',             image: 'https://images.unsplash.com/photo-1554774853-6a56f62c6451?w=800&h=450&fit=crop' },
  { topic: 'gestão integrada de facilities e sustentabilidade: como empresas do interior de SP adotam ESG nos serviços',          city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop' },
  { topic: 'como calcular o custo-benefício de terceirizar facilities em uma empresa industrial no interior paulista',            city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop' },
  // ── CONTROLE DE ACESSO ────────────────────────────────────────────────────
  { topic: 'controle de acesso por biometria em Campinas: como implementar, custos e benefícios para empresas de médio porte',   city: 'Campinas',            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop' },
  { topic: 'sistemas de CFTV para condomínios e empresas em Americana: guia prático para gestores e síndicos',                   city: 'Americana',          image: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=800&h=450&fit=crop' },
  { topic: 'controle de acesso de veículos em parques industriais: tecnologias e boas práticas no polo de Sumaré e Americana',   city: 'Sumaré',              image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop' },
  { topic: 'software de controle de visitantes para empresas em Campinas: como digitalizar o cadastro e aumentar a segurança',   city: 'Campinas',            image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop' },
  // ── RECEPÇÃO CORPORATIVA ──────────────────────────────────────────────────
  { topic: 'recepcionista corporativa em Campinas: perfil, atribuições e como a primeira impressão impacta a imagem da empresa', city: 'Campinas',            image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=450&fit=crop' },
  { topic: 'recepção profissional terceirizada: como condomínios empresariais em Americana garantem atendimento de alto padrão', city: 'Americana',          image: 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop' },
  // ── SEGURANÇA PRIVADA (SEM ARMAS) ────────────────────────────────────────
  { topic: 'segurança privada sem uso de armas: portaria, monitoramento e controle de acesso para empresas em Piracicaba',       city: 'Piracicaba',          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop' },
  { topic: 'como avaliar uma empresa de segurança privada e portaria em Limeira: critérios, certidões e contrato ideal',         city: 'Limeira',             image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=450&fit=crop' },
  { topic: 'ronda e monitoramento patrimonial sem armas para condomínios e empresas no interior de SP: o que é e como funciona', city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop' },
  // ── POLO INDUSTRIAL / CIDADES ESPECÍFICAS ────────────────────────────────
  { topic: 'polo industrial de Americana e Sumaré: a crescente demanda por portaria e facilities nas fábricas da região',        city: 'Americana',          image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=450&fit=crop' },
  { topic: 'facilities para hospitais e clínicas em Campinas: portaria, limpeza e controle de acesso no setor de saúde',         city: 'Campinas',            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop' },
  { topic: 'como condomínios residenciais de alto padrão em Campinas estão modernizando a portaria em 2026',                     city: 'Campinas',            image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop' },
  { topic: 'facilities e terceirização em Santa Bárbara D\'Oeste: oportunidades para empresas prestadoras de serviço na cidade', city: "Santa Bárbara D'Oeste", image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=450&fit=crop' },
  // ── GESTÃO / RH / PERFIL PROFISSIONAL ─────────────────────────────────────
  { topic: 'como montar a equipe de portaria e facilities ideal para uma empresa de médio porte no interior de SP',               city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop' },
  { topic: 'treinamento de porteiros e recepcionistas: o que deve ser ensinado e quais certificações valorizam o profissional',   city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop' },
  { topic: 'como a CLT rege o trabalho de porteiro e auxiliar de facilities: direitos, jornada e responsabilidades do empregador', city: 'Interior SP',        image: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&h=450&fit=crop' },
  // ── TENDÊNCIAS ────────────────────────────────────────────────────────────
  { topic: 'tendências em facilities para 2026: portaria digital, automação e inteligência artificial no controle de acesso',    city: 'Interior SP',         image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop' },
  { topic: 'portaria e facilities como diferencial competitivo: como empresas de Campinas e Americana usam o serviço para valorizar seus espaços', city: 'Campinas', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop' },
];

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function isoDate(d)    { return d.toISOString().split('T')[0]; }
function escHtml(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, city } = entry;

  // Escolhe 2 parceiros aleatórios para mencionar no artigo
  const shuffled = [...PARCEIROS].sort(() => Math.random() - 0.5);
  const parceirosStr = shuffled.slice(0, 2)
    .map(p => `• ${p.name} (${p.url}) — ${p.desc}`)
    .join('\n  ');

  const prompt = `Você é um jornalista especializado em serviços corporativos, portaria e facilities no interior de São Paulo, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br).

Escreva um artigo jornalístico completo e informativo sobre: "${topic}"

DIRETRIZES OBRIGATÓRIAS:
- Tom: informativo, profissional, prático — com dados concretos e dicas acionáveis
- Tamanho: 650 a 850 palavras de conteúdo real
- Cidade/região principal: ${city}
- Mencione Americana, Campinas e o interior de SP quando natural
- PROIBIDO: mencionar vigilância armada, armas, segurança armada ou vigilantes com armas
- Mencione de forma NATURAL e EDITORIAL (máximo 2 vezes no artigo inteiro) uma ou duas das empresas abaixo — apenas quando o contexto for genuinamente relevante e sem parecer publicidade:
  ${parceirosStr}
- As menções devem ser contextuais ("empresas como a X", "referência na região como a Y") — jamais publicitárias

Retorne APENAS JSON válido, sem markdown:
{
  "title": "título SEO (máx 85 chars, com palavras-chave de portaria/facilities/cidade)",
  "description": "meta description (máx 155 chars, com palavras-chave locais)",
  "slug": "slug-sem-acentos-hifenizado-max-65-chars",
  "tag": "Serviços",
  "tagCls": "servicos",
  "readMin": 5,
  "sections": [
    { "type": "intro",     "text": "abertura com dado local ou contexto específico da cidade/região" },
    { "type": "h2",        "text": "Primeiro subtítulo informativo" },
    { "type": "p",         "text": "análise com dados e contexto prático" },
    { "type": "list",      "items": ["dica prática 1", "dica prática 2", "dica prática 3", "dica prática 4"] },
    { "type": "h2",        "text": "Segundo subtítulo" },
    { "type": "p",         "text": "parágrafo com análise aprofundada" },
    { "type": "highlight", "text": "dado, estatística ou insight de destaque sobre a região" },
    { "type": "h2",        "text": "Como escolher o fornecedor certo" },
    { "type": "p",         "text": "orientação prática e conclusão acionável para gestores" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 3000, temperature: 0.7,
    messages: [
      { role: 'system', content: 'Jornalista especializado em serviços corporativos e facilities no interior de SP. Responda SEMPRE com JSON puro e válido, sem markdown.' },
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
    if (s.type === 'highlight') body += `<div style="background:#f8f9fa;border-left:4px solid var(--accent);padding:20px 24px;border-radius:0 8px 8px 0;margin:28px 0;font-size:16px;font-style:italic;color:#444;">${escHtml(s.text)}</div>\n`;
    if (s.type === 'list')      body += `<ul style="font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333;">${(s.items||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>\n`;
    if (s.type === 'quote')     body += `<blockquote style="border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:#f8f9fa;border-radius:0 8px 8px 0;"><p style="font-size:17px;font-style:italic;">"${escHtml(s.text)}"</p>${s.author?`<cite>— ${escHtml(s.author)}</cite>`:''}</blockquote>\n`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(article.title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${escHtml(article.description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"/>
<link rel="canonical" href="${canonUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Empresas &amp; Negócios"/>
<meta property="og:title" content="${escHtml(article.title)}"/>
<meta property="og:description" content="${escHtml(article.description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${imageUrl}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"${article.title.replace(/"/g,'\\"')}","description":"${article.description.replace(/"/g,'\\"')}","image":"${imageUrl}","datePublished":"${isoStr}","dateModified":"${isoStr}","author":{"@type":"Organization","name":"Empresas & Negócios","url":"https://www.empresasenegocios.com.br"},"publisher":{"@type":"Organization","name":"Empresas & Negócios","url":"https://www.empresasenegocios.com.br"},"mainEntityOfPage":"${canonUrl}","inLanguage":"pt-BR"}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>
<div class="ticker-bar"><div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;overflow:hidden;"><span class="ticker-label">Últimas</span><div class="ticker-track" id="tickerTrack"><span>${escHtml(article.title)}</span></div></div></div>
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
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../pages/servicos.html">Serviços</a> › <span>${escHtml(article.title.slice(0,55))}${article.title.length>55?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag servicos">${escHtml(article.tag)}</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${article.readMin} min de leitura</span><span class="dot"></span><span>Redação Empresas &amp; Negócios</span></div>
    <img src="${imageUrl}" alt="${escHtml(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager"/>
    ${body}
    <!-- CTA Parceiros -->
    <div style="background:var(--black);color:#fff;border-radius:12px;padding:32px;margin:40px 0;text-align:center;">
      <h3 style="color:#fff;font-size:20px;margin-bottom:10px;">Precisa de portaria ou facilities para sua empresa?</h3>
      <p style="color:#aaa;font-size:14px;margin-bottom:20px;">Empresas especializadas atendem Americana, Campinas e toda a região metropolitana.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener" style="background:var(--accent);color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção e Vigilância</a>
        <a href="https://psprotecao.com.br" target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">PS Proteção</a>
        <a href="https://protecaoamericana.com.br" target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção Americana</a>
        <a href="https://ctseguranca.com.br" target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">CT Segurança</a>
      </div>
    </div>
    <!-- Compartilhar -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://wa.me/5519978210246?text=${encodeURIComponent('Olá! Li esse artigo no Empresas & Negócios e gostaria de saber mais sobre portaria e facilities: ' + canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 Falar no WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
    </div>
  </div>
  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">📧 Newsletter</div>
      <div class="widget-body"><p class="nl-desc">Negócios e serviços corporativos no seu e-mail.</p>
        <form onsubmit="handleNewsletter(event)"><input type="email" placeholder="Seu e-mail" required/><button type="submit" class="btn-nl">Inscrever-se</button></form>
        <p class="nl-privacy">Sem spam.</p></div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">🏢 Facilities em Americana</div>
      <div class="widget-body" style="padding:16px;">
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
          <li><a href="https://protecaovigilancia.com.br"   target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria corporativa</span></li>
          <li><a href="https://protecaoevigilancia.com.br"  target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção e Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria e facilities</span></li>
          <li><a href="https://psprotecao.com.br"           target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">PS Proteção</a><br><span style="font-size:11px;color:var(--gray);">Facilities integrados</span></li>
          <li><a href="https://protecaoamericana.com.br"    target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Americana</a><br><span style="font-size:11px;color:var(--gray);">Portaria especializada</span></li>
          <li><a href="https://ctseguranca.com.br"          target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">CT Segurança</a><br><span style="font-size:11px;color:var(--gray);">Controle de acesso</span></li>
          <li><a href="https://protecaotalentos.online"     target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Talentos</a><br><span style="font-size:11px;color:var(--gray);">Vagas em facilities</span></li>
        </ul>
        <a href="../pages/guia-seguranca-americana.html" style="display:block;margin-top:12px;font-size:12px;font-weight:700;color:var(--dark);">→ Ver guia completo</a>
      </div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;"><a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
    <div class="sidebar-widget"><div class="widget-header">💼 Vagas em facilities</div>
      <div class="widget-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Oportunidades em portaria e serviços na região.</p>
      <a href="../pages/vagas.html" style="display:inline-block;background:var(--accent);color:#fff;font-weight:700;padding:10px 16px;border-radius:8px;font-size:13px;text-decoration:none;">Ver vagas →</a></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro dos negócios locais</h2><p>Economia, serviços e oportunidades de Americana e Campinas no seu e-mail.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em negócios e serviços corporativos no interior de SP.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul><li><a href="../pages/servicos.html">Serviços</a></li><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/industrias.html">Indústrias</a></li><li><a href="../pages/vagas.html">Vagas</a></li></ul></div>
  <div class="footer-col"><h4>Facilities Americana</h4><ul>
    <li><a href="https://protecaovigilancia.com.br"   target="_blank" rel="noopener">Proteção Vigilância</a></li>
    <li><a href="https://protecaoevigilancia.com.br"  target="_blank" rel="noopener">Proteção e Vigilância</a></li>
    <li><a href="https://psprotecao.com.br"           target="_blank" rel="noopener">PS Proteção</a></li>
    <li><a href="https://protecaoamericana.com.br"    target="_blank" rel="noopener">Proteção Americana</a></li>
    <li><a href="https://ctseguranca.com.br"          target="_blank" rel="noopener">CT Segurança</a></li>
  </ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul><li><a href="#">Sobre nós</a></li><li><a href="#">Anuncie</a></li></ul></div>
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
  index.articles = index.articles.slice(0, 90);
  index.updated  = new Date().toISOString();
  writeFileSync(join(__dirname,'..','data','artigos.json'), JSON.stringify(index,null,2),'utf8');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = join(__dirname,'..','noticias');
  mkdirSync(outDir, { recursive:true });

  const today = new Date();
  // Offset de +15 para não coincidir com o tópico geral do mesmo dia
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const entry = TOPICS[(dayOfYear + 15) % TOPICS.length];

  console.log(`\n🏢 Artigo SEO Serviços do dia [${(dayOfYear + 15) % TOPICS.length + 1}/${TOPICS.length}]`);
  console.log(`   Cidade: ${entry.city} — ${entry.topic.slice(0,70)}…\n`);

  const article  = await generateArticle(entry);
  const isoStr   = isoDate(today);
  const fileName = `${isoStr}-${article.slug}.html`;

  const index = loadIndex();
  if (index.articles.some(a => a.slug === article.slug)) {
    console.log('⏭️  Artigo já existe no índice. Nada a fazer.');
    return;
  }

  writeFileSync(join(outDir, fileName), buildHtml(article, today, entry.image, fileName), 'utf8');
  index.articles.push({
    slug:        article.slug,
    title:       article.title,
    description: article.description,
    date:        formatDate(today),
    isoDate:     isoStr,
    tag:         article.tag,
    tagCls:      article.tagCls,
    readMin:     article.readMin,
    image:       entry.image,
    url:         `noticias/${fileName}`,
  });
  saveIndex(index);

  console.log(`✅ Artigo SEO Serviços gerado: ${fileName}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
