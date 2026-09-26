# Changelog

All notable changes, new game modes, dataset updates, and UX improvements to **LoLdle** are documented in this file.

---

## [1.2.1] - 2026-09-26

### Fixed & Enhanced
- **Game State Persistence & Randomized Seeds** ([PR #9](https://github.com/taitran501/loldle/pull/9)):
  - Added robust `localStorage` persistence for **High/Low Mode** (`loldle_higherlower_state_v2`) and **Item Shop Mode** (`loldle_item_state_v2`).
  - Active rounds, current champion pairs, match history, guesses, and streak progress are seamlessly preserved when switching between mode tabs or refreshing the browser.
  - In Unlimited mode, new rounds now roll truly randomized item and champion targets (`getRandomItemTarget`, `Math.random() * 1_000_000` + `Date.now()`) instead of resetting to a static seed on remount.

---

## [1.2.0] - 2026-09-26

### Added
- **Item Shop Mode (`item` / `Items` Tab)** ([PR #7](https://github.com/taitran501/loldle/pull/7)):
  - Added a new interactive **Item Shop Mode** where players deduce the mystery completed League of Legends item from its recipe tree and pick the right item from **5 candidates**.
  - **3-Level Hierarchical Shop Recipe Tree**: Renders the Completed Item root at Level 1, direct Epic/Basic components at Level 2, and basic sub-components at Level 3 directly underneath their parent component with Hextech connector lines and square item frames.
  - **Progressive Clue System**:
    - **Start (Step 0)**: Branch #1 (Level 2 component + its Level 3 sub-components) is revealed along with the full tree topology of locked slots.
    - **Step 1**: Branch #2 is unlocked.
    - **Step 2**: Branch #3 + Total Gold & Combine Cost are unlocked.
    - **Step 3**: Item Stats Clue banner (`+AD`, `+AP`, `+Ability Haste`, etc.) is unlocked.
    - **Step 4**: Blurred Mystery Item icon is unlocked.
  - **Archetype-Matched & Structure-Distinct Candidate Algorithm (`pickTargetItemAndChoices`)**:
    - Ensures all 5 candidate choices belong to the same item archetype (`AD_FIGHTER_ASSASSIN`, `MARKSMAN_CRIT_AS`, `AP_MAGE`, `TANK`, `ENCHANTER_SUPPORT`) and share component build paths (e.g., `Caulfield's Warhammer`, `B.F. Sword`, `Lost Chapter`) so players cannot guess trivially by AD/AP tags alone.
    - Strictly excludes decoys with identical recipes (`recipeSignature`) or identical branch sub-component structures (`sortedSubCounts`), preventing ambiguous 50/50 guesses (such as *Eclipse* vs *Endless Hunger* or *Rapid Firecannon* vs *Runaan's Hurricane*) on Guess #1.
  - **Data Dragon `16.19.1` Item Pipeline (`scripts/generate-items.mjs` & `public/data/items.json`)**:
    - Automatically queries `https://ddragon.leagueoflegends.com/api/versions.json` for the latest League of Legends patch (`16.19.1`) and builds 197 items (105 target-eligible Summoner's Rift completed items) without text passive spoilers.

- **High/Low Stat Comparison Mode (`higherlower` / `High/Low` Tab)** ([PR #6](https://github.com/taitran501/loldle/pull/6)):
  - Added a head-to-head champion stat duel mode (`Higher or Lower`) with streak tracking (`currentStreak`, `bestStreak`) across Daily (5-round gauntlet) and Unlimited survival modes.
  - **4 Curated Comparison Criteria**:
    1. `Total Skins` (`skins`)
    2. `Release Year` (`releaseYear`, with exact `releaseDate` detail badge on reveal)
    3. `Attack Range` (`attackRange`, enforcing strict **Melee-vs-Melee** (`<= 300`) and **Ranged-vs-Ranged** (`> 300`) duels while excluding form-swapping champions `Jayce`, `Nidalee`, `Elise`, `Kayle`, and `Gnar`)
    4. `Days Since Last Skin` (`daysSinceLastSkin`, showing the latest skin name and release date upon reveal)
  - **Enriched Champion Dataset (`public/data/champions.json`)**:
    - Added `attackRange`, `releaseDate`, `lastSkinDate`, and `lastSkinName` across all 173 champions via `scripts/generate-dataset.mjs` and `scripts/update-champions.mjs`.
  - **UI/UX Layout**:
    - Centered prominent English **Criterion Banner** between the two champion cards.
    - Placed the **Higher / Lower** decision buttons in a dedicated action dock directly below the champion cards.
    - Removed champion title subtitles (`The River King`, etc.) for a cleaner card presentation.

### Changed
- **Responsive Navigation Header (`src/components/Header.tsx`)**:
  - Renamed `Higher/Lower` tab to **`High/Low`** and added **`Items`** tab.
  - Hid horizontal scrollbar and tuned responsive padding/typography so all 7 game mode tabs fit cleanly across mobile and desktop viewports.

---

## [1.1.0] - Previous Releases

### Added & Fixed
- **Quote Mode & Audio Alignment** ([PR #5](https://github.com/taitran501/loldle/pull/5)):
  - Aligned quote audio voice lines with displayed champion quotes, enhanced Splash Mode lightbox inspection, and restored Emoji Mode clues.
- **Source-Backed Emoji Mode Curation** ([PR #3](https://github.com/taitran501/loldle/pull/3), [PR #4](https://github.com/taitran501/loldle/pull/4)):
  - Added curated, source-backed thematic emoji sequences (`3–5` clues per champion) across the 173-champion roster.
- **Core Game Modes & Gameplay UX** ([PR #1](https://github.com/taitran501/loldle/pull/1), [PR #2](https://github.com/taitran501/loldle/pull/2)):
  - Implemented **Classic**, **Quote**, **Ability**, **Splash**, and **Emoji** modes with Daily UTC puzzles, Unlimited mode, streak persistence, and Hextech UI styling.
