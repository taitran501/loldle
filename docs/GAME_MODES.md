# LoLdle Game Modes & Architecture Guide

This document describes the rules, data pipelines, and puzzle generation algorithms across all **7 game modes** in LoLdle.

---

## 1. Overview of Game Modes

| Mode ID | Tab Label | Objective | Input Mechanism |
| :--- | :--- | :--- | :--- |
| `classic` | **Classic** | Deduce the mystery champion from 7 attribute columns (`Gender`, `Positions`, `Species`, `Resource`, `Range`, `Region`, `Release Year`). | Champion autocomplete search |
| `quote` | **Quote** | Identify the champion who speaks the displayed voice line (audio unlocks after 3 wrong guesses). | Champion autocomplete search |
| `ability` | **Ability** | Identify the champion from their ability icon (ability key `P/Q/W/E/R` unlocks after 3 guesses). | Champion autocomplete search |
| `splash` | **Splash** | Identify the champion and skin from a progressively zooming-out splash art crop. | Champion autocomplete search |
| `emoji` | **Emoji** | Identify the champion from a progressive sequence of `3–5` curated thematic emojis. | Champion autocomplete search |
| `higherlower` | **High/Low** | Compare two champions head-to-head on a chosen stat criterion (`Higher` or `Lower`). | `Higher` / `Lower` buttons |
| `item` | **Items** | Inspect the 3-level Shop Recipe Tree and pick the completed item from 5 candidates. | 5 candidate item cards |

---

## 2. High/Low Mode (`src/components/modes/HigherLowerMode.tsx`)

### Supported Criteria (`src/utils/higherLower.ts`)
1. **Total Skins (`skins`)**: Total number of official skins in League of Legends.
2. **Release Year (`releaseYear`)**: Original champion release year (reveals exact `YYYY-MM-DD` release date after guessing).
3. **Attack Range (`attackRange`)**:
   - Enforces **Melee-vs-Melee (`<= 300` range)** or **Ranged-vs-Ranged (`> 300` range)** matchups so duels are never trivial Melee-vs-Ranged comparisons.
   - Excludes hybrid form-swapping champions (`Jayce`, `Nidalee`, `Elise`, `Kayle`, `Gnar`) to avoid ambiguity.
4. **Days Since Last Skin (`daysSinceLastSkin`)**: Number of days elapsed since the champion's newest skin release (reveals `lastSkinName` and `lastSkinDate` after guessing).

---

## 3. Item Shop Mode (`src/components/modes/ItemMode.tsx`)

### 3-Level Shop Recipe Tree (`resolveRecipeTree`)
Each completed target item in `public/data/items.json` (generated from Riot Data Dragon `16.19.1` via `scripts/generate-items.mjs`) is rendered as a 3-level hierarchy:
- **Level 1 (Root)**: Completed Item square slot + Total Gold & Combine Cost badge.
- **Level 2 (Direct Components)**: The 2–4 direct components (`item.from`) connected via horizontal and vertical Hextech branch lines.
- **Level 3 (Basic Sub-Components)**: Basic items (`comp.from`) rendered directly beneath their parent Level 2 Epic component.

### Smart 5-Candidate Selection (`pickTargetItemAndChoices`)
To make every round both challenging and 100% logically deducible on Guess #1:
1. **Archetype & Build-Path Cohesion**:
   - Decoys are matched to the target item's primary archetype (`AD_FIGHTER_ASSASSIN`, `MARKSMAN_CRIT_AS`, `AP_MAGE`, `TANK`, `ENCHANTER_SUPPORT`) and prioritized when they share components (`firstCompId`), preventing trivial elimination by AD/AP class.
2. **Strict Recipe & Tree-Structure Uniqueness**:
   - No decoy can share the target item's recipe (`recipeSignature`) or its unordered branch sub-component counts (`sortedSubCounts`).
   - Items with identical recipes (e.g. *Eclipse* and *Endless Hunger*, or *Rapid Firecannon* and *Runaan's Hurricane*) never appear together in the same 5-candidate pool.
