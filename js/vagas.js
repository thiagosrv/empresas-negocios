(function () {
  'use strict';

  const BASE      = window.location.pathname.includes('/pages/') ? '../' : './';
  const DATA_URL  = BASE + 'data/vagas.json';
  const WA_GERAL  = 'https://wa.me/5519999115496';
  const WA_PORTARIA = 'https://wa.me/5519978210246';

  const CATEGORY_META = {
    'Portaria':   { color: '#c0392b', icon: '🏢', label: 'Portaria' },
    'Facilities': { color: '#c0392b', icon: '🏢', label: 'Facilities' },
    'Indústria':  { color: '#e67e22', icon: '🏭', label: 'Indústria' },
    'Tecnologia': { color: '#2980b9', icon: '💻', label: 'TI' },
    'Saúde':      { color: '#8e44ad', icon: '🏥', label: 'Saúde' },
    'Logística':  { color: '#16a085', icon: '🚚', label: 'Logística' },
    'Geral':      { color: '#7f8c8d', icon: '💼', label: 'Geral' },
  };

  function getCategoryMeta(cat) {
    return CATEGORY_META[cat] || CATEGORY_META['Geral'];
  }

  function isFacilities(cat) {
    return cat === 'Portaria' || cat === 'Facilities';
  }

  function buildAvatar(company, category) {
    const meta   = getCategoryMeta(category);
    const letter = (company || 'E').charAt(0).toUpperCase();
    return `<div class="job-avatar" style="background:${meta.color}">${letter}</div>`;
  }

  function buildBadge(text, cls) {
    return `<span class="job-badge ${cls || ''}">${text}</span>`;
  }

  function buildCard(job, isFeatured) {
    const meta    = getCategoryMeta(job.category);
    const wa      = isFacilities(job.category) ? WA_PORTARIA : WA_GERAL;
    const ctaHref = isFeatured ? job.link : job.link;
    const ctaText = isFeatured ? '💬 Candidatar-se' : 'Ver vaga →';
    const ctaRel  = isFeatured ? 'noopener' : 'noopener noreferrer';
    const ctaTarget = '_blank';

    const featuredBadge = isFeatured
      ? '<span style="display:inline-flex;align-items:center;gap:4px;background:#fff3cd;color:#856404;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:8px;">⭐ DESTAQUE</span>'
      : '';

    return `
<article class="job-card" data-city="${job.city}" data-category="${job.category}">
  ${buildAvatar(job.company, job.category)}
  <div class="job-info">
    ${featuredBadge}
    <div class="job-title">${job.title}</div>
    <div class="job-company">${job.company}</div>
    ${job.snippet ? `<p class="job-snippet">${job.snippet}</p>` : ''}
    <div class="job-meta">
      ${buildBadge(meta.icon + ' ' + job.category, '')}
      ${buildBadge('📍 ' + job.city, 'location')}
      ${job.type   ? buildBadge(job.type, 'full-time') : ''}
      ${job.salary ? buildBadge(job.salary, 'salary') : ''}
      ${job.dateRel ? buildBadge(job.dateRel, '') : ''}
    </div>
  </div>
  <a href="${ctaHref}" target="${ctaTarget}" rel="${ctaRel}" class="job-cta">${ctaText}</a>
</article>`;
  }

  // ─── FILTRO ───────────────────────────────────────────────────────────────
  let allJobs     = [];
  let activeFilter = 'all';
  let activeCity   = '';
  let searchTerm   = '';
  let visibleCount = 12;

  function applyFilters() {
    searchTerm   = (document.getElementById('searchInput')?.value || '').toLowerCase();
    activeCity   = document.getElementById('cityFilter')?.value || '';

    const filtered = allJobs.filter(j => {
      const catMatch  = activeFilter === 'all' || j.category === activeFilter;
      const cityMatch = !activeCity || j.city === activeCity;
      const textMatch = !searchTerm ||
        j.title.toLowerCase().includes(searchTerm) ||
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

    const count = document.getElementById('jobCount');
    if (count) count.textContent = list.length;

    const shown = list.slice(0, visibleCount);

    if (!shown.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:var(--gray);">
          <div style="font-size:40px;margin-bottom:12px;">🔍</div>
          <p style="font-size:16px;font-weight:600;margin-bottom:6px;">Nenhuma vaga encontrada</p>
          <p style="font-size:13px;">Tente outros filtros ou <a href="https://wa.me/5519999115496" style="color:var(--accent);font-weight:700;">fale conosco</a> para mais vagas.</p>
        </div>`;
      return;
    }

    container.innerHTML = shown.map(j => buildCard(j, false)).join('');

    // Botão "carregar mais"
    const loadMore = document.getElementById('loadMoreBtn');
    if (loadMore) {
      loadMore.style.display = list.length > visibleCount ? 'block' : 'none';
      loadMore.onclick = function () {
        visibleCount += 12;
        renderJobs(list);
      };
    }
  }

  // ─── FILTRO POR CATEGORIA (pills) ─────────────────────────────────────────
  function setupFilterBtns() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter  = this.dataset.filter;
        visibleCount  = 12;
        applyFilters();
      });
    });
  }

  // ─── RENDERIZAR FEATURED ──────────────────────────────────────────────────
  function renderFeatured(featured) {
    const container = document.getElementById('featured-container');
    if (!container || !featured.length) return;
    container.innerHTML = featured.map(j => buildCard(j, true)).join('');
  }

  // ─── ATUALIZAR TIMESTAMP ──────────────────────────────────────────────────
  function setUpdatedTime(iso) {
    const el = document.getElementById('updated-time');
    if (!el || !iso) return;
    try {
      const d = new Date(iso);
      el.textContent = 'Atualizado: ' + d.toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    } catch {}
  }

  // ─── TOTAL COUNT ──────────────────────────────────────────────────────────
  function setTotalCount(n) {
    const el = document.getElementById('totalJobCount');
    if (el) el.textContent = n;
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  async function init() {
    const container = document.getElementById('vagas-container');
    if (container) {
      container.innerHTML = '<div class="rss-loader"><div class="spinner"></div><span>Buscando vagas...</span></div>';
    }

    try {
      const res  = await fetch(DATA_URL);
      if (!res.ok) throw new Error('vagas.json não encontrado');
      const data = await res.json();

      renderFeatured(data.featured || []);
      setUpdatedTime(data.updated);

      allJobs = data.jobs || [];
      setTotalCount((data.featured?.length || 0) + allJobs.length);

      setupFilterBtns();
      applyFilters();

    } catch (e) {
      console.warn('[Vagas]', e.message);
      if (container) {
        container.innerHTML = `
          <div style="text-align:center;padding:40px 24px;color:var(--gray);">
            <p style="font-size:15px;font-weight:600;margin-bottom:8px;">⚠️ Não foi possível carregar vagas automáticas</p>
            <p style="font-size:13px;">As vagas em destaque acima estão disponíveis. <a href="https://wa.me/5519999115496" style="color:var(--accent);font-weight:700;">Fale conosco</a> para mais oportunidades.</p>
          </div>`;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
