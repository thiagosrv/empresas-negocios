/**
 * generate-batch-geral.js
 * Gera 50 artigos reais via GPT-4o sobre temas gerais de negócios, economia,
 * tecnologia, saúde, sociedade, cultura, indústria, finanças e mais.
 *
 * Uso: node scripts/generate-batch-geral.js
 * Requer: OPENAI_API_KEY
 */

import OpenAI from 'openai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client    = new OpenAI();

// ─── 50 TÓPICOS GERAIS ────────────────────────────────────────────────────────
const BATCH = [
  // ── STARTUPS (7) ──────────────────────────────────────────────────────────
  { topic: 'Nubank lança plataforma B2B para médias empresas com crédito, conta PJ e gestão financeira integrada', tag: 'Startups', tagCls: 'startups', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop' },
  { topic: 'fintechs de crédito para PMEs crescem 60% em 2026 e substituem bancos tradicionais no interior do Brasil', tag: 'Startups', tagCls: 'startups', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=450&fit=crop' },
  { topic: 'agtechs brasileiras transformam o agronegócio com drones, sensores IoT e inteligência artificial na lavoura', tag: 'Startups', tagCls: 'startups', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop' },
  { topic: 'edtechs e a revolução da educação corporativa: como empresas brasileiras treinam equipes com custo 40% menor', tag: 'Startups', tagCls: 'startups', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop' },
  { topic: 'proptechs reinventam o mercado imobiliário comercial no Brasil: tecnologia, tokenização e novos modelos de locação', tag: 'Startups', tagCls: 'startups', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop' },
  { topic: 'legaltechs crescem 80% no Brasil em 2026 e automatizam contratos, compliance e gestão jurídica nas empresas', tag: 'Startups', tagCls: 'startups', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&h=450&fit=crop' },
  { topic: 'startup de logística last-mile capta R$ 220 milhões e expande operação para 30 cidades do interior de SP', tag: 'Startups', tagCls: 'startups', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=450&fit=crop' },
  // ── TECNOLOGIA (8) ────────────────────────────────────────────────────────
  { topic: 'blockchain no agronegócio brasileiro: rastreabilidade, certificação e combate à fraude na cadeia de suprimentos', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=450&fit=crop' },
  { topic: '5G no Brasil em 2026: impactos reais para indústria, logística e empresas do interior de São Paulo', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop' },
  { topic: 'cibersegurança para PMEs em 2026: os 5 ataques mais comuns e como proteger sua empresa sem gastar muito', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop' },
  { topic: 'RPA — automação robótica de processos: como empresas brasileiras economizam 30% do tempo operacional', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop' },
  { topic: 'ChatGPT e IA generativa nas empresas: usos reais que estão aumentando a produtividade em 2026', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop' },
  { topic: 'AWS anuncia novo data center no Brasil com R$ 15 bilhões: o que muda para as empresas e startups brasileiras', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=450&fit=crop' },
  { topic: 'IoT e edge computing na indústria 4.0 brasileira: fábricas conectadas, eficiência e redução de custos', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop' },
  { topic: 'computação quântica avança e já impacta laboratórios e pesquisas no Brasil: o que as empresas precisam saber', tag: 'Tecnologia', tagCls: 'tecnologia', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop' },
  // ── SAÚDE (5) ─────────────────────────────────────────────────────────────
  { topic: 'planos de saúde corporativos em 2026: como negociar, comparar coberturas e reduzir custo sem perder qualidade', tag: 'Saúde', tagCls: 'saude', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop' },
  { topic: 'burnout e estresse no trabalho: o custo oculto de R$ 4 bilhões por ano para as empresas brasileiras', tag: 'Saúde', tagCls: 'saude', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&h=450&fit=crop' },
  { topic: 'cannabis medicinal regulada movimenta R$ 500 milhões no Brasil em 2026: empresas, produtos e perspectivas', tag: 'Saúde', tagCls: 'saude', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop' },
  { topic: 'diagnósticos por inteligência artificial em hospitais e clínicas: os resultados reais de SP e Campinas', tag: 'Saúde', tagCls: 'saude', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=450&fit=crop' },
  { topic: 'medicina preventiva nas empresas: como programas de saúde geram ROI de 3x e reduzem absenteísmo', tag: 'Saúde', tagCls: 'saude', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&h=450&fit=crop' },
  // ── BRASIL (7) ────────────────────────────────────────────────────────────
  { topic: 'reforma tributária 2027: o que os gestores de PMEs precisam fazer agora para não ser pegos de surpresa', tag: 'Brasil', tagCls: 'brasil', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=450&fit=crop' },
  { topic: 'Selic alta em 2026: estratégias financeiras para empresas que querem crescer mesmo com juros elevados', tag: 'Brasil', tagCls: 'brasil', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop' },
  { topic: 'privatizações em 2026: setores em disputa, oportunidades para empresas e o que esperar do mercado', tag: 'Brasil', tagCls: 'brasil', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop' },
  { topic: 'PAC infraestrutura 2026: R$ 350 bilhões em obras e as oportunidades de negócio para fornecedores e PMEs', tag: 'Brasil', tagCls: 'brasil', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop' },
  { topic: 'agronegócio bate US$ 180 bilhões em exportações e puxa o PIB brasileiro em 2026', tag: 'Brasil', tagCls: 'brasil', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?w=800&h=450&fit=crop' },
  { topic: 'reforma do Imposto de Renda: o impacto para empreendedores, MEIs e pequenas empresas brasileiras', tag: 'Brasil', tagCls: 'brasil', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop' },
  { topic: 'crédito consignado privado em 2026: como as empresas podem oferecer o benefício e fidelizar colaboradores', tag: 'Brasil', tagCls: 'brasil', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop' },
  // ── MUNDO (6) ─────────────────────────────────────────────────────────────
  { topic: 'guerra comercial EUA-China e tarifas: impactos diretos para exportadores e importadores brasileiros em 2026', tag: 'Mundo', tagCls: 'mundo', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?w=800&h=450&fit=crop' },
  { topic: 'Fed e corte de juros em setembro: o que o mercado financeiro brasileiro espera e como se preparar', tag: 'Mundo', tagCls: 'mundo', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=450&fit=crop' },
  { topic: 'nearshoring em alta: por que empresas globais estão escolhendo o Brasil como base de operações em 2026', tag: 'Mundo', tagCls: 'mundo', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=450&fit=crop' },
  { topic: 'AI Act europeu regulamenta inteligência artificial: o que muda para empresas brasileiras que exportam para a UE', tag: 'Mundo', tagCls: 'mundo', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1509868918748-a554f31a7b2e?w=800&h=450&fit=crop' },
  { topic: 'Bitcoin ETF e o novo ciclo cripto em 2026: guia prático para empresas e CFOs que querem entender o mercado', tag: 'Mundo', tagCls: 'mundo', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=450&fit=crop' },
  { topic: 'Zona do Euro cresce 2,1% e supera previsões: as oportunidades concretas para exportações brasileiras', tag: 'Mundo', tagCls: 'mundo', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop' },
  // ── INDÚSTRIAS (6) ────────────────────────────────────────────────────────
  { topic: 'indústria 4.0 no interior de SP: automação, robótica e o futuro dos empregos nas fábricas de Americana e Campinas', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1565793979108-a10eea5fad27?w=800&h=450&fit=crop' },
  { topic: 'setor têxtil de Americana se reinventa: sustentabilidade, exportação e inovação no polo mais tradicional do Brasil', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop' },
  { topic: 'indústria alimentícia brasileira cresce com exportações: oportunidades para fornecedores do interior paulista', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=450&fit=crop' },
  { topic: 'siderurgia e metalurgia no Brasil: desafios com insumos, oportunidades com infraestrutura e PAC 2026', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=450&fit=crop' },
  { topic: 'logística verde nas indústrias do interior de SP: frotas elétricas, biogás e redução de emissões de carbono', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=800&h=450&fit=crop' },
  { topic: 'veículos elétricos na indústria brasileira: montadoras anunciam R$ 12 bi em investimentos até 2028', tag: 'Indústrias', tagCls: 'industrias', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800&h=450&fit=crop' },
  // ── SOCIEDADE (5) ─────────────────────────────────────────────────────────
  { topic: 'diversidade e inclusão nas empresas brasileiras: dados reais de quem cresceu mais com ESG em 2026', tag: 'Sociedade', tagCls: 'sociedade', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=450&fit=crop' },
  { topic: 'home office em 2026: o que as pesquisas mostram sobre produtividade, saúde e satisfação dos trabalhadores', tag: 'Sociedade', tagCls: 'sociedade', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop' },
  { topic: 'geração Z no mercado corporativo: o que eles esperam dos empregadores, salários e cultura organizacional', tag: 'Sociedade', tagCls: 'sociedade', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop' },
  { topic: 'liderança feminina no Brasil: mulheres CEOs crescem 40% e as empresas com mais mulheres no topo faturam mais', tag: 'Sociedade', tagCls: 'sociedade', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop' },
  { topic: 'previdência privada como benefício corporativo: por que empresas brasileiras estão adotando o PGBL para colaboradores', tag: 'Sociedade', tagCls: 'sociedade', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&h=450&fit=crop' },
  // ── CULTURA & COMPORTAMENTO (4) ───────────────────────────────────────────
  { topic: 'economia criativa no Brasil movimenta R$ 200 bilhões e gera 5 milhões de empregos formais em 2026', tag: 'Cultura', tagCls: 'cultura', daysAgo: 1,  image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop' },
  { topic: 'turismo de negócios em Campinas: hotéis, eventos corporativos e o impacto econômico para a cidade', tag: 'Cultura', tagCls: 'cultura', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=450&fit=crop' },
  { topic: 'lifelong learning nas empresas: organizações que investem mais em treinamento crescem 2x mais rápido', tag: 'Cultura', tagCls: 'cultura', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop' },
  { topic: 'cultura de inovação nas empresas: como criar ambientes criativos que retêm talentos e geram resultados', tag: 'Cultura', tagCls: 'cultura', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop' },
  // ── ECONOMIA & FINANÇAS (4) ───────────────────────────────────────────────
  { topic: 'FIIs em alta em 2026: como investir no mercado imobiliário com R$ 100 e diversificar a carteira corporativa', tag: 'Novidades', tagCls: '', daysAgo: 0,  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop' },
  { topic: 'ESG no Brasil: empresas com práticas sustentáveis têm 20% mais acesso a crédito e atraem mais investidores', tag: 'Novidades', tagCls: '', daysAgo: 2,  image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop' },
  { topic: 'Tesouro Direto, CDBs e LCIs em 2026: guia para empresas que querem aplicar o caixa com mais rentabilidade', tag: 'Novidades', tagCls: '', daysAgo: 3,  image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop' },
  { topic: 'câmbio e exportações em 2026: como o dólar alto favorece as indústrias do interior paulista e o que esperar', tag: 'Novidades', tagCls: '', daysAgo: 4,  image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop' },
];

// ─── MAPA DE TAG → PÁGINA ─────────────────────────────────────────────────────
const TAG_TO_PAGE = {
  'Startups':   { page: 'pages/startups.html',  label: 'Startups'   },
  'Tecnologia': { page: 'pages/tecnologia.html', label: 'Tecnologia' },
  'Saúde':      { page: 'pages/saude.html',       label: 'Saúde'      },
  'Brasil':     { page: 'pages/brasil.html',      label: 'Brasil'     },
  'Mundo':      { page: 'pages/mundo.html',       label: 'Mundo'      },
  'Sociedade':  { page: 'pages/sociedade.html',   label: 'Sociedade'  },
  'Cultura':    { page: 'pages/cultura.html',     label: 'Cultura'    },
  'Indústrias': { page: 'pages/industrias.html',  label: 'Indústrias' },
  'Campinas':   { page: 'pages/campinas.html',    label: 'Campinas'   },
  'Novidades':  { page: 'pages/novidades.html',   label: 'Novidades'  },
};

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(d) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function isoDate(d)    { return d.toISOString().split('T')[0]; }
function escHtml(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }

// ─── GPT-4o ───────────────────────────────────────────────────────────────────
async function generateArticle(entry) {
  const { topic, tag, tagCls, image } = entry;

  const prompt = `Você é um jornalista especializado em negócios, economia e tecnologia, escrevendo para o portal Empresas & Negócios (empresasenegocios.com.br) — referência para empreendedores e executivos do Brasil.

Escreva um artigo jornalístico completo e informativo sobre: "${topic}"

DIRETRIZES:
- Tom: informativo, profissional, prático — com dados concretos e números plausíveis
- Tamanho: 650 a 850 palavras de conteúdo real (sem repetição)
- Use percentuais, valores em reais/dólares, nomes de empresas reais quando relevante
- Contexto geográfico: Brasil; cite Campinas, Americana ou SP quando o tema permitir naturalmente
- Editoria: ${tag}
- NÃO mencionar vigilância armada ou segurança com armas

Retorne APENAS JSON válido, sem markdown:
{
  "title": "título SEO (máx 80 chars, com palavras-chave)",
  "description": "meta description (máx 155 chars, persuasiva)",
  "slug": "slug-sem-acentos-hifenizado-max-60-chars",
  "tag": "${tag}",
  "tagCls": "${tagCls}",
  "readMin": 5,
  "sections": [
    { "type": "intro",     "text": "abertura impactante com dado ou fato concreto" },
    { "type": "h2",        "text": "Primeiro subtítulo" },
    { "type": "p",         "text": "análise com dados" },
    { "type": "list",      "items": ["ponto relevante", "outro ponto", "mais um", "quarto ponto"] },
    { "type": "h2",        "text": "Segundo subtítulo" },
    { "type": "p",         "text": "parágrafo" },
    { "type": "highlight", "text": "dado ou insight de destaque" },
    { "type": "h2",        "text": "Perspectivas e conclusão" },
    { "type": "p",         "text": "conclusão acionável para o leitor" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 3000, temperature: 0.7,
    messages: [
      { role: 'system', content: 'Jornalista de negócios experiente. Responda SEMPRE com JSON puro e válido, sem markdown.' },
      { role: 'user',   content: prompt },
    ],
  });
  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw.replace(/^```json?\n?/,'').replace(/\n?```$/,'').trim());
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────
function buildHtml(article, date, imageUrl, fileName, entry) {
  const dateStr  = formatDate(date);
  const isoStr   = isoDate(date);
  const canonUrl = `https://www.empresasenegocios.com.br/noticias/${fileName}`;
  const catInfo  = TAG_TO_PAGE[entry.tag] || TAG_TO_PAGE['Novidades'];

  let body = '';
  for (const s of article.sections) {
    if (s.type === 'intro')     body += `<p style="font-size:19px;line-height:1.85;font-weight:500;color:#1a1a1a;margin-bottom:28px;">${escHtml(s.text)}</p>\n`;
    if (s.type === 'h2')        body += `<h2 style="font-size:22px;font-weight:800;margin:36px 0 14px;">${escHtml(s.text)}</h2>\n`;
    if (s.type === 'h3')        body += `<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;">${escHtml(s.text)}</h3>\n`;
    if (s.type === 'p')         body += `<p style="font-size:16px;line-height:1.85;margin-bottom:20px;color:#333;">${escHtml(s.text)}</p>\n`;
    if (s.type === 'highlight') body += `<div style="background:#f8f9fa;border-left:4px solid var(--accent);padding:20px 24px;border-radius:0 8px 8px 0;margin:28px 0;font-size:16px;font-style:italic;color:#444;">${escHtml(s.text)}</div>\n`;
    if (s.type === 'list')      body += `<ul style="font-size:16px;line-height:2.1;padding-left:24px;margin-bottom:24px;color:#333;">${(s.items||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>\n`;
    if (s.type === 'quote')     body += `<blockquote style="border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:#f8f9fa;border-radius:0 8px 8px 0;"><p style="font-size:17px;font-style:italic;">"${escHtml(s.text)}"</p>${s.author?`<cite>— ${escHtml(s.author)}</cite>`:''}</blockquote>\n`;
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
    <a href="../index.html">Início</a><a href="../pages/novidades.html">Novidades</a><a href="../pages/startups.html">Startups</a><a href="../pages/tecnologia.html">Tecnologia</a><a href="../pages/brasil.html">Brasil</a><a href="../pages/vagas.html">Vagas</a><a href="../pages/servicos.html">Serviços</a>
    <div class="nav-more-wrap"><button class="nav-more-btn" id="navMoreBtn" aria-expanded="false" aria-haspopup="true">Mais ▾</button><div class="nav-dropdown" id="navDropdown"><a href="../pages/industrias.html">Indústrias</a><a href="../pages/saude.html">Saúde</a><a href="../pages/sociedade.html">Sociedade</a><a href="../pages/cultura.html">Cultura</a><a href="../pages/mundo.html">Mundo</a><a href="../pages/campinas.html">Campinas</a><a href="../pages/esportes.html">Esportes</a><a href="../pages/tempo.html">🌤️ Tempo</a><a href="../pages/noticias-locais.html">Local</a></div></div>
  </div></nav>
</header>
<div class="main-layout" style="padding-top:40px;">
  <div class="content-col">
    <p class="breadcrumb" style="margin-bottom:24px;"><a href="../index.html">Início</a> › <a href="../${catInfo.page}">${catInfo.label}</a> › <span>${escHtml(article.title.slice(0,55))}${article.title.length>55?'…':''}</span></p>
    <div style="margin-bottom:16px;"><span class="tag ${escHtml(article.tagCls)}">${escHtml(article.tag)}</span></div>
    <h1 style="font-size:clamp(24px,4vw,38px);font-weight:900;line-height:1.2;margin-bottom:16px;">${escHtml(article.title)}</h1>
    <div class="meta" style="margin-bottom:28px;"><time datetime="${isoStr}">${dateStr}</time><span class="dot"></span><span>${article.readMin} min de leitura</span><span class="dot"></span><span>Redação Empresas &amp; Negócios</span></div>
    <img src="${imageUrl}" alt="${escHtml(article.title)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:10px;margin-bottom:32px;" loading="eager"/>
    ${body}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:32px 0 40px;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:var(--gray);">Compartilhar:</span>
      <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title+' — '+canonUrl)}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">📱 WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">in LinkedIn</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonUrl)}" target="_blank" rel="noopener" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
    </div>
  </div>
  <aside class="sidebar"><div class="sidebar-sticky">
    <div class="sidebar-widget newsletter-widget">
      <div class="widget-header">📧 Newsletter</div>
      <div class="widget-body"><p class="nl-desc">Negócios e economia no seu e-mail todo dia.</p>
        <form onsubmit="handleNewsletter(event)"><input type="email" placeholder="Seu e-mail" required/><button type="submit" class="btn-nl">Inscrever-se</button></form>
        <p class="nl-privacy">Sem spam.</p></div>
    </div>
    <div class="sidebar-widget ad-sidebar">
      <div class="widget-header">Publicidade</div>
      <div class="widget-body" style="padding:0;"><a href="https://protecaoevigilancia.com.br" target="_blank" rel="sponsored noopener" style="display:block;"><img src="../banner2.png" alt="Proteção e Vigilância" width="300" height="250" loading="lazy" style="width:100%;height:auto;display:block;border-radius:0 0 8px 8px;"/></a></div>
    </div>
    <div class="sidebar-widget">
      <div class="widget-header">📂 Editorias</div>
      <div class="widget-body"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;">
        <li><a href="../pages/startups.html"   style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🚀 Startups</a></li>
        <li><a href="../pages/tecnologia.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">💻 Tecnologia</a></li>
        <li><a href="../pages/brasil.html"     style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🇧🇷 Brasil</a></li>
        <li><a href="../pages/industrias.html" style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;border-bottom:1px solid var(--border);">🏭 Indústrias</a></li>
        <li><a href="../pages/campinas.html"   style="font-size:13px;color:var(--gray-dark);display:block;padding:5px 0;">📍 Campinas</a></li>
      </ul></div>
    </div>
    <div class="sidebar-widget"><div class="widget-header">💼 Vagas na região</div>
      <div class="widget-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Oportunidades em Americana, Campinas e região.</p>
      <a href="../pages/vagas.html" style="display:inline-block;background:var(--accent);color:#fff;font-weight:700;padding:10px 16px;border-radius:8px;font-size:13px;text-decoration:none;">Ver vagas →</a></div>
    </div>
  </div></aside>
</div>
<section class="newsletter-section" id="newsletter"><div class="nl-inner"><h2>Fique por dentro do que importa</h2><p>Receba as principais notícias de negócios, economia e inovação toda manhã.</p><form class="nl-form" onsubmit="handleNewsletter(event)"><input type="email" placeholder="Digite seu e-mail" required/><button type="submit">Inscrever grátis</button></form></div></section>
<footer class="site-footer"><div class="footer-grid">
  <div class="footer-brand"><div class="logo-text">Empresas<span>&</span>Negócios</div><p>Portal de referência em notícias sobre negócios e inovação.</p></div>
  <div class="footer-col"><h4>Editorias</h4><ul><li><a href="../pages/startups.html">Startups</a></li><li><a href="../pages/tecnologia.html">Tecnologia</a></li><li><a href="../pages/saude.html">Saúde</a></li><li><a href="../pages/brasil.html">Brasil</a></li></ul></div>
  <div class="footer-col"><h4>Mais</h4><ul><li><a href="../pages/mundo.html">Mundo</a></li><li><a href="../pages/industrias.html">Indústrias</a></li><li><a href="../pages/campinas.html">Campinas</a></li><li><a href="../pages/vagas.html">Vagas</a></li></ul></div>
  <div class="footer-col"><h4>Institucional</h4><ul><li><a href="#">Sobre nós</a></li><li><a href="#">Anuncie</a></li></ul></div>
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

  console.log(`\n🚀 Gerando ${BATCH.length} artigos gerais...\n`);
  let success=0, failed=0;

  for (let i=0; i<BATCH.length; i++) {
    const entry = BATCH[i];
    const articleDate = new Date(today);
    articleDate.setDate(today.getDate() - entry.daysAgo);

    console.log(`[${i+1}/${BATCH.length}] 📝 ${entry.tag} — ${entry.topic.slice(0,65)}…`);

    try {
      const article  = await generateArticle(entry);
      const isoStr   = isoDate(articleDate);
      const fileName = `${isoStr}-${article.slug}.html`;

      if (index.articles.some(a=>a.slug===article.slug)) {
        console.log('   ⏭️  Já existe, pulando.'); continue;
      }

      writeFileSync(join(outDir,fileName), buildHtml(article, articleDate, entry.image, fileName, entry), 'utf8');
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
  console.log(`\n✅ Concluído! ${success} gerados, ${failed} falhas. Total no índice: ${index.articles.length}`);
}

main().catch(err => { console.error('\n❌',err.message); process.exit(1); });
