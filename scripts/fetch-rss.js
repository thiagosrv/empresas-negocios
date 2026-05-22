import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FEEDS = [
  // Campinas & Região
  { group: 'campinas', name: 'G1 Campinas',    url: 'https://g1.globo.com/rss/g1/sp/campinas-regiao/', tag: 'G1 Campinas',   cls: 'brasil'   },
  { group: 'campinas', name: 'Americanense',   url: 'https://jornalamericanense.com.br/feed/',          tag: 'Americanense',  cls: 'servicos' },
  { group: 'campinas', name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', tag: 'Agência Brasil', cls: 'brasil' },
  // Esportes
  { group: 'esportes', name: 'Gazeta Esportiva', url: 'https://www.gazetaesportiva.com/feed/',         tag: 'Esportes',      cls: 'startups' },
  { group: 'esportes', name: 'ESPN Brasil',    url: 'https://www.espn.com.br/espn/rss/news',           tag: 'ESPN',          cls: 'startups' },
  // Negócios
  { group: 'negocios', name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', tag: 'Economia', cls: '' },
  { group: 'negocios', name: 'InfoMoney',      url: 'https://www.infomoney.com.br/feed/',              tag: 'InfoMoney',     cls: 'brasil'   },
  { group: 'negocios', name: 'Exame',          url: 'https://exame.com/feed/',                         tag: 'Exame',         cls: 'startups' },
];

const MAX_PER_FEED = 6;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: true,
  trimValues: true,
  processEntities: false,   // evita limite de expansão de entidades XML
  htmlEntities: true,
});

function extractImage(item) {
  const mc = item['media:content'];
  if (mc) {
    if (Array.isArray(mc)) return mc[0]?.['@_url'] || null;
    if (mc['@_url']) return mc['@_url'];
  }
  const mt = item['media:thumbnail'];
  if (mt?.['@_url']) return mt['@_url'];
  if (item.enclosure?.['@_url']) return item.enclosure['@_url'];
  const desc = String(item.description || item['content:encoded'] || '');
  const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function formatDate(raw) {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(raw);
  }
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function resolveLink(item) {
  if (typeof item.link === 'string') return item.link;
  if (item.link?.['@_href']) return item.link['@_href'];
  if (item.link?.['#text']) return item.link['#text'];
  return String(item.guid?.['#text'] || item.guid || '');
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmpresasNegocios-RSS/1.0; +https://empresasenegocios.com.br)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel || parsed?.feed;
    if (!channel) throw new Error('channel não encontrado no XML');

    const rawItems = channel.item || channel.entry || [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.slice(0, MAX_PER_FEED).map(item => ({
      title:   stripHtml(item.title),
      link:    resolveLink(item),
      summary: stripHtml(item.description || item.summary || item['content:encoded'] || '').slice(0, 220),
      image:   extractImage(item),
      date:    formatDate(item.pubDate || item.published || item.updated || item['dc:date']),
      source:  feed.name,
      tag:     feed.tag,
      cls:     feed.cls,
    }));
  } catch (err) {
    console.warn(`  [AVISO] ${feed.name}: ${err.message}`);
    return [];
  }
}

async function main() {
  const result = { updated: new Date().toISOString(), feeds: {} };

  for (const feed of FEEDS) {
    process.stdout.write(`Buscando ${feed.name}... `);
    const articles = await fetchFeed(feed);
    if (!result.feeds[feed.group]) result.feeds[feed.group] = [];
    result.feeds[feed.group].push(...articles);
    console.log(`${articles.length} artigos`);
  }

  const outDir = join(__dirname, '..', 'data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'noticias.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log('\n✅ data/noticias.json atualizado em', result.updated);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
