# Horizon New Tab

A beautiful, productivity-focused new tab Chrome extension inspired by Momentum.

## Features

- Clock with time-based greeting
- Dynamic wallpapers (nature, architecture, minimalist, technology)
- Weather display with geolocation support
- Google Sign-in for cloud sync (upcoming)
- Clean, minimal design

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
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
│   ├── components/        # React components
│   │   ├── Clock.tsx      # Time and greeting display
│   │   └── Weather.tsx    # Weather widget
│   ├── services/
│   │   ├── auth.ts        # Firebase Auth service
│   │   └── wallpaper.ts   # Wallpaper service (via Firestore)
│   ├── styles/
│   │   └── index.css      # Global styles
│   ├── App.tsx            # Main component
│   └── main.tsx           # Entry point
├── functions/             # Firebase Cloud Functions
│   └── src/
│       └── index.ts       # Scheduled wallpaper updates
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## Load Extension in Chrome

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder

## Roadmap

### Free Version
- [x] Clock display with greeting
- [x] Dynamic wallpapers (4 categories)
- [x] Weather widget
- [x] Google Sign-in
- [ ] Daily quotes
- [ ] Todo list (local storage)
- [ ] Quick links
- [ ] Search box

### Premium Version (Planned)
- [ ] Custom background upload
- [ ] Pomodoro timer / Focus mode
- [ ] Task management integrations
- [ ] Ambient sounds
- [ ] Cloud sync for settings

## API Resources

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Unsplash](https://unsplash.com/developers) | Wallpapers | 50 req/hour (demo) |
| [Open-Meteo](https://open-meteo.com/) | Weather | Unlimited |

## License

MIT
