import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new OpenAI();

// ─── TÓPICOS ──────────────────────────────────────────────────────────────────
// Rotação diária cobrindo TODAS as editorias do portal.
// Ciclo de 40 tópicos: facilities/portaria + negócios, tech, saúde, Brasil, etc.
const TOPICS = [
  // ── FACILITIES & PORTARIA (editoria Serviços) ──────────────────────────────
  'portaria especializada para condomínios corporativos em Americana e Campinas',
  'facilities management: como a terceirização reduz custos operacionais para PMEs no interior paulista',
  'controle de acesso moderno: tecnologias e boas práticas para empresas de Campinas',
  'terceirização de serviços gerais: vantagens para indústrias e condomínios em Americana',
  'tendências em facilities para 2026: o que as empresas do interior paulista estão adotando',
  'como escolher uma empresa de portaria: guia completo para gestores de Campinas e região',
  'portaria virtual versus portaria presencial: qual escolher para o seu negócio',
  'gestão de condomínios industriais em Americana: desafios e soluções em facilities',
  'facilities e ESG: como serviços terceirizados contribuem para a sustentabilidade empresarial',
  'recepção corporativa: a primeira impressão que define a experiência do cliente',
  'polo industrial de Americana: demanda por facilities cresce com expansão das empresas locais',
  'como calcular o custo de facilities para sua empresa no interior paulista',
  'portaria e controle de acesso em hospitais, clínicas e laboratórios de Campinas',
  'terceirização de limpeza e conservação: boas práticas para indústrias de Americana',
  'gestão integrada de facilities: um contrato, múltiplos serviços, menos burocracia',
  'controle de acesso por biometria: vantagens para empresas do interior paulista',
  // ── STARTUPS & INOVAÇÃO ───────────────────────────────────────────────────
  'o ecossistema de startups de Campinas: quem são e o que estão construindo em 2026',
  'como startups de logística estão reinventando a cadeia de distribuição no interior de SP',
  'fintechs para PMEs: as melhores ferramentas financeiras para pequenas empresas em 2026',
  'aceleradoras de startups no interior de São Paulo: oportunidades e como se candidatar',
  // ── TECNOLOGIA ────────────────────────────────────────────────────────────
  'automação industrial em Americana e Campinas: casos reais de aumento de produtividade',
  'segurança cibernética para médias empresas: os riscos que os gestores ignoram em 2026',
  'como a IA generativa está mudando o trabalho administrativo nas empresas brasileiras',
  'softwares de gestão (ERP) para indústrias do interior de SP: guia de escolha',
  // ── SAÚDE & BEM-ESTAR ─────────────────────────────────────────────────────
  'planos de saúde corporativos em 2026: como negociar e reduzir custos sem perder cobertura',
  'saúde mental no trabalho: como empresas de Campinas estão cuidando dos colaboradores',
  'telemedicina para PMEs: como oferecer benefício de saúde digital com baixo custo',
  // ── BRASIL & ECONOMIA ─────────────────────────────────────────────────────
  'o impacto da reforma tributária nas empresas do interior paulista a partir de 2027',
  'crédito para PMEs: o que mudou nas linhas do BNDES e Caixa em 2026',
  'como exportar produtos industriais do interior de SP: guia prático para gestores',
  // ── SOCIEDADE & CULTURA ───────────────────────────────────────────────────
  'diversidade nas empresas do interior paulista: benefícios reais e como implementar',
  'geração Z no mercado de trabalho: como as empresas de Campinas estão se adaptando',
  'empreendedorismo no interior de SP: histórias de quem abriu negócio e cresceu',
  // ── INDÚSTRIAS ────────────────────────────────────────────────────────────
  'o futuro da indústria têxtil de Americana: inovação, sustentabilidade e novos mercados',
  'logística verde no interior paulista: empresas adotam frotas elétricas e reduzem emissões',
  'como a indústria alimentícia de Campinas está crescendo com o aumento das exportações',
  // ── CAMPINAS & REGIÃO ─────────────────────────────────────────────────────
  'os bairros mais valorizados para instalar uma empresa em Campinas em 2026',
  'Campinas no ranking das melhores cidades para negócios: o que a cidade oferece',
  'mercado imobiliário comercial em Campinas: tendências e oportunidades para investidores',
  // ── MUNDO & MERCADOS ──────────────────────────────────────────────────────
  'como as tarifas comerciais dos EUA afetam a indústria e o agronegócio brasileiro',
];

