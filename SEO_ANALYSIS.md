# SEO Analýza - DroneEye

## ✅ Už implementované SEO praktiky

### 1. Základné Meta Tagy
- ✅ Title tagy na každej stránke
- ✅ Meta description na každej stránke
- ✅ Meta keywords (menej dôležité, ale je tam)
- ✅ Meta robots (index, follow)
- ✅ Meta author
- ✅ Meta language
- ✅ Meta revisit-after

### 2. Open Graph & Social Media
- ✅ Open Graph tagy (og:type, og:url, og:title, og:description, og:image, og:site_name, og:locale)
- ✅ Twitter Cards (twitter:card, twitter:url, twitter:title, twitter:description, twitter:image)

### 3. Technické SEO
- ✅ Canonical URLs na každej stránke
- ✅ robots.txt súbor
- ✅ sitemap.xml súbor
- ✅ Favicon (ico, png, apple-touch-icon)
- ✅ Viewport meta tag
- ✅ UTF-8 charset

### 4. Geo Tagy
- ✅ Geo tagy na sluzby.html (geo.region, geo.placename, geo.position, ICBM)

### 5. HTML Štruktúra
- ✅ H1 tag na homepage
- ✅ Semantic HTML (nav, section, footer)
- ✅ Lang atribút na HTML elemente

### 6. Obrázky
- ✅ Alt texty na väčšine obrázkov
- ✅ Loading="lazy" na obrázkoch

---

## ⚠️ Problémy a nedostatky

### 1. Sitemap.xml
- ❌ **PROBLÉM**: URL v sitemap.xml neodpovedajú skutočným URL
  - Má: `services.html`, `projects.html`, `team.html`, `pricing.html`, `contact.html`
  - Skutočné: `sluzby`, `projekty`, `tim`, `cenova-ponuka`, `kontakt`
- ❌ **PROBLÉM**: Dátum `lastmod` je zastaralý (2024-01-01)
- ❌ **PROBLÉM**: Chýba `dronetext.html` v sitemape

### 2. Structured Data (JSON-LD)
- ❌ **CHÝBA**: Žiadne structured data (JSON-LD) schémy
  - Chýba: LocalBusiness/Organization
  - Chýba: Service
  - Chýba: BreadcrumbList
  - Chýba: FAQPage (ak majú FAQ)
  - Chýba: Review/Rating (ak majú recenzie)

### 3. Hreflang Tagy
- ❌ **CHÝBA**: Chýbajú hreflang tagy pre viacjazyčné stránky (SK/EN)
  - Potrebné pre správne indexovanie oboch jazykov

### 4. Alt Texty
- ⚠️ **ČIATOČNÉ**: Nie všetky obrázky majú alt texty
  - Obrázky dronov majú alt texty ✓
  - Social media ikony majú alt texty ✓
  - Logo má alt text ✓
  - Ale môžu chýbať na ďalších obrázkoch

### 5. Heading Hierarchy
- ⚠️ **POTREBNÉ SKONTROLOVAŤ**: 
  - H1 by mal byť len jeden na stránke
  - H2-H6 by mali mať správnu hierarchiu

### 6. Performance
- ⚠️ **POTREBNÉ SKONTROLOVAŤ**:
  - Preload kritických zdrojov
  - Lazy loading (už je na obrázkoch ✓)
  - Minifikácia CSS/JS
  - Kompresia obrázkov

### 7. Mobile SEO
- ✅ Viewport je nastavený
- ⚠️ **POTREBNÉ SKONTROLOVAŤ**: Mobile-friendly test

### 8. Interné odkazy
- ⚠️ **POTREBNÉ SKONTROLOVAŤ**: 
  - Breadcrumbs (pre lepšiu navigáciu a SEO)
  - Interné odkazy medzi stránkami

---

## 🚀 Odporúčania pre zlepšenie SEO

### Priorita 1 (Vysoká) - Okamžite implementovať

1. **Opraviť sitemap.xml**
   - Aktualizovať URL na skutočné
   - Aktualizovať lastmod dátumy
   - Pridať všetky stránky

2. **Pridať Structured Data (JSON-LD)**
   - LocalBusiness schéma na homepage
   - Service schéma na sluzby.html
   - Organization schéma
   - BreadcrumbList na všetkých podstránkach

3. **Pridať hreflang tagy**
   - Pre SK a EN verzie stránok

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

- [ ] Opraviť sitemap.xml (URL, dátumy, všetky stránky)
- [ ] Pridať LocalBusiness JSON-LD na homepage
- [ ] Pridať Service JSON-LD na sluzby.html
- [ ] Pridať Organization JSON-LD
- [ ] Pridať BreadcrumbList JSON-LD
- [ ] Pridať hreflang tagy pre SK/EN
- [ ] Skontrolovať a doplniť alt texty
- [ ] Skontrolovať heading hierarchy
- [ ] Pridať breadcrumbs HTML
- [ ] Optimalizovať performance
- [ ] Pridať interné odkazy

