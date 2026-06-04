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
 *   ---
 *
 * Se não houver frontmatter, o script deriva os metadados do nome do arquivo.
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
// Detecta tag/tagCls pelo nome do arquivo ou conteúdo
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// Detecta categoria a partir do nome do arquivo ou slug
function detectCategory(filename) {
  const lower = filename.toLowerCase();
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { tag: cat.tag, tagCls: cat.tagCls };
    }
  }
  return { tag: 'Novidades', tagCls: 'novidades' };
}

// Transforma o slug do arquivo em um título legível
function slugToTitle(slug) {
  // Remove ID numérico do final (ex: -50010)
  const clean = slug.replace(/-\d+$/, '');
  return clean
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Extrai o primeiro parágrafo do markdown como description
function extractDescription(markdownBody) {
  const lines = markdownBody.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const first = lines[0] || '';
  return first.replace(/[*_`]/g, '').slice(0, 160);
}

// Converte markdown body para HTML limpo usando marked
function markdownToHtml(body) {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  return marked.parse(body);
}

// ─── BUILDER DE HTML COMPLETO ─────────────────────────────────────────────────
function buildArticleHtml(meta, htmlBody, fileName) {
  const { title, description, tag, tagCls, image, readMin, date } = meta;
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `${SITE_URL}/noticias/${fileName}`;

  const tagLink = tagCls === 'servicos'   ? '../pages/servicos.html'
                : tagCls === 'tecnologia' ? '../pages/tecnologia.html'
                : tagCls === 'startups'   ? '../pages/startups.html'
                : tagCls === 'saude'      ? '../pages/saude.html'
                : tagCls === 'industrias' ? '../pages/industrias.html'
                : tagCls === 'futebol'    ? '../pages/futebol.html'
                : tagCls === 'brasil'     ? '../pages/brasil.html'
                : tagCls === 'mundo'      ? '../pages/mundo.html'
                : tagCls === 'sociedade'  ? '../pages/sociedade.html'
                : tagCls === 'cultura'    ? '../pages/cultura.html'
                : '../pages/novidades.html';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${escHtml(description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"/>
<link rel="canonical" href="${canonUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Empresas &amp; Negócios"/>
<meta property="og:title" content="${escHtml(title)}"/>
<meta property="og:description" content="${escHtml(description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${image}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"NewsArticle",
  "headline":"${title.replace(/"/g, '\\"')}",
  "description":"${description.replace(/"/g, '\\"')}",
  "image":"${image}",
  "datePublished":"${isoStr}",
  "dateModified":"${isoStr}",
  "author":{"@type":"Organization","name":"Empresas & Negócios","url":"${SITE_URL}"},
  "publisher":{"@type":"Organization","name":"Empresas & Negócios","url":"${SITE_URL}"},
  "mainEntityOfPage":"${canonUrl}",
  "inLanguage":"pt-BR"
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
<style>
  .article-body h2 { font-size:22px;font-weight:800;margin:36px 0 14px;color:#0E1117; }
  .article-body h3 { font-size:18px;font-weight:700;margin:24px 0 10px;color:#0E1117; }
  .article-body p  { font-size:16px;line-height:1.85;margin-bottom:20px;color:#333; }
  .article-body ul,.article-body ol { font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333; }
  .article-body blockquote { border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:#f8f9fa;border-radius:0 8px 8px 0; }
  .article-body blockquote p { font-size:17px;font-style:italic;margin:0; }
  .article-body strong { color:#0E1117; }
  .article-body a { color:var(--accent);text-decoration:underline; }
  .article-body a:hover { color:var(--accent-dark); }
  .article-body img { max-width:100%;border-radius:8px;margin:16px 0; }
  .article-body table { width:100%;border-collapse:collapse;margin:24px 0; }
  .article-body th { background:#0E1117;color:#fff;padding:10px 14px;text-align:left;font-size:13px; }
  .article-body td { padding:10px 14px;border-bottom:1px solid #eee;font-size:14px; }
</style>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>
<div class="ticker-bar">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;overflow:hidden;">
    <span class="ticker-label">E&amp;N</span>
    <div class="ticker-track" id="tickerTrack">
      <span>${escHtml(title)}</span>
      <span>Empresas &amp; Negócios — empresasenegocios.com.br</span>
    </div>
  </div>
</div>
<header class="site-header">
  <div class="header-top">
    <button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
    <a href="../index.html" class="logo"><span class="logo-text">Empresas<span>&</span>Negócios</span></a>
    <span class="header-date" id="headerDate"></span>
    <div class="header-actions">
      <a class="btn-search" href="#" aria-label="Buscar">🔍</a>
      <a class="btn-subscribe" href="#newsletter">Newsletter</a>
    </div>
  </div>
  <nav class="main-nav" id="mainNav">
    <div class="nav-inner">
      <a href="../index.html">Início</a>
      <a href="../pages/novidades.html">Novidades</a>
      <a href="../pages/startups.html">Startups</a>
      <a href="../pages/tecnologia.html">Tecnologia</a>
      <a href="../pages/brasil.html">Brasil</a>
      <a href="../pages/vagas.html">Vagas</a>
      <a href="../pages/futebol.html">⚽ Futebol</a>
      <div class="nav-more-wrap">
        <button class="nav-more-btn" id="navMoreBtn" aria-expanded="false" aria-haspopup="true">Mais ▾</button>
        <div class="nav-dropdown" id="navDropdown">
          <a href="../pages/servicos.html">Serviços</a>
          <a href="../pages/industrias.html">Indústrias</a>
          <a href="../pages/saude.html">Saúde</a>
          <a href="../pages/sociedade.html">Sociedade</a>
          <a href="../pages/cultura.html">Cultura</a>
          <a href="../pages/mundo.html">Mundo</a>
          <a href="../pages/campinas.html">Campinas</a>
          <a href="../pages/esportes.html">Esportes</a>
          <a href="../pages/tempo.html">🌤️ Tempo</a>
          <a href="../pages/noticias-locais.html">Local</a>
        </div>
      </div>
    </div>
  </nav>
</header>

<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">

    <!-- Breadcrumb -->
    <p class="breadcrumb" style="margin-bottom:24px;font-size:13px;color:#888;">
      <a href="../index.html" style="color:#888;">Início</a>
      <span style="margin:0 6px;">›</span>
      <a href="${tagLink}" style="color:#888;">${escHtml(tag)}</a>
      <span style="margin:0 6px;">›</span>
      <span style="color:#333;">${escHtml(title.slice(0, 55))}${title.length > 55 ? '…' : ''}</span>
    </p>

    <!-- Tag -->
    <div style="margin-bottom:16px;">
      <span class="tag ${tagCls}">${escHtml(tag)}</span>
    </div>

    <!-- Título -->
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;color:#0E1117;">
      ${escHtml(title)}
    </h1>

    <!-- Meta -->
    <div class="meta" style="margin-bottom:28px;">
      <time datetime="${isoStr}">${dateStr}</time>
      <span class="dot"></span>
      <span>${readMin} min de leitura</span>
      <span class="dot"></span>
      <span>Redação Empresas &amp; Negócios</span>
    </div>

    <!-- Imagem destaque -->
    <img src="${image}"
         alt="${escHtml(title)}"
         style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;"
         loading="eager"/>

    <!-- Corpo do artigo -->
    <div class="article-body">
      ${htmlBody}
    </div>

    <!-- CTA final -->
    <div style="background:#0A0A0A;color:#fff;border-radius:12px;padding:32px;margin:40px 0;text-align:center;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.4);margin-bottom:8px;">Parceiro</p>
      <h3 style="color:#fff;font-size:20px;font-weight:800;margin-bottom:10px;">
        Precisa de ${tag === 'Serviços' ? 'portaria ou facilities' : 'mais informações'} para sua empresa?
      </h3>
      <p style="color:rgba(255,255,255,.5);font-size:14px;margin-bottom:20px;">
        Fale com especialistas da região agora mesmo pelo WhatsApp.
      </p>
      <a href="https://wa.me/5519999115496?text=Olá!+Vi+o+artigo+no+Empresas+%26+Negócios+e+quero+saber+mais."
         target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        📲 Falar pelo WhatsApp
      </a>
    </div>

    <!-- Navegação de volta -->
    <div style="margin-top:24px;">
      <a href="${tagLink}"
         style="display:inline-flex;align-items:center;gap:6px;color:var(--accent);font-size:13px;font-weight:700;">
        ← Ver mais artigos de ${escHtml(tag)}
      </a>
    </div>

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
                   style="width:100%;border:1.5px solid #e0e0e0;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:10px;box-sizing:border-box;font-family:inherit;"/>
            <button type="submit"
                    style="width:100%;background:var(--accent);color:#fff;border:none;padding:11px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
              Assinar grátis
            </button>
          </form>
          <p style="font-size:10px;color:#bbb;text-align:center;margin-top:8px;">📵 Sem spam.</p>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#0a0f1e,#111827);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;border:1px solid rgba(255,255,255,.07);">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#c0392b,#922b21);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 14px;">🛡️</div>
        <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:6px;">Proteção Talentos</div>
        <p style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:16px;">Vagas diretas em portaria e facilities na região de Campinas.</p>
        <a href="https://protecaotalentos.online" target="_blank" rel="noopener"
           style="display:flex;align-items:center;justify-content:center;gap:7px;background:var(--accent);color:#fff;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">
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

<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo-text">Empresas<span>&</span>Negócios</div>
      <p>Portal de notícias e oportunidades de Americana, Campinas e região.</p>
    </div>
    <div class="footer-col"><h4>Editorias</h4><ul>
      <li><a href="../pages/novidades.html">Novidades</a></li>
      <li><a href="../pages/startups.html">Startups</a></li>
      <li><a href="../pages/tecnologia.html">Tecnologia</a></li>
      <li><a href="../pages/vagas.html">Vagas</a></li>
    </ul></div>
    <div class="footer-col"><h4>Parceiros</h4><ul>
      <li><a href="https://protecaotalentos.online" target="_blank" rel="noopener">Proteção Talentos</a></li>
      <li><a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener">Proteção e Vigilância</a></li>
      <li><a href="https://psprotecao.com.br" target="_blank" rel="noopener">PS Proteção</a></li>
    </ul></div>
    <div class="footer-col"><h4>Institucional</h4><ul>
      <li><a href="#">Sobre nós</a></li>
      <li><a href="#">Anuncie</a></li>
      <li><a href="../pages/noticias-locais.html">Notícias Locais</a></li>
    </ul></div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Empresas &amp; Negócios. Todos os direitos reservados.</span>
  </div>
</footer>

<a class="back-to-top" id="backToTop" aria-label="Voltar ao topo">↑</a>
<div class="toast" id="toast"><span class="toast-icon"></span><span id="toastMsg"></span></div>
<script src="../js/main.js"></script>
</body>
</html>`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  // --max=N  → publica no máximo N artigos por execução (padrão: todos)
  const maxArg = process.argv.find(a => a.startsWith('--max='));
  const MAX    = maxArg ? parseInt(maxArg.split('=')[1], 10) : Infinity;

  console.log('\n📂 Publicando artigos de content/artigos/...');
  if (MAX !== Infinity) console.log(`⏱️  Modo agendado: máximo ${MAX} artigo(s) por execução\n`);
  else console.log();

  // Garante que as pastas existem
  if (!existsSync(CONTENT_DIR)) {
    mkdirSync(CONTENT_DIR, { recursive: true });
    console.log('✅ Pasta content/artigos/ criada.');
    return;
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Carrega artigos.json existente
  let artigosData = { updated: '', articles: [] };
  if (existsSync(ARTIGOS_JSON)) {
    try { artigosData = JSON.parse(readFileSync(ARTIGOS_JSON, 'utf8')); } catch {}
  }
  const existingUrls  = new Set((artigosData.articles || []).map(a => a.url));
  const existingIds   = new Set((artigosData.articles || []).map(a => a.id));

  // Lista todos os .md
  const mdFiles = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (!mdFiles.length) {
    console.log('ℹ️  Nenhum arquivo .md encontrado em content/artigos/');
    console.log('   Coloque seus arquivos markdown nessa pasta e rode novamente.');
    return;
  }

  console.log(`📄 ${mdFiles.length} arquivo(s) encontrado(s)\n`);

  let published = 0;
  let skipped   = 0;
  const today   = new Date();

  for (const mdFile of mdFiles) {
    const mdPath  = join(CONTENT_DIR, mdFile);
    const rawFile = readFileSync(mdPath, 'utf8');

    // Faz o parse do frontmatter + body
    const { data: fm, content: body } = matter(rawFile);

    // Deriva slug do nome do arquivo (sem extensão)
    const fileSlug = basename(mdFile, '.md');

    // Detecta categoria
    const detected = detectCategory(fileSlug + ' ' + (fm.title || '') + ' ' + body.slice(0, 200));

    // Monta metadados — frontmatter tem prioridade sobre autodetecção
    const title      = fm.title       || slugToTitle(fileSlug);
    const tag        = fm.tag         || detected.tag;
    const tagCls     = fm.tagCls      || detected.tagCls;
    const image      = fm.image       || DEFAULT_IMAGES[tagCls] || DEFAULT_IMAGES.novidades;
    const readMin    = fm.readMin     || Math.max(3, Math.ceil(body.split(/\s+/).length / 200));
    const slug       = fm.slug        || slugify(fileSlug);
    const description= fm.description || extractDescription(body);

    // Nome do arquivo HTML de saída
    const datePrefix = isoDate(today);
    const htmlFile   = `${datePrefix}-${slug}.html`;
    const htmlPath   = join(OUTPUT_DIR, htmlFile);
    const articleUrl = `noticias/${htmlFile}`;

    // Verifica se já foi publicado (por slug — independente da data)
    if (existingIds.has(`md-${fileSlug}`)) {
      skipped++;
      continue;
    }

    // Converte markdown para HTML
    const htmlBody = markdownToHtml(body);

    const meta = { title, description, tag, tagCls, image, readMin, date: today };

    // Gera o HTML completo
    const fullHtml = buildArticleHtml(meta, htmlBody, htmlFile);
    writeFileSync(htmlPath, fullHtml, 'utf8');

    // Adiciona ao artigos.json
    artigosData.articles.unshift({
      id:          `md-${fileSlug}`,
      url:         articleUrl,
      title,
      description,
      tag,
      tagCls,
      image,
      date:        formatDate(today),
      readMin,
      source:      'content',
    });
    existingUrls.add(articleUrl);

    console.log(`✅ Publicado: ${htmlFile}`);
    console.log(`   Título: ${title}`);
    console.log(`   Tag: ${tag} (${tagCls})\n`);
    published++;

    // Para quando atingir o limite por execução
    if (published >= MAX) {
      console.log(`⏹️  Limite de ${MAX} atingido. Restantes serão publicados nas próximas execuções.`);
      break;
    }
  }

  // Salva artigos.json atualizado
  if (published > 0) {
    artigosData.updated = today.toISOString();
    artigosData.articles = artigosData.articles.slice(0, 300); // máx 300 artigos
    writeFileSync(ARTIGOS_JSON, JSON.stringify(artigosData, null, 2), 'utf8');
    console.log(`\n📦 artigos.json atualizado com ${published} novo(s) artigo(s).`);
  }

  console.log(`\n✅ Concluído: ${published} publicado(s), ${skipped} já existentes.`);
  if (published > 0) {
    console.log('\n💡 Próximo passo: git add . && git commit -m "feat: publica artigos do Drive" && git push');
  }
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
