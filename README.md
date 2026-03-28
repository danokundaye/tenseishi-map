# Tenseishi — Fortified Metropolis

Interactive city map and location reference for the **Shinobi World** text-based RPG.

Tenseishi is a massive fortified metropolis spanning 100–120km in radius — humanity's last bastion in a world of irradiated wasteland. The city is divided into four sectors, each with distinct geography, culture, and power dynamics.

## Live Site

> Add your Vercel URL here after deployment.

## Features

- **Interactive overview map** with toggleable layers (underground networks, trade routes, security outposts)
- **Detailed 2D sector maps** with building footprints, street networks, landmarks, and terrain texture
- **Three.js 3D view** for each sector — rotatable camera with extruded buildings and terrain
- **Sector detail pages** with lore, key locations, and layout descriptions
- **Landmarks toggle** to show/hide key buildings on the overview map
- Click any sector on the overview to zoom into its detailed layout

## Sectors

| Sector | Head | Terrain | Character |
|--------|----------|---------|-----------|
| Zero | — | Concentric rings on a central hill | Seat of government, elite district |
| I | Ivi | Flat, wide boulevards, garden estates | Affluent, politically indifferent |
| II | Firen | Dense urban core, quiet outskirts | Balanced, clan rivalry underneath |
| III | X | Built against an ancient gorge, three vertical layers | Poorest, most populated, underground activity |

## Tech Stack

- **Vite** — build tool
- **Tailwind CSS v4** — styling (with `@tailwindcss/vite` plugin)
- **Three.js** — 3D rendering (loaded from CDN on demand)
- **Vanilla JS** — no framework, SVG-based 2D maps

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel auto-detects Vite. Verify:
   - **Framework:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Click Deploy

Every push to `main` auto-redeploys.

## Project Structure

```
tenseishi-map/
├── index.html              # Homepage with interactive map
├── pages/
│   ├── sector-zero.html    # Sector Zero detail page
│   ├── sector-one.html     # Sector I detail page
│   ├── sector-two.html     # Sector II detail page
│   └── sector-three.html   # Sector III detail page
├── src/
│   ├── style.css           # Tailwind + custom theme
│   ├── main.js             # CSS entry point
│   ├── nav.js              # Shared navigation component
│   └── map.js              # All map rendering (2D SVG + Three.js 3D)
├── public/
│   ├── favicon.svg         # Tenseishi seal emblem
│   └── favicon.ico         # Fallback favicon
├── vite.config.js
└── package.json
```

## Shinobi World RPG

Tenseishi is the setting for Shinobi World, a Naruto-themed text-based RPG. This site serves as both a player reference and a showcase of the world's geography and lore.

---

Built with care for the Shinobi World community.
