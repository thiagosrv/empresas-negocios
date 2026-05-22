(function () {
  'use strict';

  // Detecta se está em /pages/ para ajustar o caminho relativo do JSON
  const BASE     = window.location.pathname.includes('/pages/') ? '../' : './';
  const DATA_URL = BASE + 'data/noticias.json';

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=280&fit=crop';

  let cache = null;

  async function getData() {
    if (cache) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Falha ao carregar noticias.json');
    cache = await res.json();
    return cache;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readMin(text) {
    return Math.max(2, Math.round((String(text || '').split(' ').length) / 40));
  }

  function articleHref(article) {
    // Link para página interna — ajusta caminho conforme localização
    var inPages = window.location.pathname.includes('/pages/');
    var base    = inPages ? 'artigo.html' : 'pages/artigo.html';
    return base + '?u=' + encodeURIComponent(article.link);
  }

  function buildCard(article, layout) {
    const imgSrc = article.image || FALLBACK_IMG;
    const tagCls = article.cls ? 'tag ' + article.cls : 'tag';
    const href   = articleHref(article);

    const imgTag = '<a href="' + href + '">'
      + '<img src="' + imgSrc + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK_IMG + '\'" />'
      + '</a>';

    const body = '<div class="card-body">'
      + '<span class="' + tagCls + '">' + esc(article.tag) + '</span>'
      + '<a href="' + href + '" class="card-title">' + esc(article.title) + '</a>'
      + '<p class="card-summary">' + esc(article.summary) + '</p>'
      + '<div class="meta">'
      + '<time>' + esc(article.date) + '</time>'
      + '<span class="dot"></span>'
      + '<span>' + readMin(article.summary) + ' min</span>'
      + '<span class="dot"></span>'
      + '<span>' + esc(article.source) + '</span>'
      + '</div>'
      + '</div>';

    if (layout === 'horizontal') {
      return '<article class="card card-horizontal rss-card">' + imgTag + body + '</article>';
    }
    return '<article class="card rss-card">' + imgTag + body + '</article>';
  }

  async function loadSection(containerId, group, opts) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var layout = (opts && opts.horizontal) ? 'horizontal' : 'grid';
    var max    = (opts && opts.max) ? opts.max : 6;

    el.innerHTML = '<div class="rss-loader"><div class="spinner"></div><span>Carregando notícias...</span></div>';

    try {
      var data     = await getData();
      var articles = (data.feeds[group] || []).slice(0, max);

      if (!articles.length) {
        el.innerHTML = '<p style="color:var(--muted);padding:24px 0;">Aguardando primeira atualização automática (próxima hora cheia).</p>';
        return;
      }

      el.className = layout === 'horizontal' ? 'rss-list' : 'category-grid';
      el.innerHTML = articles.map(function (a) { return buildCard(a, layout); }).join('');
    } catch (err) {
      console.warn('[NewsFeed]', err.message);
      el.innerHTML = '<p style="color:var(--muted);padding:24px 0;">Notícias temporariamente indisponíveis.</p>';
    }
  }

  // Auto-init via atributos data-rss-*
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-rss-group]').forEach(function (el) {
      loadSection(el.id, el.dataset.rssGroup, {
        horizontal: el.dataset.rssLayout === 'horizontal',
        max: parseInt(el.dataset.rssMax, 10) || 6,
      });
    });
  });

  window.NewsFeed = { loadSection: loadSection };
})();
