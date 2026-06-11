/**
 * add-related-section.js
 *
 * Adiciona a seção "Leia também" em artigos que ainda não a têm.
 * Insere o bloco logo antes de <aside class="sidebar">.
 *
 * Uso: node scripts/add-related-section.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const NOTICIAS  = join(ROOT, 'noticias');

function detectTagClsFromHtml(html) {
  const m = html.match(/class="tag ([a-z]+)"/);
  return m ? m[1] : 'novidades';
}

function buildRelated(tagCls) {
  return `\n    <!-- Artigos relacionados -->
    <section style="margin-top:48px;padding-top:32px;border-top:2px solid #000;">
      <h2 style="font-family:'Manrope',sans-serif;font-size:20px;font-weight:800;margin-bottom:24px;">Leia também</h2>
      <div id="art-relacionados"
           data-artigos="4"
           data-artigos-tagcls="${tagCls}"
           data-artigos-allow-repeat="true"></div>
    </section>\n`;
}

function main() {
  if (!existsSync(NOTICIAS)) return;

  const files = readdirSync(NOTICIAS).filter(f => f.endsWith('.html'));
  let updated = 0;
  let skipped = 0;

  for (const f of files) {
    const fp  = join(NOTICIAS, f);
    let   html = readFileSync(fp, 'utf8');

    if (html.includes('art-relacionados')) { skipped++; continue; }

    const tagCls  = detectTagClsFromHtml(html);
    const related = buildRelated(tagCls);

    // Insere o bloco de relacionados logo antes de <aside class="sidebar">
    if (html.includes('<aside class="sidebar">')) {
      html = html.replace('<aside class="sidebar">', related + '\n  <aside class="sidebar">');
      writeFileSync(fp, html, 'utf8');
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Seção "Leia também" adicionada em ${updated} artigos. ${skipped} já tinham ou sem aside.`);
}

main();
