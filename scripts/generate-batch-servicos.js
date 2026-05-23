/**
 * generate-batch-servicos.js
 * Gera 50 artigos SEO-local via GPT-4o:
 *  — Combinação de palavras-chave × cidades alvo
 *  — Cidades: Americana, Campinas, Santa Bárbara D'Oeste,
 *             Piracicaba, Limeira, Sumaré
 *  — Menciona naturalmente os sites parceiros para ranqueamento
 *  — Tags: Facilities / Serviços
 *
 * Uso: node scripts/generate-batch-servicos.js
 * Requer: OPENAI_API_KEY
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── PARCEIROS A RANQUEAR ─────────────────────────────────────────────────────
// O prompt instrui o GPT a citar 1-2 deles naturalmente por artigo.
const PARCEIROS = `
• Proteção e Vigilância (protecaoevigilancia.com.br) — portaria e facilities em Americana e região
• PS Proteção (psprotecao.com.br) — facilities integrados no interior paulista
• Proteção Americana (protecaoamericana.com.br) — portaria especializada em Americana
• CT Segurança (ctseguranca.com.br) — controle de acesso e CFTV em Campinas
• Proteção Vigilância (protecaovigilancia.com.br) — portaria corporativa no interior de SP
• Proteção Talentos (protecaotalentos.online) — recrutamento e seleção para portaria e facilities
`.trim();

// ─── 50 TÓPICOS SEO-LOCAL ────────────────────────────────────────────────────
// Cobertura: 6 cidades × múltiplas palavras-chave de serviços
const BATCH = [
  // ══ AMERICANA (10) ══════════════════════════════════════════════════════════
  {
    topic:   'portaria especializada em Americana SP: guia completo para contratar com segurança e garantir qualidade',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Americana SP: como a terceirização de serviços beneficia indústrias do polo têxtil',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso em Americana SP: tecnologias de RFID, biometria e CFTV para empresas e condomínios',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria em Americana: critérios para escolher, contratos CLT e obrigações do contratante',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop',
  },
  {
    topic:   'gestão de condomínios industriais em Americana: facilities, portaria e manutenção no polo manufatureiro',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop',
  },
  {
    topic:   'portaria virtual em Americana SP: tecnologia que cresce nos condomínios residenciais e reduz custos em 40%',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=800&h=450&fit=crop',
  },
  {
    topic:   'terceirização de limpeza e conservação em Americana SP: normas técnicas e boas práticas para fábricas',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção corporativa em Americana SP: perfil profissional, treinamento e impacto na experiência do cliente',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  },
  {
    topic:   'manutenção predial em Americana SP: terceirização versus equipe própria — o que compensa para cada empresa',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities e ESG em Americana SP: como serviços terceirizados reduzem o impacto ambiental das empresas',
    city:    'Americana', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
  },

  // ══ CAMPINAS (12) ═══════════════════════════════════════════════════════════
  {
    topic:   'portaria especializada em Campinas SP: mercado em expansão e como contratar para condomínios e corporações',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Campinas SP: tendências de terceirização para empresas do polo tecnológico em 2026',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso biométrico em Campinas SP: implementação passo a passo para empresas de qualquer porte',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção corporativa em Campinas SP: o que as empresas de TI e startups exigem do profissional de portaria',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop',
  },
  {
    topic:   'terceirização de facilities em Campinas SP: economia de até 35% no custo fixo com contrato integrado',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  },
  {
    topic:   'gestão integrada de espaços corporativos em Campinas: portaria, limpeza e manutenção em um único contrato',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop',
  },
  {
    topic:   'portaria virtual em Campinas SP: tecnologia cresce nos condomínios e reduz custos em até 45%',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=800&h=450&fit=crop',
  },
  {
    topic:   'CFTV e monitoramento remoto em Campinas SP: integração com portaria e gestão centralizada de acessos',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?w=800&h=450&fit=crop',
  },
  {
    topic:   'limpeza e conservação em Campinas SP: normas ABNT, frequência ideal e custo por metro quadrado em 2026',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities e sustentabilidade em Campinas: como empresas do polo tech aplicam ESG nos serviços terceirizados',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
  },
  {
    topic:   'manutenção predial em Campinas SP: como a terceirização reduz custos e aumenta a vida útil dos edifícios',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria em Campinas: como avaliar, comparar propostas e exigir conformidade trabalhista',
    city:    'Campinas', tag: 'Facilities', tagCls: 'servicos', daysAgo: 6,
    image:   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop',
  },

  // ══ SANTA BÁRBARA D'OESTE (7) ════════════════════════════════════════════════
  {
    topic:   'portaria em Santa Bárbara D\'Oeste SP: empresas especializadas e como contratar com garantia de qualidade',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Santa Bárbara D\'Oeste SP: terceirização de serviços para indústrias têxtil e metal-mecânica',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso em Santa Bárbara D\'Oeste: soluções para PMEs industriais e condomínios da cidade',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  },
  {
    topic:   'terceirização de limpeza em Santa Bárbara D\'Oeste SP: custo, benefícios e como escolher o fornecedor certo',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'gestão de condomínios industriais em Santa Bárbara D\'Oeste: portaria, facilities e segurança patrimonial',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria Santa Bárbara D\'Oeste: contrato CLT, direitos trabalhistas e o que o contratante deve exigir',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção e portaria em Santa Bárbara D\'Oeste: como o serviço especializado agrega valor aos condomínios',
    city:    "Santa Bárbara D'Oeste", tag: 'Facilities', tagCls: 'servicos', daysAgo: 6,
    image:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  },

  // ══ PIRACICABA (7) ═══════════════════════════════════════════════════════════
  {
    topic:   'portaria especializada em Piracicaba SP: crescimento com expansão industrial e como contratar bem',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Piracicaba SP: serviços terceirizados para o polo sucroenergético e indústrias da cidade',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso em Piracicaba SP: tecnologias adotadas por usinas, indústrias e condomínios corporativos',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção corporativa em Piracicaba SP: treinamento, perfil profissional e o impacto no atendimento empresarial',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria em Piracicaba SP: o que avaliar, quais perguntas fazer e como garantir qualidade',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop',
  },
  {
    topic:   'limpeza industrial em Piracicaba SP: normas técnicas ABNT, produtos indicados e frequência ideal para usinas',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities para o setor sucroenergético em Piracicaba: portaria, conservação e gestão de equipes terceirizadas',
    city:    'Piracicaba', tag: 'Facilities', tagCls: 'servicos', daysAgo: 6,
    image:   'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop',
  },

  // ══ LIMEIRA (7) ══════════════════════════════════════════════════════════════
  {
    topic:   'portaria em Limeira SP: mercado aquecido, empresas que atendem e como contratar com segurança',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Limeira SP: serviços para o polo joalheiro, industrial e condomínios da cidade',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso em Limeira SP: RFID, biometria e CFTV para indústrias e condomínios comerciais',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  },
  {
    topic:   'terceirização de limpeza em Limeira SP: como economizar e manter padrão de qualidade nos ambientes industriais',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria em Limeira SP: contrato CLT, obrigações legais e diferenciais para o contratante',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  },
  {
    topic:   'gestão de condomínios industriais em Limeira SP: facilities eficientes para o polo joalheiro e metal-mecânico',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção e portaria em Limeira SP: como o serviço qualificado diferencia sua empresa no mercado local',
    city:    'Limeira', tag: 'Facilities', tagCls: 'servicos', daysAgo: 6,
    image:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  },

  // ══ SUMARÉ (7) ═══════════════════════════════════════════════════════════════
  {
    topic:   'portaria especializada em Sumaré SP: como contratar para indústrias do polo automotivo com segurança',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities em Sumaré SP: terceirização de serviços para indústrias do polo automotivo e logístico',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 1,
    image:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    topic:   'controle de acesso em Sumaré SP: soluções para empresas de grande porte e gestão de múltiplos turnos',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  },
  {
    topic:   'recepção em Sumaré SP: profissionais treinados para atender indústria, comércio e condomínios corporativos',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 3,
    image:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
  },
  {
    topic:   'empresa de portaria em Sumaré SP: o que as fábricas do polo automotivo exigem no contrato de facilities',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 4,
    image:   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=450&fit=crop',
  },
  {
    topic:   'limpeza e conservação em Sumaré SP: terceirização com qualidade garantida para ambientes industriais',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 5,
    image:   'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
  },
  {
    topic:   'facilities e ESG em Sumaré SP: como reduzir impacto ambiental e ganhar selos de sustentabilidade nos serviços',
    city:    'Sumaré', tag: 'Facilities', tagCls: 'servicos', daysAgo: 6,
    image:   'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
  },

  // ══ REGIONAL / INTERIOR SP (2) ════════════════════════════════════════════════
  {
    topic:   'portaria e facilities no interior de São Paulo: guia de contratação por região — Americana, Campinas, Piracicaba e mais',
    city:    'Interior SP', tag: 'Facilities', tagCls: 'servicos', daysAgo: 0,
    image:   'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=450&fit=crop',
  },
  {
    topic:   'como escolher empresa de facilities no interior paulista: 10 critérios essenciais para gestores em 2026',
    city:    'Interior SP', tag: 'Facilities', tagCls: 'servicos', daysAgo: 2,
    image:   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  },
];

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) { return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }); }
function isoDate(d)    { return d.toISOString().split('T')[0]; }
function escHtml(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, city } = entry;

  const prompt = `Você é um jornalista especializado em serviços corporativos e facilities no interior de São Paulo, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br).

Escreva um artigo jornalístico prático e informativo sobre: "${topic}"

DIRETRIZES OBRIGATÓRIAS:
- Tom: informativo e prático — voltado para gestores e decisores que buscam contratar serviços
- Tamanho: 700 a 900 palavras de conteúdo real e útil
- Cidade principal do artigo: ${city}
- Contexto regional: interior de São Paulo (citar outras cidades próximas quando natural: Americana, Campinas, Santa Bárbara D'Oeste, Piracicaba, Limeira, Sumaré)
- Mencione NATURALMENTE, no máximo 2 vezes no artigo inteiro, uma ou duas das empresas abaixo quando o contexto for genuinamente relevante:
${PARCEIROS}
- NÃO mencionar vigilância armada, armas ou segurança armada
- Inclua pelo menos 1 lista com itens práticos (checklist, critérios, etapas)
- Inclua pelo menos 1 dado numérico (percentual, valor em R$, tempo, etc.)

Retorne APENAS JSON válido, sem markdown:
{
  "title": "título SEO (máx 80 chars, cidade + palavra-chave principal)",
  "description": "meta description (máx 155 chars, inclua a cidade e a palavra-chave)",
  "slug": "slug-sem-acentos-hifenizado-max-60-chars",
  "tag": "Facilities",
  "tagCls": "servicos",
  "readMin": 5,
  "sections": [
    { "type": "intro",     "text": "abertura com dado concreto sobre o mercado local" },
    { "type": "h2",        "text": "Por que contratar portaria/facilities especializado em ${city}?" },
    { "type": "p",         "text": "análise do mercado local com contexto regional" },
    { "type": "list",      "items": ["critério ou passo 1", "critério ou passo 2", "critério ou passo 3", "critério ou passo 4", "critério ou passo 5"] },
    { "type": "h2",        "text": "Como escolher o fornecedor certo" },
    { "type": "p",         "text": "guia prático para o gestor" },
    { "type": "highlight", "text": "dado, estatística ou insight de destaque sobre o mercado" },
    { "type": "h2",        "text": "O que exigir no contrato" },
    { "type": "p",         "text": "pontos essenciais do contrato CLT e responsabilidades" },
    { "type": "h2",        "text": "Próximos passos para o gestor" },
    { "type": "p",         "text": "conclusão prática e acionável" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 3500, temperature: 0.65,
    messages: [
      { role: 'system', content: 'Especialista em facilities e portaria no interior de SP. Responda SEMPRE com JSON puro e válido, sem markdown.' },
      { role: 'user',   content: prompt },
    ],
  });
  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw.replace(/^```json?\n?/,'').replace(/\n?```$/,'').trim());
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;

  let body = '';
  for (const s of article.sections) {
    if (s.type==='intro')     body += `<p style="font-size:19px;line-height:1.85;font-weight:500;color:#1a1a1a;margin-bottom:28px;">${escHtml(s.text)}</p>\n`;
    if (s.type==='h2')        body += `<h2 style="font-size:22px;font-weight:800;margin:36px 0 14px;color:var(--dark);">${escHtml(s.text)}</h2>\n`;
    if (s.type==='h3')        body += `<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;">${escHtml(s.text)}</h3>\n`;
    if (s.type==='p')         body += `<p style="font-size:16px;line-height:1.85;margin-bottom:20px;color:#333;">${escHtml(s.text)}</p>\n`;
    if (s.type==='highlight') body += `<div style="background:#f8f9fa;border-left:4px solid var(--accent);padding:20px 24px;border-radius:0 8px 8px 0;margin:28px 0;font-size:16px;font-style:italic;color:#444;">${escHtml(s.text)}</div>\n`;
    if (s.type==='list')      body += `<ul style="font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333;">${(s.items||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>\n`;
    if (s.type==='quote')     body += `<blockquote style="border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:#f8f9fa;border-radius:0 8px 8px 0;"><p style="font-size:17px;font-style:italic;">"${escHtml(s.text)}"</p>${s.author?`<cite>— ${escHtml(s.author)}</cite>`:''}</blockquote>\n`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escHtml(article.title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${escHtml(article.description)}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"/>
<link rel="canonical" href="${canonUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${escHtml(article.title)}"/>
<meta property="og:description" content="${escHtml(article.description)}"/>
<meta property="og:url" content="${canonUrl}"/>
<meta property="og:image" content="${imageUrl}"/>
<meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"${article.title.replace(/"/g,'\\"')}","description":"${article.description.replace(/"/g,'\\"')}","image":"${imageUrl}","datePublished":"${isoStr}","author":{"@type":"Organization","name":"Empresas & Negócios","url":"https://www.empresasenegocios.com.br"},"publisher":{"@type":"Organization","name":"Empresas & Negócios"},"mainEntityOfPage":"${canonUrl}","inLanguage":"pt-BR"}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../css/style.css"/>
</head>
<body>
<div class="reading-progress" id="readingProgress"></div>
<div class="ticker-bar"><div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;overflow:hidden;"><span class="ticker-label">Últimas</span><div class="ticker-track"><span>${escHtml(article.title)}</span></div></div></div>
<header class="site-header">
  <div class="header-top">
    <button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
    <a href="../index.html" class="logo"><span class="logo-text">Empresas<span>&</span>Negócios</span></a>
    <div class="header-actions"><a class="btn-subscribe" href="#newsletter">Newsletter</a></div>
  </div>
  <nav class="main-nav" id="mainNav"><div class="nav-inner">
    <a href="../index.html">Início</a><a href="../pages/novidades.html">Novidades</a><a href="../pages/startups.html">Startups</a><a href="../pages/tecnologia.html">Tecnologia</a><a href="../pages/servicos.html" class="active">Serviços</a><a href="../pages/industrias.html">Indústrias</a><a href="../pages/saude.html">Saúde</a><a href="../pages/sociedade.html">Sociedade</a><a href="../pages/cultura.html">Cultura</a><a href="../pages/brasil.html">Brasil</a><a href="../pages/mundo.html">Mundo</a><a href="../pages/campinas.html">Campinas</a><a href="../pages/esportes.html">Esportes</a>
  </div></nav>
</header>
<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../pages/servicos.html">Serviços</a> › <a href="../pages/campinas.html">Interior SP</a> › <span>${escHtml(article.title.slice(0,50))}${article.title.length>50?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag servicos">Facilities</span><span class="tag brasil" style="margin-left:8px;">Interior SP</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${article.readMin} min de leitura</span><span class="dot"></span><span>Redação Empresas &amp; Negócios</span></div>
    <img src="${imageUrl}" alt="${escHtml(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager"/>
    ${body}

    <!-- CTA Facilities / Portaria -->
    <div style="background:var(--black);color:#fff;border-radius:12px;padding:32px;margin:40px 0;text-align:center;">
      <h3 style="color:#fff;font-size:20px;margin-bottom:10px;">Precisa de portaria ou facilities no interior de SP?</h3>
      <p style="color:#aaa;font-size:14px;margin-bottom:20px;">Empresas especializadas atendem Americana, Campinas, Santa Bárbara D'Oeste, Piracicaba, Limeira, Sumaré e toda a região.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener" style="background:var(--accent);color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção e Vigilância</a>
        <a href="https://psprotecao.com.br"          target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">PS Proteção</a>
        <a href="https://protecaoamericana.com.br"   target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Proteção Americana</a>
        <a href="https://ctseguranca.com.br"         target="_blank" rel="noopener" style="background:#1a1a1a;border:1px solid #444;color:#fff;font-weight:700;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">CT Segurança</a>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title+' — '+canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
    </div>
  </div>
  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">📧 Newsletter</div>
      <div class="widget-body"><p class="nl-desc">Negócios e facilities no seu e-mail todo dia.</p>
        <form onsubmit="handleNewsletter(event)"><input type="email" placeholder="Seu e-mail" required/><button type="submit" class="btn-nl">Inscrever-se</button></form>
        <p class="nl-privacy">Sem spam.</p></div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">🏢 Facilities no Interior SP</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
        <li><a href="https://protecaovigilancia.com.br"   target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria corporativa</span></li>
        <li><a href="https://protecaoevigilancia.com.br"  target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção e Vigilância</a><br><span style="font-size:11px;color:var(--gray);">Portaria e facilities</span></li>
        <li><a href="https://psprotecao.com.br"           target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">PS Proteção</a><br><span style="font-size:11px;color:var(--gray);">Facilities integrados</span></li>
        <li><a href="https://protecaoamericana.com.br"    target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Americana</a><br><span style="font-size:11px;color:var(--gray);">Portaria especializada</span></li>
        <li><a href="https://ctseguranca.com.br"          target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">CT Segurança</a><br><span style="font-size:11px;color:var(--gray);">Controle de acesso</span></li>
        <li><a href="https://protecaotalentos.online"     target="_blank" rel="noopener" style="font-size:13px;font-weight:600;color:var(--accent);">Proteção Talentos</a><br><span style="font-size:11px;color:var(--gray);">Vagas em facilities</span></li>
      </ul></div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;"><a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro do que importa</h2><p>Receba as principais notícias de negócios, facilities e economia toda manhã.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em negócios, facilities e inovação.</p></div>
  <div class="footer-col"><h4>Facilities</h4><ul><li><a href="../pages/servicos.html">Serviços</a></li><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/vagas.html">Vagas</a></li></ul></div>
  <div class="footer-col"><h4>Parceiros</h4><ul>
    <li><a href="https://protecaoevigilancia.com.br" target="_blank" rel="noopener">Proteção e Vigilância</a></li>
    <li><a href="https://psprotecao.com.br"          target="_blank" rel="noopener">PS Proteção</a></li>
    <li><a href="https://protecaoamericana.com.br"   target="_blank" rel="noopener">Proteção Americana</a></li>
    <li><a href="https://ctseguranca.com.br"         target="_blank" rel="noopener">CT Segurança</a></li>
  </ul></div>
  <div class="footer-col"><h4>Portal</h4><ul><li><a href="../index.html">Início</a></li><li><a href="#">Anuncie</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 Empresas &amp; Negócios.</span></div></footer>
<div class="toast" id="toast"><span class="toast-icon">✅</span><span id="toastMsg">Inscrição realizada!</span></div>
<button class="back-to-top" id="backToTop">↑</button>
<script src="../js/main.js"></script>
</body></html>`;
}

// ─── ÍNDICE ────────────────────────────────────────────────────────────────────
function loadIndex() {
  const p = join(__dirname,'..','data','artigos.json');
  if (existsSync(p)) try { return JSON.parse(readFileSync(p,'utf8')); } catch {}
  return { updated:'', articles:[] };
}
function saveIndex(index) {
  index.articles.sort((a,b)=>(b.isoDate||'').localeCompare(a.isoDate||''));
  index.articles = index.articles.slice(0,90);
  index.updated  = new Date().toISOString();
  writeFileSync(join(__dirname,'..','data','artigos.json'), JSON.stringify(index,null,2),'utf8');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = join(__dirname,'..','noticias');
  mkdirSync(outDir, { recursive:true });
  const index = loadIndex();
  const today = new Date();

  console.log(`\n🏢 Gerando ${BATCH.length} artigos de serviços/SEO local...\n`);
  let success=0, failed=0;

  for (let i=0; i<BATCH.length; i++) {
    const entry = BATCH[i];
    const articleDate = new Date(today);
    articleDate.setDate(today.getDate() - entry.daysAgo);

    console.log(`[${i+1}/${BATCH.length}] 📍 ${entry.city} — ${entry.topic.slice(0,60)}…`);

    try {
      const article  = await generateArticle(entry);
      const isoStr   = isoDate(articleDate);
      const fileName = `${isoStr}-${article.slug}.html`;

      if (index.articles.some(a=>a.slug===article.slug)) {
        console.log('   ⏭️  Já existe, pulando.'); continue;
      }

      writeFileSync(join(outDir,fileName), buildHtml(article, articleDate, entry.image, fileName), 'utf8');
      index.articles.push({ slug:article.slug, title:article.title, description:article.description, date:formatDate(articleDate), isoDate:isoStr, tag:article.tag, tagCls:article.tagCls, readMin:article.readMin, image:entry.image, url:`noticias/${fileName}` });

      console.log(`   ✅ ${fileName}`);
      success++;
    } catch(e) {
      console.error(`   ❌ ${e.message}`);
      failed++;
    }

    if (i < BATCH.length-1) await sleep(3000);
  }

  saveIndex(index);
  console.log(`\n✅ Concluído! ${success} artigos de serviços gerados, ${failed} falhas. Total: ${index.articles.length}`);
}

main().catch(err => { console.error('\n❌',err.message); process.exit(1); });
