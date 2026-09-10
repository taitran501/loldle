import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Champion } from '../../src/types';
import { EMOJI_MAX_CLUES, EMOJI_MIN_CLUES, EMOJI_RELEASE_GATE } from '../../src/utils/constants';

type CompiledEmojiRecord = {
  clues: string[];
  status: 'approved';
  revision: string;
  source: {
    title: string;
    url: string;
    puzzleDate: string;
    accessedAt: string;
    kind: 'official-loldle' | 'loldle-archive';
  };
  verification: {
    sourceMatched: boolean;
    reviewedBy: string;
    reviewedAt: string;
    notes?: string;
  };
};

describe('Dataset & Asset Integrity Tests', () => {
  const jsonPath = path.resolve(process.cwd(), 'public/data/champions.json');
  const emojiMapPath = path.resolve(process.cwd(), 'scripts/emoji-clues.json');
  const reportPath = path.resolve(process.cwd(), 'scripts/emoji-catalog-report.json');
  expect(fs.existsSync(jsonPath)).toBe(true);
  expect(fs.existsSync(emojiMapPath)).toBe(true);
  expect(fs.existsSync(reportPath)).toBe(true);

  const champions: Champion[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const emojiMap: Record<string, CompiledEmojiRecord> = JSON.parse(fs.readFileSync(emojiMapPath, 'utf-8'));
  const report: {
    approved: number;
    candidate: number;
    rejected: number;
    missing: string[];
    sources: Array<{ championKey: string; url: string; puzzleDate: string }>;
  } = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const resolveEmojiKey = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ({
      monkeyking: 'wukong',
      nunu: 'nunuwillump',
      renata: 'renataglasc'
    } as Record<string, string>)[normalized] || normalized;
  };

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

  it('verifies all champions have ≥10 quotes with valid text and audio URLs', () => {
    for (const champ of champions) {
      expect(champ.quotes).toBeDefined();
      expect(Array.isArray(champ.quotes)).toBe(true);
      expect(champ.quotes.length).toBeGreaterThanOrEqual(10);

      for (const q of champ.quotes) {
        expect(typeof q.text).toBe('string');
        expect(q.text.trim().length).toBeGreaterThan(0);
        expect(typeof q.audioUrl).toBe('string');
        expect(q.audioUrl.length).toBeGreaterThan(0);
        expect(q.audioUrl.startsWith('https://') || q.audioUrl.startsWith('/')).toBe(true);
        expect(q.audioUrl).not.toContain('undefined');
        expect(q.audioUrl).not.toContain('NaN');
      }
    }
  }, 15_000);

  it('keeps only source-backed approved emoji records in the runtime dataset', () => {
    const approvedChampions = champions.filter(champ => champ.emojiClueStatus === 'approved');
    expect(approvedChampions.length).toBeGreaterThanOrEqual(EMOJI_RELEASE_GATE);
    expect(report.approved).toBe(approvedChampions.length);
    expect(report.candidate).toBe(0);
    expect(report.rejected).toBe(0);
    expect(report.missing.length).toBe(champions.length - approvedChampions.length);
    expect(report.sources).toHaveLength(approvedChampions.length);

    for (const champ of champions) {
      const key = resolveEmojiKey(champ.id);
      const compiled = emojiMap[key];

      expect(['approved', 'unavailable']).toContain(champ.emojiClueStatus);
      if (champ.emojiClueStatus === 'approved') {
        expect(compiled).toBeDefined();
        expect(compiled.status).toBe('approved');
        expect(compiled.revision).toMatch(/^[a-f0-9]{16}$/);
        expect(compiled.clues).toEqual(champ.emojis);
        expect(champ.emojis.length).toBeGreaterThanOrEqual(EMOJI_MIN_CLUES);
        expect(champ.emojis.length).toBeLessThanOrEqual(EMOJI_MAX_CLUES);
        expect(compiled.source.url).toMatch(/^https:\/\//);
        expect(compiled.source.puzzleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(compiled.verification.sourceMatched).toBe(true);
        expect(compiled.verification.reviewedBy).toBeTruthy();
        expect(compiled.verification.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(champ.emojis).toEqual([]);
        expect(compiled).toBeUndefined();
      }
    }
  });

  it('preserves verified source fixtures, including repeated clues', () => {
    expect(emojiMap.sylas.clues).toEqual(['©', '⛓️', '😤', '💨']);
    expect(emojiMap.lux.clues).toEqual(['🌟', '✨', '🔦', '🙂']);
    expect(emojiMap.orianna.clues).toEqual(['⚙️', '🔮', '♻️', '👩', '🤖']);
    expect(emojiMap.talon.clues).toEqual(['🗡️', '🩸', '🏙️', '🌒', '👤']);
    expect(emojiMap.rumble.clues).toEqual(['🔥', '🤖', '⚙️', '😡', '🚀']);
    expect(emojiMap.ivern.clues).toEqual(['🌳', '😊', '🍄', '🌼', '🤝']);
    expect(emojiMap.blitzcrank.clues).toEqual(['🥊', '🪢', '🪢', '🤖']);
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
