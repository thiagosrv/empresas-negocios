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
