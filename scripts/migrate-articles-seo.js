/**
 * migrate-articles-seo.js
 *
 * Atualiza as páginas de artigos já publicadas (noticias/*.html) para:
 *  1. Adicionar editorial.css + layout.js (chrome editorial consistente)
 *  2. Adicionar og:locale, og:article:published_time, og:article:section
 *  3. Adicionar BreadcrumbList JSON-LD
 *  4. Adicionar seção "Leia também" (artigos relacionados)
 *  5. Adicionar artigos.js para carregar os relacionados
 *
 * Uso: node scripts/migrate-articles-seo.js
 * Seguro: só modifica arquivos que ainda não têm editorial.css.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const NOTICIAS   = join(ROOT, 'noticias');
const SITE_URL   = 'https://www.empresasenegocios.com.br';

const TAG_PAGE = {
  'servicos':   'pages/servicos.html',
  'tecnologia': 'pages/tecnologia.html',
  'startups':   'pages/startups.html',
  'saude':      'pages/saude.html',
  'industrias': 'pages/industrias.html',
  'futebol':    'pages/futebol.html',
  'brasil':     'pages/brasil.html',
  'mundo':      'pages/mundo.html',
  'sociedade':  'pages/sociedade.html',
  'cultura':    'pages/cultura.html',
};

function escJson(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function detectTagFromHtml(html) {
  // Lê class do span.tag para detectar a categoria
  const m = html.match(/class="tag ([a-z]+)"/);
  return m ? m[1] : 'novidades';
}

function detectTagLabelFromHtml(html) {
  // Lê o texto do span.tag
  const m = html.match(/class="tag [a-z]+"[^>]*>([^<]+)</);
  return m ? m[1].trim() : 'Novidades';
}

function detectTitleFromHtml(html) {
  const m = html.match(/<title>([^|<]+)\s*\|/);
  return m ? m[1].trim() : '';
}

function detectIsoDateFromHtml(html) {
  // Lê o atributo datetime da tag <time>
  const m = html.match(/<time[^>]*datetime="([^"]+)"/);
  return m ? m[1] : new Date().toISOString().split('T')[0];
}

function detectCanonFromHtml(html) {
  const m = html.match(/rel="canonical"\s+href="([^"]+)"/);
  return m ? m[1] : '';
}

function detectImageFromHtml(html) {
  const m = html.match(/property="og:image"\s+content="([^"]+)"/);
  return m ? m[1] : '';
}

function detectDescFromHtml(html) {
  const m = html.match(/name="description"\s+content="([^"]+)"/);
  return m ? m[1] : '';
}

function buildOgArticleMeta(isoStr, tagLabel) {
  return [
    `<meta property="og:locale" content="pt_BR"/>`,
    `<meta property="article:published_time" content="${isoStr}"/>`,
    `<meta property="article:modified_time" content="${isoStr}"/>`,
    `<meta property="article:section" content="${tagLabel}"/>`,
    `<meta property="article:tag" content="${tagLabel}"/>`,
  ].join('\n');
}

function buildBreadcrumbLd(title, tag, tagCls, canonUrl) {
  const tagPageAbs = `${SITE_URL}/${TAG_PAGE[tagCls] || 'pages/novidades.html'}`;
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Início",         "item": "${SITE_URL}/" },
    { "@type": "ListItem", "position": 2, "name": "${escJson(tag)}", "item": "${tagPageAbs}" },
    { "@type": "ListItem", "position": 3, "name": "${escJson(title.slice(0, 80))}" }
  ]
}
</script>`;
}

function buildRelatedSection(tagCls) {
  return `
    <!-- Artigos relacionados (injetados pelo artigos.js) -->
    <section style="margin-top:48px;padding-top:32px;border-top:2px solid #000;">
      <h2 style="font-family:'Manrope',sans-serif;font-size:20px;font-weight:800;margin-bottom:24px;">Leia também</h2>
      <div id="art-relacionados"
           data-artigos="4"
           data-artigos-tagcls="${tagCls}"
           data-artigos-allow-repeat="true"></div>
    </section>`;
}

function migrateFile(filePath, fileName) {
  let html = readFileSync(filePath, 'utf8');

  // Pula arquivos já migrados
  if (html.includes('../css/editorial.css')) return false;

  const tagCls   = detectTagFromHtml(html);
  const tag      = detectTagLabelFromHtml(html);
  const title    = detectTitleFromHtml(html);
  const isoStr   = detectIsoDateFromHtml(html);
  const canonUrl = detectCanonFromHtml(html);

  // 1. Adiciona editorial.css após style.css
  if (html.includes('../css/style.css') && !html.includes('../css/editorial.css')) {
    html = html.replace(
      /<link rel="stylesheet" href="\.\.\/css\/style\.css"[^>]*>/,
      m => m + '\n<link rel="stylesheet" href="../css/editorial.css"/>'
    );
  }

  // 2. Adiciona og:locale + og:article:* após og:image (se ainda não existir)
  if (!html.includes('og:locale')) {
    const ogArticleMeta = buildOgArticleMeta(isoStr, tag);
    html = html.replace(
      /(<meta name="twitter:card"[^>]*>)/,
      ogArticleMeta + '\n$1'
    );
  }

  // 3. Adiciona BreadcrumbList JSON-LD (se ainda não existir)
  if (!html.includes('BreadcrumbList') && canonUrl && title) {
    const bld = buildBreadcrumbLd(title, tag, tagCls, canonUrl);
    // Insere antes do </head>
    html = html.replace('</head>', bld + '\n</head>');
  }

  // 4. Adiciona layout.js antes de main.js (se ainda não existir)
  if (!html.includes('../js/layout.js')) {
    html = html.replace(
      /<script src="\.\.\/js\/main\.js"><\/script>/,
      '<script src="../js/layout.js"></script>\n<script src="../js/artigos.js"></script>\n<script src="../js/main.js"></script>'
    );
  } else if (!html.includes('../js/artigos.js')) {
    html = html.replace(
      /<script src="\.\.\/js\/main\.js"><\/script>/,
      '<script src="../js/artigos.js"></script>\n<script src="../js/main.js"></script>'
    );
  }

  // 5. Adiciona seção de artigos relacionados antes do fechamento do content-col
  // (apenas se ainda não existir)
  if (!html.includes('art-relacionados')) {
    const related = buildRelatedSection(tagCls);
    // Insere antes do <!-- /content-col --> ou antes do </div><!-- /content-col -->
    if (html.includes('</div><!-- /content-col -->')) {
      html = html.replace('</div><!-- /content-col -->', related + '\n\n  </div><!-- /content-col -->');
    } else {
      // Tenta inserir antes de </aside> → pega a estrutura sem comentário
      html = html.replace(/(<\/div>\s*<\/div>\s*<!-- SIDEBAR -->|<\/div>\s*<!--\s*\/content-col\s*-->)/,
        related + '\n  </div><!-- /content-col -->');
    }
  }

  writeFileSync(filePath, html, 'utf8');
  return true;
}

function main() {
  if (!existsSync(NOTICIAS)) {
    console.log('❌ Pasta noticias/ não encontrada.');
    return;
  }

  const files = readdirSync(NOTICIAS).filter(f => f.endsWith('.html'));
  if (!files.length) {
    console.log('ℹ️  Nenhum artigo encontrado em noticias/');
    return;
  }

  console.log(`\n🔄 Migrando ${files.length} artigos para SEO programático...\n`);

  let updated = 0;
  let skipped = 0;

  for (const f of files) {
    const fp = join(NOTICIAS, f);
    try {
      const changed = migrateFile(fp, f);
      if (changed) {
        updated++;
        if (updated % 20 === 0) console.log(`   ✓ ${updated} artigos migrados...`);
      } else {
        skipped++;
      }
    } catch (e) {
      console.warn(`   ⚠️  Erro em ${f}: ${e.message}`);
    }
  }

  console.log(`\n✅ Migração concluída: ${updated} artigos atualizados, ${skipped} já estavam no novo formato.`);
}

main();
