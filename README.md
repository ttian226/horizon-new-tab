# Horizon Tab

A beautiful, productivity-focused new tab Chrome extension with stunning wallpapers, weather, and focus tools.

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

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase
  - Authentication (Google Sign-in)
  - Cloud Firestore (Database)
  - Cloud Functions (Scheduled wallpaper updates)
- **APIs**:
  - Unsplash (Wallpapers)
  - Open-Meteo (Weather - free, no API key required)

## Project Structure

```
horizon-new-tab/
├── public/
│   └── manifest.json      # Chrome Extension config (Manifest V3)
├── src/
│   ├── config/
│   │   └── firebase.ts    # Firebase configuration
│   ├── components/
│   │   ├── Clock.tsx      # Time and greeting display
│   │   ├── Weather.tsx    # Weather widget
│   │   ├── SettingsModal.tsx
│   │   ├── Todo/          # Todo list components
│   │   └── Widgets/       # Focus mode widgets (Notes, Todo, Dock)
│   ├── services/
│   │   ├── auth.ts        # Firebase Auth service
│   │   ├── firestore.ts   # Firestore service
│   │   └── wallpaper.ts   # Wallpaper service
│   ├── App.tsx            # Main component
│   └── main.tsx           # Entry point
├── functions/             # Firebase Cloud Functions
│   └── src/
│       └── index.ts       # Scheduled wallpaper updates
├── docs/                  # GitHub Pages (Homepage)
└── dist/                  # Build output
```

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Package extension (creates .zip)
npm run package
```

## Installation

### From Source

1. Clone this repository
2. Run `npm install && npm run build`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the `dist` folder

### From Release

1. Download the latest release from [GitHub Releases](https://github.com/ttian226/horizon-new-tab/releases)
2. Extract the zip file
3. Follow steps 3-6 above

## API Resources

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Unsplash](https://unsplash.com/developers) | Wallpapers | 50 req/hour (demo) |
| [Open-Meteo](https://open-meteo.com/) | Weather | Unlimited |

## Privacy

Horizon Tab respects your privacy:
- No ads, no tracking
- Data stored locally or in your Google account (optional)
- See our [Privacy Policy](https://ttian226.github.io/horizon-new-tab/privacy-policy.html)

## License

MIT
