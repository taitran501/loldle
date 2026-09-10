import { beforeEach, describe, expect, it } from 'vitest';
import { Champion } from '../../src/types';
import {
  GAME_STATE_STORAGE_KEY,
  LEGACY_GAME_STATE_STORAGE_KEY,
  createEmptySessionState,
  hydrateModeState,
  loadPersistedGameState,
  serializeGameState,
} from '../../src/utils/gameState';

const champion: Champion = {
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
    { key: 'P', name: 'Essence Theft', iconUrl: '/assets/abilities/Ahri_p.png' },
    { key: 'Q', name: 'Orb of Deception', iconUrl: '/assets/abilities/Ahri_q.png' },
  ],
  quotes: [
    { text: 'First', audioUrl: '/audio/first.ogg' },
    { text: 'Second', audioUrl: '/audio/second.ogg' },
  ],
  emojis: ['🦊', '🔮', '💖', '💎'],
  emojiClueStatus: 'approved',
  emojiClueRevision: 'test-revision',
  skins: [{ id: 103000, num: 0, name: 'default', splashCenteredUrl: '/skin.jpg', splashFullUrl: '/skin.jpg' }],
};

describe('game state persistence contract', () => {
  beforeEach(() => localStorage.clear());

  it('serializes compact IDs and hydrates champion objects for both sessions', () => {
    const sessions = createEmptySessionState();
    sessions.unlimited.classic = {
      target: champion,
      abilityKey: 'Q',
      quoteIndex: 1,
      guesses: [champion],
      isSolved: false,
    };
    sessions.daily.splash = {
      target: champion,
      skin: champion.skins[0],
      abilityKey: 'P',
      quoteIndex: 0,
      guesses: [],
      isSolved: true,
      bonus: { status: 'correct', selectionSkinId: 103000 },
    };

    const serialized = serializeGameState('classic', 'unlimited', sessions, '2026-09-09');
    expect(serialized.unlimited.modes.classic).toEqual({
      targetId: 'Ahri',
      abilityKey: 'Q',
      quoteIndex: 1,
      guesses: ['Ahri'],
      isSolved: false,
    });
    expect(serialized.daily.modes.splash?.bonus).toEqual({ status: 'correct', selectionSkinId: 103000 });

    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(serialized));
    const loaded = loadPersistedGameState(localStorage, '2026-09-09');
    expect(hydrateModeState(loaded.unlimited.modes.classic, [champion], 'classic')?.target).toBe(champion);
    expect(hydrateModeState(loaded.daily.modes.splash, [champion], 'splash')?.skin?.id).toBe(103000);
  });

  it('clears only Daily sessions when the UTC date changes', () => {
    const sessions = createEmptySessionState();
    sessions.daily.classic = {
      target: champion,
      abilityKey: 'Q',
      quoteIndex: 0,
      guesses: [champion],
      isSolved: true,
    };
    const serialized = serializeGameState('classic', 'daily', sessions, '2026-09-08');
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(serialized));

    const loaded = loadPersistedGameState(localStorage, '2026-09-09');
    expect(loaded.daily.utcDate).toBe('2026-09-09');
    expect(loaded.daily.modes.classic).toBeNull();
    expect(loaded.unlimited.modes.classic).toBeNull();
  });

  it('drops corrupted target records instead of throwing during hydration', () => {
    localStorage.setItem(LEGACY_GAME_STATE_STORAGE_KEY, JSON.stringify({
      version: 2,
      currentMode: 'classic',
      playType: 'unlimited',
      daily: { utcDate: '2026-09-09', modes: { classic: { targetId: 'Missing', guesses: [], isSolved: false } } },
      unlimited: { modes: { classic: { targetId: 'Missing', guesses: [], isSolved: false } } },
    }));
    const loaded = loadPersistedGameState(localStorage, '2026-09-09');
    expect(hydrateModeState(loaded.daily.modes.classic, [champion], 'classic')).toBeNull();
  });

  it('migrates v2 while resetting only Emoji sessions', () => {
    localStorage.setItem(LEGACY_GAME_STATE_STORAGE_KEY, JSON.stringify({
      version: 2,
      currentMode: 'classic',
      playType: 'unlimited',
      daily: {
        utcDate: '2026-09-09',
        modes: {
          classic: { targetId: 'Ahri', guesses: ['Ahri'], isSolved: false },
          emoji: { targetId: 'Ahri', guesses: [], isSolved: false },
        },
      },
      unlimited: {
        modes: {
          classic: { targetId: 'Ahri', guesses: ['Ahri'], isSolved: false },
          emoji: { targetId: 'Ahri', guesses: [], isSolved: false },
        },
      },
    }));

    const loaded = loadPersistedGameState(localStorage, '2026-09-09');
    expect(loaded.version).toBe(3);
    expect(loaded.unlimited.modes.classic?.targetId).toBe('Ahri');
    expect(loaded.daily.modes.classic?.targetId).toBe('Ahri');
    expect(loaded.daily.modes.emoji).toBeNull();
    expect(loaded.unlimited.modes.emoji).toBeNull();
  });

  it('persists the Emoji catalog revision and rejects stale revisions', () => {
    const sessions = createEmptySessionState();
    sessions.unlimited.emoji = {
      target: champion,
      abilityKey: 'Q',
      quoteIndex: 0,
      guesses: [],
      isSolved: false,
    };
    const serialized = serializeGameState('emoji', 'unlimited', sessions, '2026-09-09');
    expect(serialized.unlimited.modes.emoji?.emojiClueRevision).toBe('test-revision');
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(serialized));
    const loaded = loadPersistedGameState(localStorage, '2026-09-09');
    expect(hydrateModeState(loaded.unlimited.modes.emoji, [champion], 'emoji')).toBeTruthy();
    expect(hydrateModeState({ ...serialized.unlimited.modes.emoji!, emojiClueRevision: 'old' }, [champion], 'emoji')).toBeNull();
  });

  it('drops records with stale guesses or incomplete completed bonuses', () => {
    const staleGuess = {
      targetId: 'Ahri',
      abilityKey: 'Q',
      quoteIndex: 0,
      guesses: ['MissingChampion'],
      isSolved: false,
    } as const;
    const incompleteBonus = {
      targetId: 'Ahri',
      abilityKey: 'Q',
      quoteIndex: 0,
      guesses: ['Ahri'],
      isSolved: true,
      bonus: { status: 'correct' as const },
    } as const;

    expect(hydrateModeState(staleGuess, [champion], 'classic')).toBeNull();
    expect(hydrateModeState(incompleteBonus, [champion], 'ability')).toBeNull();
  });
});
