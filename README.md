# DroneEye - Web Aplikácia

Moderná webová aplikácia s Three.js animovaným canvasom a responzívnym dizajnom, postavená na Vite.

## Funkcie

- 🎨 **Three.js Animácie** - Interaktívny 3D particle systém
- 📱 **Responzívny dizajn** - Optimalizované pre všetky zariadenia
- 🧭 **Smooth navigácia** - Plynulé prepínanie medzi stránkami
- ✨ **Moderný UI/UX** - Glassmorphism dizajn s animáciami
- 📧 **Kontaktný formulár** - Funkčný formulár s validáciou
- ⚡ **Vite Build Tool** - Rýchly development a optimalizovaný build

## Štruktúra projektu

```
droneye/
├── index.html              # Hlavná HTML stránka
├── src/
│   ├── main.js            # JavaScript funkcionalita (ES modules)
│   └── style.css           # CSS štýly
├── package.json           # NPM dependencies
├── vite.config.js         # Vite konfigurácia
└── README.md              # Dokumentácia
```

## Technológie

- **Vite** - Moderný build tool a dev server
- **HTML5** - Sémantická štruktúra
- **CSS3** - Moderné štýly s flexbox/grid
- **JavaScript ES6+** - ES modules s Three.js
- **Three.js** - 3D grafika a animácie
- **Web APIs** - Intersection Observer, RequestAnimationFrame

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
- Hlavné menu s 4 sekciami (Domov, O nás, Služby, Kontakt)
- Mobilné hamburger menu
- Smooth scrolling medzi sekciami

### Three.js Animácie
- 2000 animovaných častíc
- Interaktívne ovládanie myšou
- Responzívne prispôsobenie veľkosti okna
- Optimalizované pre výkon

### UI Komponenty
- Glassmorphism karty s blur efektom
- Hover animácie a transitions
- Loading screen s animáciou
- Responzívny grid layout

## Prispôsobenie

### Zmena farieb
Upravte CSS premenné v `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### Pridanie nových stránok
1. Pridajte novú sekciu do HTML
2. Aktualizujte navigáciu
3. Pridajte JavaScript handler

### Three.js úpravy
Upravte parametre v `script.js`:
- `particleCount` - počet častíc
- `material.size` - veľkosť častíc
- Animácie v `animate()` funkcii

## Browser podpora

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Optimalizácia

- Lazy loading pre obrázky
- RequestAnimationFrame pre smooth animácie
- CSS transforms namiesto position changes
- Minimalizované DOM manipulácie

## Licencia

MIT License - voľné použitie pre komerčné aj nekomerčné účely.
