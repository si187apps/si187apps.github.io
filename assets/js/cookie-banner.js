/* ═════════════════════════════════════════════════════════════
   si187 Apps — Cookie Banner & Consent Management
   GDPR/UK GDPR compliant. Gates Google Analytics 4 behind consent.

   How it works:
   - On first visit, shows banner asking for cookie consent
   - User can Accept or Decline
   - Choice stored in localStorage for 12 months
   - Only loads GA4 if user accepted
   - "Cookie preferences" footer link reopens the banner
   ═════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  const STORAGE_KEY      = 'si187_cookie_consent';
  const STORAGE_DATE_KEY = 'si187_cookie_consent_date';
  const CONSENT_VALID_DAYS = 365;

  // GA4 — si187 Apps measurement ID
  // Property: si187 Apps · Web stream: https://si187apps.com
  // Loaded ONLY after user accepts cookies (GDPR-compliant)
  const GA4_MEASUREMENT_ID = 'G-MWTWGLJL48';

  // ── Helpers ────────────────────────────────────────────────
  function getConsent() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      const d = localStorage.getItem(STORAGE_DATE_KEY);
      if (!v || !d) return null;
      const ageMs = Date.now() - parseInt(d, 10);
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays > CONSENT_VALID_DAYS) return null;
      return v; // 'accepted' or 'declined'
    } catch (e) { return null; }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(STORAGE_DATE_KEY, Date.now().toString());
    } catch (e) {}
  }

  // ── Google Analytics 4 loader ──────────────────────────────
  function loadGA4() {
    if (!GA4_MEASUREMENT_ID) {
      console.info('[si187] GA4 measurement ID not configured — skipping analytics load');
      return;
    }
    if (window.__ga4Loaded) return;
    window.__ga4Loaded = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=Strict;Secure'
    });
  }

  // ── Banner DOM ─────────────────────────────────────────────
  function buildBanner() {
    if (document.getElementById('si187-cookie-banner')) return;

    const wrap = document.createElement('div');
    wrap.id = 'si187-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'si187-cookie-title');
    wrap.setAttribute('aria-describedby', 'si187-cookie-desc');
    wrap.innerHTML = `
      <div class="si187-cb-inner">
        <div class="si187-cb-text">
          <p id="si187-cookie-title" class="si187-cb-title">Cookies, briefly.</p>
          <p id="si187-cookie-desc" class="si187-cb-desc">
            We use a small number of cookies to understand how the site is used so we can improve it.
            Strictly necessary cookies are always on. Analytics cookies are optional.
            <a href="/privacy" class="si187-cb-link">Read our privacy policy</a>.
          </p>
        </div>
        <div class="si187-cb-actions">
          <button type="button" class="si187-cb-btn si187-cb-btn-decline" id="si187-cb-decline">Decline analytics</button>
          <button type="button" class="si187-cb-btn si187-cb-btn-accept" id="si187-cb-accept">Accept all</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById('si187-cb-accept').addEventListener('click', function() {
      setConsent('accepted');
      loadGA4();
      hideBanner();
    });
    document.getElementById('si187-cb-decline').addEventListener('click', function() {
      setConsent('declined');
      hideBanner();
    });

    // Slide in
    requestAnimationFrame(() => wrap.classList.add('visible'));
  }

  function hideBanner() {
    const wrap = document.getElementById('si187-cookie-banner');
    if (!wrap) return;
    wrap.classList.remove('visible');
    setTimeout(() => wrap.remove(), 300);
  }

  // ── Public API: reopen via footer link ─────────────────────
  window.si187CookiePrefs = function() {
    // Clear stored choice so banner reappears
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATE_KEY);
    } catch (e) {}
    buildBanner();
  };

  // ── Initialise on load ─────────────────────────────────────
  function init() {
    const consent = getConsent();
    if (consent === 'accepted') {
      loadGA4();
    } else if (consent === null) {
      // First visit or expired consent — show banner
      buildBanner();
    }
    // If 'declined', do nothing — respect choice silently
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
