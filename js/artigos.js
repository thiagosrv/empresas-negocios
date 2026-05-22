(function () {
  'use strict';

  const BASE     = window.location.pathname.includes('/pages/') ? '../' : './';
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

  // ─── CARD padrão (grade) ────────────────────────────────────────────────────
  function buildCard(a) {
    const href = articleUrl(a);
    const img  = a.image || FALLBACK;
    return '<article class="card">'
      + '<a href="' + href + '"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="card-body">'
      + '<span class="tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span>'
      + '<a href="' + href + '" class="card-title">' + a.title + '</a>'
      + (a.description ? '<p class="card-summary">' + a.description + '</p>' : '')
      + '<div class="meta"><time>' + a.date + '</time><span class="dot"></span><span>' + (a.readMin || 5) + ' min</span></div>'
      + '</div></article>';
  }

  // ─── CARD horizontal (lista) ────────────────────────────────────────────────
  function buildCardH(a) {
    const href = articleUrl(a);
    const img  = a.image || FALLBACK;
    return '<article class="card-h">'
      + '<a href="' + href + '"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="card-body">'
      + '<span class="tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span>'
      + '<a href="' + href + '" class="card-title">' + a.title + '</a>'
      + '<div class="meta"><time>' + a.date + '</time><span class="dot"></span><span>' + (a.readMin || 5) + ' min</span></div>'
      + '</div></article>';
  }

  // ─── HERO (destaque principal + 2 secundários) ──────────────────────────────
  function buildHeroSection(articles) {
    if (!articles.length) return '';
    const main = articles[0];
    const href0 = articleUrl(main);
    const img0  = main.image || FALLBACK;

    let html = '<article class="hero-main">'
      + '<a href="' + href0 + '"><img src="' + img0 + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="hero-content">'
      + '<span class="tag ' + (main.tagCls || '') + '">' + (main.tag || 'Destaque') + '</span>'
      + '<h2 class="hero-title"><a href="' + href0 + '" style="color:inherit;">' + main.title + '</a></h2>'
      + (main.description ? '<p class="hero-summary">' + main.description + '</p>' : '')
      + '<div class="meta"><span class="author">Redação E&amp;N</span>'
      + '<span class="dot"></span><time>' + main.date + '</time>'
      + '<span class="dot"></span><span>' + (main.readMin || 5) + ' min de leitura</span></div>'
      + '</div></article>';

    const secondary = articles.slice(1, 3);
    secondary.forEach(function (a) {
      const href = articleUrl(a);
      const img  = a.image || FALLBACK;
      html += '<article class="hero-secondary">'
        + '<a href="' + href + '"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
        + '<div class="card-body">'
        + '<span class="tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span>'
        + '<a href="' + href + '" class="card-title">' + a.title + '</a>'
        + '<div class="meta" style="margin-top:8px;"><time>' + a.date + '</time>'
        + '<span class="dot"></span><span>' + (a.readMin || 5) + ' min</span></div>'
        + '</div></article>';
    });
    return html;
  }

  // ─── ESTADO VAZIO ────────────────────────────────────────────────────────────
  function emptyState() {
    return '<div style="grid-column:1/-1;padding:40px 0;text-align:center;color:var(--gray);">'
      + '<p style="font-size:32px;margin-bottom:12px;">📝</p>'
      + '<p style="font-weight:600;margin-bottom:6px;">Novos artigos em breve</p>'
      + '<p style="font-size:14px;">Nossa equipe publica conteúdo diariamente sobre negócios, tecnologia e economia.</p>'
      + '</div>';
  }

  // ─── LOADER PRINCIPAL ────────────────────────────────────────────────────────
  async function loadArtigos(containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const max    = (opts && opts.max)    ? opts.max    : 6;
    const tag    = (opts && opts.tag)    ? opts.tag    : null;    // filtro por tag/editoria
    const layout = (opts && opts.layout) ? opts.layout : 'card';  // card | card-h | hero

    el.innerHTML = '<div class="rss-loader"><div class="spinner"></div><span>Carregando…</span></div>';

    try {
      const data     = await getData();
      let   articles = data.articles || [];

      // Filtra por tag, se especificado
      if (tag) {
        articles = articles.filter(function (a) { return a.tag === tag; });
      }

      articles = articles.slice(0, max);

      if (!articles.length) {
        el.innerHTML = emptyState();
        return;
      }

      if (layout === 'hero') {
        el.className = 'hero-grid';
        el.innerHTML = buildHeroSection(articles);

      } else if (layout === 'card-h') {
        el.className = 'list-cards';
        el.innerHTML = articles.map(buildCardH).join('');

      } else {
        // layout === 'card' — mantém a classe que já estava no HTML,
        // ou aplica 'news-grid' como padrão
        if (!el.className || el.className === 'rss-loader') {
          el.className = 'news-grid';
        }
        el.innerHTML = articles.map(buildCard).join('');
      }

    } catch (e) {
      console.warn('[Artigos]', e.message);
      el.innerHTML = '';
    }
  }

  // ─── AUTO-INIT via atributos data- ───────────────────────────────────────────
  // Uso no HTML:
  //   <div id="home-recentes"  class="news-grid"    data-artigos="4"></div>
  //   <div id="home-startups"  class="category-row" data-artigos="3" data-artigos-tag="Startups"></div>
  //   <div id="home-tecnologia"                     data-artigos="3" data-artigos-tag="Tecnologia" data-artigos-layout="card-h"></div>
  //   <div id="home-hero"                           data-artigos="3" data-artigos-layout="hero"></div>
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-artigos]').forEach(function (el) {
      var max    = parseInt(el.dataset.artigos, 10)       || 6;
      var tag    = el.dataset.artigosTag                  || null;
      var layout = el.dataset.artigosLayout               || 'card';
      loadArtigos(el.id, { max: max, tag: tag, layout: layout });
    });
  });

  // API pública
  window.ArtigosLoader = { loadArtigos: loadArtigos };
})();
