# Contentful Synchronization

Tento dokument popisuje, ako synchronizovať obsah z Contentful CMS do projektu.

## Požiadavky

- PHP 7.4 alebo vyššie
- Composer (PHP dependency manager)

## Inštalácia

1. Nainštalujte PHP závislosti pomocou Composer:
```bash
composer install
```

2. Skontrolujte, že máte správne Contentful API credentials v `sync-contentful.php`:
   - `SPACE_ID`: ID vášho Contentful space
   - `ACCESS_TOKEN`: Váš Contentful Delivery API token
   - `ENVIRONMENT`: Environment (zvyčajne 'master')

## Použitie

### Lokálne testovanie (localhost)

#### 1. Inštalácia závislostí
```bash
composer install
```

#### 2. Spustenie cez CLI (najjednoduchšie)
```bash
php sync-contentful.php
```

Alebo pomocou Composer:
```bash
composer sync
```

#### 3. Spustenie cez web (localhost)

**Možnosť A: PHP Built-in Server**
```bash
# Spustite PHP server v root adresári projektu
php -S localhost:8000

# Potom otvorte v prehliadači:
# http://localhost:8000/sync-contentful-web.php?token=your-secret-token
```

**Možnosť B: XAMPP/WAMP/MAMP**
- Nahrajte súbory do `htdocs` (XAMPP) alebo `www` (WAMP)
- Otvorte: `http://localhost/droneye/sync-contentful-web.php?token=your-secret-token`

**Možnosť C: Vite Dev Server (ak už beží)**
- Vite beží na porte 5173, ale PHP súbory nefungujú cez Vite
- Použite PHP built-in server na inom porte alebo XAMPP

#### 4. Testovanie web endpointu
```bash
# CURL test
curl "http://localhost:8000/sync-contentful-web.php?token=your-secret-token"

# Alebo v prehliadači
http://localhost:8000/sync-contentful-web.php?token=your-secret-token
```

**Poznámka:** Zmeňte `$SECRET_TOKEN` v `sync-contentful-web.php` na niečo jednoduchšie pre testovanie, napr. `test123`.

## Výstup

Skript vytvorí dva JSON súbory v `assets/contentful/` adresári:

### 1. `youtube-videos.json` - YouTube videá

```json
{
    "syncedAt": "2024-01-15 10:30:00",
    "totalVideos": 2,
    "videos": [
        {
            "id": "6bxtIT3Yni0",
            "contentfulId": "1to3gHatr30vJueX0vgYY2",
            "title": {
                "sk": "Škandinávske domčeky – Únik do prírody a wellness",
                "en": "Scandinavian Cabins – Nature & Wellness Escape",
                "de": "Skandinavische Ferienhäuser – Natur- & Wellness-Auszeit"
            },
            "order": 1
        }
    ]
}
```

### 2. `photos.json` - Fotografie

```json
{
    "syncedAt": "2024-01-15 10:30:00",
    "totalPhotos": 2,
    "photos": [
        {
            "contentfulId": "4FSNVQpUfpEjIyFiMViHWz",
            "title": {
                "sk": "Fotografia projektu 2",
                "en": "Project photo 2",
                "de": "Projektfoto 2"
            },
            "images": [
                {
                    "fileName": "DJI_Avata_2.webp",
                    "contentType": "image/webp",
                    "url": "https://images.ctfassets.net/..."
                }
            ]
        }
    ]
}
```

## Konfigurácia Contentful

Skript používa **GraphQL API** a očakáva nasledujúcu štruktúru v Contentful:

### YouTube Video Content Type
- **videoId** (Text) - YouTube video ID
- **videoNadpisSk** (Text) - Názov videa (slovenčina)
- **videoNadpisEn** (Text) - Názov videa (angličtina)
- **videoNadpisDe** (Text) - Názov videa (nemčina)

### Fotografia Content Type
- **fotografiaNadpisSk** (Text) - Názov fotografie (slovenčina)
- **fotografiaNadpisEn** (Text) - Názov fotografie (angličtina)
- **fotografiaNadpisDe** (Text) - Názov fotografie (nemčina)
- **fotkyCollection** (Media) - Kolekcia obrázkov

