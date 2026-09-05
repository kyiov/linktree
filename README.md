# Linktree — Muhar (@muh4r_)

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Netlify Status](https://img.shields.io/badge/Netlify-Deployed-00C7B7.svg?style=flat-square&logo=netlify)](https://muhartree.netlify.app/)

Personal Linktree bio link hub featuring **Dark Glassmorphism & Cyberpunk aesthetics**, tactile micro-interactions, integrated background music player, real-time theme palette switcher, dynamic QR sharing, and full static hosting support on Netlify.

🌐 **Live Demo:** [muhartree.netlify.app](https://muhartree.netlify.app/)

---

## ✨ Features

- **Profile & Dynamic Hero**:
  - Pulsating neon glow avatar with high-res asset and local fallback.
  - Operational status badge (`🟢 Available for projects`).
  - Tactile social bar with direct links (Instagram, GitHub, Telegram) and Web Audio haptic feedback.
- **Dark Glassmorphic Link Cards**:
  - Interactive dark glass cards (`bg-zinc-900/60 backdrop-blur-xl border border-white/10`).
  - Badges (`Personal`, `App`, `API`, `Featured`, `New`), Lucide icons, and hover cursor spotlight gradient.
  - Smooth elevation scale transitions on hover and click.
- **Custom Music Player**:
  - Floating player pill with soundwave visualizer and instant play/pause toggle.
  - Preloaded default evaluation track: *Snowfall* (Øneheart & reidenshi).
  - Search & stream audio via YouTube pipeline (local dev) or direct custom audio URL & local file upload (IndexedDB client-side persistence).
- **Multi-Preset Theme Switcher**:
  - **Muhar Burgundy** (Signature Warm Rosewood & Wine)
  - **Cyber Cyan** (Electric Cyan & Deep Abyss Dark)
  - **Matrix Emerald** (Mint Neon & Hacker Green)
  - **Monochrome Noir** (Minimalist High-Contrast White/Zinc)
  - Instant CSS variables transition without page reload, saved in `localStorage`.
- **Dynamic QR Code & Quick Share Modal**:
  - Glassmorphic modal generating on-the-fly vector QR codes.
  - One-click copy link with sound chime and toast confirmation.
  - Native Web Share API integration on mobile devices.
- **In-Browser Live Customizer (Admin Drawer)**:
  - Edit profile bio, links, and avatar live in browser (`?edit=true` or press `E`).
  - Live preview updates in real-time.
  - Direct "Export config.json" download and "Copy JSON" for instant deployment.
- **Tactile Web Audio API Sound FX**:
  - Synthesized organic click feedback on link clicks and copy success chime.
- **Keyboard Shortcuts**:
  - `1` – `9`: Open corresponding link in a new tab.
  - `M`: Toggle music play/pause.
  - `S` or `/`: Open music search modal.
  - `C`: Copy profile link to clipboard.
  - `E`: Toggle Live Customizer.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vite.dev/)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Icons:** [Lucide React](https://lucide.dev/)
- **Utilities:** `clsx`, `tailwind-merge`, `qrcode`
- **Audio & Haptics:** Web Audio API (OscillatorNode synthesizers) & HTML5 Audio
- **Hosting Target:** [Netlify](https://www.netlify.com/) (Zero-backend static site with range request support for audio)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/kyiov/linktree.git
cd linktree

# Install dependencies
npm install
```

### Local Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Typecheck and bundle production assets to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## ⚙️ Configuration

All profile data, links, music settings, and feature flags are declaratively managed in `src/config/config.json`:

```json
{
  "profile": {
    "name": "Muhar",
    "handle": "@muh4r_",
    "title": "Developer & Creator",
    "bio": "",
    "avatarUrl": "https://raw.githubusercontent.com/kyiov/cdn/main/uploads/mtmumwdb.jpg",
    "avatarLocalFallback": "/avatar.jpg"
  },
  "music": {
    "enabled": true,
    "defaultTrack": {
      "id": "snowfall",
      "title": "snowfall",
      "artist": "Øneheart & reidenshi",
      "duration": 125,
      "audioUrl": "/audio/snowfall.mp3",
      "thumbnail": "https://i.ytimg.com/vi/U1m46getoEw/hq720.jpg"
    },
    "volume": 0.65,
    "loop": true
  },
  "features": {
    "filmGrain": true,
    "sunsetVignette": true,
    "soundEffects": true,
    "keyboardShortcuts": true
  },
  "socials": [ ... ],
  "links": [ ... ]
}
```

---

## 📁 Project Structure

```
linktree/
├── design.md                  # Comprehensive Design & Architecture Specification
├── README.md                  # Project documentation & overview
├── index.html                 # HTML shell with meta/OG tags & fonts
├── package.json               # Dependencies & scripts
├── tailwind.config.js         # Tailwind styling & keyframe configurations
├── vite.config.ts             # Vite bundler configuration & local proxy
├── public/                    # Static assets (audio tracks, favicons, og-image)
└── src/
    ├── App.tsx                # Main application component & shortcut listeners
    ├── main.tsx               # App entrypoint
    ├── index.css              # Global styles, typography & CSS variables
    ├── components/
    │   ├── FilmGrain.tsx      # SVG film grain overlay
    │   ├── LinkCard.tsx       # Glassmorphic link card with spotlight effect
    │   ├── LinkList.tsx       # Link item iterator
    │   ├── MusicPlayer.tsx    # Floating audio player pill & visualizer
    │   ├── MusicSearchModal.tsx # Audio search, streaming & local upload modal
    │   ├── ProfileFooter.tsx  # Footer stats & shortcut hints
    │   ├── ProfileHeader.tsx  # Avatar hero & profile info
    │   ├── ShareModal.tsx     # Dynamic QR code generator modal
    │   ├── SocialBar.tsx      # Social media action bar
    │   └── ThemeSwitcher.tsx  # Cyberpunk palette switcher dropdown
    ├── config/
    │   └── config.json        # Main configuration file
    ├── types/
    │   └── linktree.ts        # TypeScript interfaces & types
    └── utils/
        ├── audio.ts           # Web Audio API click & chime synthesis
        └── audioStorage.ts    # LocalStorage / IndexedDB track persistence
```

---

## 📄 License

MIT © [muh4r_ (kyiov)](https://github.com/kyiov)