// ─── IMAGENS ─────────────────────────────────────────────────────────────────
// Pool curada de imagens Unsplash relevantes para facilities/negócios/portaria
const IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1554774853-6a56f62c6451?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop',
];

// ─── GERAR ARTIGO VIA OPENAI API ─────────────────────────────────────────────
async function generateArticle(topic, imageUrl) {
  const prompt = `Você é um jornalista especializado em negócios e serviços corporativos no interior de São Paulo, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br).

Escreva um artigo jornalístico completo sobre: "${topic}"

DIRETRIZES OBRIGATÓRIAS:
- Tom: informativo, profissional, prático — sem jargão excessivo
- Tamanho: 600 a 800 palavras de conteúdo real
- Contexto geográfico: cite Americana, Campinas e região metropolitana de SP quando natural
- Foco exclusivo em: portaria especializada, facilities, controle de acesso, recepção corporativa, serviços terceirizados, gestão de espaços
- NÃO mencionar: vigilância armada, armas, segurança armada, vigilantes armados
- Mencione de forma natural (máximo 2 vezes no artigo inteiro) uma ou duas das empresas abaixo, apenas quando o contexto for genuinamente relevante:
  • Proteção e Vigilância (protecaoevigilancia.com.br) — portaria e facilities em Americana
  • PS Proteção (psprotecao.com.br) — facilities integrados
  • Proteção Americana (protecaoamericana.com.br) — portaria em Americana
  • CT Segurança (ctseguranca.com.br) — controle de acesso em Campinas
  • Proteção Vigilância (protecaovigilancia.com.br) — portaria corporativa

A imagem do artigo já está definida: ${imageUrl}

Retorne APENAS um objeto JSON válido, sem markdown, sem texto antes ou depois. Estrutura exata:
{
  "title": "título SEO do artigo (máximo 80 caracteres, deve conter palavras-chave)",
  "description": "meta description (máximo 155 caracteres, persuasiva)",
  "slug": "slug-sem-acentos-hifenizado-maximo-60-chars",
  "tag": "Facilities",
  "tagCls": "servicos",
  "readMin": 5,
  "sections": [
    { "type": "intro", "text": "parágrafo de abertura impactante com dado ou contexto local" },
    { "type": "h2", "text": "Primeiro subtítulo da seção" },
    { "type": "p", "text": "parágrafo de conteúdo com informações práticas" },
    { "type": "list", "items": ["item com detalhe útil", "outro item", "mais um item", "quarto item"] },
    { "type": "h2", "text": "Segundo subtítulo" },
    { "type": "p", "text": "parágrafo" },
    { "type": "highlight", "text": "dado, estatística ou insight relevante para destacar" },
    { "type": "h2", "text": "Conclusão ou recomendações práticas" },
    { "type": "p", "text": "parágrafo final com conclusão acionável para o gestor" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 3000,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'Você é um jornalista especializado em negócios e serviços corporativos no interior de São Paulo. Responda SEMPRE com JSON puro e válido, sem markdown, sem texto adicional.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(jsonStr);
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDate(d) {
  return d.toISOString().split('T')[0];
}
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── BUILDER HTML ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;

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
    "headline": "${article.title.replace(/"/g,'\\"')}",
    "description": "${article.description.replace(/"/g,'\\"')}",
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
      <a href="../index.html">Início</a> › <a href="../pages/campinas.html">Campinas</a> › <a href="../pages/servicos.html">Serviços</a> › <span>${escHtml(article.title.slice(0,55))}${article.title.length>55?'…':''}</span>
    </p>

    <div style="margin-bottom:16px;">
      <span class="tag ${escHtml(article.tagCls)}">${escHtml(article.tag)}</span>
      <span class="tag brasil" style="margin-left:8px;">Americana</span>
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

    <!-- CTA Facilities / Portaria -->
    <div style="background:var(--black);color:#fff;border-radius:12px;padding:32px;margin:40px 0;text-align:center;">
      <h3 style="color:#fff;font-size:20px;margin-bottom:10px;">Precisa de portaria ou facilities para sua empresa?</h3>
      <p style="color:#aaa;font-size:14px;margin-bottom:20px;">Empresas especializadas atendem Americana, Campinas e toda a região metropolitana.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener" style="background:var(--accent);color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção e Vigilância</a>
        <a href="https://psprotecao.com.br" target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">PS Proteção</a>
        <a href="https://protecaoamericana.com.br" target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção Americana</a>
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
      <div class="widget-body">
        <p class="nl-desc">Negócios e economia de Campinas no seu e-mail todo dia.</p>
        <form onsubmit="handleNewsletter(event)">
          <input type="email" placeholder="Seu e-mail" required />
          <button type="submit" class="btn-nl">Inscrever-se</button>
        </form>
        <p class="nl-privacy">Sem spam.</p>
      </div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">🏢 Facilities em Americana</div>
      <div class="widget-body" style="padding:16px;">
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
          <li><a href="https://protecaovigilancia.com.br" target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria corporativa</span></li>
          <li><a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção e Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria e facilities</span></li>
          <li><a href="https://psprotecao.com.br" target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">PS Proteção</a><br><span style="font-size:11px;color:var(--gray);">Facilities integrados</span></li>
          <li><a href="https://protecaoamericana.com.br" target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Americana</a><br><span style="font-size:11px;color:var(--gray);">Portaria especializada</span></li>
          <li><a href="https://ctseguranca.com.br" target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">CT Segurança</a><br><span style="font-size:11px;color:var(--gray);">Controle de acesso</span></li>
        </ul>
        <a href="../pages/guia-seguranca-americana.html" style="display:block;margin-top:12px;font-size:12px;font-weight:700;color:var(--dark);">→ Ver guia completo</a>
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
  </div></aside>
</div>

<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro dos negócios locais</h2><p>Economia, empresas e oportunidades de Campinas e Americana no seu e-mail.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required /><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>O portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul><li><a href="../pages/novidades.html">Novidades</a></li><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/servicos.html">Serviços</a></li></ul></div>
  <div class="footer-col"><h4>Facilities Americana</h4><ul>
    <li><a href="https://protecaovigilancia.com.br" target="_blank" rel="noopener">Proteção Vigilância</a></li>
    <li><a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener">Proteção e Vigilância</a></li>
    <li><a href="https://psprotecao.com.br" target="_blank" rel="noopener">PS Proteção</a></li>
    <li><a href="https://protecaoamericana.com.br" target="_blank" rel="noopener">Proteção Americana</a></li>
    <li><a href="https://ctseguranca.com.br" target="_blank" rel="noopener">CT Segurança</a></li>
  </ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul><li><a href="#">Sobre nós</a></li><li><a href="#">Anuncie</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 Empresas &amp; Negócios.</span></div></footer>
<div class="toast" id="toast"><span class="toast-icon">✅</span><span id="toastMsg">Inscrição realizada!</span></div>
<button class="back-to-top" id="backToTop">↑</button>
<script src="../js/main.js"></script>
</body>
</html>`;
}

