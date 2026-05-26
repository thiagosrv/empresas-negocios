(function () {
  'use strict';

  const BASE     = window.location.pathname.includes('/pages/') ? '../' : './';
  const DATA_URL = BASE + 'data/vagas.json';

  const CATEGORY_META = {
    'Portaria':      { color: '#c0392b', colorDark: '#922b21', icon: '🏢', label: 'Portaria'      },
    'Facilities':    { color: '#d35400', colorDark: '#a04000', icon: '🛠️',  label: 'Facilities'    },
    'Indústria':     { color: '#d97706', colorDark: '#b45309', icon: '🏭', label: 'Indústria'     },
    'Tecnologia':    { color: '#2563eb', colorDark: '#1d4ed8', icon: '💻', label: 'Tecnologia'    },
    'Saúde':         { color: '#7c3aed', colorDark: '#6d28d9', icon: '🏥', label: 'Saúde'         },
    'Logística':     { color: '#059669', colorDark: '#047857', icon: '🚚', label: 'Logística'     },
    'Vendas':        { color: '#ea580c', colorDark: '#c2410c', icon: '📈', label: 'Vendas'        },
    'Administrativo':{ color: '#0284c7', colorDark: '#0369a1', icon: '📋', label: 'Administrativo'},
    'Engenharia':    { color: '#0d9488', colorDark: '#0f766e', icon: '⚙️',  label: 'Engenharia'    },
    'Marketing':     { color: '#db2777', colorDark: '#be185d', icon: '📣', label: 'Marketing'     },
    'Finanças':      { color: '#16a34a', colorDark: '#15803d', icon: '💰', label: 'Finanças'      },
    'RH':            { color: '#9333ea', colorDark: '#7e22ce', icon: '👥', label: 'RH'            },
    'Educação':      { color: '#ca8a04', colorDark: '#a16207', icon: '📚', label: 'Educação'      },
    'Geral':         { color: '#4b5563', colorDark: '#374151', icon: '💼', label: 'Geral'         },
  };

  function getMeta(cat) {
    return CATEGORY_META[cat] || CATEGORY_META['Geral'];
  }

  // ─── FEATURED CARD (Proteção Talentos) ────────────────────────────────────
  function buildFeaturedCard(job) {
    const meta   = getMeta(job.category);
    const letter = (job.company || 'P').charAt(0).toUpperCase();

    return `
<article class="pt-card">
  <div class="pt-star-badge">⭐ DESTAQUE</div>
  <div class="pt-card-header">
    <div class="pt-avatar" style="background:linear-gradient(135deg,${meta.color},${meta.colorDark})">
      ${letter}
    </div>
    <div class="pt-card-titles">
      <div class="pt-job-title">${job.title}</div>
      <div class="pt-job-company">${job.company}</div>
    </div>
  </div>
  ${job.snippet ? `<p class="pt-snippet">${job.snippet}</p>` : ''}
  <div class="pt-chips">
    <span class="pt-chip salary">💰 A consultar</span>
    ${job.type   ? `<span class="pt-chip type">📋 ${job.type}</span>`     : ''}
    <span class="pt-chip location">📍 ${job.city}</span>
  </div>
  <a href="${job.link}" target="_blank" rel="noopener" class="pt-cta">
    Ver oportunidade <span>→</span>
  </a>
</article>`;
  }

  // ─── INDEED JOB CARD ──────────────────────────────────────────────────────
  function buildJobCard(job) {
    const meta   = getMeta(job.category);
    const letter = (job.company || 'E').charAt(0).toUpperCase();

    return `
<article class="job-card" data-city="${job.city}" data-category="${job.category}" style="--cat-color:${meta.color}">
  <div class="job-avatar" style="background:${meta.color}">${letter}</div>
  <div class="job-info">
    <div class="job-title">${job.title}</div>
    <div class="job-company">${job.company}</div>
    ${job.snippet ? `<p class="job-snippet">${job.snippet}</p>` : ''}
    <div class="job-meta">
      <span class="job-badge cat">${meta.icon} ${job.category}</span>
      <span class="job-badge location">📍 ${job.city}</span>
      ${job.type   ? `<span class="job-badge type">${job.type}</span>`          : ''}
      <span class="job-badge salary">💰 A consultar</span>
      ${job.dateRel? `<span class="job-badge date">🕐 ${job.dateRel}</span>`   : ''}
    </div>
  </div>
  <a href="${job.link}" target="_blank" rel="noopener noreferrer" class="job-cta">Ver vaga →</a>
</article>`;
  }

  // ─── FILTER STATE ─────────────────────────────────────────────────────────
  let allJobs      = [];
  let activeFilter = 'all';
  let activeCity   = '';
  let searchTerm   = '';
  let visibleCount = 12;

  function applyFilters() {
    searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    activeCity = document.getElementById('cityFilter')?.value || '';

    const filtered = allJobs.filter(j => {
      const catMatch  = activeFilter === 'all' || j.category === activeFilter;
      const cityMatch = !activeCity  || j.city === activeCity;
      const textMatch = !searchTerm  ||
        j.title.toLowerCase().includes(searchTerm)   ||
        j.company.toLowerCase().includes(searchTerm) ||
        (j.snippet || '').toLowerCase().includes(searchTerm);
      return catMatch && cityMatch && textMatch;
    });

    renderJobs(filtered);
  }

  window.applyFilters = applyFilters;

  function renderJobs(list) {
    const container = document.getElementById('vagas-container');
    if (!container) return;

    const countEl = document.getElementById('jobCount');
    if (countEl) countEl.textContent = list.length;

    const shown = list.slice(0, visibleCount);

    if (!shown.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p class="empty-title">Nenhuma vaga encontrada</p>
          <p class="empty-sub">Tente outros filtros ou <a href="https://protecaotalentos.online" target="_blank" rel="noopener">acesse a Proteção Talentos</a> para mais oportunidades.</p>
        </div>`;
      const loadMore = document.getElementById('loadMoreBtn');
      if (loadMore) loadMore.style.display = 'none';
      return;
    }

    container.innerHTML = shown.map(j => buildJobCard(j)).join('');

    const loadMore = document.getElementById('loadMoreBtn');
    if (loadMore) {
      loadMore.style.display = list.length > visibleCount ? 'flex' : 'none';
      loadMore.onclick = function () {
        visibleCount += 12;
        renderJobs(list);
      };
    }
  }

  // ─── FILTER PILLS ─────────────────────────────────────────────────────────
  function setupFilterBtns() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.dataset.filter;
        visibleCount = 12;
        applyFilters();
      });
    });
  }

  // ─── RENDER FEATURED (Proteção Talentos) ──────────────────────────────────
  function renderFeatured(featured) {
    const container = document.getElementById('featured-container');
    if (!container || !featured.length) return;
    container.innerHTML = featured.map(j => buildFeaturedCard(j)).join('');
  }

  // ─── TIMESTAMP ────────────────────────────────────────────────────────────
  function setUpdatedTime(iso) {
    const el = document.getElementById('updated-time');
    if (!el || !iso) return;
    try {
      const d = new Date(iso);
      el.textContent = 'Atualizado ' + d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {}
  }

  // ─── TOTAL COUNT (animated) ───────────────────────────────────────────────
  function animateCount(el, target) {
    if (!el) return;
    let current = 0;
    const step  = Math.ceil(target / 30);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  async function init() {
    const container = document.getElementById('vagas-container');
    if (container) {
      container.innerHTML = `<div class="rss-loader"><div class="spinner"></div><span>Buscando vagas de emprego...</span></div>`;
    }

    try {
      const res  = await fetch(DATA_URL);
      if (!res.ok) throw new Error('vagas.json não encontrado');
      const data = await res.json();

      renderFeatured(data.featured || []);
      setUpdatedTime(data.updated);

      allJobs = data.jobs || [];
      const total = (data.featured?.length || 0) + allJobs.length;
      animateCount(document.getElementById('totalJobCount'), total);

      setupFilterBtns();
      applyFilters();

    } catch (e) {
      console.warn('[Vagas]', e.message);
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p class="empty-title">Não foi possível carregar as vagas</p>
            <p class="empty-sub">As vagas em destaque acima estão disponíveis. <a href="https://protecaotalentos.online" target="_blank">Acesse a Proteção Talentos</a> para mais oportunidades.</p>
          </div>`;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
