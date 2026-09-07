import { describe, it, expect } from 'vitest';
import { compareChampions } from '../../src/utils/compare';
import { Champion } from '../../src/types';

const mockTarget: Champion = {
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
  abilities: [],
  quote: { text: "Don't you trust me?", audioUrl: '' },
  emojis: ['🦊', '🔮', '💖', '💎'],
  skins: []
};

const mockGuessExact: Champion = { ...mockTarget };

const mockGuessPartial: Champion = {
  ...mockTarget,
  id: 'Akali',
  name: 'Akali',
  gender: 'Female',           // correct
  positions: ['Top', 'Middle'], // target is ['Middle'], guess has 'Middle' => partial
  species: ['Human'],         // incorrect
  resource: 'Energy',         // incorrect
  rangeType: ['Melee'],       // incorrect
  regions: ['Ionia'],         // correct
  releaseYear: 2010           // target is 2011 > 2010 => higher
};

const mockGuessDifferent: Champion = {
  ...mockTarget,
  id: 'Darius',
  name: 'Darius',
  gender: 'Male',             // incorrect
  positions: ['Top'],         // incorrect
  species: ['Human'],         // incorrect
  resource: 'Mana',           // correct
  rangeType: ['Melee'],       // incorrect
  regions: ['Noxus'],         // incorrect
  releaseYear: 2012           // target is 2011 < 2012 => lower
};

describe('compareChampions utility', () => {
  it('returns all correct when target and guess match exactly', () => {
    const result = compareChampions(mockTarget, mockGuessExact);

    expect(result.genderMatch).toBe('correct');
    expect(result.positionsMatch).toBe('correct');
    expect(result.speciesMatch).toBe('correct');
    expect(result.resourceMatch).toBe('correct');
    expect(result.rangeTypeMatch).toBe('correct');
    expect(result.regionsMatch).toBe('correct');
    expect(result.releaseYearMatch).toEqual({ status: 'correct' });
  });

  it('correctly calculates partial matches and higher release year direction', () => {
    const result = compareChampions(mockTarget, mockGuessPartial);

    expect(result.genderMatch).toBe('correct');
    expect(result.positionsMatch).toBe('partial');
    expect(result.speciesMatch).toBe('incorrect');
    expect(result.resourceMatch).toBe('incorrect');
    expect(result.rangeTypeMatch).toBe('incorrect');
    expect(result.regionsMatch).toBe('correct');
    expect(result.releaseYearMatch).toEqual({ status: 'incorrect', direction: 'higher' });
  });

  it('correctly calculates lower release year direction', () => {
    const result = compareChampions(mockTarget, mockGuessDifferent);

    expect(result.genderMatch).toBe('incorrect');
    expect(result.positionsMatch).toBe('incorrect');
    expect(result.speciesMatch).toBe('incorrect');
    expect(result.resourceMatch).toBe('correct');
    expect(result.releaseYearMatch).toEqual({ status: 'incorrect', direction: 'lower' });
  });

  it('is case-insensitive for single string attributes', () => {
    const uppercaseGuess: Champion = {
      ...mockTarget,
      gender: 'FEMALE',
      resource: 'MANA'
    };
    const result = compareChampions(mockTarget, uppercaseGuess);
    expect(result.genderMatch).toBe('correct');
    expect(result.resourceMatch).toBe('correct');
  });
});