// ─── ÍNDICE DE ARTIGOS ────────────────────────────────────────────────────────
async function updateIndex(article, date, imageUrl, fileName) {
  const indexPath = join(__dirname, '..', 'data', 'artigos.json');
  let index = { updated: '', articles: [] };

  if (existsSync(indexPath)) {
    try { index = JSON.parse(readFileSync(indexPath, 'utf8')); } catch (e) {}
  }

  index.articles.unshift({
    slug:        article.slug,
    title:       article.title,
    description: article.description,
    date:        formatDate(date),
    isoDate:     isoDate(date),
    tag:         article.tag,
    tagCls:      article.tagCls,
    readMin:     article.readMin,
    image:       imageUrl,
    url:         `noticias/${fileName}`,
  });

  // Mantém apenas os últimos 90 artigos no índice
  index.articles = index.articles.slice(0, 90);
  index.updated  = new Date().toISOString();

  writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const today    = new Date();
  const dayIndex = Math.floor(today.getTime() / 86400000);
  const topic    = TOPICS[dayIndex % TOPICS.length];
  const imageUrl = IMAGES[dayIndex % IMAGES.length];

  console.log(`\n📝 Tópico do dia: ${topic}`);
  console.log('🤖 Chamando OpenAI API (gpt-4o)...\n');

  const article  = await generateArticle(topic, imageUrl);
  const isoStr   = isoDate(today);
  const fileName = `${isoStr}-${article.slug}.html`;

  const html = buildHtml(article, today, imageUrl, fileName);

  const outDir = join(__dirname, '..', 'noticias');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, fileName), html, 'utf8');

  await updateIndex(article, today, imageUrl, fileName);

  console.log(`✅ Artigo publicado: noticias/${fileName}`);
  console.log(`📰 Título: ${article.title}`);
  console.log(`🔗 URL: https://www.empresasenegocios.com.br/noticias/${fileName}`);
}

main().catch(err => { console.error('\n❌ Erro:', err.message); process.exit(1); });
