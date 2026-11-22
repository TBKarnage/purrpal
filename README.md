# PurrPal — Cozy Virtual Kitty PWA

A cozy, touch-first virtual pet Progressive Web App designed for kids on iPadOS 17 (and modern desktop/tablet browsers). Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Workbox** (`vite-plugin-pwa`) for full offline play.

## Features

- **100% Cozy & Stress-Free:** Zero permadeath and gentle stat floors (`15%`) with offline time catch-up.
- **Adoption & Random Kitty Names:** Pick from 4 coats (Tabby, Tuxedo, Calico, Gray), roll 6 fresh random names from a 48-name pool with the **New Names** shuffle button, or type a custom name.
- **Living Room Care Loop:** Feed kibble & treats (with full-tummy head-shake refusal at `100%` hunger to prevent XP farming), sweep floor messes for Paw Coins, brush fur, and tap/rub to pet.
- **4 Growth Stages & Celebrations:** Evolve from **Tiny Kitten** → **Playful Junior** (Lv 4) → **Teen Cat** (Lv 8) → **Full-Grown Adult** (Lv 13) with confetti celebrations and unlock cards.
- **3-Tab Style Boutique (Multi-Slot Layering):**
  - **Customize:** Free Starter Basics at Lv 1 (5 Eye Colors, 4 Cheek Flair styles, 4 Starter Neck Ribbons) plus layered neckwear, headwear, and eyewear unlocked as you level up.
  - **Room:** Free Starter Rug Colors (Cream, Mint, Peach) plus unlockable Cat Tree, Sun Cushion, Fairy Lights, and Starry Rug.
  - **Unlocks:** Visual level-up roadmap showing every style category and its preview items.
- **3 Touch Mini-Games:** *Laser Chase* (Lv 1), *Bubble Pop* (Lv 4), and *Catch Treats* (Lv 8) with guaranteed positive Happiness, XP, and Coin rewards.
- **Synthesized Web Audio SFX:** Zero external audio files — gentle synthesized meows, purrs, crunches, pops, and fanfares unlocked on first tap.
- **Dual Persistence & Parent Corner:** Automatic `IndexedDB` + `localStorage` saving with a 3-second press-and-hold **Parent Corner** for audio toggle, mini-game unlock override, Base64 save backup/restore, and double-confirmed reset.

## Local Development

```bash
npm install
npm run dev
```

### Scripts

- `npm test` — Run unit tests (`vitest`)
- `npm run lint` — Run linter (`oxlint`)
- `npm run build` — Type-check and build production PWA bundle (`dist/`)
- `npm run preview` — Preview the production build locally

## Installing on iPadOS 17

1. Deploy `dist/` to any static HTTPS host (Cloudflare Pages, Vercel, Netlify, or GitHub Pages).
2. Open the deployed URL in **Safari** on iPadOS 17.
3. Tap **Share → Add to Home Screen → Add**.
4. Launch **PurrPal** from the Home Screen for full-screen, offline-capable play with automatic progress saving.
