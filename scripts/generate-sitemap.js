/**
 * generate-sitemap.js
 * Gera sitemap.xml e robots.txt automaticamente a partir de:
 *  - Páginas fixas (index + pages/*.html conhecidas)
 *  - Artigos dinâmicos em data/artigos.json
 *
 * Uso: node scripts/generate-sitemap.js
 * Executado automaticamente após cada geração de artigo via GitHub Actions.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const BASE_URL  = 'https://www.empresasenegocios.com.br';
const TODAY     = new Date().toISOString().split('T')[0];

// ─── PÁGINAS ESTÁTICAS ────────────────────────────────────────────────────────
// priority: 1.0 = homepage, 0.8 = categorias principais, 0.6 = demais
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
    return (data.articles || []).map(a => ({
      loc:        '/' + a.url,
      changefreq: 'monthly',
      priority:   '0.7',
      lastmod:    a.isoDate || TODAY,
    }));
  } catch (e) {
    console.warn('⚠️  Erro ao ler artigos.json:', e.message);
    return [];
  }
}

// ─── BUILDER XML ─────────────────────────────────────────────────────────────
function buildSitemap(pages) {
  const urls = pages.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
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
  const allPages     = [...STATIC_PAGES, ...articlePages];

  // Gera sitemap.xml
  const sitemap = buildSitemap(allPages);
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`✅ sitemap.xml gerado com ${allPages.length} URLs (${articlePages.length} artigos + ${STATIC_PAGES.length} páginas fixas)`);

  // Gera robots.txt (só sobrescreve se não existir ou se for gerado pelo script)
  const robotsPath = join(ROOT, 'robots.txt');
  writeFileSync(robotsPath, buildRobots(), 'utf8');
  console.log('✅ robots.txt atualizado');

  console.log(`\n📋 Próximos passos:`);
  console.log(`   1. Acesse: https://search.google.com/search-console`);
  console.log(`   2. Adicione a propriedade: ${BASE_URL}`);
  console.log(`   3. Submeta o sitemap: ${BASE_URL}/sitemap.xml`);
}

main();
