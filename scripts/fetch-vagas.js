/**
 * fetch-vagas.js
 * Busca vagas de emprego da região via Indeed RSS e salva em data/vagas.json
 * Rodado diariamente pelo GitHub Actions
 */

import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT   = join(__dirname, '..', 'data', 'vagas.json');

// ─── BUSCAS ──────────────────────────────────────────────────────────────────
const SEARCHES = [
  { q: 'portaria',           l: 'Americana,+SP',             city: 'Americana',     category: 'Portaria'   },
  { q: 'facilities+limpeza', l: 'Americana,+SP',             city: 'Americana',     category: 'Facilities' },
  { q: 'operador+producao',  l: 'Americana,+SP',             city: 'Americana',     category: 'Indústria'  },
  { q: 'enfermeiro+tecnico', l: 'Americana,+SP',             city: 'Americana',     category: 'Saúde'      },
  { q: 'portaria',           l: 'Santa+B%C3%A1rbara+D%27Oeste,+SP', city: 'Santa Bárbara', category: 'Portaria' },
  { q: '',                   l: 'Santa+B%C3%A1rbara+D%27Oeste,+SP', city: 'Santa Bárbara', category: 'Geral'    },
  { q: 'operador',           l: 'Sumar%C3%A9,+SP',           city: 'Sumaré',        category: 'Indústria'  },
  { q: '',                   l: 'Sumar%C3%A9,+SP',           city: 'Sumaré',        category: 'Geral'      },
  { q: 'portaria+recepção',  l: 'Campinas,+SP',              city: 'Campinas',      category: 'Portaria'   },
  { q: 'tecnologia+ti',      l: 'Campinas,+SP',              city: 'Campinas',      category: 'Tecnologia' },
];

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
  processEntities: false,
  htmlEntities: true,
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function stripHtml(str) {
  return String(str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function relativeDate(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7)  return `há ${days} dias`;
    if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
    return `há ${Math.floor(days / 30)} mes.`;
  } catch { return ''; }
}

// Indeed title: "Cargo - Empresa" ou "Cargo"
function parseTitle(raw) {
  const parts = raw.split(' - ');
  if (parts.length >= 2) {
    return { title: parts[0].trim(), company: parts.slice(1).join(' - ').trim() };
  }
  return { title: raw.trim(), company: 'Não informado' };
}

function makeId(link) {
  return link.replace(/[^a-zA-Z0-9]/g, '').slice(-20);
}

// ─── FETCH DE UM FEED ────────────────────────────────────────────────────────
async function fetchSearch(s) {
  const url = `https://br.indeed.com/rss?q=${s.q}&l=${s.l}&radius=15&sort=date`;
  console.log(`  → Buscando: ${s.city} / ${s.category}`);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  if (!xml.includes('<item>') && !xml.includes('<item/>')) throw new Error('Sem itens no feed');

  const data  = PARSER.parse(xml);
  const items = data?.rss?.channel?.item || data?.feed?.entry || [];
  const list  = Array.isArray(items) ? items : [items];

  return list.slice(0, 8).map(item => {
    const { title, company } = parseTitle(stripHtml(item.title || ''));
    const link    = typeof item.link === 'string' ? item.link : (item.link?.['@_href'] || item.guid || '');
    const snippet = stripHtml(item.description || item.summary || '').slice(0, 180);
    const pubDate = item.pubDate || item.updated || item.published || new Date().toISOString();

    return {
      id:       makeId(link),
      title,
      company,
      city:     s.city,
      category: s.category,
      link,
      snippet,
      date:     pubDate,
      dateRel:  relativeDate(pubDate),
      source:   'Indeed',
    };
  }).filter(j => j.title && j.link);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n💼 Buscando vagas de emprego da região...\n');

  // Lê arquivo existente para preservar featured jobs
  let existing = { updated: '', featured: [], jobs: [] };
  if (existsSync(OUTPUT)) {
    try { existing = JSON.parse(readFileSync(OUTPUT, 'utf8')); } catch {}
  }

  const allJobs = [];
  const seen    = new Set();
  let   ok      = 0;

  for (const search of SEARCHES) {
    try {
      const jobs = await fetchSearch(search);
      for (const j of jobs) {
        if (!seen.has(j.id) && j.id) {
          seen.add(j.id);
          allJobs.push(j);
        }
      }
      ok++;
      // Pausa entre requests para não sobrecarregar
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.warn(`  ⚠️  ${search.city}/${search.category}: ${err.message}`);
    }
  }

  // Ordena por data (mais recente primeiro)
  allJobs.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    updated:  new Date().toISOString(),
    totalOk:  ok,
    featured: existing.featured || [],
    jobs:     allJobs.slice(0, 80),
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ ${allJobs.length} vagas salvas em data/vagas.json (${ok}/${SEARCHES.length} fontes OK)`);
}

main().catch(err => { console.error('\n❌ Erro:', err.message); process.exit(1); });
