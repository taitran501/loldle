import { AbilityKey, BonusState, Champion, GameMode, PlayType, Skin } from '../types';
import { isEmojiEligible } from './emoji';

export const GAME_STATE_STORAGE_KEY = 'loldle_game_state_v3';
export const LEGACY_GAME_STATE_STORAGE_KEY = 'loldle_game_state_v2';
export const GAME_STATE_VERSION = 3 as const;
export const LEGACY_GAME_STATE_VERSION = 2 as const;
export const GAME_MODES: GameMode[] = ['classic', 'quote', 'ability', 'emoji', 'splash'];

export interface PersistedModeState {
  targetId: string;
  skinId?: number;
  abilityKey?: AbilityKey;
  quoteIndex?: number;
  guesses: string[];
  isSolved: boolean;
  isSurrendered?: boolean;
  bonus?: BonusState;
  emojiClueRevision?: string;
}

export interface PersistedGameState {
  version: typeof GAME_STATE_VERSION;
  currentMode: GameMode;
  playType: PlayType;
  daily: {
    utcDate: string;
    modes: Record<GameMode, PersistedModeState | null>;
  };
  unlimited: {
    modes: Record<GameMode, PersistedModeState | null>;
  };
}

export interface ModeState {
  target: Champion;
  skin?: Skin;
  abilityKey: AbilityKey;
  quoteIndex: number;
  bonus?: BonusState;
  isSurrendered?: boolean;
  guesses: Champion[];
  isSolved: boolean;
}

export type ModeStateMap = Record<GameMode, ModeState | null>;
export type SessionState = Record<PlayType, ModeStateMap>;

const isGameMode = (value: unknown): value is GameMode =>
  typeof value === 'string' && GAME_MODES.includes(value as GameMode);

const isPlayType = (value: unknown): value is PlayType => value === 'daily' || value === 'unlimited';

const isAbilityKey = (value: unknown): value is AbilityKey =>
  value === 'P' || value === 'Q' || value === 'W' || value === 'E' || value === 'R';

const emptyModes = (): Record<GameMode, PersistedModeState | null> => ({
  classic: null,
  quote: null,
  ability: null,
  emoji: null,
  splash: null,
});

export const createEmptyModeStateMap = (): ModeStateMap => ({
  classic: null,
  quote: null,
  ability: null,
  emoji: null,
  splash: null,
});

export const createEmptySessionState = (): SessionState => ({
  daily: createEmptyModeStateMap(),
  unlimited: createEmptyModeStateMap(),
});

export const createDefaultPersistedGameState = (utcDate: string): PersistedGameState => ({
  version: GAME_STATE_VERSION,
  currentMode: 'classic',
  playType: 'unlimited',
  daily: { utcDate, modes: emptyModes() },
  unlimited: { modes: emptyModes() },
});

const sanitizeBonus = (value: unknown): BonusState | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Partial<BonusState>;
  if (raw.status !== 'pending' && raw.status !== 'correct' && raw.status !== 'missed' && raw.status !== 'skipped') {
    return undefined;
  }

  // A pending/skipped bonus has no user selection to restore. Dropping stray
  // selection fields also keeps malformed storage from making the UI look
  // completed before the bonus is actually answered.
  if (raw.status === 'pending' || raw.status === 'skipped') {
    return { status: raw.status };
  }

  return {
    status: raw.status,
    ...(isAbilityKey(raw.selectionKey) ? { selectionKey: raw.selectionKey } : {}),
    ...(typeof raw.selectionSkinId === 'number' && Number.isFinite(raw.selectionSkinId)
      ? { selectionSkinId: raw.selectionSkinId }
      : {}),
  };
};

