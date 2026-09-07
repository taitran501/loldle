import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Champion } from '../../src/types';

describe('Dataset & Asset Integrity Tests', () => {
  const jsonPath = path.resolve(process.cwd(), 'public/data/champions.json');
  expect(fs.existsSync(jsonPath)).toBe(true);

  const champions: Champion[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  it('contains exactly 173 champions in the dataset', () => {
    expect(champions.length).toBe(173);
  });

  it('has unique IDs, numericIds, and names for every champion', () => {
    const ids = new Set<string>();
    const numericIds = new Set<number>();
    const names = new Set<string>();

    for (const champ of champions) {
      expect(ids.has(champ.id)).toBe(false);
      expect(numericIds.has(champ.numericId)).toBe(false);
      expect(names.has(champ.name.toLowerCase())).toBe(false);

      ids.add(champ.id);
      numericIds.add(champ.numericId);
      names.add(champ.name.toLowerCase());
    }
  });

  it('validates 100% of champion core attributes (gender, positions, species, resource, range, releaseYear)', () => {
    for (const champ of champions) {
      expect(['Male', 'Female', 'Other']).toContain(champ.gender);
      expect(champ.positions.length).toBeGreaterThan(0);
      expect(champ.species.length).toBeGreaterThan(0);
      expect(typeof champ.resource).toBe('string');
      expect(champ.resource.length).toBeGreaterThan(0);
      expect(champ.rangeType.length).toBeGreaterThan(0);
      expect(champ.regions.length).toBeGreaterThan(0);
      expect(champ.releaseYear).toBeGreaterThanOrEqual(2009);
      expect(champ.releaseYear).toBeLessThanOrEqual(2026);
    }
  });

  it('verifies 100% of 173 local avatar static files exist on disk with valid size', () => {
    for (const champ of champions) {
      expect(champ.iconUrl).toBe(`/assets/champions/${champ.id}.png`);
      const filePath = path.resolve(process.cwd(), `public/assets/champions/${champ.id}.png`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it('verifies 100% of 865 local ability icons exist on disk with valid keys (P, Q, W, E, R)', () => {
    let totalAbilities = 0;
    for (const champ of champions) {
      expect(champ.abilities.length).toBe(5);
      const keys = champ.abilities.map(a => a.key);
      expect(keys).toEqual(['P', 'Q', 'W', 'E', 'R']);

      for (const ability of champ.abilities) {
        totalAbilities++;
        expect(ability.iconUrl).toBe(`/assets/abilities/${champ.id}_${ability.key.toLowerCase()}.png`);
        const filePath = path.resolve(process.cwd(), `public${ability.iconUrl}`);
        expect(fs.existsSync(filePath)).toBe(true);
        const stat = fs.statSync(filePath);
        expect(stat.size).toBeGreaterThan(100);
      }
    }
    expect(totalAbilities).toBe(865);
  });

  it('verifies 100% of quotes and audio URLs across all 173 champions', () => {
    for (const champ of champions) {
      expect(champ.quote).toBeDefined();
      expect(typeof champ.quote.text).toBe('string');
      expect(champ.quote.text.trim().length).toBeGreaterThanOrEqual(5);

      expect(typeof champ.quote.audioUrl).toBe('string');
      expect(champ.quote.audioUrl.length).toBeGreaterThan(0);
      expect(champ.quote.audioUrl.startsWith('https://') || champ.quote.audioUrl.startsWith('/')).toBe(true);
      expect(champ.quote.audioUrl).not.toContain('undefined');
      expect(champ.quote.audioUrl).not.toContain('NaN');
    }
  });

  it('verifies 100% of champions have exactly 4 curated emojis', () => {
    for (const champ of champions) {
      expect(champ.emojis).toBeDefined();
      expect(champ.emojis.length).toBe(4);
      champ.emojis.forEach(emoji => {
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    }
  });

  it('verifies Riot Games Official Data Dragon full HD splash URLs for all skins', () => {
    let totalSkins = 0;
    for (const champ of champions) {
      expect(champ.skins.length).toBeGreaterThan(0);
      for (const skin of champ.skins) {
        totalSkins++;
        expect(skin.num).toBeGreaterThanOrEqual(0);
        expect(skin.splashFullUrl).toContain('ddragon.leagueoflegends.com/cdn/img/champion/splash/');
        expect(skin.splashFullUrl).not.toContain('undefined');
        expect(skin.splashFullUrl).not.toContain('NaN');
      }
    }
    expect(totalSkins).toBeGreaterThan(1000);
  });
});
