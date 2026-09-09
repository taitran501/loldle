# LoLdle

A web-based League of Legends guessing game featuring Daily and Unlimited modes across five challenge categories: Classic, Quote, Ability, Emoji, and Splash.

## Game Modes

- **Classic:** Deduce the mystery champion by comparing seven attributes: Gender, Positions, Species, Resource, Range type, Regions, and Release year. Clue tokens unlock at 5 guesses (Quote), 10 guesses (Ability), and 15 guesses (Splash).
- **Quote:** Identify the champion from an iconic spoken quote. An audio clue unlocks after 3 guesses.
- **Ability:** Guess the champion based on an ability icon (Passive, Q, W, E, or R). Optional Challenge Mode toggles (grayscale, rotation) allow customizable difficulty.
- **Emoji:** Guess the champion represented by a curated sequence of 4-6 thematic emojis. Each champion can use a different number of clues, unlocked incrementally.
- **Splash:** Identify the champion from a cropped section of official skin splash art. The viewport zooms out with each subsequent guess.

Both **Daily** (UTC-deterministic seed) and **Unlimited** (client-randomized streak mode) are supported across all modes. Active rounds, guesses, completed Daily rounds, and the selected mode persist in versioned `localStorage` state; Daily and Unlimited have separate sessions and statistics.

## Tech Stack

- **Framework:** React 19, TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4, Lucide React
- **Testing:** Vitest 5 (Unit & Component), Playwright (End-to-End), Testing Library
- **Dataset & Assets:** Local static assets for champions (173) and abilities (865); CommunityDragon & Riot DDragon CDN for splash art and voice audio.

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9 (recommended) or npm

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
pnpm build
```

The compiled static assets will be output to the `dist/` directory.

## Testing & Quality Assurance

```bash
# Run unit and component test suite
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run Playwright end-to-end browser tests
pnpm test:e2e

# Run 50-user concurrent load test benchmark
pnpm test:load
```

## Project Structure

```text
public/
  assets/
    abilities/         Pre-downloaded local ability icons (865 files)
    champions/         Pre-downloaded local champion portraits (173 files)
  data/
    champions.json     Normalized champion database (stats, quotes, emojis, skins)
  favicon.ico          Multi-resolution icon (16x16, 32x32, 48x48)
  favicon.png          Transparent Hextech emblem
scripts/
  generate-dataset.mjs      ETL pipeline aggregating Riot DDragon + CommunityDragon data
  download-assets.mjs       Asset downloader for local offline resilience
  stress-test-50-users.mjs  Concurrency and throughput benchmark script
  take-screenshot.mjs       Playwright-based viewport validation script
src/
  components/
    modes/             Mode-specific game views (Classic, Quote, Ability, Emoji, Splash)
    AutocompleteInput  Prefix search input with keyboard navigation and explicit Guess confirmation
    Header             Navigation bar with segmented Daily/Unlimited switcher and Statistics
    VictoryModal       Win screen with guess summary and share functionality
  types/               Core game contracts and data types
  utils/
    compare.ts         Attribute comparison logic (exact match, partial match, arrows)
    daily.ts           Deterministic daily seed generator and unlimited RNG
    constants.ts       Shared clue and hint unlock milestones
    gameState.ts       Versioned Daily/Unlimited localStorage persistence
    stats.ts            Versioned statistics, streak, and legacy migration logic
tests/
  component/           React Testing Library tests for each game mode
  e2e/                 Playwright browser flows across desktop, tablet, and mobile
  unit/                Dataset integrity, attribute comparison, and performance benchmarks
```

## Data Pipeline

Dataset generation and static asset synchronization can be re-run with:

```bash
# Fetch latest data and compile champions.json
pnpm generate-data

# Download local champion portraits and ability icons
pnpm download-assets
```

## Disclaimer

LoLdle is a fan-made project and is not endorsed by Riot Games. It does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends properties. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