const sanitizeMode = (value: unknown): PersistedModeState | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<PersistedModeState>;
  if (typeof raw.targetId !== 'string' || !Array.isArray(raw.guesses)) return null;
  if (!raw.guesses.every(guess => typeof guess === 'string')) return null;
  const bonus = sanitizeBonus(raw.bonus);

  return {
    targetId: raw.targetId,
    ...(typeof raw.skinId === 'number' && Number.isFinite(raw.skinId) ? { skinId: raw.skinId } : {}),
    ...(isAbilityKey(raw.abilityKey) ? { abilityKey: raw.abilityKey } : {}),
    ...(typeof raw.quoteIndex === 'number' && Number.isInteger(raw.quoteIndex) && raw.quoteIndex >= 0
      ? { quoteIndex: raw.quoteIndex }
      : {}),
    guesses: raw.guesses.filter((guess): guess is string => typeof guess === 'string'),
    isSolved: raw.isSolved === true,
    ...(raw.isSurrendered === true ? { isSurrendered: true } : {}),
    ...(bonus ? { bonus } : {}),
    ...(typeof raw.emojiClueRevision === 'string' && raw.emojiClueRevision.length > 0
      ? { emojiClueRevision: raw.emojiClueRevision }
      : {}),
  };
};

const sanitizeModes = (value: unknown, resetEmoji = false): Record<GameMode, PersistedModeState | null> => {
  const raw = value && typeof value === 'object' ? value as Partial<Record<GameMode, unknown>> : {};
  return Object.fromEntries(GAME_MODES.map(mode => [mode, resetEmoji && mode === 'emoji' ? null : sanitizeMode(raw[mode])])) as Record<GameMode, PersistedModeState | null>;
};

const getPersistedDailyDate = (value: unknown, utcDate: string): string => {
  const daily = value && typeof value === 'object' ? (value as { daily?: unknown }).daily : undefined;
  return daily && typeof daily === 'object' && typeof (daily as { utcDate?: unknown }).utcDate === 'string'
    ? (daily as { utcDate: string }).utcDate
    : utcDate;
};

const deserializeState = (parsed: Partial<PersistedGameState>, utcDate: string, resetEmoji: boolean): PersistedGameState => {
  const fallback = createDefaultPersistedGameState(utcDate);
  const daily = parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : undefined;
  const dailyDate = getPersistedDailyDate(parsed, utcDate);
  return {
    version: GAME_STATE_VERSION,
    currentMode: isGameMode(parsed.currentMode) && !(resetEmoji && parsed.currentMode === 'emoji')
      ? parsed.currentMode
      : fallback.currentMode,
    playType: isPlayType(parsed.playType) ? parsed.playType : fallback.playType,
    daily: {
      utcDate,
      modes: dailyDate === utcDate ? sanitizeModes(daily?.modes, resetEmoji) : emptyModes(),
    },
    unlimited: {
      modes: sanitizeModes(parsed.unlimited?.modes, resetEmoji),
    },
  };
};

