#!/bin/bash
# Quick test script for local Contentful sync
# Usage: ./test-sync-local.sh

echo "🧪 Testing Contentful sync locally..."
echo ""

# Check if composer dependencies are installed
if [ ! -d "vendor" ]; then
    echo "📦 Installing Composer dependencies..."
    composer install
    echo ""
fi

# Test CLI sync
echo "🔄 Testing CLI sync..."
php sync-contentful.php

echo ""
echo "✅ Test completed!"
echo ""
echo "To test web endpoint, run:"
echo "  php -S localhost:8000"
echo ""
echo "Then open:"
echo "  http://localhost:8000/sync-contentful-web.php?token=your-secret-token"
echo ""

