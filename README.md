# DroneEye - Web Aplikácia

Moderná webová aplikácia s Three.js animovaným dronom a responzívnym dizajnom, postavená na Vite. Profesionálne drone služby s interaktívnou 3D animáciou.

## Funkcie

- 🎨 **Three.js Animácie** - Interaktívny 3D dron s tromi scénami (Vesmír, Oblaky, Voda)
- 🌍 **Viacjazyčnosť** - Podpora pre SK, EN, DE (i18n)
- 📱 **Responzívny dizajn** - Optimalizované pre všetky zariadenia
- 🧭 **Smooth navigácia** - Plynulé prepínanie medzi stránkami
- ✨ **Moderný UI/UX** - Glassmorphism dizajn s animáciami
- 📧 **Kontaktný formulár** - Funkčný formulár s EmailJS validáciou
- 🍪 **Cookies** - GDPR súhlas s cookies
- ⚡ **Vite Build Tool** - Rýchly development a optimalizovaný build
- 🔍 **SEO Optimalizácia** - Sitemap, structured data, hreflang tagy

## Štruktúra projektu

```
droneye/
├── index.html              # Hlavná HTML stránka s 3D animáciou
├── sluzby.html             # Stránka služieb
├── projekty.html           # Galéria projektov
├── tim.html                # Stránka tímu
├── cenova-ponuka.html      # Cenová ponuka
├── kontakt.html            # Kontaktný formulár
├── legislativa.html        # Legislatíva
├── gdpr.html               # GDPR politika
├── src/
│   ├── animation.js        # Three.js animácia dronu (3 scény)
│   ├── main.js             # Hlavná JavaScript funkcionalita
│   ├── i18n.js             # Internacionalizácia (SK/EN/DE)
│   ├── contact-form.js     # Kontaktný formulár
│   ├── cookies.js          # Cookies súhlas
│   ├── style.css           # CSS štýly
│   └── locales/            # Preklady
│       ├── sk.json
│       ├── en.json
│       └── de.json
├── public/                 # Statické súbory
│   ├── Drone.glb           # 3D model dronu
│   ├── cloud1.png          # Textúra oblakov
│   ├── cloud2.png          # Textúra oblakov
│   └── favicon.ico
├── assets/                 # Obrázky a zdroje
├── sitemap.xml             # SEO sitemap
├── robots.txt              # SEO robots
├── package.json            # NPM dependencies
├── vite.config.js          # Vite konfigurácia
└── README.md               # Dokumentácia
```

## Technológie

- **Vite** - Moderný build tool a dev server
- **HTML5** - Sémantická štruktúra
- **CSS3** - Moderné štýly s flexbox/grid, CSS premenné
- **JavaScript ES6+** - ES modules s Three.js
- **Three.js** - 3D grafika, animácie, GLTF loader, Water shader
- **i18n** - Vlastná internacionalizácia (SK/EN/DE)
- **EmailJS** - Kontaktný formulár
- **Web APIs** - Intersection Observer, RequestAnimationFrame, WebGL

## Spustenie

### Development

```bash
npm run dev
```

Aplikácia sa spustí na `http://localhost:5173` s hot reload.

### Production Build

```bash
npm run build
```

Vytvorí optimalizovaný build v `dist/` priečinku.

### Preview Production Build

```bash
npm run preview
```

Spustí preview production buildu.

## Funkcionality

### Navigácia

- Hlavné menu s 6 sekciami (Domov, Služby, Projekty, Kurzy, Cenová ponuka, Kontakt)
- Mobilné hamburger menu
- Prepínanie jazykov (SK/EN/DE)
- Smooth scrolling medzi sekciami

### Three.js Animácie (animation.js)

- **3D Dron Model** - GLTF model s animovanými vrtuľami
- **Tri scény**:
    - **SpaceScene** - Vesmír s hviezdami a aurorou
    - **SkyScene** - Obloha s oblakmi (Sprite clouds)
    - **WaterScene** - Voda s vlnami a oblakmi
- **Interaktívne scrollovanie** - Plynulé prepínanie medzi scénami
- **Vstupná animácia** - Dron doletí zľava pri kliknutí na "Explore"
- **Responzívne prispôsobenie** - Optimalizované pre mobilné zariadenia
- **Výkon** - Optimalizované cloud count pre mobilné zariadenia

### Internacionalizácia (i18n)

- Podpora pre 3 jazyky: SK, EN, DE
- Dynamické prepínanie jazykov
- Ukladanie preferencie do localStorage
- Preklady pre všetky stránky a komponenty

### UI Komponenty

- Glassmorphism karty s blur efektom
- Hover animácie a transitions
- Loading screen s animáciou
- Responzívny grid layout
- Photo gallery lightbox
- Cookie consent banner

## Prispôsobenie

### Zmena farieb dronu

Upravte farby v `src/animation.js`:

```javascript
const droneColors = {
    body: 0x002366, // Royal blue
    rotors: 0xff6600, // Orange
    details: 0xffffff // White
};
```

### Pridanie nových stránok

1. Vytvorte nový HTML súbor (napr. `nova-stranka.html`)
2. Pridajte do `vite.config.js` v `rollupOptions.input`
3. Aktualizujte navigáciu v `index.html` a ostatných stránkach
4. Pridajte preklady do `src/locales/*.json`
5. Aktualizujte `sitemap.xml`

### Three.js úpravy

Upravte parametre v `src/animation.js`:

- **Scény**: `SpaceScene`, `SkyScene`, `WaterScene` triedy
- **Dron**: `loadDroneModel()`, `droneColors`, `rotorSpinSpeed`
- **Animácie**: `animate()` funkcia, `entranceAnimationDuration`
- **Clouds**: `CLOUD_COUNT`, cloud positioning, opacity
- **Aurora**: Farba a intenzita v `SpaceScene.createAuroraTunnel()`

### Pridanie nového jazyka

1. Vytvorte `src/locales/novy-jazyk.json`
2. Skopírujte štruktúru z `sk.json` a preložte
3. Pridajte jazyk do `src/i18n.js`
4. Pridajte prepínač jazyka do HTML súborov
5. Aktualizujte hreflang tagy v HTML a sitemap.xml

## Browser podpora

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Optimalizácia

- **Lazy loading** pre obrázky (`loading="lazy"`)
- **RequestAnimationFrame** pre smooth animácie
- **CSS transforms** namiesto position changes
- **Minimalizované DOM manipulácie**
- **Redukovaný počet oblakov** na mobilných zariadeniach (150 namiesto 300)
- **Sprite clouds** namiesto 3D meshov pre lepší výkon
- **Distance-based opacity** pre oblaky (fade in z diaľky)
- **Vite build** s optimalizáciou a minifikáciou

## Licencia

MIT License - voľné použitie pre komerčné aj nekomerčné účely.
