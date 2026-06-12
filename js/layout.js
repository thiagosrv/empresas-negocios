/* ════════════════════════════════════════════════════════════════════════════
   layout.js — Injeta o cabeçalho (ticker + navbar) e o rodapé editorial em
   TODAS as páginas. Fonte única de verdade do chrome do site.

   Funciona tanto na raiz (index.html) quanto em /pages/*.html — os caminhos
   são ajustados automaticamente. Substitui qualquer header/footer/ticker antigo.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Google Fonts não-bloqueante ──────────────────────────────────────────────
  (function () {
    var h = document.head;
    function addLink(rel, href, extra) {
      var l = document.createElement('link');
      l.rel = rel;
      l.href = href;
      if (extra) { l.as = extra.as; if (extra.crossorigin) l.crossOrigin = ''; }
      h.appendChild(l);
    }
    addLink('preconnect', 'https://fonts.googleapis.com');
    addLink('preconnect', 'https://fonts.gstatic.com', { crossorigin: true });
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    l.media = 'print';
    l.onload = function () { this.media = 'all'; };
    h.appendChild(l);
  })();
  // ─────────────────────────────────────────────────────────────────────────────

  var inPages = window.location.pathname.indexOf('/pages/') !== -1;
  var ROOT    = inPages ? '../' : './';          // raiz do site
  var P       = inPages ? '' : 'pages/';          // prefixo p/ páginas internas
  var WA       = 'https://wa.me/5519999115496?text=Ol%C3%A1!%20Quero%20publicar%20meu%20artigo%20no%20Empresas%20%26%20Neg%C3%B3cios.';

  // Detecta a página atual para marcar o link ativo
  var here = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function navLink(file, label) {
    var active = (here === file) || (file === 'index.html' && (here === '' || here === 'index.html'));
    return '<li><a href="' + (file === 'index.html' ? ROOT + 'index.html' : P + file) + '"'
      + (active ? ' class="active"' : '') + '>' + label + '</a></li>';
  }

  var TICKER_ITEMS = [
    'Ibovespa supera 135 mil pontos com alívio externo',
    'Governo anuncia pacote de R$ 8 bi para PMEs do setor industrial',
    'Startup brasileira levanta US$ 50 mi em rodada Série B',
    'Petrobras registra lucro líquido de R$ 26 bi no trimestre',
    'Banco Central mantém Selic em 13,75% ao ano',
    'Desemprego cai para 7,1% e atinge menor nível em 10 anos'
  ];

  function buildTicker() {
    var spans = TICKER_ITEMS.concat(TICKER_ITEMS) // duplicado p/ loop contínuo
      .map(function (t) { return '<span>' + t + '</span>'; }).join('');
    return '<div class="ed-ticker"><div class="ed-ticker-inner">'
      + '<div class="ed-ticker-track">' + spans + '</div></div></div>';
  }

  function buildHeader() {
    var links = ''
      + navLink('index.html',     'Início')
      + navLink('startups.html',  'Startups')
      + navLink('tecnologia.html','Tecnologia')
      + navLink('brasil.html',    'Brasil')
      + navLink('vagas.html',     'Vagas')
      + navLink('futebol.html',   'Futebol')
      + navLink('novidades.html', 'Mais');

    var mobileLinks = [
      ['index.html', 'Início'], ['novidades.html', 'Novidades'], ['startups.html', 'Startups'],
      ['tecnologia.html', 'Tecnologia'], ['brasil.html', 'Brasil'], ['vagas.html', 'Vagas'],
      ['futebol.html', 'Futebol'], ['servicos.html', 'Serviços'], ['mundo.html', 'Mundo']
    ].map(function (l) {
      var href = l[0] === 'index.html' ? ROOT + 'index.html' : P + l[0];
      return '<a href="' + href + '">' + l[1] + '</a>';
    }).join('');

    return ''
    + '<nav class="ed-nav">'
    +   '<div class="ed-nav-inner">'
    +     '<a href="' + ROOT + 'index.html" class="ed-logo" aria-label="Empresas & Négocios — início">'
    +       '<img src="' + ROOT + 'assets/logo-fn.png" alt="Empresas & Négocios" width="160" height="80" />'
    +     '</a>'
    +     '<ul class="ed-nav-links">' + links + '</ul>'
    +     '<div class="ed-actions">'
    +       '<a href="' + WA + '" target="_blank" rel="noopener" class="ed-publish in-nav">✍️ Publique seu artigo</a>'
    +       '<a href="#newsletter" class="ed-cta">Newsletter</a>'
    +       '<button class="ed-hamburger" id="edHamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>'
    +     '</div>'
    +   '</div>'
    + '</nav>'
    + '<div class="ed-mobile-menu" id="edMobileMenu" role="dialog" aria-modal="true" aria-label="Menu">'
    +   '<div class="ed-mobile-head">'
    +     '<span style="font-family:var(--ed-font-head);font-size:18px;font-weight:800;color:#fff;">E&amp;N</span>'
    +     '<button class="ed-mobile-close" id="edMobileClose" aria-label="Fechar menu">✕</button>'
    +   '</div>'
    +   '<nav>' + mobileLinks
    +     '<a href="#newsletter" id="edNlMobile">Newsletter</a>'
    +     '<a href="' + WA + '" target="_blank" rel="noopener" style="color:#25D366;">✍️ Publique seu artigo</a>'
    +   '</nav>'
    + '</div>';
  }

  function buildFooter() {
    function col(title, items) {
      var lis = items.map(function (it) {
        var href = it[1].charAt(0) === '#' || it[1].indexOf('http') === 0 ? it[1] : P + it[1];
        return '<li><a href="' + href + '">' + it[0] + '</a></li>';
      }).join('');
      return '<div class="ed-footer-col"><h4>' + title + '</h4><ul>' + lis + '</ul></div>';
    }
    return ''
    + '<footer class="ed-footer"><div class="ed-footer-inner">'
    +   '<div class="ed-footer-cta">'
    +     '<div><h3>Quer publicar seu artigo no FN?</h3>'
    +       '<p>Compartilhe sua análise ou notícia com milhares de leitores de negócios.</p></div>'
    +     '<a href="' + WA + '" target="_blank" rel="noopener" class="ed-publish">✍️ Publique seu artigo</a>'
    +   '</div>'
    +   '<div class="ed-footer-grid">'
    +     '<div class="ed-footer-brand">'
    +       '<div class="ed-footer-brand-name">Empresas &amp; Négocios</div>'
    +       '<p>O portal de referência em notícias sobre negócios, economia, inovação e empreendedorismo para o Brasil e o mundo.</p>'
    +       '<div class="ed-footer-social"><a href="#" aria-label="LinkedIn">in</a><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="Twitter">𝕏</a><a href="#" aria-label="YouTube">yt</a></div>'
    +     '</div>'
    +     col('Editorias', [['Novidades','novidades.html'],['Startups','startups.html'],['Tecnologia','tecnologia.html'],['Serviços','servicos.html'],['Indústrias','industrias.html'],['Saúde','saude.html']])
    +     col('Mais', [['Sociedade','sociedade.html'],['Cultura','cultura.html'],['Brasil','brasil.html'],['Mundo','mundo.html'],['Futebol','futebol.html'],['Esportes','esportes.html']])
    +     col('Institucional', [['Sobre nós','#'],['Anuncie','#'],['Contato','#'],['Privacidade','#'],['Termos de Uso','#']])
    +   '</div>'
    +   '<div class="ed-footer-bottom">'
    +     '<span>© 2026 Empresas &amp; Négocios. Todos os direitos reservados.</span>'
    +     '<div class="ed-footer-bottom-links"><a href="#">Privacidade</a><a href="#">Termos</a><a href="#">Cookies</a></div>'
    +   '</div>'
    + '</div></footer>';
  }

  function attachBehaviors() {
    var ham   = document.getElementById('edHamburger');
    var menu  = document.getElementById('edMobileMenu');
    var close = document.getElementById('edMobileClose');
    var nlM   = document.getElementById('edNlMobile');
    function open()  { menu.classList.add('open'); document.body.classList.add('menu-open'); document.body.style.overflow = 'hidden'; }
    function shut()  { menu.classList.remove('open'); document.body.classList.remove('menu-open'); document.body.style.overflow = ''; }
    if (ham)   ham.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    if (nlM)   nlM.addEventListener('click', shut);
  }

  function init() {
    // Remove o chrome antigo (se existir nesta página)
    ['.ticker-bar', 'header.site-header', 'nav.site-nav', 'footer.site-footer'].forEach(function (sel) {
      var node = document.querySelector(sel);
      if (node) node.parentNode.removeChild(node);
    });

    // Injeta o novo cabeçalho no início do body
    var headerHost = document.getElementById('site-header');
    if (headerHost) {
      headerHost.outerHTML = buildTicker() + buildHeader();
    } else {
      document.body.insertAdjacentHTML('afterbegin', buildTicker() + buildHeader());
    }

    // Injeta o novo rodapé (placeholder ou antes do </body>)
    var footerHost = document.getElementById('site-footer');
    if (footerHost) {
      footerHost.outerHTML = buildFooter();
    } else {
      document.body.insertAdjacentHTML('beforeend', buildFooter());
    }

    attachBehaviors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
