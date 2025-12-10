#!/bin/bash

# Chrome Extension Packaging Script
# This creates a .zip file for distribution

echo "📦 Starting packaging process..."

# Build the project
echo "🔨 Building project..."
npm run build

# Create release directory
RELEASE_DIR="release"
mkdir -p $RELEASE_DIR

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="horizon-new-tab-v${VERSION}.zip"

# Remove 'key' field from manifest.json for Chrome Web Store
echo "🔑 Removing 'key' field for store submission..."
cd dist
if [ -f "manifest.json" ]; then
  # Use node to remove the key field
  node -e "
    const fs = require('fs');
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    delete manifest.key;
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
  "
  echo "   ✓ 'key' field removed from dist/manifest.json"
fi
cd ..

# Create zip file with only necessary files
echo "📁 Creating zip file..."
cd dist
zip -r "../${RELEASE_DIR}/${ZIP_NAME}" . -x "*.map" "*.DS_Store"
cd ..

echo "✅ Package created: ${RELEASE_DIR}/${ZIP_NAME}"
echo ""
echo "📖 To install:"
echo "1. Extract the zip file"
echo "2. Open Chrome → Extensions (chrome://extensions/)"
echo "3. Enable 'Developer mode'"
echo "4. Click 'Load unpacked'"
echo "5. Select the extracted folder"
