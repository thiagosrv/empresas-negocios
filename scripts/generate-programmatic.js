/**
 * generate-programmatic.js
 * Gera ~780 páginas de SEO programático:
 *  - 600 páginas de cidade (120 × 5 temas)
 *  - 180 artigos gerais em noticias/ + artigos.json
 * Uso: node scripts/generate-programmatic.js
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const SITE_URL  = 'https://www.empresasenegocios.com.br';
const TODAY_ISO = '2026-06-11';

// ───────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escJ(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"'); }

function writeFileMkdir(fp, content) {
  mkdirSync(dirname(fp), { recursive: true });
  writeFileSync(fp, content, 'utf8');
}

function fmtDate(iso){
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const [y,m,d] = iso.split('-');
  return `${parseInt(d)} de ${months[parseInt(m)-1]}. de ${y}`;
}

// ───────────────────────────────────────────
// HTML PAGE BUILDER
// ───────────────────────────────────────────
function buildPage({ title, desc, canon, body, breadcrumbs, schemaType='WebPage', depth=2, tagCls='servicos', img='' }) {
  const p = depth === 1 ? '../' : '../../';
  const bcs = breadcrumbs.map((b,i)=>`{"@type":"ListItem","position":${i+1},"name":"${escJ(b.name)}"${b.item?`,"item":"${b.item}"`:''}}`).join(',');
  const imgMeta = img ? `<meta property="og:image" content="${esc(img)}">` : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} | Empresas &amp; Negócios</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canon)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canon)}">
${imgMeta}
<meta property="og:site_name" content="Empresas &amp; Negócios">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"${schemaType}","name":"${escJ(title)}","url":"${escJ(canon)}","description":"${escJ(desc)}","inLanguage":"pt-BR","isPartOf":{"@id":"${SITE_URL}/#website"}},
{"@type":"BreadcrumbList","itemListElement":[${bcs}]}
]}
</script>
<link rel="stylesheet" href="${p}css/style.css">
<link rel="stylesheet" href="${p}css/editorial.css">
</head>
<body>
<main class="container editorial-layout" style="padding-top:40px">
  <article class="content-col">
    ${body}
    <section style="margin-top:48px;padding-top:32px;border-top:2px solid #000">
      <h2 style="font-family:'Manrope',sans-serif;font-size:20px;font-weight:800;margin-bottom:24px">Leia também</h2>
      <div id="art-relacionados" data-artigos="4" data-artigos-tagcls="${tagCls}" data-artigos-allow-repeat="true"></div>
    </section>
  </article>
  <aside class="sidebar">
    <div class="sidebar-widget">
      <h3 class="widget-title">Empresas &amp; Negócios</h3>
      <p>Notícias e análises sobre negócios no interior paulista e todo o Brasil.</p>
    </div>
    <div class="sidebar-widget" style="margin-top:24px">
      <a href="https://wa.me/5519999115496" target="_blank" rel="noopener"
         style="display:block;background:#000;color:#fff;padding:14px 20px;text-align:center;font-weight:700;border-radius:4px;text-decoration:none">
        Publicar artigo no E/N →
      </a>
    </div>
  </aside>
</main>
<script src="${p}js/layout.js"></script>
<script src="${p}js/artigos.js"></script>
<script src="${p}js/main.js"></script>
</body>
</html>`;
}

// ───────────────────────────────────────────
// CITY PAGE TEMPLATES
// ───────────────────────────────────────────
function bodyFacilidades(c) {
  return `<h1>Facilities em ${c.nome}: Gestão Predial e Terceirização</h1>
<p><span class="tag servicos">Serviços</span> &nbsp; <em>Por Thiago Rodrigues — Redator do E/N</em></p>
<p>O mercado de <strong>Facilities Management em ${c.nome}</strong> cresce acompanhando a expansão econômica da ${c.regiao}. ${c.nome}, reconhecida como ${c.eco}, concentra demanda crescente por gestão profissional de espaços corporativos, industriais e comerciais. O mercado nacional de FM movimenta mais de <strong>R$ 60 bilhões por ano</strong> e cresce 4,66% ao ano, segundo a ABRAFAC.</p>
<h2>Serviços de Facilities em ${c.nome}</h2>
<p>Empresas e condomínios comerciais em ${c.nome} contratam serviços integrados que incluem:</p>
<ul>
<li><strong>Portaria e controle de acesso</strong>: presencial ou remota</li>
<li><strong>Limpeza e conservação</strong>: diária ou semanal com equipe treinada</li>
<li><strong>Manutenção predial</strong>: elétrica, hidráulica, ar-condicionado, elevadores</li>
<li><strong>Jardinagem e paisagismo</strong>: áreas externas e jardins internos</li>
<li><strong>Segurança patrimonial</strong>: integrada com CFTV e alarmes</li>
<li><strong>Recepção corporativa</strong>: atendimento profissional ao visitante</li>
</ul>
<h2>Por que Terceirizar Facilities em ${c.nome}?</h2>
<p>Pesquisa da Deloitte mostra que empresas que terceirizam serviços de apoio reduzem entre <strong>20% e 30% dos custos operacionais</strong>. Em ${c.nome}, o mercado competitivo da ${c.regiao} oferece boas opções de fornecedores com custo-benefício comprovado.</p>
<p>Os principais ganhos da terceirização em ${c.nome}: foco no core business, equipe qualificada nas NRs aplicáveis, equipamentos industriais sem investimento direto, escalabilidade conforme demanda e eliminação de encargos trabalhistas sobre a equipe de apoio.</p>
<h2>Modelo IFM em ${c.nome}</h2>
<p>O modelo <strong>IFM (Integrated Facility Management)</strong> — onde um único fornecedor coordena múltiplos serviços — apresenta o maior ROI para empresas com mais de 50 colaboradores. Na ${c.regiao}, empresas que migraram para IFM reportam economia média de 15% frente à contratação fragmentada.</p>
<h2>Como Contratar Facilities em ${c.nome}</h2>
<p>Para encontrar o parceiro ideal em ${c.nome}: mapeie os serviços necessários, solicite 3 propostas com SLA definido, verifique certidões negativas (CNDT, FGTS), analise referências na ${c.regiao} e formalize contrato com KPIs mensuráveis. Empresas certificadas ISO 9001 oferecem maior segurança jurídica.</p>
<p>O mercado de facilities em ${c.estado} conta com fornecedores nacionais (Sodexo, Manserv, CBRE) e regionais com amplo conhecimento do perfil empresarial de ${c.nome} e do interior paulista.</p>`;
}

function bodySeguranca(c) {
  return `<h1>Segurança Eletrônica em ${c.nome}: Câmeras, Alarmes e Monitoramento</h1>
<p><span class="tag tecnologia">Tecnologia</span> &nbsp; <em>Por Thiago Rodrigues — Redator do E/N</em></p>
<p>O mercado de <strong>segurança eletrônica no Brasil</strong> deve atingir <strong>R$ 18 bilhões em 2026</strong>, crescendo 12% ao ano. Em ${c.nome} — ${c.eco} — a demanda por proteção patrimonial eletrônica acompanha o crescimento do setor produtivo da ${c.regiao}. Pesquisa nacional aponta que <strong>78% das empresas</strong> planejam aumentar investimentos em segurança eletrônica, e a procura cresceu <strong>26% em apenas quatro meses</strong> no Brasil.</p>
<h2>Tecnologias Disponíveis em ${c.nome}</h2>
<ul>
<li><strong>Câmeras IP com IA embarcada</strong>: análise de comportamento, detecção de invasão e leitura de placas — já em 50% dos equipamentos fabricados no país</li>
<li><strong>Alarmes monitorados 24h</strong>: com acionamento automático de equipe de resposta</li>
<li><strong>Controle de acesso biométrico</strong>: facial, cartão e senha — padrão em 65% dos edifícios corporativos modernos</li>
<li><strong>Monitoramento remoto</strong>: modelos híbridos (nuvem + on-premise) em 70% das novas instalações</li>
<li><strong>Cerca elétrica e sensores perimetrais</strong>: proteção de áreas externas</li>
<li><strong>Rastreamento veicular</strong>: frotas e veículos corporativos em ${c.nome}</li>
</ul>
<h2>Nova Lei da Segurança Privada em ${c.nome}</h2>
<p>O <strong>Decreto 13.012</strong> de junho de 2026, que regulamenta a Lei 14.967/2024, trouxe novas exigências para empresas de segurança eletrônica em todo o Brasil. A Polícia Federal passou a ter competência ampliada para autorizar e fiscalizar serviços de monitoramento eletrônico. Em ${c.nome}, certifique-se de contratar apenas empresas devidamente registradas na PF e com certificação de equipamentos pelo Inmetro.</p>
<h2>IoT e IA na Segurança de ${c.nome}</h2>
<p>O mercado de IoT para segurança crescerá 18% no Brasil. Em ${c.nome} e na ${c.regiao}, drones com sensores térmicos já são usados para monitorar perímetros de indústrias. A integração entre CFTV, controle de acesso e BMS predial reduz falsos alarmes em até 70% e aumenta a eficiência das equipes de segurança.</p>
<h2>Como Contratar Segurança Eletrônica em ${c.nome}</h2>
<p>Ao selecionar um fornecedor em ${c.nome}: verifique o registro na Polícia Federal, a certificação dos produtos (Inmetro/UL), o SLA de resposta a alarmes e referências na ${c.regiao}. O Brasil tem mais de <strong>30 mil empresas ativas</strong> no setor e cerca de <strong>300 mil empregos diretos</strong>. Escolha parceiros com histórico comprovado na região de ${c.nome}.</p>`;
}

function bodyTerceirizacao(c) {
  return `<h1>10 Dicas para Contratar Serviços Terceirizados em ${c.nome}</h1>
<p><span class="tag servicos">Serviços</span> &nbsp; <em>Por Thiago Rodrigues — Redator do E/N</em></p>
<p>A terceirização de serviços em <strong>${c.nome}</strong> cresce junto com a economia da ${c.regiao}. Segundo pesquisa da Deloitte, empresas que terceirizam estrategicamente reduzem <strong>20% a 30% dos custos operacionais</strong>. Mas contratar mal pode gerar passivos trabalhistas e queda de qualidade. Confira as 10 dicas essenciais.</p>
<h2>As 10 Dicas</h2>
<p><strong>1. Mapeie necessidades antes de cotar.</strong> Defina escopo, área, frequência e SLA esperado. Uma RFP clara evita surpresas em ${c.nome}.</p>
<p><strong>2. Solicite ao menos 3 cotações.</strong> O mercado da ${c.regiao} é competitivo. Compare empresas com histórico comprovado em ${c.estado}.</p>
<p><strong>3. Verifique regularidade trabalhista e fiscal.</strong> Exija CNDT, CND-FGTS e CND Federal. Irregularidade gera responsabilidade subsidiária para o contratante.</p>
<p><strong>4. Visite operações ativas do fornecedor.</strong> Peça contatos de clientes em ${c.nome} ou região e visite in loco para avaliar qualidade real.</p>
<p><strong>5. Analise o contrato com atenção ao SLA.</strong> Defina métricas claras, multas por descumprimento e condições de rescisão sem penalidade por falha do prestador.</p>
<p><strong>6. Exija certificações da equipe.</strong> NR-10 (elétrica), NR-35 (altura), NR-6 (EPIs): treinamentos obrigatórios evitam acidentes e passivos em ${c.nome}.</p>
<p><strong>7. Nomeie um gestor interno do contrato.</strong> Terceirização sem supervisão interna vira transferência de problemas. Defina responsável e reuniões mensais.</p>
<p><strong>8. Desconfie do menor preço.</strong> Propostas muito abaixo da média em ${c.nome} geralmente escondem precariedade salarial ou inadimplência com encargos.</p>
<p><strong>9. Estabeleça KPIs e revisões periódicas.</strong> Satisfação interna, ocorrências, absenteísmo e consumo de insumos devem ser monitorados mensalmente.</p>
<p><strong>10. Formalize tudo por contrato.</strong> Qualquer mudança de escopo ou preço exige addendum assinado. Acordos verbais não têm validade jurídica em ${c.nome}.</p>
<p>Seguindo essas dicas, sua empresa estará preparada para terceirizar em ${c.nome} com segurança jurídica e eficiência operacional comprovada.</p>`;
}

function bodyFacilitiesCustos(c) {
  return `<h1>10 Dicas de Facilities: Como Otimizar Custos em ${c.nome}</h1>
<p><span class="tag servicos">Serviços</span> &nbsp; <em>Por Thiago Rodrigues — Redator do E/N</em></p>
<p>A <strong>gestão de facilities em ${c.nome}</strong> oferece um dos maiores potenciais de otimização de custos para empresas da ${c.regiao}. Com o mercado nacional de FM movimentando mais de <strong>R$ 60 bilhões por ano</strong> (ABRAFAC), práticas inteligentes podem gerar economia de 20% a 35% nos gastos operacionais.</p>
<h2>10 Estratégias para Reduzir Custos com Facilities em ${c.nome}</h2>
<p><strong>1. Implante manutenção preventiva.</strong> Empresas em ${c.nome} com rotina preventiva reduzem em até 40% gastos com corretiva. Crie cronograma mensal para elétrica, hidráulica, AC e elevadores.</p>
<p><strong>2. Faça auditoria energética.</strong> Iluminação LED, sensores de presença e variadores de frequência reduzem a conta de energia em 20% a 30% sem impacto na operação.</p>
<p><strong>3. Consolide fornecedores no modelo IFM.</strong> Um único prestador gerenciando múltiplos serviços reduz sobreposições e melhora SLA. Empresas em ${c.nome} que migraram para IFM reportam 15% de economia.</p>
<p><strong>4. Adote sistema CMMS.</strong> Gestão digitalizada de ordens de serviço e histórico de manutenção elimina desperdícios invisíveis na ${c.regiao}.</p>
<p><strong>5. Terceirize atividades-suporte.</strong> Portaria, limpeza e manutenção terceirizadas custam menos que equipe própria com todos os encargos em ${c.estado}.</p>
<p><strong>6. Implante coleta seletiva.</strong> Além de ESG, venda de recicláveis gera receita e reduz custos de descarte em ${c.nome}.</p>
<p><strong>7. Revise contratos de limpeza.</strong> Mapeie tráfego por área. Em setores administrativos, limpeza 3×/semana substitui o diário sem perda de qualidade.</p>
<p><strong>8. Instale submedidores de consumo.</strong> Energia, água e gás por setor identificam desperdícios pontuais. Custo de instalação paga-se em 6 a 12 meses.</p>
<p><strong>9. Treine equipe interna para fiscalizar contratos.</strong> Reduz desvios de qualidade, uso indevido de insumos e horas extras não autorizadas em ${c.nome}.</p>
<p><strong>10. Faça benchmarking anual com o mercado.</strong> Pesquise preços praticados na ${c.regiao} e renegocie contratos com base em dados reais de mercado.</p>
<p>Aplicando essas 10 estratégias, sua empresa em ${c.nome} terá controle real sobre custos prediais, com impacto direto na rentabilidade.</p>`;
}

function bodyReducaoCustos(c) {
  return `<h1>Redução de Custos em ${c.nome}: Como a Terceirização de Mão de Obra Ajuda</h1>
<p><span class="tag servicos">Serviços</span> &nbsp; <em>Por Thiago Rodrigues — Redator do E/N</em></p>
<p>Empresas em <strong>${c.nome}</strong> buscam estratégias concretas para <strong>reduzir custos operacionais</strong> sem comprometer qualidade. A terceirização de mão de obra é uma das ferramentas mais eficazes: estudo da Deloitte indica redução de <strong>20% a 30%</strong> nos custos operacionais, e modelos de HRO bem implementados chegam a <strong>35%</strong> de economia.</p>
<h2>Por que a Terceirização Reduz Custos em ${c.nome}?</h2>
<p>Na ${c.regiao}, o custo total de um funcionário CLT pode ser 1,8× a 2,2× o salário bruto, somando FGTS (8%), INSS patronal (20%), 13º, férias + 1/3, VT, VA, plano de saúde e seguro de vida. Ao terceirizar, esses encargos ficam com o prestador; você paga apenas pelos serviços prestados e elimina custos de recrutamento, onboarding e passivos de rescisão.</p>
<h2>O que Terceirizar em ${c.nome}?</h2>
<p>Com a <strong>Reforma Trabalhista (Lei 13.467/2017)</strong>, a terceirização é permitida inclusive para atividade-fim. Em ${c.nome}, os serviços mais terceirizados são:</p>
<ul>
<li><strong>Facilities</strong>: limpeza, portaria, manutenção e jardinagem</li>
<li><strong>Segurança</strong>: vigilância patrimonial e monitoramento eletrônico</li>
<li><strong>Logística</strong>: motoristas, entregadores e operadores de armazém</li>
<li><strong>TI</strong>: suporte, infraestrutura e desenvolvimento</li>
<li><strong>Contabilidade e RH</strong>: escritórios especializados na ${c.regiao}</li>
</ul>
<h2>Calculando o ROI em ${c.nome}</h2>
<p>Compare o <em>custo atual</em> (salário × 2 × nº de funcionários + gestão) com o <em>custo terceirizado</em> (proposta mensal de fornecedor em ${c.nome}). Adicione os ganhos indiretos: tempo de gestão recuperado, menor turnover e acesso a tecnologia. Empresas da ${c.regiao} que fizeram essa conta descobriram economia de 15% a 25% mesmo em operações simples.</p>
<h2>Responsabilidade Subsidiária em ${c.estado}</h2>
<p>A empresa contratante responde subsidiariamente por inadimplências trabalhistas do prestador. Por isso, verifique sempre CNDT, CND-FGTS e certidões estaduais antes de fechar contrato em ${c.nome}. Um parceiro regularizado protege sua empresa de passivos inesperados.</p>
<p>Com estratégia bem definida, a terceirização de mão de obra em ${c.nome} pode ser o diferencial competitivo para crescer de forma sustentável em 2026 e além.</p>`;
}

// ───────────────────────────────────────────
// GENERATE CITY PAGES
// ───────────────────────────────────────────
const CITY_TOPICS = [
  {
    dir: 'facilities',
    bodyFn: bodyFacilidades,
    titleFn: c => `Facilities em ${c.nome}: Gestão Predial e Terceirização`,
    descFn: c => `Serviços de Facilities em ${c.nome}: limpeza, portaria, manutenção e segurança. Saiba como terceirizar e reduzir 20% a 30% dos custos.`,
    tagCls: 'servicos',
    bc2: { name: 'Facilities', item: `${SITE_URL}/facilities/` },
  },
  {
    dir: 'seguranca-eletronica',
    bodyFn: bodySeguranca,
    titleFn: c => `Segurança Eletrônica em ${c.nome}: Câmeras, Alarmes e Monitoramento`,
    descFn: c => `Soluções de segurança eletrônica em ${c.nome}. Câmeras IP com IA, alarmes monitorados e controle de acesso biométrico.`,
    tagCls: 'tecnologia',
    bc2: { name: 'Segurança Eletrônica', item: `${SITE_URL}/seguranca-eletronica/` },
  },
  {
    dir: 'terceirizacao',
    bodyFn: bodyTerceirizacao,
    titleFn: c => `10 Dicas para Contratar Terceirizados em ${c.nome}`,
    descFn: c => `Como contratar serviços terceirizados em ${c.nome} com segurança: 10 dicas práticas para evitar passivos e garantir qualidade.`,
    tagCls: 'servicos',
    bc2: { name: 'Terceirização', item: `${SITE_URL}/terceirizacao/` },
  },
  {
    dir: 'facilities-custos',
    bodyFn: bodyFacilitiesCustos,
    titleFn: c => `10 Dicas de Facilities para Otimizar Custos em ${c.nome}`,
    descFn: c => `Como facilities pode reduzir custos operacionais em ${c.nome}. 10 estratégias baseadas em dados do mercado de R$ 60 bilhões.`,
    tagCls: 'servicos',
    bc2: { name: 'Facilities e Custos', item: `${SITE_URL}/facilities-custos/` },
  },
  {
    dir: 'reducao-custos',
    bodyFn: bodyReducaoCustos,
    titleFn: c => `Redução de Custos em ${c.nome}: Terceirização de Mão de Obra`,
    descFn: c => `Como a terceirização de mão de obra reduz custos em ${c.nome}. Dados Deloitte: 20% a 30% de economia comprovada.`,
    tagCls: 'servicos',
    bc2: { name: 'Redução de Custos', item: `${SITE_URL}/reducao-custos/` },
  },
];

function generateCityPages(cidades) {
  let count = 0;
  for (const cidade of cidades) {
    for (const topic of CITY_TOPICS) {
      const title = topic.titleFn(cidade);
      const desc  = topic.descFn(cidade);
      const canon = `${SITE_URL}/${topic.dir}/${cidade.slug}/`;
      const body  = topic.bodyFn(cidade);
      const html  = buildPage({
        title, desc, canon, body,
        breadcrumbs: [
          { name: 'Início', item: `${SITE_URL}/` },
          topic.bc2,
          { name: cidade.nome },
        ],
        schemaType: 'WebPage',
        depth: 2,
        tagCls: topic.tagCls,
      });
      const fp = join(ROOT, topic.dir, cidade.slug, 'index.html');
      writeFileMkdir(fp, html);
      count++;
    }
  }
  console.log(`✅ ${count} páginas de cidade geradas.`);
  return count;
}

// ───────────────────────────────────────────
// NOTICIAS ARTICLE BUILDER
// ───────────────────────────────────────────
function buildArticlePage({ title, desc, canon, body, tag, tagCls, isoDate, img }) {
  const dateFormatted = fmtDate(isoDate);
  return buildPage({
    title, desc, canon,
    body: `${body}\n<p style="margin-top:32px;font-size:13px;color:#666">Publicado em ${dateFormatted} · Redator: Thiago Rodrigues</p>`,
    breadcrumbs: [
      { name: 'Início', item: `${SITE_URL}/` },
      { name: tag, item: `${SITE_URL}/pages/${tagCls}.html` },
      { name: title.slice(0,80) },
    ],
    schemaType: 'NewsArticle',
    depth: 1,
    tagCls,
    img,
  });
}

function writeArticle(article, newEntries) {
  const filename = `${article.isoDate}-${article.slug}.html`;
  const url      = `noticias/${filename}`;
  const canon    = `${SITE_URL}/${url}`;
  const fp       = join(ROOT, 'noticias', filename);

  if (existsSync(fp)) return; // não sobrescreve artigos existentes

  const html = buildArticlePage({ ...article, canon });
  writeFileSync(fp, html, 'utf8');

  newEntries.push({
    id:       `prog-${article.slug}`,
    url,
    title:    article.title,
    description: article.desc,
    tag:      article.tag,
    tagCls:   article.tagCls,
    image:    article.img || '',
    date:     fmtDate(article.isoDate),
    readMin:  Math.max(2, Math.round(article.body.replace(/<[^>]+>/g,'').split(/\s+/).length / 200)),
    source:   'content',
    isoDate:  article.isoDate,
  });
}

// ───────────────────────────────────────────
// UPDATE ARTIGOS.JSON
// ───────────────────────────────────────────
function updateArtigosJson(newEntries) {
  const artigosPath = join(ROOT, 'data', 'artigos.json');
  const data = JSON.parse(readFileSync(artigosPath, 'utf8'));
  const existingIds = new Set(data.articles.map(a => a.id));
  const toAdd = newEntries.filter(e => !existingIds.has(e.id));
  data.articles = [...toAdd, ...data.articles];
  data.updated = new Date().toISOString();
  writeFileSync(artigosPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ artigos.json: ${toAdd.length} novos artigos adicionados.`);
}

// ───────────────────────────────────────────
// IMPORT ARTICLE DATA
// ───────────────────────────────────────────
import { FACILITIES_ARTICLES } from './gen-data/facilities-articles.js';
import { IA_ARTICLES }         from './gen-data/ia-articles.js';
import { SEGURANCA_ARTICLES }  from './gen-data/seguranca-geral-articles.js';
import { LEI_ARTICLES }        from './gen-data/lei-articles.js';
import { FUTEBOL_ARTICLES }    from './gen-data/futebol-articles.js';
import { FINANCEIRO_ARTICLES } from './gen-data/financeiro-articles.js';

// ───────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────
async function main() {
  const cidadesData = JSON.parse(readFileSync(join(ROOT, 'data', 'cidades.json'), 'utf8'));
  const cidades = cidadesData.cidades;

  console.log(`\n🏙️  Gerando páginas de cidade (${cidades.length} cidades × 5 temas)...`);
  generateCityPages(cidades);

  console.log(`\n📰 Gerando artigos gerais...`);
  const newEntries = [];
  const allArticles = [
    ...FACILITIES_ARTICLES,
    ...IA_ARTICLES,
    ...SEGURANCA_ARTICLES,
    ...LEI_ARTICLES,
    ...FUTEBOL_ARTICLES,
    ...FINANCEIRO_ARTICLES,
  ];
  for (const a of allArticles) writeArticle(a, newEntries);
  console.log(`   → ${newEntries.length} artigos escritos em noticias/`);

  updateArtigosJson(newEntries);

  const total = cidades.length * CITY_TOPICS.length + newEntries.length;
  console.log(`\n🎉 Geração concluída: ${total} páginas criadas.\n`);
}

main().catch(console.error);
