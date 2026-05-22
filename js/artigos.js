(function () {
  'use strict';

  const BASE = window.location.pathname.includes('/pages/') ? '../' : './';
  const DATA_URL = BASE + 'data/artigos.json';
  const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=280&fit=crop';

  let cache = null;

  async function getData() {
    if (cache) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('artigos.json não encontrado');
    cache = await res.json();
    return cache;
  }

  function articleUrl(a) {
    const inPages = window.location.pathname.includes('/pages/');
    return inPages ? '../' + a.url : a.url;
  }

  function buildCard(a) {
    const href = articleUrl(a);
    const img  = a.image || FALLBACK;
    return '<article class="card">'
      + '<a href="' + href + '"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="card-body">'
      + '<span class="tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span>'
      + '<a href="' + href + '" class="card-title">' + a.title + '</a>'
      + '<p class="card-summary">' + a.description + '</p>'
      + '<div class="meta"><time>' + a.date + '</time><span class="dot"></span><span>' + (a.readMin || 5) + ' min</span></div>'
      + '</div></article>';
  }

  async function loadArtigos(containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const max    = (opts && opts.max) ? opts.max : 6;

    el.innerHTML = '<div class="rss-loader"><div class="spinner"></div><span>Carregando artigos...</span></div>';

    try {
      const data     = await getData();
      const articles = (data.articles || []).slice(0, max);

      if (!articles.length) {
        el.innerHTML = '<div style="grid-column:1/-1;padding:40px 0;text-align:center;color:var(--gray);">'
          + '<p style="font-size:32px;margin-bottom:12px;">📝</p>'
          + '<p style="font-weight:600;margin-bottom:6px;">Novos artigos em breve</p>'
          + '<p style="font-size:14px;">Nossa equipe publica conteúdo diariamente sobre facilities e negócios em Americana e Campinas.</p>'
          + '</div>';
        return;
      }

      el.className = 'category-grid';
      el.innerHTML = articles.map(buildCard).join('');
    } catch (e) {
      console.warn('[Artigos]', e.message);
      el.innerHTML = '';
    }
  }

  // Auto-init via data-artigos
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-artigos]').forEach(function (el) {
      loadArtigos(el.id, { max: parseInt(el.dataset.artigos, 10) || 6 });
    });
  });

  window.ArtigosLoader = { loadArtigos: loadArtigos };
})();
