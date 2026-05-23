/**
 * generate-batch.js
 * Geração em lote de 20 artigos reais via GPT-4o, cobrindo todas as editorias
 * do portal Empresas & Negócios.
 *
 * Uso: node scripts/generate-batch.js
 * Requer: OPENAI_API_KEY no ambiente (ou .env)
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── 20 TÓPICOS DIVERSOS ──────────────────────────────────────────────────────
// Cada entrada define o assunto, a editoria, a classe CSS da tag e a imagem.
// Datas retrocedidas para simular publicação ao longo de 5 dias.
const BATCH = [
  // ── HOJE (22/05/2026) ─────────────────────────────────────────────────────
  {
    topic:  'fintechs brasileiras batem recorde histórico de captação em 2026, com R$ 4,3 bilhões investidos no primeiro semestre',
    tag:    'Startups', tagCls: 'startups',
    daysAgo: 0,
    image:  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop',
  },
  {
    topic:  'inteligência artificial transforma a manufatura brasileira: cases reais de empresas do interior de São Paulo',
    tag:    'Tecnologia', tagCls: 'tecnologia',
    daysAgo: 0,
    image:  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop',
  },
  {
    topic:  'economia brasileira cresce 3,2% no primeiro trimestre de 2026 e supera expectativas do mercado',
    tag:    'Brasil', tagCls: 'brasil',
    daysAgo: 0,
    image:  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  },
  // ── ONTEM (21/05/2026) ────────────────────────────────────────────────────
  {
    topic:  'startups de logística verde captam R$ 180 milhões e expandem frota elétrica para 12 estados brasileiros',
    tag:    'Startups', tagCls: 'startups',
    daysAgo: 1,
    image:  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
  },
  {
    topic:  'healthtechs brasileiras crescem 45% e atraem R$ 2 bilhões em investimentos em 2026',
    tag:    'Saúde', tagCls: 'saude',
    daysAgo: 1,
    image:  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  },
  {
    topic:  'trabalho híbrido consolida-se como padrão nas grandes corporações brasileiras em 2026',
    tag:    'Sociedade', tagCls: 'sociedade',
    daysAgo: 1,
    image:  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  },
  {
    topic:  'Fed sinaliza corte de juros em setembro: o que muda para o mercado financeiro e investidores brasileiros',
    tag:    'Mundo', tagCls: 'mundo',
    daysAgo: 1,
    image:  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=450&fit=crop',
  },
  // ── 20/05/2026 ────────────────────────────────────────────────────────────
  {
    topic:  'cloud computing para pequenas e médias empresas do interior de São Paulo: como migrar com baixo custo',
    tag:    'Tecnologia', tagCls: 'tecnologia',
    daysAgo: 2,
    image:  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop',
  },
  {
    topic:  'reforma tributária começa a valer em 2027: o que as empresas brasileiras precisam fazer agora para se preparar',
    tag:    'Brasil', tagCls: 'brasil',
    daysAgo: 2,
    image:  'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=450&fit=crop',
  },
  {
    topic:  'China lança fundo de US$ 1 trilhão para energia limpa e redefine o mercado global de commodities',
    tag:    'Mundo', tagCls: 'mundo',
    daysAgo: 2,
    image:  'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?w=800&h=450&fit=crop',
  },
  {
    topic:  'empreendedorismo feminino cresce 38% no Brasil e chega a 15 milhões de mulheres à frente de negócios',
    tag:    'Sociedade', tagCls: 'sociedade',
    daysAgo: 2,
    image:  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  },
  // ── 19/05/2026 ────────────────────────────────────────────────────────────
  {
    topic:  'telemedicina em Campinas: como clínicas e hospitais da região adotaram a modalidade e triplicaram atendimentos',
    tag:    'Saúde', tagCls: 'saude',
    daysAgo: 3,
    image:  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=450&fit=crop',
  },
  {
    topic:  'indústria automotiva brasileira anuncia R$ 12 bilhões em veículos elétricos até 2028 com apoio de incentivos fiscais',
    tag:    'Indústrias', tagCls: 'industrias',
    daysAgo: 3,
    image:  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
  },
  {
    topic:  'economia criativa movimenta R$ 200 bilhões no Brasil e gera 5 milhões de empregos formais',
    tag:    'Cultura', tagCls: 'cultura',
    daysAgo: 3,
    image:  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
  },
  {
    topic:  'Selic, inflação e câmbio: o que esperar da economia brasileira no segundo semestre de 2026',
    tag:    'Novidades', tagCls: '',
    daysAgo: 3,
    image:  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
  },
  // ── 18/05/2026 ────────────────────────────────────────────────────────────
  {
    topic:  'Campinas confirma posição como maior hub de inovação e tecnologia do interior de São Paulo em 2026',
    tag:    'Campinas', tagCls: 'campinas',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop',
  },
  {
    topic:  'polo industrial de Americana recebe R$ 800 milhões em novos investimentos e gera 4 mil empregos diretos',
    tag:    'Indústrias', tagCls: 'industrias',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1565793979108-a10eea5fad27?w=800&h=450&fit=crop',
  },
  {
    topic:  'mercado imobiliário comercial bate recordes em Campinas: ocupação de escritórios chega a 92% no 1º trimestre',
    tag:    'Campinas', tagCls: 'campinas',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:  'como pequenas empresas brasileiras usam inteligência artificial para competir com grandes corporações',
    tag:    'Novidades', tagCls: '',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  },
  {
    topic:  'setor de serviços lidera geração de empregos formais no Brasil com 320 mil vagas criadas em abril de 2026',
    tag:    'Brasil', tagCls: 'brasil',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=450&fit=crop',
  },
  {
    topic:  'agtech mineira usa satélites e IA para monitorar lavouras e reduzir perdas em 30% na safra de soja',
    tag:    'Startups', tagCls: 'startups',
    daysAgo: 4,
    image:  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop',
  },
];

// ─── MAPA: TAG → PÁGINA DE CATEGORIA ─────────────────────────────────────────
const TAG_TO_PAGE = {
  'Startups':   { page: 'pages/startups.html',   label: 'Startups'   },
  'Tecnologia': { page: 'pages/tecnologia.html',  label: 'Tecnologia' },
  'Saúde':      { page: 'pages/saude.html',        label: 'Saúde'      },
  'Brasil':     { page: 'pages/brasil.html',       label: 'Brasil'     },
  'Mundo':      { page: 'pages/mundo.html',        label: 'Mundo'      },
  'Sociedade':  { page: 'pages/sociedade.html',    label: 'Sociedade'  },
  'Cultura':    { page: 'pages/cultura.html',      label: 'Cultura'    },
  'Indústrias': { page: 'pages/industrias.html',   label: 'Indústrias' },
  'Campinas':   { page: 'pages/campinas.html',     label: 'Campinas'   },
  'Economia':   { page: 'pages/novidades.html',    label: 'Economia'   },
  'Novidades':  { page: 'pages/novidades.html',    label: 'Novidades'  },
  'Facilities': { page: 'pages/servicos.html',     label: 'Serviços'   },
};

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDate(d) { return d.toISOString().split('T')[0]; }
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── GERAÇÃO VIA GPT-4o ───────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, tag, tagCls, image } = entry;

  const prompt = `Você é um jornalista especializado em negócios, economia e tecnologia, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br) — portal de referência para empreendedores e executivos do Brasil.

Escreva um artigo jornalístico completo e informativo sobre: "${topic}"

DIRETRIZES OBRIGATÓRIAS:
- Tom: informativo, profissional, prático — com dados concretos e números plausíveis
- Tamanho: 600 a 800 palavras de conteúdo real (sem repetição)
- Use percentuais, valores em reais ou dólares, nomes de empresas reais quando relevante
- Contexto geográfico natural: Brasil; mencione Campinas, Americana ou São Paulo quando o tema permitir
- Editoria deste artigo: ${tag}
- NÃO mencionar vigilância armada, armas ou segurança armada

A imagem já está definida: ${image}

Retorne APENAS um objeto JSON válido, sem markdown, sem texto antes ou depois. Estrutura exata:
{
  "title": "título SEO do artigo (máximo 80 caracteres, inclua palavras-chave)",
  "description": "meta description (máximo 155 caracteres, persuasiva e informativa)",
  "slug": "slug-sem-acentos-hifenizado-maximo-60-chars",
  "tag": "${tag}",
  "tagCls": "${tagCls}",
  "readMin": 5,
  "sections": [
    { "type": "intro", "text": "parágrafo de abertura impactante com dado ou fato concreto" },
    { "type": "h2",    "text": "Primeiro subtítulo da seção" },
    { "type": "p",     "text": "parágrafo com análise e dados" },
    { "type": "list",  "items": ["ponto relevante com detalhe", "outro ponto", "mais um", "quarto"] },
    { "type": "h2",    "text": "Segundo subtítulo" },
    { "type": "p",     "text": "parágrafo" },
    { "type": "highlight", "text": "dado, estatística ou insight relevante para destacar em destaque visual" },
    { "type": "h2",    "text": "Perspectivas e conclusão" },
    { "type": "p",     "text": "parágrafo final com conclusão acionável para o leitor" }
  ]
}`;

  const response = await client.chat.completions.create({
    model:       'gpt-4o',
    max_tokens:  3000,
    temperature: 0.7,
    messages: [
      {
        role:    'system',
        content: 'Você é um jornalista de negócios experiente. Responda SEMPRE com JSON puro e válido, sem markdown, sem texto adicional.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw     = response.choices[0].message.content.trim();
  const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(jsonStr);
}

// ─── BUILDER HTML ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName, entry) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;
  const catInfo  = TAG_TO_PAGE[entry.tag] || { page: 'pages/novidades.html', label: 'Novidades' };

  let contentHtml = '';
  for (const s of article.sections) {
    switch (s.type) {
      case 'intro':
        contentHtml += `<p style="font-size:19px;line-height:1.85;font-weight:500;color:#1a1a1a;margin-bottom:28px;">${escHtml(s.text)}</p>\n`;
        break;
      case 'h2':
        contentHtml += `<h2 style="font-size:22px;font-weight:800;margin:36px 0 14px;color:var(--dark);">${escHtml(s.text)}</h2>\n`;
        break;
      case 'h3':
        contentHtml += `<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;">${escHtml(s.text)}</h3>\n`;
        break;
      case 'p':
        contentHtml += `<p style="font-size:16px;line-height:1.85;margin-bottom:20px;color:#333;">${escHtml(s.text)}</p>\n`;
        break;
      case 'list':
        contentHtml += '<ul style="font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333;">\n'
          + (s.items || []).map(i => `  <li>${escHtml(i)}</li>`).join('\n')
          + '\n</ul>\n';
        break;
      case 'highlight':
        contentHtml += `<div style="background:#f8f9fa;border-left:4px solid var(--accent);padding:20px 24px;border-radius:0 8px 8px 0;margin:28px 0;font-size:16px;font-style:italic;color:#444;">${escHtml(s.text)}</div>\n`;
        break;
      case 'quote':
        contentHtml += `<blockquote style="border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:#f8f9fa;border-radius:0 8px 8px 0;">
  <p style="font-size:17px;font-style:italic;margin-bottom:8px;">"${escHtml(s.text)}"</p>
  ${s.author ? `<cite style="font-size:13px;color:var(--gray);">— ${escHtml(s.author)}</cite>` : ''}
</blockquote>\n`;
        break;
    }
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(article.title)} | Empresas &amp; Negócios</title>
  <meta name="description" content="${escHtml(article.description)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${canonUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Empresas &amp; Negócios" />
  <meta property="og:title" content="${escHtml(article.title)}" />
  <meta property="og:description" content="${escHtml(article.description)}" />
  <meta property="og:url" content="${canonUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escHtml(article.title)}" />
  <meta name="twitter:description" content="${escHtml(article.description)}" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${article.title.replace(/"/g, '\\"')}",
    "description": "${article.description.replace(/"/g, '\\"')}",
    "image": "${imageUrl}",
    "datePublished": "${isoStr}",
    "dateModified": "${isoStr}",
    "author": { "@type": "Organization", "name": "Empresas & Negócios", "url": "https://www.empresasenegocios.com.br" },
    "publisher": { "@type": "Organization", "name": "Empresas & Negócios", "url": "https://www.empresasenegocios.com.br" },
    "mainEntityOfPage": "${canonUrl}",
    "inLanguage": "pt-BR"
  }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
  <meta name="theme-color" content="#000000" />
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
    <a href="../index.html">Início</a><a href="../pages/novidades.html">Novidades</a><a href="../pages/startups.html">Startups</a><a href="../pages/tecnologia.html">Tecnologia</a><a href="../pages/brasil.html">Brasil</a><a href="../pages/vagas.html">Vagas</a><a href="../pages/servicos.html">Serviços</a>
    <div class="nav-more-wrap"><button class="nav-more-btn" id="navMoreBtn" aria-expanded="false" aria-haspopup="true">Mais ▾</button><div class="nav-dropdown" id="navDropdown"><a href="../pages/industrias.html">Indústrias</a><a href="../pages/saude.html">Saúde</a><a href="../pages/sociedade.html">Sociedade</a><a href="../pages/cultura.html">Cultura</a><a href="../pages/mundo.html">Mundo</a><a href="../pages/campinas.html">Campinas</a><a href="../pages/esportes.html">Esportes</a><a href="../pages/tempo.html">🌤️ Tempo</a><a href="../pages/noticias-locais.html">Local</a></div></div>
  </div></nav>
</header>

<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">

    <p class="breadcrumb" style="margin-bottom:24px;">
      <a href="../index.html">Início</a> ›
      <a href="../${catInfo.page}">${catInfo.label}</a> ›
      <span>${escHtml(article.title.slice(0, 55))}${article.title.length > 55 ? '…' : ''}</span>
    </p>

    <div style="margin-bottom:16px;">
      <span class="tag ${escHtml(article.tagCls)}">${escHtml(article.tag)}</span>
    </div>

    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>

    <div class="meta" style="margin-bottom:28px;">
      <time datetime="${isoStr}">${dateStr}</time>
      <span class="dot"></span><span>${article.readMin} min de leitura</span>
      <span class="dot"></span><span>Redação Empresas &amp; Negócios</span>
    </div>

    <img src="${imageUrl}" alt="${escHtml(article.title)}"
      style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;"
      loading="eager" />

    ${contentHtml}

    <!-- Compartilhar -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:32px 0 40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' — ' + canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
    </div>

  </div>

  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">📧 Newsletter</div>
      <div class="widget-body">
        <p class="nl-desc">Negócios e economia no seu e-mail todo dia.</p>
        <form onsubmit="handleNewsletter(event)">
          <input type="email" placeholder="Seu e-mail" required />
          <button type="submit" class="btn-nl">Inscrever-se</button>
        </form>
        <p class="nl-privacy">Sem spam.</p>
      </div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;">
        <a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener noreferrer" style="display:block;">
          <img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;" />
        </a>
      </div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">📂 Editorias</div>
      <div class="widget-body">
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;">
          <li><a href="../pages/startups.html"   style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🚀 Startups</a></li>
          <li><a href="../pages/tecnologia.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">💻 Tecnologia</a></li>
          <li><a href="../pages/saude.html"      style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🏥 Saúde</a></li>
          <li><a href="../pages/industrias.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🏭 Indústrias</a></li>
          <li><a href="../pages/brasil.html"     style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🇧🇷 Brasil</a></li>
          <li><a href="../pages/campinas.html"   style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;">📍 Campinas</a></li>
        </ul>
      </div>
    </div>
  </div></aside>
</div>

<section class="newsletter-section" id="newsletter">
  <div class="nl-inner">
    <h2>Fique por dentro do que importa</h2>
    <p>Receba as principais notícias de negócios, economia e inovação toda manhã no seu e-mail.</p>
    <form class="nl-form" onsubmit="handleNewsletter(event)">
      <input type="email" placeholder="Digite seu e-mail" required />
      <button type="submit">Inscrever grátis</button>
    </form>
  </div>
</section>

<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>O portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul>
    <li><a href="../pages/novidades.html">Novidades</a></li>
    <li><a href="../pages/startups.html">Startups</a></li>
    <li><a href="../pages/tecnologia.html">Tecnologia</a></li>
    <li><a href="../pages/saude.html">Saúde</a></li>
  </ul></div>
  <div class="footer-col"><h4>Brasil & Mundo</h4><ul>
    <li><a href="../pages/brasil.html">Brasil</a></li>
    <li><a href="../pages/mundo.html">Mundo</a></li>
    <li><a href="../pages/campinas.html">Campinas</a></li>
    <li><a href="../pages/industrias.html">Indústrias</a></li>
  </ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul>
    <li><a href="#">Sobre nós</a></li>
    <li><a href="#">Anuncie</a></li>
    <li><a href="../pages/vagas.html">Vagas</a></li>
  </ul></div>
</div><div class="footer-bottom"><span>© 2026 Empresas &amp; Negócios.</span></div></footer>
<div class="toast" id="toast"><span class="toast-icon">✅</span><span id="toastMsg">Inscrição realizada!</span></div>
<button class="back-to-top" id="backToTop">↑</button>
<script src="../js/main.js"></script>
</body>
</html>`;
}

// ─── ATUALIZAR ÍNDICE ─────────────────────────────────────────────────────────
function loadIndex() {
  const indexPath = join(__dirname, '..', 'data', 'artigos.json');
  if (existsSync(indexPath)) {
    try { return JSON.parse(readFileSync(indexPath, 'utf8')); } catch {}
  }
  return { updated: '', articles: [] };
}

function saveIndex(index) {
  // Ordena por data decrescente (mais recente primeiro)
  index.articles.sort((a, b) => (b.isoDate || '').localeCompare(a.isoDate || ''));
  // Mantém no máximo 90 artigos
  index.articles = index.articles.slice(0, 90);
  index.updated  = new Date().toISOString();
  const indexPath = join(__dirname, '..', 'data', 'artigos.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

// ─── SLEEP (respeitar rate limit da OpenAI) ───────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = join(__dirname, '..', 'noticias');
  mkdirSync(outDir, { recursive: true });

  const index = loadIndex();
  const today = new Date();

  console.log(`\n🚀 Iniciando geração em lote de ${BATCH.length} artigos...\n`);

  let success = 0;
  let failed  = 0;

  for (let i = 0; i < BATCH.length; i++) {
    const entry = BATCH[i];

    // Calcula a data do artigo (retroativa)
    const articleDate = new Date(today);
    articleDate.setDate(today.getDate() - entry.daysAgo);

    console.log(`[${i + 1}/${BATCH.length}] 📝 ${entry.tag} — ${entry.topic.slice(0, 70)}...`);

    try {
      const article  = await generateArticle(entry);
      const isoStr   = isoDate(articleDate);
      const fileName = `${isoStr}-${article.slug}.html`;

      // Verifica se já existe (evita duplicatas em reexecuções)
      const filePath = join(outDir, fileName);
      const alreadyInIndex = index.articles.some(a => a.slug === article.slug);

      if (alreadyInIndex) {
        console.log(`   ⏭️  Já existe no índice (slug: ${article.slug}), pulando.`);
        continue;
      }

      // Salva o HTML
      const html = buildHtml(article, articleDate, entry.image, fileName, entry);
      writeFileSync(filePath, html, 'utf8');

      // Adiciona ao índice (em memória, salva no final)
      index.articles.push({
        slug:        article.slug,
        title:       article.title,
        description: article.description,
        date:        formatDate(articleDate),
        isoDate:     isoStr,
        tag:         article.tag,
        tagCls:      article.tagCls,
        readMin:     article.readMin,
        image:       entry.image,
        url:         `noticias/${fileName}`,
      });

      console.log(`   ✅ Publicado: noticias/${fileName}`);
      console.log(`   📰 "${article.title}"`);
      success++;

    } catch (e) {
      console.error(`   ❌ Erro: ${e.message}`);
      failed++;
    }

    // Pausa entre chamadas para evitar rate limit (exceto na última)
    if (i < BATCH.length - 1) {
      process.stdout.write('   ⏳ Aguardando 3s...\r');
      await sleep(3000);
    }
  }

  // Salva o índice final (já ordenado por data)
  saveIndex(index);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Concluído! ${success} artigos gerados, ${failed} falhas.`);
  console.log(`📋 data/artigos.json atualizado com ${index.articles.length} artigos no total.`);
  console.log(`🌐 Acesse: https://www.empresasenegocios.com.br/\n`);
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
