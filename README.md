# Linktree - Muhar (@muhar_fg)

Personal Linktree bio link with tactile micro-interactions, custom music player, themes, and full Netlify static hosting support.

## Features

- **Profile & Dynamic Header**: Interactive avatar with scroll-collapse effect, bio, and social bar (Instagram, Telegram, GitHub).
- **Categorized Links**: Configurable link items with badges, icons, and categories loaded from `config.json`.
- **Music Player**:
  - Offline / client-side audio playback with `localStorage` & `IndexedDB` persistence.
  - Curated themes: *Daisy* (STEREO DIVE FOUNDATION) & *Twilight Sunset Drive* (AE86 Sunset Chill).
  - Search & stream audio via YouTube pipeline (local dev) or direct custom audio URL & local file upload (static production).
- **Theme Switcher**: Smooth palette swapping (Midnight Burgundy, Cyberpunk Neon, Minimal Dark).
- **Tactile Audio FX**: Web Audio API micro-sounds on clicks and sharing.
- **Production Ready**: Fully static deployment on Netlify with CDN range-request support for streaming audio.

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Build & Production

```bash
npm run build
```

The output in `dist/` is ready for deployment on Netlify or any static hosting provider.
