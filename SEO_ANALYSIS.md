# SEO Analýza - DroneEye

## ✅ Už implementované SEO praktiky

### 1. Základné Meta Tagy

-   ✅ Title tagy na každej stránke
-   ✅ Meta description na každej stránke
-   ✅ Meta keywords (menej dôležité, ale je tam)
-   ✅ Meta robots (index, follow)
-   ✅ Meta author
-   ✅ Meta language
-   ✅ Meta revisit-after

### 2. Open Graph & Social Media

-   ✅ Open Graph tagy (og:type, og:url, og:title, og:description, og:image, og:site_name, og:locale)
-   ✅ Twitter Cards (twitter:card, twitter:url, twitter:title, twitter:description, twitter:image)

### 3. Technické SEO

-   ✅ Canonical URLs na každej stránke
-   ✅ robots.txt súbor
-   ✅ sitemap.xml súbor
-   ✅ Favicon (ico, png, apple-touch-icon)
-   ✅ Viewport meta tag
-   ✅ UTF-8 charset

### 4. Geo Tagy

-   ✅ Geo tagy na sluzby.html (geo.region, geo.placename, geo.position, ICBM)

### 5. HTML Štruktúra

-   ✅ H1 tag na homepage
-   ✅ Semantic HTML (nav, section, footer)
-   ✅ Lang atribút na HTML elemente

### 6. Obrázky

-   ✅ Alt texty na väčšine obrázkov
-   ✅ Loading="lazy" na obrázkoch

---

## ⚠️ Problémy a nedostatky

### 1. Sitemap.xml

-   ✅ **OPRAVENÉ**: URL v sitemap.xml teraz odpovedajú skutočným URL (`sluzby`, `projekty`, `tim`, `cenova-ponuka`, `kontakt`)
-   ✅ **OPRAVENÉ**: Dátum `lastmod` je aktualizovaný (2024-12-19)
-   ⚠️ **CHÝBA**: Chýbajú stránky v sitemap.xml:
    -   `legislativa.html`
    -   `gdpr.html`
-   ⚠️ **CHÝBA**: Hreflang tagy v sitemap.xml majú len SK a EN, chýba DE (aj keď v HTML sú všetky tri jazyky)

### 2. Structured Data (JSON-LD)

-   ✅ **ČIATOČNÉ**: Organization schéma je implementovaná na homepage
-   ⚠️ **CHÝBA**: Chýbajú ďalšie structured data schémy:
    -   Chýba: LocalBusiness (majú len Organization)
    -   Chýba: Service schéma na sluzby.html
    -   Chýba: BreadcrumbList na podstránkach
    -   Chýba: FAQPage (ak majú FAQ)
    -   Chýba: Review/Rating (ak majú recenzie)

### 3. Hreflang Tagy

-   ✅ **IMPLEMENTOVANÉ**: Hreflang tagy sú na homepage (SK/EN/DE)
-   ⚠️ **POTREBNÉ SKONTROLOVAŤ**: Hreflang tagy na ostatných stránkach (sluzby, projekty, tim, cenova-ponuka, kontakt, legislativa, gdpr)
-   ⚠️ **CHÝBA**: V sitemap.xml sú hreflang tagy len pre SK a EN, chýba DE

### 4. Alt Texty

-   ⚠️ **ČIATOČNÉ**: Nie všetky obrázky majú alt texty
    -   Obrázky dronov majú alt texty ✓
    -   Social media ikony majú alt texty ✓
    -   Logo má alt text ✓
    -   Ale môžu chýbať na ďalších obrázkoch

### 5. Heading Hierarchy

-   ⚠️ **POTREBNÉ SKONTROLOVAŤ**:
    -   H1 by mal byť len jeden na stránke
    -   H2-H6 by mali mať správnu hierarchiu

### 6. Performance

-   ⚠️ **POTREBNÉ SKONTROLOVAŤ**:
    -   Preload kritických zdrojov
    -   Lazy loading (už je na obrázkoch ✓)
    -   Minifikácia CSS/JS
    -   Kompresia obrázkov

### 7. Mobile SEO

-   ✅ Viewport je nastavený
-   ⚠️ **POTREBNÉ SKONTROLOVAŤ**: Mobile-friendly test

### 8. Interné odkazy

-   ⚠️ **POTREBNÉ SKONTROLOVAŤ**:
    -   Breadcrumbs (pre lepšiu navigáciu a SEO)
    -   Interné odkazy medzi stránkami

---

## 🚀 Odporúčania pre zlepšenie SEO

### Priorita 1 (Vysoká) - Okamžite implementovať

1. **Doplniť sitemap.xml**

    - ✅ URL sú správne
    - ✅ lastmod dátumy sú aktualizované
    - ⚠️ Pridať chýbajúce stránky: `legislativa`, `gdpr`
    - ⚠️ Pridať hreflang tagy pre DE do sitemap.xml

2. **Rozšíriť Structured Data (JSON-LD)**

    - ✅ Organization schéma už je na homepage
    - ⚠️ Pridať LocalBusiness schému na homepage (alebo rozšíriť Organization)
    - ⚠️ Pridať Service schému na sluzby.html
    - ⚠️ Pridať BreadcrumbList na všetkých podstránkach

3. **Skontrolovať a doplniť hreflang tagy**
    - ✅ Homepage má hreflang tagy (SK/EN/DE)
    - ⚠️ Skontrolovať hreflang tagy na ostatných stránkach
    - ⚠️ Pridať DE do hreflang tagov v sitemap.xml

### Priorita 2 (Stredná) - Implementovať čoskoro

4. **Breadcrumbs**

    - HTML breadcrumbs
    - BreadcrumbList structured data

5. **FAQ Structured Data**

    - Ak majú FAQ sekciu, pridať FAQPage schému

6. **Review/Rating Structured Data**

    - Ak majú recenzie, pridať Review schému

7. **Aktualizovať alt texty**
    - Skontrolovať všetky obrázky
    - Pridať deskriptívne alt texty

### Priorita 3 (Nízka) - Dobre mať

8. **Performance optimalizácia**

    - Preload kritických zdrojov
    - Minifikácia
    - Kompresia obrázkov

9. **Interné odkazy**

    - Pridať relevantné interné odkazy
    - Related content sekcie

10. **Schema.org rozšírenia**
    - VideoObject pre video obsah
    - ImageObject pre obrázky
    - Product pre služby (ak to dáva zmysel)

---

## 📋 Checklist pre implementáciu

-   [x] Opraviť sitemap.xml (URL, dátumy) - ✅ Hotovo
-   [ ] Doplniť chýbajúce stránky do sitemap.xml (legislativa, gdpr)
-   [ ] Pridať DE hreflang tagy do sitemap.xml
-   [x] Pridať Organization JSON-LD - ✅ Hotovo na homepage
-   [ ] Pridať LocalBusiness JSON-LD na homepage (alebo rozšíriť Organization)
-   [ ] Pridať Service JSON-LD na sluzby.html
-   [ ] Pridať BreadcrumbList JSON-LD na podstránkach
-   [x] Pridať hreflang tagy pre SK/EN/DE - ✅ Hotovo na homepage
-   [ ] Skontrolovať hreflang tagy na ostatných stránkach
-   [ ] Skontrolovať a doplniť alt texty
-   [ ] Skontrolovať heading hierarchy
-   [ ] Pridať breadcrumbs HTML
-   [ ] Optimalizovať performance
-   [ ] Pridať interné odkazy
