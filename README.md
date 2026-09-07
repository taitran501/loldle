# LoLdle - Unlimited League of Legends Guessing Game

A lightweight, high-performance web recreation of **LoLdle** with **Unlimited Play** and **Daily Mode**, featuring all 5 game modes and over **2,100+ skins**.

![LoLdle Preview](https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_7.jpg)

## Features

- **5 Game Modes:**
  1. **Classic:** Deduce champions by Gender, Positions, Species, Resource, Range type, Regions, and Release year.
  2. **Quote:** Identify champions from their iconic voice line quotes with official streaming audio.
  3. **Ability:** Guess the champion by their spell icon (P, Q, W, E, R).
  4. **Splash:** Zoom out from over 2,100+ official League skins with each guess.
  5. **Emoji:** Riddle puzzles based on 3-4 champion themed emojis.
- **Unlimited & Daily Modes:** Toggle anytime between the global daily challenge or endless streak-building rounds.
- **Zero Local Media Storage:** 100% of images and audio are streamed directly from Riot Games and CommunityDragon public CDNs.
- **Ultra Lightweight:** Under 85 KB total gzipped bundle size, instant startup (<50ms).

## Quick Start (Local Development)

```bash
# 1. Install dependencies with pnpm (fast & saves disk space)
pnpm install

# 2. Start development server
pnpm dev

# 3. Build for production
pnpm build
```

## Free Deployment (Zero Cost & Free Domain)

### Option 1: Cloudflare Pages (Recommended - Unlimited Bandwidth)
1. Push this repository to **GitHub**.
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository:
   - **Framework preset:** `Vite`
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**. You will get a free permanent URL like `https://your-loldle.pages.dev` with free SSL and global CDN.

### Option 2: Vercel
1. Push repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) > **Add New Project** > Import repository.
3. Vercel automatically detects Vite. Click **Deploy**.
4. You will get a free permanent URL like `https://your-loldle.vercel.app`.

---

## Legal Disclaimer
LoLdle isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
