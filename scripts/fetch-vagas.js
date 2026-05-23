/**
 * fetch-vagas.js
 * Busca vagas de emprego da região via múltiplos RSS e salva em data/vagas.json.
 * Fontes: vagas.com.br (primária), catho.com.br (secundária).
 * Em caso de falha total nas fontes, usa FALLBACK_JOBS garantindo que a
 * página nunca fique vazia.
 *
 * IMPORTANTE: salary nunca é exibido — sempre "A consultar".
 */

import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT    = join(__dirname, '..', 'data', 'vagas.json');

// ─── FONTES RSS ───────────────────────────────────────────────────────────────
// vagas.com.br: formato https://www.vagas.com.br/vagas-de-{cargo}-em-{cidade}.rss
// catho.com.br: formato https://www.catho.com.br/vagas/{cargo}/{cidade}/?rss=1
const SEARCHES = [
  // Americana
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-americana.rss',              city: 'Americana',      category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-de-servicos-gerais-em-americana.rss', city: 'Americana', category: 'Facilities' },
  { url: 'https://www.vagas.com.br/vagas-de-operador-de-producao-em-americana.rss',  city: 'Americana',      category: 'Indústria'  },
  // Santa Bárbara D'Oeste
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-santa-barbara-d-oeste.rss',  city: 'Santa Bárbara',  category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-operador-em-santa-barbara-d-oeste.rss',  city: 'Santa Bárbara',  category: 'Indústria'  },
  // Sumaré
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-sumare.rss',                 city: 'Sumaré',         category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-de-manutencao-em-sumare.rss',   city: 'Sumaré',         category: 'Facilities' },
  // Campinas
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-campinas.rss',               city: 'Campinas',       category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-recepcionista-em-campinas.rss',          city: 'Campinas',       category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-tecnologia-em-campinas.rss',             city: 'Campinas',       category: 'Tecnologia' },
  // Piracicaba
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-piracicaba.rss',             city: 'Piracicaba',     category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-operador-em-piracicaba.rss',             city: 'Piracicaba',     category: 'Indústria'  },
  // Limeira
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-limeira.rss',                city: 'Limeira',        category: 'Portaria'   },
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-em-limeira.rss',                city: 'Limeira',        category: 'Geral'      },
];

// ─── VAGAS FIXAS DE FALLBACK ──────────────────────────────────────────────────
// Usadas quando os feeds RSS falham. Linkam para páginas de busca (sempre válidas).
const FALLBACK_JOBS = [
  {
    id: 'fb-001', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Americana', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-americana',
    snippet: 'Vagas de porteiro em Americana. Experiência em controle de acesso, atendimento ao público e CFTV. Registro em CLT.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-002', title: 'Auxiliar de Facilities', company: 'Diversas empresas',
    city: 'Americana', category: 'Facilities',
    link: 'https://www.vagas.com.br/vagas-de-auxiliar-de-facilities-em-americana',
    snippet: 'Auxiliar de facilities para empresas de Americana. Rotinas de conservação, controle de materiais e suporte operacional.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-003', title: 'Recepcionista', company: 'Diversas empresas',
    city: 'Americana', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-recepcionista-em-americana',
    snippet: 'Recepcionista para condomínios corporativos e empresas de Americana. Boa comunicação e apresentação.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-004', title: 'Operador de Produção', company: 'Diversas empresas',
    city: 'Americana', category: 'Indústria',
    link: 'https://www.vagas.com.br/vagas-de-operador-de-producao-em-americana',
    snippet: 'Operador de produção para indústrias do polo de Americana. Experiência em linha de montagem e controle de qualidade.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-005', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Campinas', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-campinas',
    snippet: 'Vagas de porteiro em Campinas. Condomínios residenciais, comerciais e corporativos. CLT com benefícios.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-006', title: 'Recepcionista Corporativa', company: 'Diversas empresas',
    city: 'Campinas', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-recepcionista-em-campinas',
    snippet: 'Recepcionista para empresas de tecnologia e corporações em Campinas. Inglês básico desejável.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-007', title: 'Auxiliar de Manutenção', company: 'Diversas empresas',
    city: 'Campinas', category: 'Facilities',
    link: 'https://www.vagas.com.br/vagas-de-auxiliar-de-manutencao-em-campinas',
    snippet: 'Auxiliar de manutenção predial em Campinas. Manutenção elétrica, hidráulica e conservação geral.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-008', title: 'Analista de TI', company: 'Diversas empresas',
    city: 'Campinas', category: 'Tecnologia',
    link: 'https://www.vagas.com.br/vagas-de-analista-de-ti-em-campinas',
    snippet: 'Analista de TI em Campinas. Suporte, infraestrutura, desenvolvimento. Oportunidades em empresas do polo tecnológico.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-009', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Santa Bárbara', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-santa-barbara-d-oeste',
    snippet: 'Vagas de porteiro em Santa Bárbara D\'Oeste. Controle de acesso, ronda e atendimento ao público.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-010', title: 'Operador de Produção', company: 'Diversas empresas',
    city: 'Santa Bárbara', category: 'Indústria',
    link: 'https://www.vagas.com.br/vagas-de-operador-de-producao-em-santa-barbara-d-oeste',
    snippet: 'Operador de produção em Santa Bárbara D\'Oeste. Indústrias têxtil e metal-mecânica. Turno fixo e rodízio.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-011', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Sumaré', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-sumare',
    snippet: 'Vagas de porteiro em Sumaré. Empresas e condomínios do polo industrial e automotivo.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-012', title: 'Auxiliar de Serviços Gerais', company: 'Diversas empresas',
    city: 'Sumaré', category: 'Facilities',
    link: 'https://www.vagas.com.br/vagas-de-auxiliar-de-servicos-gerais-em-sumare',
    snippet: 'Auxiliar de serviços gerais em Sumaré. Limpeza, organização e conservação em empresas industriais.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-013', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Piracicaba', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-piracicaba',
    snippet: 'Vagas de porteiro em Piracicaba. Usinas, condomínios e empresas do setor sucroenergético.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-014', title: 'Porteiro', company: 'Diversas empresas',
    city: 'Limeira', category: 'Portaria',
    link: 'https://www.vagas.com.br/vagas-de-porteiro-em-limeira',
    snippet: 'Vagas de porteiro em Limeira. Polo joalheiro, industrial e condomínios residenciais.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-015', title: 'Técnico de Enfermagem', company: 'Diversas empresas',
    city: 'Campinas', category: 'Saúde',
    link: 'https://www.vagas.com.br/vagas-de-tecnico-de-enfermagem-em-campinas',
    snippet: 'Técnico de enfermagem em Campinas. Hospitais, clínicas e laboratórios. Plantão diurno e noturno.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
  {
    id: 'fb-016', title: 'Motorista de Entrega', company: 'Diversas empresas',
    city: 'Americana', category: 'Logística',
    link: 'https://www.vagas.com.br/vagas-de-motorista-em-americana',
    snippet: 'Motorista de entrega em Americana e região. CNH B ou D. Logística e distribuição.',
    dateRel: 'hoje', source: 'Vagas.com.br',
  },
];

// ─── PARSER XML ───────────────────────────────────────────────────────────────
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
    if (days <= 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7)  return `há ${days} dias`;
    if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
    return `há ${Math.floor(days / 30)} mes.`;
  } catch { return 'hoje'; }
}

