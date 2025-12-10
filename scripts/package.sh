#!/bin/bash

# Chrome Extension Packaging Script
# Creates two versions:
# 1. release/ - for GitHub (manual install, keeps key for OAuth)
# 2. store-assets/ - for Chrome Web Store (no key)

echo "📦 Starting packaging process..."

# Build the project
echo "🔨 Building project..."
npm run build

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create directories
mkdir -p release
mkdir -p store-assets

# ============ Package 1: GitHub Release (with key) ============
echo ""
echo "📁 Creating GitHub release package (with key)..."
GITHUB_ZIP="horizon-new-tab-v${VERSION}.zip"
cd dist
zip -r "../release/${GITHUB_ZIP}" . -x "*.map" "*.DS_Store"
cd ..
echo "   ✅ release/${GITHUB_ZIP}"

# ============ Package 2: Chrome Web Store (without key) ============
echo ""
echo "📁 Creating Chrome Web Store package (without key)..."
STORE_ZIP="horizon-tab-v${VERSION}.zip"

# Remove 'key' field from manifest.json for store
cd dist
node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  delete manifest.key;
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
"
zip -r "../store-assets/${STORE_ZIP}" . -x "*.map" "*.DS_Store"
cd ..
echo "   ✅ store-assets/${STORE_ZIP}"

# Restore key in dist for local development
echo ""
echo "🔄 Restoring key in dist/ for local development..."
cp public/manifest.json dist/manifest.json

echo ""
echo "✅ Packaging complete!"
echo ""
echo "📦 Packages created:"
echo "   • release/${GITHUB_ZIP}        → GitHub Release (manual install)"
echo "   • store-assets/${STORE_ZIP}    → Chrome Web Store"
