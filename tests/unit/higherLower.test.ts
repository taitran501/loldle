import { describe, expect, it } from 'vitest';
import { Champion } from '../../src/types';
import {
  calculateDaysBetween,
  evaluateHigherLowerChoice,
  formatMetricDisplay,
  getInitialHigherLowerPair,
  getMetricValue,
  pickNextComparison,
} from '../../src/utils/higherLower';

const mockChampions: Champion[] = [
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
    releaseDate: '2011-12-14',
    attackRange: 550,
    lastSkinDate: '2024-06-12',
    lastSkinName: 'Immortalized Legend Ahri',
    iconUrl: '/assets/champions/Ahri.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(19).fill({ id: 1, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
  {
    id: 'Skarner',
    numericId: 72,
    name: 'Skarner',
    title: 'the Primordial Sovereign',
    gender: 'Male',
    positions: ['Jungle'],
    species: ['Brackern'],
    resource: 'Mana',
    rangeType: ['Melee'],
    regions: ['Ixtal'],
    releaseYear: 2011,
    releaseDate: '2011-08-09',
    attackRange: 150,
    lastSkinDate: '2020-11-24',
    lastSkinName: 'Cosmic Sting Skarner',
    iconUrl: '/assets/champions/Skarner.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(6).fill({ id: 2, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
  {
    id: 'Caitlyn',
    numericId: 51,
    name: 'Caitlyn',
    title: 'the Sheriff of Piltover',
    gender: 'Female',
    positions: ['Bottom'],
    species: ['Human'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Piltover'],
    releaseYear: 2011,
    releaseDate: '2011-01-04',
    attackRange: 650,
    lastSkinDate: '2023-07-20',
    lastSkinName: 'DRX Caitlyn',
    iconUrl: '/assets/champions/Caitlyn.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(16).fill({ id: 3, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
];

describe('higherLower utilities', () => {
  it('calculates metric values accurately for all 4 supported criteria', () => {
    expect(getMetricValue(mockChampions[0], 'skins', '2026-09-26')).toBe(19);
    expect(getMetricValue(mockChampions[0], 'releaseYear', '2026-09-26')).toBe(2011);
    expect(getMetricValue(mockChampions[0], 'attackRange', '2026-09-26')).toBe(550);

    const skarnerDays = getMetricValue(mockChampions[1], 'daysSinceLastSkin', '2026-09-26');
    const ahriDays = getMetricValue(mockChampions[0], 'daysSinceLastSkin', '2026-09-26');
    expect(skarnerDays).toBeGreaterThan(ahriDays);
  });

  it('computes UTC days between two dates deterministically', () => {
    expect(calculateDaysBetween('2026-09-16', '2026-09-26')).toBe(10);
  });

  it('formats metric display strings cleanly', () => {
    expect(formatMetricDisplay(19, 'skins')).toBe('19 Skins');
    expect(formatMetricDisplay(1, 'skins')).toBe('1 Skin');
    expect(formatMetricDisplay(2011, 'releaseYear')).toBe('2011');
    expect(formatMetricDisplay(550, 'attackRange')).toBe('550 Range');
  });

  it('evaluates higher and lower choices properly', () => {
    expect(evaluateHigherLowerChoice(10, 15, 'higher')).toBe(true);
    expect(evaluateHigherLowerChoice(10, 15, 'lower')).toBe(false);
    expect(evaluateHigherLowerChoice(550, 175, 'lower')).toBe(true);
    expect(evaluateHigherLowerChoice(550, 550, 'higher')).toBe(true);
  });

  it('picks a challenger in the same range class (Ranged vs Ranged / Melee vs Melee) for attackRange', () => {
    const { rightChampion, metric } = pickNextComparison(
      mockChampions[0], // Ahri (550 Ranged)
      mockChampions,
      'attackRange',
      42,
      '2026-09-26'
    );
    expect(metric).toBe('attackRange');
    expect(rightChampion.id).toBe('Caitlyn'); // Ranged (650) instead of Skarner (150 Melee)
    expect(getMetricValue(rightChampion, 'attackRange')).toBeGreaterThan(300);
  });

  it('returns deterministic initial pairs in daily mode', () => {
    const pair1 = getInitialHigherLowerPair(mockChampions, 'daily', 'all', '2026-09-26');
    const pair2 = getInitialHigherLowerPair(mockChampions, 'daily', 'all', '2026-09-26');
    expect(pair1.leftChampion.id).toBe(pair2.leftChampion.id);
    expect(pair1.rightChampion.id).toBe(pair2.rightChampion.id);
    expect(pair1.metric).toBe(pair2.metric);
  });
});
