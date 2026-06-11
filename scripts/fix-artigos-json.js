/**
 * fix-artigos-json.js
 *
 * Corrige entradas existentes em data/artigos.json:
 *  1. Adiciona campo isoDate (extraído da URL ou da data formatada)
 *  2. Remove prefixos "Meta Title:", "Meta Description:" das descriptions
 *
 * Uso: node scripts/fix-artigos-json.js
 * Idempotente — pode ser rodado múltiplas vezes sem problema.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const ARTIGOS    = join(ROOT, 'data', 'artigos.json');

function extractIsoDate(url) {
  // URL format: noticias/YYYY-MM-DD-slug.html
  const m = url.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function cleanDescription(desc) {
  if (!desc) return desc;
  // Remove padrões como "Meta Title: ... | ..." e "Meta Description: ..."
  return desc
    .replace(/^Meta\s+(Title|Description|Keywords)\s*:[^\n]*/gi, '')
    .replace(/^\s*\|[^\n]*/gm, '')
    .trim()
    .slice(0, 160)
    || desc.slice(0, 160); // fallback ao original se ficou vazio
}

function main() {
  if (!existsSync(ARTIGOS)) {
    console.log('❌ data/artigos.json não encontrado.');
    return;
  }

  const data = JSON.parse(readFileSync(ARTIGOS, 'utf8'));
  const articles = data.articles || [];

  let patchedDate = 0;
  let patchedDesc = 0;

  for (const a of articles) {
    // 1. Adiciona isoDate se ausente
    if (!a.isoDate) {
      const iso = extractIsoDate(a.url || '');
      if (iso) {
        a.isoDate = iso;
        patchedDate++;
      }
    }

    // 2. Limpa description com "Meta Title:"
    if (a.description && /^Meta\s+(Title|Description)/i.test(a.description)) {
      const original = a.description;
      a.description  = cleanDescription(a.description);
      if (a.description !== original) patchedDesc++;
    }
  }

  data.articles = articles;
  writeFileSync(ARTIGOS, JSON.stringify(data, null, 2), 'utf8');

  console.log(`✅ artigos.json corrigido:`);
  console.log(`   • isoDate adicionado em ${patchedDate} entradas`);
  console.log(`   • descriptions limpas em ${patchedDesc} entradas`);
  console.log(`   • Total: ${articles.length} artigos`);
}

main();
