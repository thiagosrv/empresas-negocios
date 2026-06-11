/**
 * generate-sitemap.js
 * Gera sitemap.xml e robots.txt automaticamente a partir de:
 *  - Páginas fixas (index + pages/*.html conhecidas)
 *  - Artigos dinâmicos em data/artigos.json
 *
 * Uso: node scripts/generate-sitemap.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const BASE_URL  = 'https://www.empresasenegocios.com.br';
const TODAY     = new Date().toISOString().split('T')[0];

// ─── PÁGINAS ESTÁTICAS ────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { loc: '/',                              changefreq: 'hourly',  priority: '1.0', lastmod: TODAY },
  { loc: '/pages/novidades.html',          changefreq: 'hourly',  priority: '0.9', lastmod: TODAY },
  { loc: '/pages/startups.html',           changefreq: 'daily',   priority: '0.8', lastmod: TODAY },
  { loc: '/pages/tecnologia.html',         changefreq: 'daily',   priority: '0.8', lastmod: TODAY },
  { loc: '/pages/brasil.html',             changefreq: 'daily',   priority: '0.8', lastmod: TODAY },
  { loc: '/pages/mundo.html',              changefreq: 'daily',   priority: '0.8', lastmod: TODAY },
  { loc: '/pages/saude.html',              changefreq: 'daily',   priority: '0.7', lastmod: TODAY },
  { loc: '/pages/industrias.html',         changefreq: 'daily',   priority: '0.7', lastmod: TODAY },
  { loc: '/pages/sociedade.html',          changefreq: 'daily',   priority: '0.7', lastmod: TODAY },
  { loc: '/pages/cultura.html',            changefreq: 'daily',   priority: '0.7', lastmod: TODAY },
  { loc: '/pages/campinas.html',           changefreq: 'daily',   priority: '0.7', lastmod: TODAY },
  { loc: '/pages/servicos.html',           changefreq: 'weekly',  priority: '0.7', lastmod: TODAY },
  { loc: '/pages/vagas.html',              changefreq: 'hourly',  priority: '0.8', lastmod: TODAY },
  { loc: '/pages/esportes.html',           changefreq: 'daily',   priority: '0.6', lastmod: TODAY },
  { loc: '/pages/noticias-locais.html',    changefreq: 'daily',   priority: '0.6', lastmod: TODAY },
  { loc: '/pages/tempo.html',              changefreq: 'hourly',  priority: '0.5', lastmod: TODAY },
  { loc: '/pages/guia-seguranca-americana.html', changefreq: 'monthly', priority: '0.5', lastmod: TODAY },
];

// ─── LER ARTIGOS DO ÍNDICE ────────────────────────────────────────────────────
function getArticlePages() {
  const indexPath = join(ROOT, 'data', 'artigos.json');
  if (!existsSync(indexPath)) return [];

  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf8'));
    const now  = new Date();

    return (data.articles || []).map(a => {
      const articleDate = a.isoDate || TODAY;
      // Artigos com menos de 2 dias recebem tag Google News
      const ageMs   = now - new Date(articleDate);
      const isRecent = ageMs < 2 * 24 * 60 * 60 * 1000;

      return {
        loc:        '/' + a.url,
        changefreq: 'monthly',
        priority:   '0.7',
        lastmod:    articleDate,
        isRecent,
        title:      a.title   || '',
        tag:        a.tag     || 'Negócios',
      };
    });
  } catch (e) {
    console.warn('⚠️  Erro ao ler artigos.json:', e.message);
    return [];
  }
}

// ─── BUILDER XML ─────────────────────────────────────────────────────────────
function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemap(staticPages, articlePages) {
  const staticUrls = staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const articleUrls = articlePages.map(p => {
    let newsTag = '';
    if (p.isRecent) {
      newsTag = `
    <news:news>
      <news:publication>
        <news:name>Empresas &amp; Negócios</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${p.lastmod}</news:publication_date>
      <news:title>${escXml(p.title)}</news:title>
      <news:keywords>${escXml(p.tag)}</news:keywords>
    </news:news>`;
    }
    return `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${newsTag}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls}
${articleUrls}
</urlset>`;
}

// ─── ROBOTS.TXT ───────────────────────────────────────────────────────────────
function buildRobots() {
  return `User-agent: *
Allow: /

# Bloquear arquivos de dados e scripts internos
Disallow: /data/
Disallow: /scripts/
Disallow: /.github/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const articlePages = getArticlePages();
  const recentCount  = articlePages.filter(p => p.isRecent).length;

  const sitemap = buildSitemap(STATIC_PAGES, articlePages);
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`✅ sitemap.xml — ${STATIC_PAGES.length} páginas fixas + ${articlePages.length} artigos (${recentCount} com tag Google News)`);

  const robotsPath = join(ROOT, 'robots.txt');
  writeFileSync(robotsPath, buildRobots(), 'utf8');
  console.log('✅ robots.txt atualizado');

  console.log(`\n📋 Próximos passos:`);
  console.log(`   1. Acesse: https://search.google.com/search-console`);
  console.log(`   2. Adicione a propriedade: ${BASE_URL}`);
  console.log(`   3. Submeta o sitemap: ${BASE_URL}/sitemap.xml`);
}

main();
