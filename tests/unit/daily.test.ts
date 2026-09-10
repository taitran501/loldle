import { describe, it, expect } from 'vitest';
import { getTodayDateString, getDailyTarget, getRandomTarget } from '../../src/utils/daily';
import { Champion } from '../../src/types';

const mockChampions: Champion[] = [
  {
    id: 'Aatrox',
    numericId: 266,
    name: 'Aatrox',
    title: 'the Darkin Blade',
    gender: 'Male',
    positions: ['Top'],
    species: ['Darkin'],
    resource: 'Manaless',
    rangeType: ['Melee'],
    regions: ['Runeterra', 'Shurima'],
    releaseYear: 2013,
    iconUrl: '/assets/champions/Aatrox.png',
    abilities: [
      { key: 'P', name: 'Deathbringer Stance', iconUrl: '/assets/abilities/Aatrox_P.png' },
      { key: 'Q', name: 'The Darkin Blade', iconUrl: '/assets/abilities/Aatrox_Q.png' },
      { key: 'W', name: 'Infernal Chains', iconUrl: '/assets/abilities/Aatrox_W.png' },
      { key: 'E', name: 'Umbral Dash', iconUrl: '/assets/abilities/Aatrox_E.png' },
      { key: 'R', name: 'World Ender', iconUrl: '/assets/abilities/Aatrox_R.png' }
    ],
    quote: { text: 'Now, hear the silence of annihilation!', audioUrl: 'https://example.com/aatrox.ogg' },
    emojis: ['🗡️', '🩸', '💀', '👿'],
    skins: [
      { id: 266000, num: 0, name: 'default', splashCenteredUrl: '', splashFullUrl: 'https://example.com/0.jpg' },
      { id: 266001, num: 1, name: 'Justicar Aatrox', splashCenteredUrl: '', splashFullUrl: 'https://example.com/1.jpg' }
    ]
  },
  {
    id: 'Ahri',
    numericId: 103,
    name: 'Ahri',
    title: 'the Nine-Tailed Fox',
    gender: 'Female',
    positions: ['Middle'],
    species: ['Vastayan'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Ionia'],
    releaseYear: 2011,
    iconUrl: '/assets/champions/Ahri.png',
    abilities: [
      { key: 'P', name: 'Essence Theft', iconUrl: '/assets/abilities/Ahri_P.png' },
      { key: 'Q', name: 'Orb of Deception', iconUrl: '/assets/abilities/Ahri_Q.png' },
      { key: 'W', name: 'Fox-Fire', iconUrl: '/assets/abilities/Ahri_W.png' },
      { key: 'E', name: 'Charm', iconUrl: '/assets/abilities/Ahri_E.png' },
      { key: 'R', name: 'Spirit Rush', iconUrl: '/assets/abilities/Ahri_R.png' }
    ],
    quote: { text: "Don't you trust me?", audioUrl: 'https://example.com/ahri.ogg' },
    emojis: ['🦊', '🔮', '💖', '💎'],
    skins: [
      { id: 103000, num: 0, name: 'default', splashCenteredUrl: '', splashFullUrl: 'https://example.com/ahri_0.jpg' }
    ]
  },
  {
    id: 'Akali',
    numericId: 84,
    name: 'Akali',
    title: 'the Rogue Assassin',
    gender: 'Female',
    positions: ['Middle', 'Top'],
    species: ['Human'],
    resource: 'Energy',
    rangeType: ['Melee'],
    regions: ['Ionia'],
    releaseYear: 2010,
    iconUrl: '/assets/champions/Akali.png',
    abilities: [
      { key: 'P', name: 'Assassin\'s Mark', iconUrl: '/assets/abilities/Akali_P.png' },
      { key: 'Q', name: 'Five Point Strike', iconUrl: '/assets/abilities/Akali_Q.png' }
    ],
    quote: { text: 'Fear the assassin with no master.', audioUrl: 'https://example.com/akali.ogg' },
    emojis: ['🥷', '💨', '🗡️', '🐉'],
    skins: []
  }
];

describe('daily utility tests', () => {
  it('getTodayDateString returns YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  describe('getDailyTarget', () => {
    it('is completely deterministic for same date and mode across multiple executions', () => {
      const target1 = getDailyTarget(mockChampions, 'classic', '2026-09-07');
      const target2 = getDailyTarget(mockChampions, 'classic', '2026-09-07');
      expect(target1.champion.id).toBe(target2.champion.id);
    });

    it('generates consistent abilityKey in ability mode', () => {
      const target1 = getDailyTarget(mockChampions, 'ability', '2026-09-07');
      const target2 = getDailyTarget(mockChampions, 'ability', '2026-09-07');
      expect(target1.abilityKey).toBe(target2.abilityKey);
      expect(['P', 'Q', 'W', 'E', 'R']).toContain(target1.abilityKey);
    });

    it('generates consistent skin in splash mode', () => {
      const target1 = getDailyTarget(mockChampions, 'splash', '2026-09-07');
      const target2 = getDailyTarget(mockChampions, 'splash', '2026-09-07');
      if (target1.champion.skins.length > 0) {
        expect(target1.skin).toBeDefined();
        expect(target1.skin?.id).toBe(target2.skin?.id);
      }
    });

    it('filters Emoji targets to approved source-backed champions', () => {
      const emojiChampions = mockChampions.map((champion, index) => ({
        ...champion,
        emojiClueStatus: index === 1 ? 'approved' as const : 'unavailable' as const,
        emojiClueRevision: index === 1 ? 'test-revision' : undefined,
      }));

      expect(getDailyTarget(emojiChampions, 'emoji', '2026-09-07').champion.id).toBe('Ahri');
      expect(getRandomTarget(emojiChampions, 'emoji').champion.id).toBe('Ahri');
    });

    it('throws error when champion list is empty', () => {
      expect(() => getDailyTarget([], 'classic')).toThrow('Champions list is empty');
    });
  });

  describe('getRandomTarget', () => {
    it('respects excludeIds and does not pick excluded champions', () => {
      const excluded = ['Aatrox', 'Ahri'];
      for (let i = 0; i < 20; i++) {
        const result = getRandomTarget(mockChampions, 'classic', excluded);
        expect(result.champion.id).toBe('Akali');
      }
    });

    it('falls back to full pool gracefully if all champions are excluded', () => {
      const excluded = ['Aatrox', 'Ahri', 'Akali'];
      const result = getRandomTarget(mockChampions, 'classic', excluded);
      expect(mockChampions.map(c => c.id)).toContain(result.champion.id);
    });

    it('selects valid ability key when mode is ability', () => {
      const result = getRandomTarget(mockChampions, 'ability');
      if (result.champion.abilities.length > 0) {
        expect(result.abilityKey).toBeDefined();
        const availableKeys = result.champion.abilities.map(a => a.key);
        expect(availableKeys).toContain(result.abilityKey);
      }
    });

    it('selects valid skin when mode is splash and skins exist', () => {
      const aatroxOnly = [mockChampions[0]];
      const result = getRandomTarget(aatroxOnly, 'splash');
      expect(result.skin).toBeDefined();
      expect([266000, 266001]).toContain(result.skin?.id);
    });
  });
});
