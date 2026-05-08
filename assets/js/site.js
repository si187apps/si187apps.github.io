/* ═════════════════════════════════════════════════════════════
   si187 Apps — Shared site JS
   Nav, mobile drawer with focus trap, scroll reveal, active link
   ═════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Nav scroll shrink ──────────────────────────────────────
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ── Mobile nav with focus trap ─────────────────────────────
  const mobileNav = document.getElementById('mobile-nav');
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const closeBtn  = document.getElementById('mobile-nav-close');
  let lastFocusedBeforeOpen = null;

  function getFocusableInDrawer() {
    if (!mobileNav) return [];
    return Array.from(mobileNav.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function openMobileNav() {
    if (!mobileNav) return;
    lastFocusedBeforeOpen = document.activeElement;
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const closeBtnEl = document.getElementById('mobile-nav-close');
      if (closeBtnEl) closeBtnEl.focus();
    });
  }

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedBeforeOpen && lastFocusedBeforeOpen.focus) {
      lastFocusedBeforeOpen.focus();
    }
  }
  window.closeMobileNav = closeMobileNav;

  if (toggleBtn) toggleBtn.addEventListener('click', openMobileNav);
  if (closeBtn)  closeBtn.addEventListener('click',  closeMobileNav);

  // Focus trap + ESC inside mobile nav
  document.addEventListener('keydown', (e) => {
    if (!mobileNav || !mobileNav.classList.contains('open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMobileNav();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = getFocusableInDrawer();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  // ── Scroll reveal ──────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.10 });
    revealEls.forEach(el => revealObs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ── Active nav link ────────────────────────────────────────
  const path = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (href && path === href) a.classList.add('active');
  });

})();
