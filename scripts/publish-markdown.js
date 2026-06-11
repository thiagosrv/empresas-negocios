/**
 * publish-markdown.js
 *
 * Lê arquivos .md da pasta content/artigos/, converte para HTML e atualiza
 * data/artigos.json automaticamente. Não usa IA — publica o conteúdo que você escreveu.
 *
 * Uso: node scripts/publish-markdown.js
 * Suporte a frontmatter YAML:
 *   ---
 *   title: Título do artigo
 *   description: Resumo de 2-3 frases
 *   tag: Tecnologia
 *   tagCls: tecnologia
 *   image: https://...
 *   slug: meu-artigo-2026
 *   readMin: 5
 *   keywords: portaria, campinas, facilities
 *   ---
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

const CONTENT_DIR  = join(ROOT, 'content', 'artigos');
const OUTPUT_DIR   = join(ROOT, 'noticias');
const ARTIGOS_JSON = join(ROOT, 'data', 'artigos.json');
const SITE_URL     = 'https://www.empresasenegocios.com.br';

// ─── MAPEAMENTO DE CATEGORIAS ─────────────────────────────────────────────────
const CATEGORY_MAP = [
  { keywords: ['controle-de-acesso', 'cftv', 'biometria', 'monitoramento', 'portaria-virtual'], tag: 'Serviços',   tagCls: 'servicos'   },
  { keywords: ['facilities', 'gestao-de-facilities', 'limpeza', 'conservacao', 'manutencao-predial', 'terceirizacao'], tag: 'Serviços', tagCls: 'servicos' },
  { keywords: ['portaria', 'recepcao', 'recepcionist'],                                          tag: 'Serviços',   tagCls: 'servicos'   },
  { keywords: ['inovacao-tecnologica', 'tecnologia', 'inteligencia-artificial', 'ia-', '-ia-', 'digital', 'software', 'startup-tech'], tag: 'Tecnologia', tagCls: 'tecnologia' },
  { keywords: ['startups', 'startup', 'fintech', 'agtech', 'healthtech', 'unicornio'],          tag: 'Startups',   tagCls: 'startups'   },
  { keywords: ['saude', 'hospital', 'clinica', 'enfermagem', 'medico'],                         tag: 'Saúde',      tagCls: 'saude'      },
  { keywords: ['industria', 'industrial', 'fabrica', 'producao', 'automotivo'],                 tag: 'Indústrias', tagCls: 'industrias' },
  { keywords: ['futebol', 'brasileirao', 'copa', 'libertadores', 'gol', 'campeonato'],          tag: 'Futebol',    tagCls: 'futebol'    },
  { keywords: ['brasil', 'economia', 'governo', 'politica', 'reforma', 'tributar', 'bndes'],    tag: 'Brasil',     tagCls: 'brasil'     },
  { keywords: ['mundo', 'eua', 'china', 'europa', 'global', 'internacional'],                   tag: 'Mundo',      tagCls: 'mundo'      },
  { keywords: ['campinas', 'americana', 'sumare', 'piracicaba', 'limeira', 'santa-barbara'],     tag: 'Campinas',   tagCls: 'brasil'     },
  { keywords: ['sociedade', 'carreira', 'geracao', 'home-office', 'rh', 'lideranca'],           tag: 'Sociedade',  tagCls: 'sociedade'  },
  { keywords: ['cultura', 'arte', 'gastronomia', 'lifestyle'],                                   tag: 'Cultura',    tagCls: 'cultura'    },
];

const DEFAULT_IMAGES = {
  servicos:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  tecnologia:  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop',
  startups:    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop',
  saude:       'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  industrias:  'https://images.unsplash.com/photo-1565793979108-a10eea5fad27?w=800&h=450&fit=crop',
  futebol:     'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop',
  brasil:      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=450&fit=crop',
  mundo:       'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=450&fit=crop',
  sociedade:   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  cultura:     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
  novidades:   'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
};

// Mapa tag → página de categoria
const TAG_PAGE = {
  servicos:   'pages/servicos.html',
  tecnologia: 'pages/tecnologia.html',
  startups:   'pages/startups.html',
  saude:      'pages/saude.html',
  industrias: 'pages/industrias.html',
  futebol:    'pages/futebol.html',
  brasil:     'pages/brasil.html',
  mundo:      'pages/mundo.html',
  sociedade:  'pages/sociedade.html',
  cultura:    'pages/cultura.html',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escJson(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function detectCategory(filename) {
  const lower = filename.toLowerCase();
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { tag: cat.tag, tagCls: cat.tagCls };
    }
  }
  return { tag: 'Novidades', tagCls: 'novidades' };
}

function slugToTitle(slug) {
  const clean = slug.replace(/-\d+$/, '');
  return clean
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractDescription(markdownBody) {
  const SKIP = /^(Meta\s+(Title|Description|Keywords)|#{1,6}\s)/i;
  const lines = markdownBody.split('\n').filter(l => {
    const t = l.trim();
    return t && !SKIP.test(t);
  });
  const first = lines[0] || '';
  return first.replace(/[*_`[\]]/g, '').slice(0, 160);
}

function markdownToHtml(body) {
  marked.setOptions({ gfm: true, breaks: true });
  return marked.parse(body);
}

// ─── BUILDER DE HTML COMPLETO ─────────────────────────────────────────────────
function buildArticleHtml(meta, htmlBody, fileName) {
  const { title, description, tag, tagCls, image, readMin, date, keywords } = meta;
  const dateStr    = formatDate(date);
  const isoStr     = isoDate(date);
  const canonUrl   = `${SITE_URL}/noticias/${fileName}`;
  const tagPageRel = '../' + (TAG_PAGE[tagCls] || 'pages/novidades.html');
  const tagPageAbs = `${SITE_URL}/${TAG_PAGE[tagCls] || 'pages/novidades.html'}`;
  const wordCount  = htmlBody.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;

  const kwArr = keywords
    ? keywords.split(',').map(k => k.trim()).filter(Boolean)
    : [tag, tagCls, 'negócios', 'empresas'];
  const kwJson = JSON.stringify(kwArr);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${escHtml(description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"/>
<link rel="canonical" href="${canonUrl}"/>
<link rel="icon" type="image/x-icon" href="../favicon.ico"/>
<meta name="theme-color" content="#000000"/>

<!-- Open Graph -->
<meta property="og:type" content="article"/>
<meta property="og:locale" content="pt_BR"/>
<meta property="og:site_name" content="Empresas &amp; Negócios"/>
<meta property="og:title" content="${escHtml(title)}"/>
<meta property="og:description" content="${escHtml(description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:width" content="800"/>
<meta property="og:image:height" content="450"/>
<meta property="article:published_time" content="${isoStr}"/>
<meta property="article:modified_time" content="${isoStr}"/>
<meta property="article:section" content="${escHtml(tag)}"/>
<meta property="article:tag" content="${escHtml(tag)}"/>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@empresasenegocios"/>
<meta name="twitter:title" content="${escHtml(title)}"/>
<meta name="twitter:description" content="${escHtml(description)}"/>
<meta name="twitter:image" content="${image}"/>

<!-- Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsArticle",
      "@id": "${canonUrl}#article",
      "headline": "${escJson(title)}",
      "description": "${escJson(description)}",
      "image": { "@type": "ImageObject", "url": "${image}", "width": 800, "height": 450 },
      "datePublished": "${isoStr}",
      "dateModified": "${isoStr}",
      "wordCount": ${wordCount},
      "keywords": ${kwJson},
      "articleSection": "${escJson(tag)}",
      "inLanguage": "pt-BR",
      "mainEntityOfPage": "${canonUrl}",
      "url": "${canonUrl}",
      "author": {
        "@type": "Person",
        "name": "Thiago Rodrigues",
        "jobTitle": "Redator",
        "worksFor": { "@type": "Organization", "@id": "${SITE_URL}/#organization" }
      },
      "publisher": {
        "@type": "NewsMediaOrganization",
        "@id": "${SITE_URL}/#organization",
        "name": "Empresas & Negócios",
        "url": "${SITE_URL}"
      },
      "isPartOf": { "@id": "${SITE_URL}/#website" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Início",       "item": "${SITE_URL}/" },
        { "@type": "ListItem", "position": 2, "name": "${escJson(tag)}", "item": "${tagPageAbs}" },
        { "@type": "ListItem", "position": 3, "name": "${escJson(title.slice(0, 80))}" }
      ]
    }
  ]
}
</script>

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
<link rel="stylesheet" href="../css/editorial.css"/>
<style>
  .article-body h2 { font-family:var(--ed-font-head,"Manrope"),sans-serif;font-size:22px;font-weight:800;margin:36px 0 14px;color:#000; }
  .article-body h3 { font-family:var(--ed-font-head,"Manrope"),sans-serif;font-size:18px;font-weight:700;margin:24px 0 10px;color:#000; }
  .article-body p  { font-size:16px;line-height:1.85;margin-bottom:20px;color:#333; }
  .article-body ul,.article-body ol { font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333; }
  .article-body blockquote { border-left:4px solid #000;padding:16px 24px;margin:28px 0;background:#f8f9fa; }
  .article-body blockquote p { font-size:17px;font-style:italic;margin:0; }
  .article-body strong { color:#000; }
  .article-body a { color:#000;text-decoration:underline; }
  .article-body img { max-width:100%;margin:16px 0; }
  .article-body table { width:100%;border-collapse:collapse;margin:24px 0; }
  .article-body th { background:#000;color:#fff;padding:10px 14px;text-align:left;font-size:13px; }
  .article-body td { padding:10px 14px;border-bottom:1px solid #eee;font-size:14px; }
  .article-share { display:flex;gap:10px;flex-wrap:wrap;margin:32px 0;align-items:center; }
  .article-share span { font-size:13px;font-weight:700;color:#888; }
  .share-btn { padding:8px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;color:#fff; }
  .share-wa { background:#25D366; }
  .share-li { background:#0077b5; }
  .related-section { margin-top:48px;padding-top:32px;border-top:2px solid #000; }
  .related-section h2 { font-family:var(--ed-font-head,"Manrope"),sans-serif;font-size:20px;font-weight:800;margin-bottom:24px; }
</style>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>

<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">

    <!-- Breadcrumb HTML -->
    <nav aria-label="Breadcrumb" style="margin-bottom:24px;font-size:13px;color:#888;">
      <a href="../index.html" style="color:#888;">Início</a>
      <span style="margin:0 6px;" aria-hidden="true">›</span>
      <a href="${tagPageRel}" style="color:#888;">${escHtml(tag)}</a>
      <span style="margin:0 6px;" aria-hidden="true">›</span>
      <span style="color:#333;" aria-current="page">${escHtml(title.slice(0, 60))}${title.length > 60 ? '…' : ''}</span>
    </nav>

    <!-- Tag -->
    <div style="margin-bottom:16px;">
      <span class="tag ${tagCls}">${escHtml(tag)}</span>
    </div>

    <!-- Título -->
    <h1 style="font-family:var(--ed-font-head,'Manrope'),sans-serif;font-size:clamp(24px,4vw,40px);font-weight:800;line-height:1.2;margin-bottom:16px;color:#000;">
      ${escHtml(title)}
    </h1>

    <!-- Meta -->
    <div class="meta" style="margin-bottom:28px;">
      <time datetime="${isoStr}">${dateStr}</time>
      <span class="dot"></span>
      <span>${readMin} min de leitura</span>
      <span class="dot"></span>
      <span>Thiago Rodrigues &mdash; Redator do E&amp;N</span>
    </div>

    <!-- Imagem destaque -->
    <img src="${image}"
         alt="${escHtml(title)}"
         style="width:100%;aspect-ratio:16/7;object-fit:cover;margin-bottom:32px;"
         loading="eager" width="800" height="350"/>

    <!-- Corpo do artigo -->
    <div class="article-body">
      ${htmlBody}
    </div>

    <!-- Compartilhar -->
    <div class="article-share">
      <span>Compartilhar:</span>
      <a class="share-btn share-wa"
         href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' — ' + canonUrl)}"
         target="_blank" rel="noopener">📱 WhatsApp</a>
      <a class="share-btn share-li"
         href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}"
         target="_blank" rel="noopener">in LinkedIn</a>
    </div>

    <!-- CTA WhatsApp -->
    <div style="background:#0A0A0A;color:#fff;padding:32px;margin:32px 0;text-align:center;">
      <h3 style="color:#fff;font-size:20px;font-weight:800;margin-bottom:10px;">
        Precisa de ${tag === 'Serviços' ? 'portaria ou facilities' : 'mais informações'} para sua empresa?
      </h3>
      <p style="color:rgba(255,255,255,.5);font-size:14px;margin-bottom:20px;">
        Fale com especialistas da região agora mesmo pelo WhatsApp.
      </p>
      <a href="https://wa.me/5519999115496?text=${encodeURIComponent('Olá! Vi o artigo "' + title + '" no Empresas & Negócios e quero saber mais.')}"
         target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:13px 28px;font-weight:700;font-size:14px;text-decoration:none;">
        📲 Falar pelo WhatsApp
      </a>
    </div>

    <!-- Navegação de volta -->
    <div style="margin-bottom:16px;">
      <a href="${tagPageRel}" style="color:#000;font-size:13px;font-weight:700;">
        ← Ver mais artigos de ${escHtml(tag)}
      </a>
    </div>

    <!-- Artigos relacionados -->
    <section class="related-section">
      <h2>Leia também</h2>
      <div id="art-relacionados"
           data-artigos="4"
           data-artigos-tagcls="${tagCls}"
           data-artigos-allow-repeat="true"></div>
    </section>

  </div><!-- /content-col -->

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-sticky">
      <div class="sidebar-widget">
        <div class="widget-header">📧 Newsletter</div>
        <div style="padding:16px;">
          <p style="font-size:13px;color:#666;margin-bottom:14px;">Receba os melhores artigos de negócios no seu e-mail toda manhã.</p>
          <form onsubmit="handleNewsletter(event)">
            <input type="email" placeholder="seu@email.com" required
                   style="width:100%;border:1.5px solid #e0e0e0;padding:10px 14px;font-size:13px;margin-bottom:10px;box-sizing:border-box;font-family:inherit;"/>
            <button type="submit"
                    style="width:100%;background:#000;color:#fff;border:none;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
              Assinar grátis
            </button>
          </form>
          <p style="font-size:10px;color:#bbb;text-align:center;margin-top:8px;">📵 Sem spam.</p>
        </div>
      </div>

      <div style="background:#0a0f1e;padding:20px;text-align:center;margin-bottom:20px;border:1px solid rgba(255,255,255,.07);">
        <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:6px;">Proteção Talentos</div>
        <p style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:16px;">Vagas diretas em portaria e facilities na região de Campinas.</p>
        <a href="https://protecaotalentos.online" target="_blank" rel="noopener"
           style="display:flex;align-items:center;justify-content:center;gap:7px;background:#25D366;color:#fff;padding:11px 20px;font-size:13px;font-weight:700;text-decoration:none;">
          🚀 Ver vagas
        </a>
      </div>
    </div>
  </aside>
</div>

<section class="newsletter-section" id="newsletter">
  <div class="nl-inner">
    <h2>Fique por dentro dos negócios</h2>
    <p>Notícias de Campinas, Americana e toda a região no seu e-mail todo dia.</p>
    <form class="nl-form" onsubmit="handleNewsletter(event)">
      <input type="email" placeholder="Digite seu e-mail" required/>
      <button type="submit">Assinar grátis</button>
    </form>
  </div>
</section>

<a class="back-to-top" id="backToTop" aria-label="Voltar ao topo">↑</a>
<div class="toast" id="toast"><span class="toast-icon"></span><span id="toastMsg"></span></div>

<script src="../js/layout.js"></script>
<script src="../js/artigos.js"></script>
<script src="../js/main.js"></script>
</body>
</html>`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const maxArg = process.argv.find(a => a.startsWith('--max='));
  const MAX    = maxArg ? parseInt(maxArg.split('=')[1], 10) : Infinity;

  console.log('\n📂 Publicando artigos de content/artigos/...');
  if (MAX !== Infinity) console.log(`⏱️  Modo agendado: máximo ${MAX} artigo(s) por execução\n`);
  else console.log();

  if (!existsSync(CONTENT_DIR)) {
    mkdirSync(CONTENT_DIR, { recursive: true });
    console.log('✅ Pasta content/artigos/ criada.');
    return;
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let artigosData = { updated: '', articles: [] };
  if (existsSync(ARTIGOS_JSON)) {
    try { artigosData = JSON.parse(readFileSync(ARTIGOS_JSON, 'utf8')); } catch {}
  }
  const existingIds = new Set((artigosData.articles || []).map(a => a.id));

  const mdFiles = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (!mdFiles.length) {
    console.log('ℹ️  Nenhum arquivo .md encontrado em content/artigos/');
    return;
  }

  console.log(`📄 ${mdFiles.length} arquivo(s) encontrado(s)\n`);

  let published = 0;
  let skipped   = 0;
  const today   = new Date();

  for (const mdFile of mdFiles) {
    const mdPath  = join(CONTENT_DIR, mdFile);
    const rawFile = readFileSync(mdPath, 'utf8');

    const { data: fm, content: body } = matter(rawFile);

    const fileSlug = basename(mdFile, '.md');

    if (existingIds.has(`md-${fileSlug}`)) {
      skipped++;
      continue;
    }

    const detected  = detectCategory(fileSlug + ' ' + (fm.title || '') + ' ' + body.slice(0, 200));
    const title     = fm.title       || slugToTitle(fileSlug);
    const tag       = fm.tag         || detected.tag;
    const tagCls    = fm.tagCls      || detected.tagCls;
    const image     = fm.image       || DEFAULT_IMAGES[tagCls] || DEFAULT_IMAGES.novidades;
    const readMin   = fm.readMin     || Math.max(3, Math.ceil(body.split(/\s+/).length / 200));
    const slug      = fm.slug        || slugify(fileSlug);
    const desc      = fm.description || extractDescription(body);
    const keywords  = fm.keywords    || null;

    const datePrefix = isoDate(today);
    const htmlFile   = `${datePrefix}-${slug}.html`;
    const htmlPath   = join(OUTPUT_DIR, htmlFile);
    const articleUrl = `noticias/${htmlFile}`;

    const htmlBody  = markdownToHtml(body);
    const meta      = { title, description: desc, tag, tagCls, image, readMin, date: today, keywords };

    writeFileSync(htmlPath, buildArticleHtml(meta, htmlBody, htmlFile), 'utf8');

    artigosData.articles.unshift({
      id:          `md-${fileSlug}`,
      url:         articleUrl,
      title,
      description: desc,
      tag,
      tagCls,
      image,
      date:        formatDate(today),
      isoDate:     datePrefix,
      readMin,
      source:      'content',
    });
    existingIds.add(`md-${fileSlug}`);

    console.log(`✅ Publicado: ${htmlFile}`);
    console.log(`   Título: ${title}`);
    console.log(`   Tag: ${tag} (${tagCls})\n`);
    published++;

    if (published >= MAX) {
      console.log(`⏹️  Limite de ${MAX} atingido.`);
      break;
    }
  }

  if (published > 0) {
    artigosData.updated  = today.toISOString();
    artigosData.articles = artigosData.articles.slice(0, 300);
    writeFileSync(ARTIGOS_JSON, JSON.stringify(artigosData, null, 2), 'utf8');
    console.log(`\n📦 artigos.json atualizado com ${published} novo(s) artigo(s).`);
  }

  console.log(`\n✅ Concluído: ${published} publicado(s), ${skipped} já existentes.`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
