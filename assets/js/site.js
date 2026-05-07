/* si187 Apps — Shared site JS */

// Nav scroll shrink
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// Mobile nav
const mobileNav = document.getElementById('mobile-nav');
const toggleBtn  = document.getElementById('nav-toggle-btn');
const closeBtn   = document.getElementById('mobile-nav-close');

function openMobileNav()  { if (mobileNav) { mobileNav.classList.add('open');    document.body.style.overflow = 'hidden'; } }
function closeMobileNav() { if (mobileNav) { mobileNav.classList.remove('open'); document.body.style.overflow = '';       } }

if (toggleBtn) toggleBtn.addEventListener('click', openMobileNav);
if (closeBtn)  closeBtn.addEventListener('click',  closeMobileNav);

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.10 });
revealEls.forEach(el => revealObs.observe(el));

// Mark active nav link
const path = window.location.pathname.replace(/\/$/, '');
document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
  const href = a.getAttribute('href').replace(/\/$/, '');
  if (href && path.endsWith(href)) a.classList.add('active');
});
