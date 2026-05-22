// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');

if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    mainNav.classList.toggle('nav-mobile-open');
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(s => s.style.opacity = mainNav.classList.contains('nav-mobile-open') ? '.5' : '1');
  });
}

// ===== ACTIVE NAV LINK =====
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    a.classList.toggle('active', href === path);
  });
})();

// ===== NEWSLETTER =====
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  if (!input.value) return;
  showToast('✅', 'Inscrição realizada! Verifique seu e-mail.');
  input.value = '';
}

// ===== TOAST =====
function showToast(icon, msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = toast.querySelector('.toast-icon');
  if (!toast) return;
  toastMsg.textContent = msg;
  toastIcon.textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== BACK TO TOP =====
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== READING PROGRESS =====
const progressBar = document.getElementById('readingProgress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    progressBar.style.width = pct + '%';
  });
}

// ===== TICKER =====
(function () {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  // Duplica para loop contínuo
  track.innerHTML += track.innerHTML;
})();

// ===== LAZY IMAGE FALLBACK =====
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', function () {
    this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23e8e8e8" width="400" height="200"/><text fill="%23999" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".35em">Imagem indisponível</text></svg>';
    this.alt = 'Imagem indisponível';
  });
});

// ===== WHATSAPP FLUTUANTE =====
(function () {
  // Páginas e palavras-chave relacionadas a facilities/portaria → número comercial especializado
  var facilitiesPages = [
    'servicos.html', 'campinas.html', 'guia-seguranca-americana.html',
    'portaria', 'facilities', 'controle-acesso', 'terceirizacao'
  ];
  var path = window.location.pathname + window.location.href;
  var isFacilities = facilitiesPages.some(function (kw) { return path.indexOf(kw) !== -1; });

  var number  = isFacilities ? '5519978210246' : '5519999115496';
  var message = isFacilities
    ? 'Olá! Vi o site Empresas & Negócios e gostaria de saber mais sobre portaria e facilities para minha empresa.'
    : 'Olá! Vim pelo site Empresas & Negócios e gostaria de mais informações.';

  var btn = document.createElement('a');
  btn.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', 'Fale conosco pelo WhatsApp');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.524 5.823L.057 23.428a.75.75 0 0 0 .915.915l5.605-1.467A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.71 9.71 0 0 1-4.953-1.355l-.355-.211-3.676.963.98-3.579-.232-.368A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>';

  btn.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
    'background:#25D366', 'color:#fff', 'width:56px', 'height:56px',
    'border-radius:50%', 'display:flex', 'align-items:center', 'justify-content:center',
    'box-shadow:0 4px 16px rgba(37,211,102,0.45)', 'text-decoration:none',
    'transition:transform .2s, box-shadow .2s', 'cursor:pointer'
  ].join(';');

  btn.addEventListener('mouseenter', function () {
    this.style.transform = 'scale(1.1)';
    this.style.boxShadow = '0 6px 24px rgba(37,211,102,0.6)';
  });
  btn.addEventListener('mouseleave', function () {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 16px rgba(37,211,102,0.45)';
  });

  document.body.appendChild(btn);
})();
