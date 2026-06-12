(function () {
  'use strict';

  const BASE     = window.location.pathname.includes('/pages/') ? '../' : './';
  const DATA_URL = BASE + 'data/artigos.json';
  const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=280&fit=crop';

  let cache = null;

  // Controla artigos já exibidos na página para evitar repetição entre seções
  const usedUrls = new Set();

  const AUTHOR = 'Thiago Rodrigues — Redator do E&amp;N';

  async function getData() {
    if (cache) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('artigos.json não encontrado');
    const raw = await res.json();
    // aceita array puro ou {articles: [...]} / {updated, articles: [...]}
    cache = Array.isArray(raw) ? raw : (raw.articles || []);
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
      + '<a href="' + href + '" class="card-img-wrap"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" />'
      + '<span class="card-tag-over tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span></a>'
      + '<div class="card-body">'
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

  // ─── CARD em DESTAQUE (primeiro artigo da categoria) ────────────────────────
  function buildFeaturedCard(a) {
    const href = articleUrl(a);
    const img  = a.image || FALLBACK;
    return '<article class="card-featured">'
      + '<a href="' + href + '" class="card-featured-img"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="card-featured-body">'
      + '<span class="tag ' + (a.tagCls || '') + '">' + (a.tag || 'Artigo') + '</span>'
      + '<a href="' + href + '"><h2 class="card-featured-title">' + a.title + '</h2></a>'
      + (a.description ? '<p class="card-featured-desc">' + a.description + '</p>' : '')
      + '<div class="meta"><span class="author">' + AUTHOR + '</span><span class="dot"></span>'
      + '<time>' + a.date + '</time><span class="dot"></span>'
      + '<span>' + (a.readMin || 5) + ' min de leitura</span></div>'
      + '<a href="' + href + '" class="card-featured-cta">Ler artigo completo →</a>'
      + '</div></article>';
  }

  // ─── HERO (destaque principal + 2 secundários) ──────────────────────────────
  function buildHeroSection(articles) {
    if (!articles.length) return '';
    const main = articles[0];
    const href0 = articleUrl(main);
    const img0  = main.image || FALLBACK;

    let html = '<article class="hero-main">'
      + '<a href="' + href0 + '"><img src="' + img0 + '" alt="" loading="eager" fetchpriority="high" width="800" height="450" onerror="this.src=\'' + FALLBACK + '\'" /></a>'
      + '<div class="hero-content">'
      + '<span class="tag ' + (main.tagCls || '') + '">' + (main.tag || 'Destaque') + '</span>'
      + '<h2 class="hero-title"><a href="' + href0 + '" style="color:inherit;">' + main.title + '</a></h2>'
      + (main.description ? '<p class="hero-summary">' + main.description + '</p>' : '')
      + '<div class="meta"><span class="author">' + AUTHOR + '</span>'
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

  // ─── LAYOUT FEATURED (1 destaque + grid com o resto) ────────────────────────
  function buildFeaturedLayout(articles) {
    if (!articles.length) return '';
    let html = buildFeaturedCard(articles[0]);
    const rest = articles.slice(1);
    if (rest.length) {
      html += '<div class="category-grid">' + rest.map(buildCard).join('') + '</div>';
    }
    return html;
  }

  // ─── ESTADO VAZIO ────────────────────────────────────────────────────────────
  function emptyState(tag) {
    return '<div style="grid-column:1/-1;padding:60px 0;text-align:center;color:var(--gray);">'
      + '<p style="font-size:40px;margin-bottom:16px;">📰</p>'
      + '<p style="font-weight:700;font-size:16px;margin-bottom:8px;">Novos artigos em breve</p>'
      + '<p style="font-size:14px;color:var(--gray-light);">Nossa equipe publica conteúdo sobre '
      + (tag || 'negócios e economia') + ' diariamente.</p>'
      + '</div>';
  }

  // ─── LOADER PRINCIPAL ────────────────────────────────────────────────────────
  async function loadArtigos(containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const max    = (opts && opts.max)    ? opts.max    : 6;
    const tag    = (opts && opts.tag)    ? opts.tag    : null;    // filtro exato por tag
    const tagCls = (opts && opts.tagCls) ? opts.tagCls : null;    // filtro por tagCls (categoria)
    const layout = (opts && opts.layout) ? opts.layout : 'card';  // card | card-h | hero | featured
    const dedup  = !(opts && opts.allowRepeat);                   // evita repetir artigos na mesma página

    el.innerHTML = '<div class="rss-loader"><div class="spinner"></div><span>Carregando…</span></div>';

    try {
      const data     = await getData();
      let   articles = data.articles || [];

      // Filtro por tag exata (nome da editoria)
      if (tag) {
        articles = articles.filter(function (a) { return a.tag === tag; });
      }

      // Filtro por tagCls (cobre múltiplas tags da mesma categoria)
      // Ex: servicos cobre "Serviços", "Facilities", "Portaria", etc.
      if (tagCls) {
        articles = articles.filter(function (a) { return a.tagCls === tagCls; });
      }

      // Remove artigos já exibidos em outras seções da mesma página
      if (dedup) {
        articles = articles.filter(function (a) { return !usedUrls.has(a.url); });
      }

      articles = articles.slice(0, max);

      if (!articles.length) {
        el.innerHTML = emptyState(tag || tagCls);
        return;
      }

      // Marca os artigos escolhidos como usados
      if (dedup) {
        articles.forEach(function (a) { usedUrls.add(a.url); });
      }

      if (layout === 'featured') {
        el.className = 'featured-section';
        el.innerHTML = buildFeaturedLayout(articles);

      } else if (layout === 'hero') {
        el.className = 'hero-grid';
        el.innerHTML = buildHeroSection(articles);

      } else if (layout === 'card-h') {
        el.className = 'list-cards';
        el.innerHTML = articles.map(buildCardH).join('');

      } else {
        // layout === 'card'
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
  //   <div id="artigos-recentes" data-artigos="12" data-artigos-tag="Startups" data-artigos-layout="featured"></div>
  //   <div id="artigos-recentes" data-artigos="12" data-artigos-tagcls="servicos" data-artigos-layout="featured"></div>
  //   <div id="home-hero"        data-artigos="3"  data-artigos-layout="hero"></div>
  document.addEventListener('DOMContentLoaded', async function () {
    // Carrega sequencialmente (na ordem do DOM) para a deduplicação ser determinística:
    // o hero pega os mais recentes, e as seções seguintes não repetem esses artigos.
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-artigos]'));
    for (var i = 0; i < nodes.length; i++) {
      var el     = nodes[i];
      var max    = parseInt(el.dataset.artigos, 10) || 6;
      var tag    = el.dataset.artigosTag            || null;
      var tagCls = el.dataset.artigosTagcls         || null;
      var layout = el.dataset.artigosLayout         || 'card';
      var repeat = el.dataset.artigosAllowRepeat === 'true';
      await loadArtigos(el.id, { max: max, tag: tag, tagCls: tagCls, layout: layout, allowRepeat: repeat });
    }
  });

  // API pública
  window.ArtigosLoader = { loadArtigos: loadArtigos };
})();
