# si187 Apps — Project Context for Claude Code

This file is read automatically by Claude Code at the start of every session.
It contains everything CC needs to work on this repo without being briefed each time.

---

## Repository

- **Repo:** github.com/si187apps/si187apps.github.io
- **Hosting:** GitHub Pages, deployed via GitHub Actions on push to main
- **Live site:** https://si187apps.com
- **Branch strategy:** Always work on a feature branch. Open a PR. Do not push directly to main. Wait for approval before merging.

---

## Site structure

```
si187apps.github.io/
├── index.html                     studio homepage
├── about/index.html
├── roadmap/index.html
├── manifesto/index.html
├── labs/index.html
├── fpl-coach-ai/
│   ├── index.html                 FPL Coach AI product landing page
│   └── help/index.html            FPL Coach AI help & FAQ
├── privacy/index.html
├── terms/index.html
├── assets/
│   ├── css/site.css               shared stylesheet (studio pages only)
│   ├── js/site.js                 shared scripts (studio pages only)
│   ├── js/cookie-banner.js        GDPR consent + GA4 loader (all pages)
│   └── images/
│       ├── og-card.png            studio OG card 1200×630
│       └── og-fpl.png             FPL Coach AI OG card 1200×630
├── sitemap.xml
├── robots.txt
└── CNAME                          contains: si187apps.com
```

**Help page pattern for future apps:**
`/[app-name]/help/index.html` — self-contained CSS, app palette, minimal nav

---

## Design system

### Studio palette (homepage, about, roadmap, manifesto, labs, privacy, terms)
```css
--bg:        #050E05   /* deep forest background */
--bg-card:   #091409
--bg-border: #142014
--green:     #39FF7A   /* plasma green — primary CTA, headings */
--magenta:   #C084C8   /* signal magenta — secondary text, accents */
--text1:     #F0F5F0   /* near-white body */
--text2:     #8AAA8A   /* muted */
```

### FPL Coach AI palette (fpl-coach-ai/* pages)
```css
--navy:  #0A1628   /* background */
--teal:  #00D4A0   /* primary accent */
--amber: #FFB800   /* highlight / chip strategy */
--text:  #f0f5f0
--text2: #9ca3af
```

### Typography
| Role | Font | Weight |
|------|------|--------|
| Display / headings | Syne | 700, 800 |
| Body | Inter | 400, 500, 600 |
| Data / mono / labels | JetBrains Mono | 400, 700 |

Google Fonts import used on all pages:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Brand mark
The fingerprint SVG mark is defined inline across all pages. Green outer rings, magenta inner ring, green centre dot. Do not replace with a different mark.

---

## Shared rules — apply to every file you touch

1. **Contact email:** always `studio@si187apps.com` — never `si@si187apps.com` or any other variant
2. **Cookie banner:** every page must load `/assets/js/cookie-banner.js` before `</body>`
3. **Skip link:** every page must have a skip-to-content link as the first child of `<body>`
4. **Footer contrast:** muted footer text uses `var(--magenta)` at reduced opacity — never `var(--bg-border)` or `--text3` (#3A5A3A), which is invisible on dark backgrounds
5. **Footer legal links:** every footer must include Privacy, Terms, and Cookie preferences links
6. **site.css:** used by studio pages (homepage, about, roadmap, manifesto, labs, privacy, terms) — NOT by fpl-coach-ai pages, which have their own self-contained CSS
7. **Sitemap:** add any new page to `sitemap.xml` with correct `<lastmod>` date
8. **No direct push to main:** always branch → PR → await approval

---

## Integrations

| Service | Purpose | Key detail |
|---------|---------|------------|
| Formspree `xwvynpjr` | Homepage + FPL Coach AI waitlist | Submits to studio@si187apps.com |
| Formspree `xrejabvo` | Labs sign-up | Submits to studio@si187apps.com |
| Google Analytics | GA4 measurement | ID: `G-MWTWGLJL48` — loaded by cookie-banner.js after consent only |
| Cloudflare | DNS, SSL, email routing | All `*@si187apps.com` routes to Gmail |

---

## Studio information

- **Legal entity:** si187 Enterprises Ltd (London, UK)
- **Trading name:** si187 Apps
- **Social handles:** @si187apps on X, Instagram, TikTok
- **Tagline:** "Apps worth using."
- **First product:** FPL Coach AI — iOS, launching GW1 2026/27 season (August 2026)
- **Positioning:** Independent mobile studio. Bootstrapped. No VC. One app at a time.

---

## Commit message convention

Use this format:
```
Short description of what changed (imperative, under 72 chars)

- Bullet detail 1
- Bullet detail 2
- Bullet detail 3
```

Example:
```
Add FPL Coach AI help page and wire into landing page

- Create /fpl-coach-ai/help with FAQ, Manager ID guide, and meta tags
- Add Help & FAQ link to FPL landing page footer nav
- Update sitemap.xml with new URL entry
```

---

## When in doubt

- Check existing pages for patterns before inventing new ones
- Match the palette of the section you're working in (studio vs FPL)
- If a task would require pushing to main directly, stop and open a PR instead
- If something is ambiguous, make a decision and note it in the PR description
