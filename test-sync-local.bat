@echo off
REM Quick test script for local Contentful sync (Windows)
REM Usage: test-sync-local.bat

echo 🧪 Testing Contentful sync locally...
echo.

REM Check if composer dependencies are installed
if not exist "vendor" (
    echo 📦 Installing Composer dependencies...
    composer install
    echo.
)

REM Test CLI sync
echo 🔄 Testing CLI sync...
php sync-contentful.php

echo.
echo ✅ Test completed!
echo.
echo To test web endpoint, run:
echo   php -S localhost:8000
echo.
echo Then open:
echo   http://localhost:8000/sync-contentful-web.php?token=your-secret-token
echo.

pause

