/**
 * generate-article.js
 * Gera 1 artigo diário de tema GERAL (editorial sortido) via GPT-4o.
 * O tópico é escolhido por rotação determinística (dia do ano % total de tópicos).
 * Cobre: Startups, Tecnologia, Brasil, Saúde, Mundo, Indústrias, Sociedade, Cultura, Campinas.
 *
 * Uso: node scripts/generate-article.js
 * Requer: OPENAI_API_KEY
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── TÓPICOS GERAIS (rotação diária — 30 temas) ──────────────────────────────
// Cada entrada: { topic, tag, tagCls, image }
const TOPICS = [
  // ── STARTUPS ──────────────────────────────────────────────────────────────
  { topic: 'o ecossistema de startups de Campinas em 2026: quem são os novos unicórnios e o que estão construindo',                             tag: 'Startups',   tagCls: 'startups',   image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop' },
  { topic: 'fintechs para PMEs: as melhores ferramentas financeiras para pequenas e médias empresas brasileiras em 2026',                        tag: 'Startups',   tagCls: 'startups',   image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=450&fit=crop' },
  { topic: 'agtechs brasileiras lideram inovação no agronegócio com drones, sensores IoT e IA para aumentar produtividade',                     tag: 'Startups',   tagCls: 'startups',   image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop' },
  { topic: 'startup de logística last-mile capta R$ 220 milhões e expande operação para 30 cidades do interior de SP',                          tag: 'Startups',   tagCls: 'startups',   image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=450&fit=crop' },
  // ── TECNOLOGIA ────────────────────────────────────────────────────────────
  { topic: 'como a IA generativa está mudando o trabalho administrativo e operacional nas empresas brasileiras em 2026',                         tag: 'Tecnologia', tagCls: 'tecnologia', image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop' },
  { topic: 'cibersegurança para PMEs em 2026: os 5 ataques mais comuns e como proteger sua empresa sem gastar muito',                           tag: 'Tecnologia', tagCls: 'tecnologia', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop' },
  { topic: '5G no Brasil em 2026: impactos reais para indústria, logística e empresas do interior de São Paulo',                                 tag: 'Tecnologia', tagCls: 'tecnologia', image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop' },
  { topic: 'automação industrial em Americana e Campinas: casos reais de aumento de produtividade com robôs e IA',                              tag: 'Tecnologia', tagCls: 'tecnologia', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop' },
  // ── BRASIL ────────────────────────────────────────────────────────────────
  { topic: 'reforma tributária 2027: o que os gestores de PMEs precisam fazer agora para não ser pegos de surpresa',                            tag: 'Brasil',     tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=450&fit=crop' },
  { topic: 'crédito para PMEs em 2026: o que mudou nas linhas do BNDES, Caixa e agências de fomento estaduais',                                tag: 'Brasil',     tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop' },
  { topic: 'agronegócio bate US$ 180 bilhões em exportações e puxa o PIB brasileiro: oportunidades para fornecedores',                         tag: 'Brasil',     tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?w=800&h=450&fit=crop' },
  { topic: 'PAC infraestrutura 2026: R$ 350 bilhões em obras e as oportunidades para empresas do interior paulista',                            tag: 'Brasil',     tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop' },
  // ── SAÚDE ─────────────────────────────────────────────────────────────────
  { topic: 'planos de saúde corporativos em 2026: como negociar, comparar coberturas e reduzir custo sem perder qualidade',                     tag: 'Saúde',      tagCls: 'saude',      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop' },
  { topic: 'saúde mental no trabalho: como empresas de Campinas e Americana estão cuidando do bem-estar dos colaboradores',                      tag: 'Saúde',      tagCls: 'saude',      image: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&h=450&fit=crop' },
  { topic: 'medicina preventiva nas empresas: como programas de saúde geram ROI de 3x e reduzem absenteísmo',                                   tag: 'Saúde',      tagCls: 'saude',      image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&h=450&fit=crop' },
  // ── MUNDO ─────────────────────────────────────────────────────────────────
  { topic: 'guerra comercial EUA-China e tarifas: impactos diretos para exportadores e importadores brasileiros em 2026',                        tag: 'Mundo',      tagCls: 'mundo',      image: 'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?w=800&h=450&fit=crop' },
  { topic: 'nearshoring em alta: por que empresas globais estão escolhendo o Brasil como base de operações em 2026',                            tag: 'Mundo',      tagCls: 'mundo',      image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=450&fit=crop' },
  { topic: 'AI Act europeu regulamenta inteligência artificial: o que muda para empresas brasileiras que exportam para a UE',                    tag: 'Mundo',      tagCls: 'mundo',      image: 'https://images.unsplash.com/photo-1509868918748-a554f31a7b2e?w=800&h=450&fit=crop' },
  // ── INDÚSTRIAS ────────────────────────────────────────────────────────────
  { topic: 'indústria 4.0 no interior de SP: automação, robótica e o futuro das fábricas em Americana, Sumaré e Campinas',                      tag: 'Indústrias', tagCls: 'industrias', image: 'https://images.unsplash.com/photo-1565793979108-a10eea5fad27?w=800&h=450&fit=crop' },
  { topic: 'setor têxtil de Americana se reinventa com sustentabilidade, exportação e inovação em 2026',                                        tag: 'Indústrias', tagCls: 'industrias', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop' },
  { topic: 'veículos elétricos na indústria brasileira: montadoras anunciam R$ 12 bi em investimentos e impacto na cadeia local',               tag: 'Indústrias', tagCls: 'industrias', image: 'https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800&h=450&fit=crop' },
  // ── SOCIEDADE ─────────────────────────────────────────────────────────────
  { topic: 'geração Z no mercado corporativo: o que eles esperam dos empregadores, salários e cultura organizacional em 2026',                   tag: 'Sociedade',  tagCls: 'sociedade',  image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop' },
  { topic: 'home office em 2026: o que as pesquisas mostram sobre produtividade, saúde e o modelo híbrido nas empresas brasileiras',             tag: 'Sociedade',  tagCls: 'sociedade',  image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop' },
  { topic: 'liderança feminina no Brasil cresce 40%: empresas com mais mulheres no topo faturam mais e têm menor rotatividade',                  tag: 'Sociedade',  tagCls: 'sociedade',  image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop' },
  // ── CULTURA ───────────────────────────────────────────────────────────────
  { topic: 'economia criativa no Brasil movimenta R$ 200 bilhões e gera 5 milhões de empregos formais em 2026',                                 tag: 'Cultura',    tagCls: 'cultura',    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop' },
  { topic: 'cultura de inovação nas empresas: como criar ambientes criativos que retêm talentos e geram resultados concretos',                   tag: 'Cultura',    tagCls: 'cultura',    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop' },
  // ── CAMPINAS & REGIÃO ─────────────────────────────────────────────────────
  { topic: 'os bairros mais valorizados para instalar uma empresa em Campinas em 2026: análise por custo, infraestrutura e acesso',              tag: 'Campinas',   tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop' },
  { topic: 'Campinas no ranking das melhores cidades para negócios no Brasil: o que a cidade oferece para empresas em 2026',                     tag: 'Campinas',   tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop' },
  { topic: 'mercado imobiliário comercial em Campinas e Americana: tendências e oportunidades para investidores em 2026',                        tag: 'Campinas',   tagCls: 'brasil',     image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop' },
  { topic: 'polo industrial de Americana, Sumaré e Santa Bárbara D\'Oeste: crescimento, vagas e oportunidades de negócio em 2026',              tag: 'Indústrias', tagCls: 'industrias', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=450&fit=crop' },
];

// ─── TAG → PÁGINA ─────────────────────────────────────────────────────────────
const TAG_TO_PAGE = {
  'Startups':   { page: 'pages/startups.html',   label: 'Startups'   },
  'Tecnologia': { page: 'pages/tecnologia.html',  label: 'Tecnologia' },
  'Brasil':     { page: 'pages/brasil.html',       label: 'Brasil'     },
  'Saúde':      { page: 'pages/saude.html',        label: 'Saúde'      },
  'Mundo':      { page: 'pages/mundo.html',        label: 'Mundo'      },
  'Indústrias': { page: 'pages/industrias.html',   label: 'Indústrias' },
  'Sociedade':  { page: 'pages/sociedade.html',    label: 'Sociedade'  },
  'Cultura':    { page: 'pages/cultura.html',      label: 'Cultura'    },
  'Campinas':   { page: 'pages/campinas.html',     label: 'Campinas'   },
};

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function isoDate(d)    { return d.toISOString().split('T')[0]; }
function escHtml(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, tag, tagCls } = entry;

  const catInfo = TAG_TO_PAGE[tag] || TAG_TO_PAGE['Brasil'];

  const prompt = `Você é um jornalista especializado em negócios, economia e inovação, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br) — referência para empreendedores e executivos do Brasil.

Escreva um artigo jornalístico completo e informativo sobre: "${topic}"

DIRETRIZES:
- Tom: informativo, profissional, prático — com dados concretos e números plausíveis de 2026
- Tamanho: 650 a 850 palavras de conteúdo real (sem repetição)
- Use percentuais, valores em reais/dólares, nomes de empresas reais quando relevante
- Editoria: ${tag}
- Contexto geográfico: Brasil; cite Campinas, Americana ou SP quando o tema permitir naturalmente
- NÃO mencionar vigilância armada, armas ou segurança privada com armas

Retorne APENAS JSON válido, sem markdown:
{
  "title": "título SEO (máx 80 chars, com palavras-chave)",
  "description": "meta description (máx 155 chars, persuasiva)",
  "slug": "slug-sem-acentos-hifenizado-max-65-chars",
  "tag": "${tag}",
  "tagCls": "${tagCls}",
  "readMin": 5,
  "sections": [
    { "type": "intro",     "text": "abertura impactante com dado ou fato concreto" },
    { "type": "h2",        "text": "Primeiro subtítulo" },
    { "type": "p",         "text": "análise com dados" },
    { "type": "list",      "items": ["ponto 1", "ponto 2", "ponto 3", "ponto 4"] },
    { "type": "h2",        "text": "Segundo subtítulo" },
    { "type": "p",         "text": "parágrafo" },
    { "type": "highlight", "text": "dado ou insight de destaque" },
    { "type": "h2",        "text": "Perspectivas e conclusão" },
    { "type": "p",         "text": "conclusão acionável para o leitor" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 3000, temperature: 0.7,
    messages: [
      { role: 'system', content: 'Jornalista de negócios experiente. Responda SEMPRE com JSON puro e válido, sem markdown.' },
      { role: 'user',   content: prompt },
    ],
  });
  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw.replace(/^```json?\n?/,'').replace(/\n?```$/,'').trim());
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName, entry) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;
  const catInfo  = TAG_TO_PAGE[entry.tag] || TAG_TO_PAGE['Brasil'];

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
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../${catInfo.page}">${catInfo.label}</a> › <span>${escHtml(article.title.slice(0,55))}${article.title.length>55?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag ${escHtml(article.tagCls)}">${escHtml(article.tag)}</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${article.readMin} min de leitura</span><span class="dot"></span><span>Redação Empresas &amp; Negócios</span></div>
    <img src="${imageUrl}" alt="${escHtml(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager"/>
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
      <div class="widget-body" style="padding:0;"><a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
    <div class="sidebar-widget"><div class="widget-header">📂 Editorias</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;">
        <li><a href="../pages/startups.html"   style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🚀 Startups</a></li>
        <li><a href="../pages/tecnologia.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">💻 Tecnologia</a></li>
        <li><a href="../pages/brasil.html"     style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🇧🇷 Brasil</a></li>
        <li><a href="../pages/industrias.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🏭 Indústrias</a></li>
        <li><a href="../pages/vagas.html"      style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;">💼 Vagas</a></li>
      </ul></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro do que importa</h2><p>Receba as principais notícias de negócios, economia e inovação toda manhã.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul><li><a href="../pages/startups.html">Startups</a></li><li><a href="../pages/tecnologia.html">Tecnologia</a></li><li><a href="../pages/saude.html">Saúde</a></li><li><a href="../pages/brasil.html">Brasil</a></li></ul></div>
  <div class="footer-col"><h4>Mais</h4><ul><li><a href="../pages/mundo.html">Mundo</a></li><li><a href="../pages/industrias.html">Indústrias</a></li><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/vagas.html">Vagas</a></li></ul></div>
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
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const entry = TOPICS[dayOfYear % TOPICS.length];

  console.log(`\n📰 Artigo geral do dia [${dayOfYear % TOPICS.length + 1}/${TOPICS.length}]`);
  console.log(`   Tag: ${entry.tag} — ${entry.topic.slice(0,70)}…\n`);

  const article  = await generateArticle(entry);
  const isoStr   = isoDate(today);
  const fileName = `${isoStr}-${article.slug}.html`;

  const index = loadIndex();
  if (index.articles.some(a => a.slug === article.slug)) {
    console.log('⏭️  Artigo já existe no índice. Nada a fazer.');
    return;
  }

  writeFileSync(join(outDir, fileName), buildHtml(article, today, entry.image, fileName, entry), 'utf8');
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

  console.log(`✅ Artigo geral gerado: ${fileName}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
