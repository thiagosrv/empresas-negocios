/**
 * fetch-vagas.js
 * Busca vagas de emprego reais de TODOS os setores via múltiplos RSS e salva em data/vagas.json.
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
// vagas.com.br: https://www.vagas.com.br/vagas-de-{cargo}.rss  (nacional)
//               https://www.vagas.com.br/vagas-de-{cargo}-em-{cidade}.rss  (cidade)
// catho.com.br: https://www.catho.com.br/vagas/{cargo}/?rss=1
const SEARCHES = [

  // ── TECNOLOGIA ──────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-desenvolvedor.rss',                     category: 'Tecnologia',     city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-analista-de-sistemas.rss',              category: 'Tecnologia',     city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-desenvolvedor-em-sao-paulo.rss',        category: 'Tecnologia',     city: 'São Paulo' },
  { url: 'https://www.vagas.com.br/vagas-de-analista-de-dados-em-sao-paulo.rss',    category: 'Tecnologia',     city: 'São Paulo' },
  { url: 'https://www.vagas.com.br/vagas-de-desenvolvedor-em-campinas.rss',         category: 'Tecnologia',     city: 'Campinas'  },
  { url: 'https://www.catho.com.br/vagas/desenvolvedor/?rss=1',                     category: 'Tecnologia',     city: 'Brasil'    },

  // ── VENDAS / COMERCIAL ───────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-vendedor.rss',                          category: 'Vendas',         city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-representante-comercial.rss',           category: 'Vendas',         city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-vendedor-em-sao-paulo.rss',             category: 'Vendas',         city: 'São Paulo' },
  { url: 'https://www.vagas.com.br/vagas-de-assistente-comercial-em-campinas.rss',  category: 'Vendas',         city: 'Campinas'  },
  { url: 'https://www.catho.com.br/vagas/vendedor/?rss=1',                          category: 'Vendas',         city: 'Brasil'    },

  // ── ADMINISTRATIVO ───────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-administrativo.rss',           category: 'Administrativo', city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-assistente-administrativo.rss',         category: 'Administrativo', city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-assistente-administrativo-em-sao-paulo.rss', category: 'Administrativo', city: 'São Paulo' },
  { url: 'https://www.vagas.com.br/vagas-de-gerente-de-projetos-em-sao-paulo.rss',  category: 'Administrativo', city: 'São Paulo' },
  { url: 'https://www.catho.com.br/vagas/assistente-administrativo/?rss=1',         category: 'Administrativo', city: 'Brasil'    },

  // ── SAÚDE ────────────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-enfermeiro.rss',                        category: 'Saúde',          city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-tecnico-de-enfermagem.rss',             category: 'Saúde',          city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-enfermeiro-em-sao-paulo.rss',           category: 'Saúde',          city: 'São Paulo' },
  { url: 'https://www.vagas.com.br/vagas-de-tecnico-de-enfermagem-em-campinas.rss', category: 'Saúde',          city: 'Campinas'  },
  { url: 'https://www.catho.com.br/vagas/enfermeiro/?rss=1',                        category: 'Saúde',          city: 'Brasil'    },

  // ── ENGENHARIA ───────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-engenheiro-civil.rss',                  category: 'Engenharia',     city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-engenheiro-mecanico.rss',               category: 'Engenharia',     city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-engenheiro-em-campinas.rss',            category: 'Engenharia',     city: 'Campinas'  },
  { url: 'https://www.catho.com.br/vagas/engenheiro/?rss=1',                        category: 'Engenharia',     city: 'Brasil'    },

  // ── INDÚSTRIA / PRODUÇÃO ─────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-operador-de-producao.rss',              category: 'Indústria',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-mecanico.rss',                          category: 'Indústria',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-eletricista.rss',                       category: 'Indústria',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-operador-de-producao-em-campinas.rss',  category: 'Indústria',      city: 'Campinas'  },
  { url: 'https://www.vagas.com.br/vagas-de-operador-de-producao-em-americana.rss', category: 'Indústria',      city: 'Americana' },

  // ── LOGÍSTICA / TRANSPORTE ───────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-motorista.rss',                         category: 'Logística',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-operador-de-logistica.rss',             category: 'Logística',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-motorista-em-campinas.rss',             category: 'Logística',      city: 'Campinas'  },
  { url: 'https://www.catho.com.br/vagas/motorista/?rss=1',                         category: 'Logística',      city: 'Brasil'    },

  // ── MARKETING ────────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-analista-de-marketing.rss',             category: 'Marketing',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-social-media.rss',                      category: 'Marketing',      city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-analista-de-marketing-em-sao-paulo.rss',category: 'Marketing',      city: 'São Paulo' },

  // ── FINANÇAS / CONTABILIDADE ─────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-analista-financeiro.rss',               category: 'Finanças',       city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-contador.rss',                          category: 'Finanças',       city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-analista-financeiro-em-sao-paulo.rss',  category: 'Finanças',       city: 'São Paulo' },
  { url: 'https://www.catho.com.br/vagas/analista-financeiro/?rss=1',               category: 'Finanças',       city: 'Brasil'    },

  // ── RH / RECURSOS HUMANOS ────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-analista-de-rh.rss',                    category: 'RH',             city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-assistente-de-recursos-humanos.rss',    category: 'RH',             city: 'Brasil'    },
  { url: 'https://www.catho.com.br/vagas/analista-de-rh/?rss=1',                    category: 'RH',             city: 'Brasil'    },

  // ── EDUCAÇÃO ─────────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-professor.rss',                         category: 'Educação',       city: 'Brasil'    },
  { url: 'https://www.vagas.com.br/vagas-de-coordenador-pedagogico.rss',            category: 'Educação',       city: 'Brasil'    },

  // ── PORTARIA / RECEPÇÃO ──────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-campinas.rss',              category: 'Portaria',       city: 'Campinas'  },
  { url: 'https://www.vagas.com.br/vagas-de-recepcionista-em-campinas.rss',         category: 'Portaria',       city: 'Campinas'  },
  { url: 'https://www.vagas.com.br/vagas-de-porteiro-em-americana.rss',             category: 'Portaria',       city: 'Americana' },

  // ── FACILITIES ───────────────────────────────────────────────────────────────
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-de-servicos-gerais-em-campinas.rss', category: 'Facilities', city: 'Campinas' },
  { url: 'https://www.vagas.com.br/vagas-de-auxiliar-de-manutencao-em-campinas.rss', category: 'Facilities',    city: 'Campinas'  },
];

// ─── VAGAS FIXAS DE FALLBACK ──────────────────────────────────────────────────
// Links apontam para páginas de BUSCA (sempre ativas), nunca para vagas específicas.
const FALLBACK_JOBS = [
  // Tecnologia
  { id:'fb-ti-01', title:'Desenvolvedor Full Stack', company:'Diversas empresas', city:'Brasil', category:'Tecnologia',
    link:'https://www.vagas.com.br/vagas-de-desenvolvedor',
    snippet:'Vagas de desenvolvedor full stack, front-end e back-end em todo o Brasil. Node.js, React, Java, Python e mais.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-ti-02', title:'Analista de Dados', company:'Diversas empresas', city:'São Paulo', category:'Tecnologia',
    link:'https://www.vagas.com.br/vagas-de-analista-de-dados',
    snippet:'Analista de dados em empresas de tecnologia. Python, SQL, Power BI, machine learning e business intelligence.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-ti-03', title:'Analista de Suporte de TI', company:'Diversas empresas', city:'Brasil', category:'Tecnologia',
    link:'https://www.vagas.com.br/vagas-de-analista-de-suporte',
    snippet:'Suporte técnico e helpdesk em empresas de médio e grande porte. Remoto e presencial.', dateRel:'hoje', source:'Vagas.com.br' },

  // Vendas
  { id:'fb-vd-01', title:'Vendedor Externo', company:'Diversas empresas', city:'Brasil', category:'Vendas',
    link:'https://www.vagas.com.br/vagas-de-vendedor',
    snippet:'Vendedor externo para empresas de todos os segmentos. Comissão atrativa + fixo + benefícios.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-vd-02', title:'Consultor de Vendas', company:'Diversas empresas', city:'São Paulo', category:'Vendas',
    link:'https://www.vagas.com.br/vagas-de-consultor-de-vendas',
    snippet:'Consultor comercial para venda de soluções B2B e B2C. Carteira de clientes própria é diferencial.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-vd-03', title:'Assistente Comercial', company:'Diversas empresas', city:'Campinas', category:'Vendas',
    link:'https://www.vagas.com.br/vagas-de-assistente-comercial',
    snippet:'Assistente comercial para apoio à equipe de vendas. Emissão de pedidos, CRM e atendimento ao cliente.', dateRel:'hoje', source:'Vagas.com.br' },

  // Administrativo
  { id:'fb-adm-01', title:'Auxiliar Administrativo', company:'Diversas empresas', city:'Brasil', category:'Administrativo',
    link:'https://www.vagas.com.br/vagas-de-auxiliar-administrativo',
    snippet:'Auxiliar administrativo para rotinas de escritório. Controle de documentos, atendimento e suporte.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-adm-02', title:'Assistente Administrativo', company:'Diversas empresas', city:'São Paulo', category:'Administrativo',
    link:'https://www.vagas.com.br/vagas-de-assistente-administrativo',
    snippet:'Assistente administrativo para empresas de médio e grande porte. Excel, comunicação e organização.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-adm-03', title:'Gerente de Projetos', company:'Diversas empresas', city:'Brasil', category:'Administrativo',
    link:'https://www.vagas.com.br/vagas-de-gerente-de-projetos',
    snippet:'Gerente de projetos com metodologias ágeis (Scrum, Kanban). PMP ou certificação PMI é diferencial.', dateRel:'hoje', source:'Vagas.com.br' },

  // Saúde
  { id:'fb-sd-01', title:'Enfermeiro(a)', company:'Diversas unidades', city:'Brasil', category:'Saúde',
    link:'https://www.vagas.com.br/vagas-de-enfermeiro',
    snippet:'Vagas de enfermeiro em hospitais, clínicas e UBSs. Plantão diurno e noturno. COREN ativo obrigatório.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-sd-02', title:'Técnico de Enfermagem', company:'Diversas unidades', city:'Brasil', category:'Saúde',
    link:'https://www.vagas.com.br/vagas-de-tecnico-de-enfermagem',
    snippet:'Técnico de enfermagem para hospitais, clínicas e home care. COREN ativo e experiência hospitalar.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-sd-03', title:'Médico(a) Clínico Geral', company:'Diversas clínicas', city:'Brasil', category:'Saúde',
    link:'https://www.vagas.com.br/vagas-de-medico',
    snippet:'Médico clínico geral para atendimento ambulatorial. CRM ativo. Horário comercial e plantão.', dateRel:'hoje', source:'Vagas.com.br' },

  // Engenharia
  { id:'fb-eng-01', title:'Engenheiro Civil', company:'Diversas construtoras', city:'Brasil', category:'Engenharia',
    link:'https://www.vagas.com.br/vagas-de-engenheiro-civil',
    snippet:'Engenheiro civil para obras residenciais e comerciais. Gestão de equipe, cronograma e orçamento.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-eng-02', title:'Engenheiro Mecânico', company:'Diversas indústrias', city:'Brasil', category:'Engenharia',
    link:'https://www.vagas.com.br/vagas-de-engenheiro-mecanico',
    snippet:'Engenheiro mecânico para indústria. Manutenção, projetos e melhoria de processos.', dateRel:'hoje', source:'Vagas.com.br' },

  // Indústria
  { id:'fb-ind-01', title:'Operador de Produção', company:'Diversas indústrias', city:'Campinas', category:'Indústria',
    link:'https://www.vagas.com.br/vagas-de-operador-de-producao',
    snippet:'Operador de produção para indústrias da região. Linha de montagem, controle de qualidade e processos.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-ind-02', title:'Eletricista Industrial', company:'Diversas empresas', city:'Brasil', category:'Indústria',
    link:'https://www.vagas.com.br/vagas-de-eletricista',
    snippet:'Eletricista industrial para manutenção predial e equipamentos. NR10 e NR35 obrigatórias.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-ind-03', title:'Mecânico de Manutenção', company:'Diversas indústrias', city:'Brasil', category:'Indústria',
    link:'https://www.vagas.com.br/vagas-de-mecanico',
    snippet:'Mecânico para manutenção preventiva e corretiva de equipamentos industriais.', dateRel:'hoje', source:'Vagas.com.br' },

  // Logística
  { id:'fb-log-01', title:'Motorista de Entrega', company:'Diversas transportadoras', city:'Brasil', category:'Logística',
    link:'https://www.vagas.com.br/vagas-de-motorista',
    snippet:'Motorista entregador com CNH B/C/D/E. Logística last mile, distribuição e cargas.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-log-02', title:'Auxiliar de Logística', company:'Diversas empresas', city:'Brasil', category:'Logística',
    link:'https://www.vagas.com.br/vagas-de-auxiliar-de-logistica',
    snippet:'Auxiliar de logística em centros de distribuição. Separação, conferência e expedição de pedidos.', dateRel:'hoje', source:'Vagas.com.br' },

  // Marketing
  { id:'fb-mkt-01', title:'Analista de Marketing Digital', company:'Diversas agências', city:'Brasil', category:'Marketing',
    link:'https://www.vagas.com.br/vagas-de-analista-de-marketing',
    snippet:'Analista de marketing digital. SEO, campanhas pagas (Google Ads, Meta Ads), email marketing e analytics.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-mkt-02', title:'Social Media', company:'Diversas empresas', city:'Brasil', category:'Marketing',
    link:'https://www.vagas.com.br/vagas-de-social-media',
    snippet:'Social media para gestão de redes sociais, criação de conteúdo e engajamento de audiência.', dateRel:'hoje', source:'Vagas.com.br' },

  // Finanças
  { id:'fb-fin-01', title:'Analista Financeiro', company:'Diversas empresas', city:'Brasil', category:'Finanças',
    link:'https://www.vagas.com.br/vagas-de-analista-financeiro',
    snippet:'Analista financeiro para contas a pagar, contas a receber, fluxo de caixa e conciliação bancária.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-fin-02', title:'Contador(a)', company:'Diversas empresas', city:'Brasil', category:'Finanças',
    link:'https://www.vagas.com.br/vagas-de-contador',
    snippet:'Contador para rotinas fiscais, tributárias e contábeis. CRC ativo. ERP (SAP, TOTVS, Oracle).', dateRel:'hoje', source:'Vagas.com.br' },

  // RH
  { id:'fb-rh-01', title:'Analista de RH', company:'Diversas empresas', city:'Brasil', category:'RH',
    link:'https://www.vagas.com.br/vagas-de-analista-de-rh',
    snippet:'Analista de RH generalista. Recrutamento, seleção, treinamento, folha e benefícios.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-rh-02', title:'Recrutador(a)', company:'Diversas empresas', city:'Brasil', category:'RH',
    link:'https://www.vagas.com.br/vagas-de-recrutador',
    snippet:'Recrutador para atração e seleção de talentos. LinkedIn Recruiter, triagem de currículos e entrevistas.', dateRel:'hoje', source:'Vagas.com.br' },

  // Educação
  { id:'fb-edu-01', title:'Professor(a)', company:'Diversas escolas', city:'Brasil', category:'Educação',
    link:'https://www.vagas.com.br/vagas-de-professor',
    snippet:'Professor para redes de ensino públicas e privadas. Licenciatura na área. Ensino fundamental e médio.', dateRel:'hoje', source:'Vagas.com.br' },

  // Portaria
  { id:'fb-pt-01', title:'Porteiro', company:'Diversas empresas', city:'Campinas', category:'Portaria',
    link:'https://www.vagas.com.br/vagas-de-porteiro-em-campinas',
    snippet:'Vagas de porteiro em Campinas. Condomínios residenciais, comerciais e corporativos. CLT com benefícios.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-pt-02', title:'Recepcionista', company:'Diversas empresas', city:'Campinas', category:'Portaria',
    link:'https://www.vagas.com.br/vagas-de-recepcionista-em-campinas',
    snippet:'Recepcionista para empresas e condomínios de Campinas. Boa comunicação e atendimento ao público.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-pt-03', title:'Porteiro', company:'Diversas empresas', city:'Americana', category:'Portaria',
    link:'https://www.vagas.com.br/vagas-de-porteiro-em-americana',
    snippet:'Vagas de porteiro em Americana. Controle de acesso, ronda e atendimento. CLT com benefícios.', dateRel:'hoje', source:'Vagas.com.br' },

  // Facilities
  { id:'fb-fac-01', title:'Auxiliar de Serviços Gerais', company:'Diversas empresas', city:'Campinas', category:'Facilities',
    link:'https://www.vagas.com.br/vagas-de-auxiliar-de-servicos-gerais',
    snippet:'Auxiliar de serviços gerais em Campinas. Limpeza, organização e conservação em empresas e condomínios.', dateRel:'hoje', source:'Vagas.com.br' },
  { id:'fb-fac-02', title:'Auxiliar de Manutenção', company:'Diversas empresas', city:'Campinas', category:'Facilities',
    link:'https://www.vagas.com.br/vagas-de-auxiliar-de-manutencao',
    snippet:'Auxiliar de manutenção predial. Elétrica, hidráulica e conservação geral de instalações.', dateRel:'hoje', source:'Vagas.com.br' },
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
  console.log(`  → ${search.category} / ${search.city}`);

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

  return list.slice(0, 5).map(item => {
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
      source:   search.url.includes('catho') ? 'Catho' : 'Vagas.com.br',
    };
  }).filter(j => j.title && j.link && j.link.startsWith('http'));
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n💼 Buscando vagas de emprego de todos os setores...\n');

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
    await new Promise(r => setTimeout(r, 1500));
  }

  // Se poucos resultados reais → completa com fallback
  const MIN_JOBS = 15;
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
    jobs:     allJobs.slice(0, 120),
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ ${allJobs.length} vagas salvas em ${ok}/${SEARCHES.length} feeds bem-sucedidos`);
}

main().catch(err => { console.error('\n❌ Erro:', err.message); process.exit(1); });