function parseTitle(raw) {
  const parts = raw.split(' - ');
  if (parts.length >= 2) {
    return { title: parts[0].trim(), company: parts.slice(1).join(' - ').trim() };
  }
  return { title: raw.trim(), company: 'Não informado' };
}

function makeId(link) {
  return 'rss-' + link.replace(/[^a-zA-Z0-9]/g, '').slice(-20);
}

// ─── FETCH DE UM FEED RSS ────────────────────────────────────────────────────
async function fetchFeed(search) {
  console.log(`  → ${search.city} / ${search.category}`);

  const res = await fetch(search.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':          'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control':   'no-cache',
      'Referer':         'https://www.vagas.com.br/',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  if (!xml.includes('<item>')) throw new Error('Sem itens no feed');

  const data  = PARSER.parse(xml);
  const items = data?.rss?.channel?.item || [];
  const list  = Array.isArray(items) ? items : [items];

  return list.slice(0, 6).map(item => {
    const rawTitle = stripHtml(item.title || '');
    const { title, company } = parseTitle(rawTitle);
    const link    = typeof item.link === 'string' ? item.link
                    : (item.link?.['@_href'] || item.guid?.['#text'] || item.guid || '');
    const snippet = stripHtml(item.description || '').slice(0, 200);
    const pubDate = item.pubDate || new Date().toISOString();

    return {
      id:       makeId(String(link)),
      title:    title || rawTitle,
      company:  company || 'A informar',
      city:     search.city,
      category: search.category,
      link:     String(link),
      snippet,
      date:     pubDate,
      dateRel:  relativeDate(pubDate),
      source:   'Vagas.com.br',
      // salary: nunca preenchido → "A consultar" exibido pelo JS
    };
  }).filter(j => j.title && j.link && j.link.startsWith('http'));
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n💼 Buscando vagas de emprego da região...\n');

  // Preserva featured jobs existentes
  let existing = { updated: '', featured: [], jobs: [] };
  if (existsSync(OUTPUT)) {
    try { existing = JSON.parse(readFileSync(OUTPUT, 'utf8')); } catch {}
  }

  const allJobs = [];
  const seen    = new Set();
  let   ok      = 0;

  for (const search of SEARCHES) {
    try {
      const jobs = await fetchFeed(search);
      for (const j of jobs) {
        if (j.id && !seen.has(j.id)) {
          seen.add(j.id);
          allJobs.push(j);
        }
      }
      console.log(`     ✅ ${jobs.length} vagas`);
      ok++;
    } catch (err) {
      console.warn(`     ⚠️  ${err.message}`);
    }

    // Pausa para não sobrecarregar o servidor
    await new Promise(r => setTimeout(r, 2000));
  }

  // Se poucos resultados reais → completa com fallback
  const MIN_JOBS = 8;
  if (allJobs.length < MIN_JOBS) {
    console.log(`\n⚡ Poucos resultados reais (${allJobs.length}). Usando vagas curadas como complemento...`);
    for (const fb of FALLBACK_JOBS) {
      if (!seen.has(fb.id)) {
        seen.add(fb.id);
        allJobs.push(fb);
      }
    }
  }

  // Ordena: reais primeiro (têm date real), fallback depois
  allJobs.sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return db - da;
  });

  const output = {
    updated:  new Date().toISOString(),
    totalOk:  ok,
    featured: existing.featured || [],
    jobs:     allJobs.slice(0, 80),
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ ${allJobs.length} vagas salvas (${ok}/${SEARCHES.length} feeds OK)`);
}

main().catch(err => { console.error('\n❌ Erro:', err.message); process.exit(1); });
