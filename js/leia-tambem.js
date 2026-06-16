/* ════════════════════════════════════════════════════════════════════════════
   leia-tambem.js — Sidebar "Leia Também" em páginas de artigos.
   Injeta automaticamente no início de <aside class="sidebar"> os artigos
   relacionados à mesma editoria do artigo atual.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX      = 5;
  var FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&h=90&fit=crop';
  var BASE     = '../';   // noticias/ está sempre 1 nível abaixo da raiz

  // Compartilha cache com artigos.js se já tiver carregado
  function getCache() {
    return (window.ArtigosLoader && window.ArtigosLoader._cache) || null;
  }

  // Detecta a editoria desta página
  function detectTag() {
    // 1. data-artigos-tagcls no container de relacionados
    var rel = document.getElementById('art-relacionados');
    if (rel) {
      var tc = rel.getAttribute('data-artigos-tagcls') || '';
      var t  = rel.getAttribute('data-artigos-tag')    || '';
      if (tc || t) return { tagCls: tc, tag: t };
    }
    // 2. <meta property="article:section">
    var metaSection = document.querySelector('meta[property="article:section"]');
    if (metaSection) return { tag: metaSection.getAttribute('content') || '', tagCls: '' };
    // 3. <meta property="article:tag">
    var metaTag = document.querySelector('meta[property="article:tag"]');
    if (metaTag) return { tag: metaTag.getAttribute('content') || '', tagCls: '' };
    return { tag: '', tagCls: '' };
  }

  // Converte tagCls → nome exibido (para o badge)
  var CLS_MAP = {
    brasil: 'Brasil', tecnologia: 'Tecnologia', startups: 'Startups',
    economia: 'Economia', financeiro: 'Financeiro', politica: 'Política',
    servicos: 'Serviços', futebol: 'Futebol', esportes: 'Esportes',
    negocios: 'Negócios', cultura: 'Cultura', sociedade: 'Sociedade',
    saude: 'Saúde', industrias: 'Indústrias', campinas: 'Campinas',
    facilities: 'Facilities', mundo: 'Mundo'
  };

  function tagLabel(cls, tag) {
    return CLS_MAP[cls] || CLS_MAP[(cls || '').toLowerCase()] || tag || 'Artigo';
  }

  // Render
  function renderWidget(articles, tagCls, tag) {
    var label = tagLabel(tagCls, tag);
    var editUrl = 'pages/' + (tagCls || 'novidades') + '.html';

    var cards = articles.map(function (a) {
      var href  = '../' + a.url;
      var img   = a.image || FALLBACK;
      var atag  = a.tag || tagLabel(a.tagCls, '') || label;
      var cls   = a.tagCls || '';
      return '<a href="' + href + '" class="lt-card">'
        + '<img src="' + img + '" alt="" width="72" height="72" loading="lazy" '
        +   'onerror="this.src=\'' + FALLBACK + '\'" class="lt-thumb">'
        + '<div class="lt-info">'
        +   '<span class="lt-badge tag ' + cls + '">' + atag + '</span>'
        +   '<p class="lt-title">' + a.title + '</p>'
        +   '<span class="lt-meta">' + (a.date || '') + ' · ' + (a.readMin || 5) + ' min</span>'
        + '</div>'
        + '</a>';
    }).join('');

    return '<div class="sidebar-widget lt-widget">'
      + '<div class="lt-header">'
      +   '<span class="lt-icon">📌</span>'
      +   '<span class="lt-label">Leia Também</span>'
      +   '<a href="' + editUrl + '" class="lt-ver-mais" aria-label="Ver mais artigos de ' + label + '">ver mais →</a>'
      + '</div>'
      + '<div class="lt-cards">' + cards + '</div>'
      + '</div>';
  }

  // CSS injetado uma única vez
  function injectStyles() {
    if (document.getElementById('lt-styles')) return;
    var s = document.createElement('style');
    s.id = 'lt-styles';
    s.textContent = [
      '.lt-widget { border:1px solid #e8e8e8; background:#fff; border-radius:0; padding:0; overflow:hidden; margin-bottom:24px; }',
      '.lt-header { display:flex; align-items:center; gap:8px; padding:14px 16px 12px; border-bottom:2px solid #000; background:#000; }',
      '.lt-icon { font-size:14px; }',
      '.lt-label { font-family:"JetBrains Mono",monospace; font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#fff; flex:1; }',
      '.lt-ver-mais { font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:700; letter-spacing:.06em; color:rgba(255,255,255,.6); text-decoration:none; flex-shrink:0; }',
      '.lt-ver-mais:hover { color:#fff; }',
      '.lt-cards { display:flex; flex-direction:column; }',
      '.lt-card { display:flex; gap:12px; padding:14px 16px; text-decoration:none; color:inherit; border-bottom:1px solid #f0f0f0; transition:background .15s; }',
      '.lt-card:last-child { border-bottom:none; }',
      '.lt-card:hover { background:#f9f9f9; }',
      '.lt-thumb { width:72px; height:72px; object-fit:cover; flex-shrink:0; border-radius:4px; }',
      '.lt-info { display:flex; flex-direction:column; gap:4px; min-width:0; }',
      '.lt-badge { font-size:9px; padding:2px 6px; border-radius:2px; display:inline-block; align-self:flex-start; }',
      '.lt-title { font-size:13px; font-weight:600; line-height:1.4; color:#111c2d; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }',
      '.lt-meta { font-size:11px; color:#888; font-family:"JetBrains Mono",monospace; margin-top:auto; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  // Ponto de entrada
  function init() {
    var sidebar = document.querySelector('aside.sidebar');
    if (!sidebar) return;

    // Não injetar duas vezes
    if (document.getElementById('lt-styles')) return;

    injectStyles();

    var tagInfo = detectTag();
    var currentPath = window.location.pathname.replace(/^\//, '');

    function render(arts) {
      // Filtra: mesmo tag/tagCls, exclui artigo atual
      var matched = arts.filter(function (a) {
        if (!a || !a.url) return false;
        // Exclui artigo atual
        var aPath = a.url.replace(/^\//, '');
        if (aPath === currentPath) return false;
        // Filtra por tagCls
        if (tagInfo.tagCls && a.tagCls === tagInfo.tagCls) return true;
        // Filtra por tag exata
        if (tagInfo.tag && a.tag === tagInfo.tag) return true;
        return false;
      });

      var selected = matched.slice(0, MAX);

      // Se menos de MAX, preenche com artigos recentes de qualquer tag
      if (selected.length < MAX) {
        var used = new Set(selected.map(function (a) { return a.url; }));
        var extras = arts.filter(function (a) {
          return a && a.url && a.url !== currentPath && !used.has(a.url);
        }).slice(0, MAX - selected.length);
        selected = selected.concat(extras);
      }

      if (!selected.length) return;

      var html = renderWidget(selected, tagInfo.tagCls, tagInfo.tag);
      sidebar.insertAdjacentHTML('afterbegin', html);

      // Oculta a seção "Leia também" do rodapé do artigo (evita duplicata)
      var bottomSec = document.querySelector('#art-relacionados');
      if (bottomSec) {
        var wrap = bottomSec.closest('section');
        if (wrap) wrap.style.display = 'none';
      }
    }

    // Tenta usar cache do artigos.js
    var cached = getCache();
    if (cached && Array.isArray(cached)) {
      render(cached);
      return;
    }

    // Senão, busca diretamente
    fetch(BASE + 'data/artigos.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (data) {
        var arts = Array.isArray(data) ? data : (data.articles || []);
        render(arts);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
