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

# Create zip file with only necessary files
echo "📁 Creating zip file..."
cd dist
zip -r "../${RELEASE_DIR}/${ZIP_NAME}" . -x "*.map" "*.DS_Store"
cd ..

# Add manifest.json if not already in dist
if [ ! -f "dist/manifest.json" ]; then
  echo "⚠️  Warning: manifest.json not found in dist folder"
fi

echo "✅ Package created: ${RELEASE_DIR}/${ZIP_NAME}"
echo ""
echo "📖 To install:"
echo "1. Extract the zip file"
echo "2. Open Chrome → Extensions (chrome://extensions/)"
echo "3. Enable 'Developer mode'"
echo "4. Click 'Load unpacked'"
echo "5. Select the extracted folder"
