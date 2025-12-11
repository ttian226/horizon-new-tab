<p align="center">
  <img src="docs/icons/icon-128.png" alt="Horizon Tab" width="100">
</p>

<h1 align="center">Horizon Tab</h1>

<p align="center">
  A beautiful, productivity-focused new tab Chrome extension with stunning wallpapers, weather, and focus tools.
</p>

<p align="center">
  <a href="https://github.com/ttian226/horizon-new-tab/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/ttian226/horizon-new-tab/releases">
    <img src="https://img.shields.io/github/v/release/ttian226/horizon-new-tab" alt="Release">
  </a>
  <img src="https://img.shields.io/badge/manifest-v3-green.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/react-18-61dafb.svg" alt="React 18">
  <img src="https://img.shields.io/badge/typescript-5-3178c6.svg" alt="TypeScript">
</p>

<p align="center">
  <a href="https://horizon-tab.app/">Homepage</a> •
  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#development">Development</a> •
  <a href="https://horizon-tab.app/privacy-policy.html">Privacy Policy</a>
</p>

---

## Features

- **Beautiful Clock** - Elegant time display with personalized greetings (12h/24h format)
- **Stunning Wallpapers** - Curated 4K images from Unsplash across 4 categories
- **Real-time Weather** - Auto-location or manual city search via Open-Meteo
- **Todo List** - Cloud-synced task management with Google account
- **Markdown Notes** - Quick notes with full GitHub Flavored Markdown support
- **Focus Mode** - Distraction-free workspace with draggable widgets
- **Favorites** - Save your favorite wallpapers (up to 9)
- **Cloud Sync** - Sync settings, todos, and favorites across devices
- **Glassmorphism Design** - Modern frosted glass aesthetics

## Installation

### Chrome Web Store

Coming soon...

### From GitHub Release

1. Download the latest `.zip` from [Releases](https://github.com/ttian226/horizon-new-tab/releases)
2. Extract the zip file
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** → Select the extracted folder

### From Source

```bash
git clone https://github.com/ttian226/horizon-new-tab.git
cd horizon-new-tab
npm install
npm run build
```

Then load the `dist` folder in Chrome as above.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package extension (.zip)
npm run package
```

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Firebase (Auth, Firestore, Cloud Functions) |
| APIs | Unsplash (Wallpapers), Open-Meteo (Weather) |

## Project Structure

```
horizon-new-tab/
├── src/
│   ├── components/     # React components
│   ├── services/       # API & Firebase services
│   └── config/         # Firebase config
├── functions/          # Cloud Functions
├── docs/               # GitHub Pages (Homepage)
└── public/             # Static assets & manifest.json
```

## Privacy

Horizon Tab respects your privacy:
- No ads, no tracking
- Data stored locally or in your Google account (optional)
- See our [Privacy Policy](https://horizon-tab.app/privacy-policy.html)

## Acknowledgments

This project was built with the assistance of [Claude AI](https://claude.ai), demonstrating the potential of AI-driven development. While AI assisted in generating code, all code has been manually reviewed, tested, and optimized.

## License

[MIT](LICENSE) © 2025
