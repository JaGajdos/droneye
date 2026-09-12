# DroneEye — webová prezentácia

Marketingový web firmy DroneEye (drone služby, projekty, kurzy, tím). Multi-page statický web na **Vite**, s WebGL intro na homepage, i18n (SK/EN/DE), Contentful sync pre projekty, EmailJS formulármi a cookie bannerom.

Produkčný base path: `/droneye/` (GitHub Pages). Doména: [droneye.sk](https://www.droneye.sk/).

## Stránky

| URL | Súbor | Popis |
|-----|--------|--------|
| `/` | `index.html` | Homepage + 3D scroll intro |
| `/sluzby` | `sluzby.html` | Služby |
| `/projekty` | `projekty.html` | Galéria (YouTube + fotky z Contentful) |
| `/kurzy` | `kurzy.html` | Kurzy / legislatívne konzultácie |
| `/tim` | `tim.html` | Tím |
| `/cenova-ponuka` | `cenova-ponuka.html` | Cenová ponuka |
| `/kontakt` | `kontakt.html` | Kontaktný formulár |
| `/legislativa` | `legislativa.html` | Legislatíva |
| `/gdpr` | `gdpr.html` | GDPR |

## Štruktúra

```
droneye/
├── index.html, sluzby.html, projekty.html, kurzy.html, tim.html, …
├── src/
│   ├── main.js              # Navigácia, UI, init stránok
│   ├── i18n.js              # SK / EN / DE
│   ├── contact-form.js      # EmailJS formuláre
│   ├── cookies.js           # Cookie consent + YouTube po súhlase
│   ├── projects.js          # Načítanie Contentful JSON
│   ├── style.css
│   ├── locales/             # sk.json, en.json, de.json
│   └── partials/            # footer.html, cookie-banner.html
├── public/
│   ├── droneye/
│   │   ├── three.min.js     # Three.js r128 (legacy global)
│   │   ├── droneye-inline.js# 3D intro scéna (homepage)
│   │   └── models/          # GLB model adapters
│   ├── DroneModel.glb, Drone2.glb, cloud*.png, favicon.*
├── assets/                  # Logo, ikony, Contentful JSON/obrázky, Font Awesome
├── sync-contentful.php      # Sync z Contentful CMS
├── vite.config.js
└── package.json
```

## Technológie

- **Vite** — build + dev server
- **Three.js (legacy)** — homepage WebGL cez `public/droneye/three.min.js` + CDN `GLTFLoader` (r128). **Nie** cez npm `three` / ES modules.
- **EmailJS** — kontaktné formuláre
- **Contentful** — videá a fotky → `assets/contentful/*.json` (PHP sync / GitHub Actions)
- **i18n** — vlastné JSON locale súbory
- **Font Awesome** — lokálne v `assets/fontawesome/` (nie npm balík)

## Spustenie

```bash
npm install
npm run dev      # http://localhost:5173 (base /droneye/)
npm run build    # výstup do dist/
npm run preview
npm run deploy   # build + gh-pages
```

### Contentful sync

```bash
composer install          # ak treba PHP závislosti
php sync-contentful.php   # alebo: composer sync
```

Automaticky: GitHub Action `.github/workflows/sync-contentful.yml` (denne + manuálne). Detaily: `CONTENTFUL_SYNC.md`.

## Homepage 3D intro

1. Hero s CTA **Preskúmať** (`#start-animation-btn`)
2. Po kliknutí sa odomkne scroll stage (`#intro-scroll-stage`)
3. Animáciu riadi `public/droneye/droneye-inline.js` (canvas `#webgl`)
4. Texty krokov sú v `src/locales/*.json` pod kľúčom `animation.*`
5. Aplikácia (nav, i18n, cookies) beží samostatne cez `src/main.js`

**Pozor:** nemeniť verziu Three / GLTFLoader bez otestovania intro — skripty sú viazané na r128 global `THREE`.

## Navigácia a i18n

Menu: Domov → Služby → Projekty → **Kurzy** (`nav.courses`) → **Tím** (`nav.team`) → Cenová ponuka → Kontakt.

Preklady: `src/locales/{sk,en,de}.json`. Preferencia jazyka v `localStorage`.

## SEO

- `sitemap.xml` — všetky stránky vrátane `/kurzy` a `/tim`
- `robots.txt`
- Open Graph / Twitter: `assets/og-image.webp`, `assets/twitter-image.webp`
- Hreflang + structured data na stránkach
- Clean URL rewrite: `.htaccess`

## Pridanie novej stránky

1. Nový `*.html` + entry v `vite.config.js` → `build.rollupOptions.input`
2. Rewrite v `.htaccess`
3. Položka v navigácii na všetkých stránkach
4. Preklady v `src/locales/*.json`
5. Záznam v `sitemap.xml`

## Browser podpora

Chrome 60+, Firefox 55+, Safari 12+, Edge 79+ (WebGL pre homepage intro).
