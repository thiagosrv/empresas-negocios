/**
 * fetch-esportes.js
 * Busca notícias de futebol via RSS do LANCE! e Gazeta Esportiva.
 * Salva em data/esportes.json (máx. 24 itens, ordenados por data).
 * Em caso de falha nas fontes, mantém o arquivo anterior ou usa fallback.
 */

import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT    = join(__dirname, '..', 'data', 'esportes.json');
const MAX_ITEMS = 24;

// ─── FONTES RSS ───────────────────────────────────────────────────────────────
const FEEDS = [
  {
    url: 'https://www.lance.com.br/futebol-nacional/feed',
    source: 'LANCE!',
    sourceLogo: 'lance',
  },
  {
    url: 'https://www.gazetaesportiva.com/futebol/regiao-sudeste/feed/',
    source: 'Gazeta Esportiva',
    sourceLogo: 'gazeta',
  },
  {
    url: 'https://www.gazetaesportiva.com/times/brasil/feed/',
    source: 'Gazeta Esportiva',
    sourceLogo: 'gazeta',
  },
  {
    url: 'https://www.gazetaesportiva.com/futebol/futebol-internacional/feed/',
    source: 'Gazeta Esportiva',
    sourceLogo: 'gazeta',
  },
];

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
// Usado apenas se TODOS os feeds falharem E não houver arquivo anterior.
const FALLBACK_ITEMS = [
  {
    title: 'Brasileirão 2026: confira a tabela completa e os jogos da rodada',
    link: 'https://www.lance.com.br/futebol-nacional',
    source: 'LANCE!', sourceLogo: 'lance',
    date: 'hoje', isoDate: new Date().toISOString().slice(0,10),
    category: 'Brasileirão',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=340&fit=crop',
  },
  {
    title: 'Copa Libertadores 2026: resultados, tabela e classificação',
    link: 'https://www.lance.com.br/futebol-nacional',
    source: 'LANCE!', sourceLogo: 'lance',
    date: 'hoje', isoDate: new Date().toISOString().slice(0,10),
    category: 'Libertadores',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=340&fit=crop',
  },
  {
    title: 'Seleção Brasileira: convocação, jogos e novidades da Canarinho',
    link: 'https://www.gazetaesportiva.com/times/brasil/',
    source: 'Gazeta Esportiva', sourceLogo: 'gazeta',
    date: 'hoje', isoDate: new Date().toISOString().slice(0,10),
    category: 'Seleção',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=340&fit=crop',
  },
  {
    title: 'Copa do Mundo 2026: grupos, seleções classificadas e sedes',
    link: 'https://www.gazetaesportiva.com/futebol/futebol-internacional/',
    source: 'Gazeta Esportiva', sourceLogo: 'gazeta',
    date: 'hoje', isoDate: new Date().toISOString().slice(0,10),
    category: 'Copa do Mundo',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=340&fit=crop',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function inferCategory(title = '', tags = '') {
  const txt = (title + ' ' + tags).toLowerCase();
  if (/libertadores|sulamericana|conmebol/.test(txt)) return 'Libertadores';
  if (/seleção|selecao|canarinho|brasil.*sub/.test(txt))    return 'Seleção';
  if (/copa do mundo|mundial|world cup/.test(txt))          return 'Copa do Mundo';
  if (/copa do brasil/.test(txt))                           return 'Copa do Brasil';
  if (/brasileiro|série a|brasileirao/.test(txt))           return 'Brasileirão';
  if (/transferência|contrato|reforço|chegada|saída/.test(txt)) return 'Mercado';
  return 'Futebol';
}

function categoryColor(cat) {
  const map = {
    'Brasileirão': '#27ae60',
    'Libertadores': '#f39c12',
    'Seleção': '#f1c40f',
    'Copa do Mundo': '#2980b9',
    'Copa do Brasil': '#8e44ad',
    'Mercado': '#e67e22',
    'Futebol': '#c0392b',
    'Internacional': '#16a085',
  };
  return map[cat] || '#c0392b';
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=340&fit=crop',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=340&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=340&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=340&fit=crop',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=340&fit=crop',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&h=340&fit=crop',
];

function extractImage(item) {
  // Tenta pegar imagem do <media:content>, <enclosure> ou <content:encoded>
  if (item['media:content']?.['@_url']) return item['media:content']['@_url'];
  if (item.enclosure?.['@_url'])        return item.enclosure['@_url'];
  const content = item['content:encoded'] || item.description || '';
  const m = content.match(/<img[^>]+src="([^"]+)"/i);
  if (m) return m[1];
  return null;
}

function formatDate(raw) {
  if (!raw) return 'hoje';
  try {
    const d = new Date(raw);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return 'hoje'; }
}

function isoDate(raw) {
  if (!raw) return new Date().toISOString().slice(0,10);
  try { return new Date(raw).toISOString().slice(0,10); }
  catch { return new Date().toISOString().slice(0,10); }
}

// ─── FETCH RSS ────────────────────────────────────────────────────────────────
async function fetchFeed(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EmpresasNoticias/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!xml.includes('<')) throw new Error('Resposta não é XML');

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) throw new Error('Canal RSS não encontrado');

    const rawItems = channel.item || channel.entry || [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.slice(0, 8).map((item, i) => {
      const title = String(item.title || '').replace(/<[^>]+>/g, '').trim();
      const link  = item.link?.['@_href'] || item.link || item.guid || '#';
      const pubDate = item.pubDate || item.published || item.updated || '';
      const cat   = inferCategory(title, JSON.stringify(item.category || ''));
      const img   = extractImage(item) || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];

      return {
        title,
        link: typeof link === 'string' ? link : '#',
        source: feed.source,
        sourceLogo: feed.sourceLogo,
        date: formatDate(pubDate),
        isoDate: isoDate(pubDate),
        category: cat,
        categoryColor: categoryColor(cat),
        image: img,
      };
    }).filter(it => it.title && it.link !== '#');

  } catch (err) {
    clearTimeout(timer);
    console.warn(`[fetch-esportes] ${feed.source} (${feed.url}) → ${err.message}`);
    return [];
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[fetch-esportes] Buscando feeds RSS de futebol...');

  const results = await Promise.all(FEEDS.map(fetchFeed));
  const allItems = results.flat();
  const totalOk = results.filter(r => r.length > 0).length;

  console.log(`[fetch-esportes] Feeds com sucesso: ${totalOk}/${FEEDS.length}, itens: ${allItems.length}`);

  // Deduplica por link
  const seen = new Set();
  const unique = allItems.filter(it => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });

  // Ordena por data (mais recente primeiro)
  unique.sort((a, b) => (b.isoDate > a.isoDate ? 1 : -1));

  let finalItems = unique.slice(0, MAX_ITEMS);

  // Se não conseguiu nada, tenta manter versão anterior ou usa fallback
  if (finalItems.length === 0) {
    if (existsSync(OUTPUT)) {
      const prev = JSON.parse(readFileSync(OUTPUT, 'utf8'));
      console.log('[fetch-esportes] Mantendo dados anteriores (feeds falharam).');
      process.exit(0);
    }
    console.log('[fetch-esportes] Usando fallback de itens fixos.');
    finalItems = FALLBACK_ITEMS;
  }

  const output = {
    updated: new Date().toISOString(),
    totalOk,
    items: finalItems,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[fetch-esportes] Salvo: ${finalItems.length} itens em data/esportes.json`);
}

main().catch(err => {
  console.error('[fetch-esportes] Erro fatal:', err);
  process.exit(1);
});