export function loadPersistedGameState(
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
  utcDate: string
): PersistedGameState {
  const fallback = createDefaultPersistedGameState(utcDate);
  if (!storage) return fallback;

  try {
    const saved = storage.getItem(GAME_STATE_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && (parsed as { version?: unknown }).version === GAME_STATE_VERSION) {
        return deserializeState(parsed as Partial<PersistedGameState>, utcDate, false);
      }
    }

    const legacySaved = storage.getItem(LEGACY_GAME_STATE_STORAGE_KEY);
    if (legacySaved) {
      const legacyParsed: unknown = JSON.parse(legacySaved);
      if (legacyParsed && typeof legacyParsed === 'object'
        && (legacyParsed as { version?: unknown }).version === LEGACY_GAME_STATE_VERSION) {
        // v2 did not persist the catalog revision, so only Emoji records are
        // discarded. All other modes remain restorable and stats are stored
        // under a separate key.
        return deserializeState(legacyParsed as Partial<PersistedGameState>, utcDate, true);
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export function serializeGameState(
  currentMode: GameMode,
  playType: PlayType,
  sessions: SessionState,
  utcDate: string
): PersistedGameState {
  const serializeModes = (modes: ModeStateMap): Record<GameMode, PersistedModeState | null> =>
    Object.fromEntries(
      GAME_MODES.map(mode => {
        const state = modes[mode];
        if (!state) return [mode, null];
        return [mode, {
          targetId: state.target.id,
          ...(state.skin ? { skinId: state.skin.id } : {}),
          ...(state.abilityKey ? { abilityKey: state.abilityKey } : {}),
          ...(typeof state.quoteIndex === 'number' ? { quoteIndex: state.quoteIndex } : {}),
          guesses: state.guesses.map(guess => guess.id),
          isSolved: state.isSolved,
          ...(state.isSurrendered ? { isSurrendered: true } : {}),
          ...(state.bonus ? { bonus: state.bonus } : {}),
          ...(mode === 'emoji' && state.target.emojiClueRevision
            ? { emojiClueRevision: state.target.emojiClueRevision }
            : {}),
        } satisfies PersistedModeState];
      })
    ) as Record<GameMode, PersistedModeState | null>;

  return {
    version: GAME_STATE_VERSION,
    currentMode,
    playType,
    daily: { utcDate, modes: serializeModes(sessions.daily) },
    unlimited: { modes: serializeModes(sessions.unlimited) },
  };
}

export function hydrateModeState(
  persisted: PersistedModeState | null | undefined,
  champions: Champion[],
  mode?: GameMode
): ModeState | null {
  if (!persisted) return null;
  const target = champions.find(champion => champion.id === persisted.targetId);
  if (!target) return null;

  if (mode === 'emoji' && (!isEmojiEligible(target)
    || !persisted.emojiClueRevision
    || persisted.emojiClueRevision !== target.emojiClueRevision)) return null;

  // A round is only safe to restore when every referenced champion still
  // exists in the current dataset. Otherwise regenerate the whole record
  // instead of silently changing the clues underneath the player.
  if (!persisted.guesses.every(id => champions.some(champion => champion.id === id))) return null;

  const skin = mode === 'splash'
    ? (persisted.skinId === undefined
      ? target.skins[0]
      : target.skins.find(candidate => candidate.id === persisted.skinId))
    : undefined;
  if (persisted.skinId !== undefined && !skin) return null;

  if (mode === 'splash' && !skin) return null;

  if (mode === 'ability' && target.abilities.length === 0) return null;

  if (persisted.abilityKey && !target.abilities.some(ability => ability.key === persisted.abilityKey)) return null;

  if (persisted.quoteIndex !== undefined && persisted.quoteIndex >= target.quotes.length) return null;

  const persistedBonus = persisted.bonus;
  if (persistedBonus && (persistedBonus.status === 'correct' || persistedBonus.status === 'missed')) {
    if (mode === 'ability' && (!persistedBonus.selectionKey
      || !target.abilities.some(ability => ability.key === persistedBonus.selectionKey))) return null;
    if (mode === 'splash' && (persistedBonus.selectionSkinId === undefined
      || !target.skins.some(candidate => candidate.id === persistedBonus.selectionSkinId))) return null;
  }

  const abilityKey = persisted.abilityKey && target.abilities.some(ability => ability.key === persisted.abilityKey)
    ? persisted.abilityKey
    : target.abilities[0]?.key || 'Q';
  const quoteIndex = persisted.quoteIndex !== undefined && persisted.quoteIndex < target.quotes.length
    ? persisted.quoteIndex
    : 0;

  return {
    target,
    skin,
    abilityKey,
    quoteIndex,
    bonus: (mode === 'ability' || mode === 'splash')
      ? (persistedBonus || (persisted.isSolved ? { status: 'pending' } : undefined))
      : undefined,
    isSurrendered: persisted.isSurrendered,
    guesses: persisted.guesses
      .map(id => champions.find(champion => champion.id === id))
      .filter((champion): champion is Champion => Boolean(champion)),
    isSolved: persisted.isSolved,
  };
}
