# Návrh jednotného systému veľkostí fontov

## Navrhovaný systém (všetko v rem):

### 1. NADPISY (Headings)

#### Hero Title (H1 - hlavná stránka)
- Desktop: **3rem** (48px)
- Tablet: **2.5rem** (40px)
- Mobile: **2rem** (32px)

#### Subpage Hero Title (H1 - podstránky)
- Desktop: **3rem** (48px)
- Tablet: **2.5rem** (40px)
- Mobile: **2rem** (32px)

#### Section Title (H2)
- Desktop: **2.5rem** (40px)
- Tablet: **2rem** (32px)
- Mobile: **1.75rem** (28px)

#### Card Title (H3)
- Desktop: **1.5rem** (24px)
- Tablet: **1.3rem** (20.8px)
- Mobile: **1.2rem** (19.2px)

#### Small Heading (H4)
- Všetky: **1.3rem** (20.8px)

---

### 2. PODNADPISY (Subtitles)

#### Hero Subtitle
- Desktop: **1.3rem** (20.8px)
- Mobile: **1.1rem** (17.6px)

#### Section Subtitle
- Desktop: **1.2rem** (19.2px)
- Mobile: **1rem** (16px)

---

### 3. TEXT (Body Text)

#### Body Text (normálny)
- Desktop: **1.1rem** (17.6px)
- Mobile: **1rem** (16px)

#### Small Text
- Desktop: **0.9rem** (14.4px)
- Mobile: **0.85rem** (13.6px)

---

### 4. ŠPECIÁLNE ELEMENTY

#### Buttons
- Všetky: **1.1rem** (17.6px)

#### Navigation Links
- Desktop: **1.2rem** (19.2px)
- Mobile: **1.1rem** (17.6px)

#### Form Inputs
- Všetky: **1rem** (16px)

#### Footer Text
- Všetky: **1rem** (16px)

#### Footer Links
- Všetky: **0.9rem** (14.4px)

#### Language Switcher / Theme Switcher
- Všetky: **0.9rem** (14.4px)

---

## CSS Premenné (navrhované):

```css
:root {
    /* Headings */
    --font-size-hero-title: 3rem;
    --font-size-hero-title-tablet: 2.5rem;
    --font-size-hero-title-mobile: 2rem;
    
    --font-size-section-title: 2.5rem;
    --font-size-section-title-tablet: 2rem;
    --font-size-section-title-mobile: 1.75rem;
    
    --font-size-card-title: 1.5rem;
    --font-size-card-title-tablet: 1.3rem;
    --font-size-card-title-mobile: 1.2rem;
    
    --font-size-small-heading: 1.3rem;
    
    /* Subtitles */
    --font-size-hero-subtitle: 1.3rem;
    --font-size-hero-subtitle-mobile: 1.1rem;
    
    --font-size-section-subtitle: 1.2rem;
    --font-size-section-subtitle-mobile: 1rem;
    
    /* Body Text */
    --font-size-body: 1.1rem;
    --font-size-body-mobile: 1rem;
    
    --font-size-small: 0.9rem;
    --font-size-small-mobile: 0.85rem;
    
    /* Special Elements */
    --font-size-button: 1.1rem;
    --font-size-nav-link: 1.2rem;
    --font-size-nav-link-mobile: 1.1rem;
    --font-size-form-input: 1rem;
    --font-size-footer: 1rem;
    --font-size-footer-link: 0.9rem;
    --font-size-ui-small: 0.9rem;
}
```

---

## Výhody tohto systému:

1. **Konzistentnosť**: Všetky veľkosti sú v rem jednotkách
2. **Škálovateľnosť**: Respektuje používateľské nastavenia prehliadača
3. **Jednoduchosť**: Jasné kategórie (nadpisy, podnadpisy, text, špeciálne)
4. **Údržba**: CSS premenné umožňujú jednoduchú zmenu
5. **Responsive**: Každá kategória má svoje responsive varianty

---

## Špeciálne prípady (px - len ak je to nevyhnutné):

- **Lightbox buttons**: 2.5rem (40px ekvivalent) - možno zmeniť na rem
- **Donut chart**: 1.25rem - 0.75rem (20px - 12px ekvivalent) - možno zmeniť na rem

---

## Odporúčanie:

1. Všetky px jednotky premeniť na rem (okrem úplne špeciálnych prípadov)
2. Použiť CSS premenné pre všetky veľkosti fontov
3. Zachovať responsive breakpointy (1024px, 768px, 480px)
4. Zjednotiť všetky podobné elementy na rovnaké veľkosti

