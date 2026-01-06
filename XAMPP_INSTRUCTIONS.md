# Spustenie Contentful Sync cez XAMPP

## Rýchly spôsob (CLI)

1. **Otvorte Command Prompt** (cmd) alebo PowerShell
2. **Prejdite do adresára projektu:**
   ```cmd
   cd C:\ine\dron\droneye
   ```
3. **Použite PHP z XAMPP:**
   ```cmd
   C:\xampp\php\php.exe sync-contentful.php
   ```
   
   Alebo ak máte PHP v PATH:
   ```cmd
   php sync-contentful.php
   ```

## Spustenie cez web (XAMPP)

1. **Skopírujte súbory do XAMPP htdocs:**
   - Súbory: `sync-contentful.php`, `sync-contentful-web.php`
   - Adresár: `C:\xampp\htdocs\droneye\`

2. **Upravte token** v `sync-contentful-web.php`:
   ```php
   $SECRET_TOKEN = 'test123'; // Jednoduchý token pre testovanie
   ```

3. **Spustite XAMPP Control Panel:**
   - Kliknite na "Start" pri Apache

4. **Otvorte v prehliadači:**
   ```
   http://localhost/droneye/sync-contentful-web.php?token=test123
   ```

## Alternatíva - priamo z projektu

Ak chcete spustiť priamo z vášho projektu bez kopírovania do htdocs:

1. **Spustite Apache v XAMPP Control Panel**

2. **V Command Prompte prejdite do adresára projektu:**
   ```cmd
   cd C:\ine\dron\droneye
   ```

3. **Spustite PHP built-in server:**
   ```cmd
   C:\xampp\php\php.exe -S localhost:8000
   ```

4. **Otvorte v prehliadači:**
   ```
   http://localhost:8000/sync-contentful-web.php?token=test123
   ```

## Najjednoduchšie (odporúčané)

**Priamo cez Command Prompt:**
```cmd
cd C:\ine\dron\droneye
C:\xampp\php\php.exe sync-contentful.php
```

Toto vytvorí JSON súbory v `assets/contentful/` bez potreby web servera!