**Poznámka:** Skript používa GraphQL API, takže nepotrebuje Contentful PHP SDK. Stačí PHP s cURL rozšírením.

## Spustenie na serveri

### 1. GitHub Actions (pre GitHub Pages - odporúčané)

Pre projekty hostované na GitHub Pages je najlepšie použiť GitHub Actions pre automatickú synchronizáciu.

**Ako to funguje:**
- GitHub Actions workflow (`.github/workflows/sync-contentful.yml`) automaticky spúšťa synchronizáciu
- Môže bežať na plánovanom rozvrhu (napr. každý deň) alebo manuálne
- Po synchronizácii automaticky commitne a pushne zmeny do repozitára

**Nastavenie:**
1. Workflow je už vytvorený v `.github/workflows/sync-contentful.yml`
2. Synchronizácia sa spustí automaticky každý deň o 2:00 UTC
3. Môžete ju spustiť manuálne cez GitHub Actions tab → "Sync Contentful" → "Run workflow"

**Poznámka:** GitHub Actions má PHP vstavaný, takže nie je potrebné nič inštalovať. Skript použije credentials, ktoré sú už v `sync-contentful.php`.

### 2. Web Endpoint (pre vlastný server)

Vytvorte web endpoint pre spustenie synchronizácie cez HTTP request:

**URL:** `https://yourdomain.com/sync-contentful-web.php?token=YOUR_SECRET_TOKEN`

**Bezpečnosť:**
1. Zmeňte `$SECRET_TOKEN` v `sync-contentful-web.php` na silný náhodný reťazec
2. (Voliteľne) Obmedzte prístup podľa IP adresy v `.htaccess`
3. (Voliteľne) Pridajte HTTP Basic Authentication

**Príklad použitia:**
```bash
# CURL request
curl "https://yourdomain.com/sync-contentful-web.php?token=your-secret-token"

# Alebo v prehliadači
https://yourdomain.com/sync-contentful-web.php?token=your-secret-token
```

**Odpoveď (JSON):**
```json
{
    "success": true,
    "message": "Synchronization completed successfully",
    "totalVideos": 5,
    "outputFile": "/path/to/assets/contentful/youtube-videos.json",
    "output": "..."
}
```

### 2. Cron Job (automatická synchronizácia)

Pre automatickú synchronizáciu nastavte cron job na serveri:

```bash
# Synchronizácia každú hodinu
0 * * * * cd /path/to/project && php /path/to/project/sync-contentful.php >> /path/to/project/sync.log 2>&1

# Alebo cez web endpoint (odporúčané)
0 * * * * curl -s "https://yourdomain.com/sync-contentful-web.php?token=your-secret-token" > /dev/null
```

### 3. Contentful Webhook

V Contentful môžete nastaviť webhook, ktorý automaticky spustí synchronizáciu pri zmene obsahu:

1. V Contentful: Settings → Webhooks
2. Vytvorte nový webhook
3. URL: `https://yourdomain.com/sync-contentful-web.php?token=your-secret-token`
4. Events: Publish, Unpublish, Archive, Delete
5. Content types: Vyberte váš YouTube video content type

## Použitie v JavaScripte

Po synchronizácii môžete načítať YouTube videá v JavaScripte:

```javascript
async function loadYouTubeVideos() {
    const response = await fetch('/assets/contentful/youtube-videos.json');
    const data = await response.json();
    
    data.videos.forEach(video => {
        console.log(`Video ID: ${video.id}, Title: ${video.title}`);
        // Použite video.id pre zobrazenie YouTube videa
    });
}
```

## Riešenie problémov

### Chyba: "Class 'Contentful\Delivery\Client' not found"
- Uistite sa, že ste spustili `composer install`
- Skontrolujte, že `vendor/autoload.php` existuje

### Chyba: "Invalid API credentials"
- Skontrolujte `SPACE_ID` a `ACCESS_TOKEN` v `sync-contentful.php`
- Uistite sa, že používate Delivery API token, nie Management API token

### Žiadne videá sa nenašli
- Skontrolujte názov content type v `sync-contentful.php` (riadok s `setContentType()`)
- Uistite sa, že máte publikované záznamy v Contentful
- Skontrolujte, že polia v Contentful majú správne názvy

