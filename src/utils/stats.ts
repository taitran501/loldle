import { GameMode, GameStatsV2, ModeStats, PlayType, StatsBucket } from '../types';

export const STATS_STORAGE_KEY = 'loldle_stats_v2';
export const LEGACY_STATS_STORAGE_KEY = 'loldle_stats';

const GAME_MODES: GameMode[] = ['classic', 'quote', 'ability', 'emoji', 'splash'];

const emptyModeStats = (): ModeStats => ({
  played: 0,
  won: 0,
  guessDistribution: {},
});

export const createEmptyStatsBucket = (): StatsBucket => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {},
  byMode: Object.fromEntries(GAME_MODES.map(mode => [mode, emptyModeStats()])) as Record<GameMode, ModeStats>,
  unattributed: emptyModeStats(),
});

export const createDefaultStats = (): GameStatsV2 => ({
  version: 2,
  daily: createEmptyStatsBucket(),
  unlimited: createEmptyStatsBucket(),
});

const isGameMode = (value: unknown): value is GameMode =>
  typeof value === 'string' && GAME_MODES.includes(value as GameMode);

const asNonNegativeInt = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

const normalizeDistribution = (value: unknown): Record<number, number> => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, count]) => /^\d+$/.test(key) && asNonNegativeInt(count) > 0)
      .map(([key, count]) => [Number(key), asNonNegativeInt(count)])
  );
};

const normalizeModeStats = (value: unknown): ModeStats => {
  const raw = value && typeof value === 'object' ? value as Partial<ModeStats> : {};
  return {
    played: asNonNegativeInt(raw.played),
    won: asNonNegativeInt(raw.won),
    guessDistribution: normalizeDistribution(raw.guessDistribution),
  };
};

const normalizeBucket = (value: unknown): StatsBucket => {
  const raw = value && typeof value === 'object' ? value as Partial<StatsBucket> : {};
  const byMode = Object.fromEntries(
    GAME_MODES.map(mode => [mode, normalizeModeStats(raw.byMode?.[mode])])
  ) as Record<GameMode, ModeStats>;

  return {
    played: asNonNegativeInt(raw.played),
    won: asNonNegativeInt(raw.won),
    currentStreak: asNonNegativeInt(raw.currentStreak),
    maxStreak: Math.max(asNonNegativeInt(raw.maxStreak), asNonNegativeInt(raw.currentStreak)),
    guessDistribution: normalizeDistribution(raw.guessDistribution),
    byMode,
    unattributed: normalizeModeStats(raw.unattributed),
  };
};

const migrateLegacyStats = (value: unknown): GameStatsV2 => {
  const raw = value && typeof value === 'object' ? value as Partial<ModeStats> & {
    currentStreak?: unknown;
    maxStreak?: unknown;
  } : {};
  const legacy = createEmptyStatsBucket();
  legacy.played = asNonNegativeInt(raw.played);
  legacy.won = asNonNegativeInt(raw.won);
  legacy.currentStreak = asNonNegativeInt(raw.currentStreak);
  legacy.maxStreak = Math.max(asNonNegativeInt(raw.maxStreak), legacy.currentStreak);
  legacy.guessDistribution = normalizeDistribution(raw.guessDistribution);
  legacy.unattributed = {
    played: legacy.played,
    won: legacy.won,
    guessDistribution: { ...legacy.guessDistribution },
  };
  return { version: 2, daily: createEmptyStatsBucket(), unlimited: legacy };
};

export function loadStats(storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): GameStatsV2 {
  if (!storage) return createDefaultStats();

  try {
    const current = storage.getItem(STATS_STORAGE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (parsed && typeof parsed === 'object' && (parsed as { version?: unknown }).version === 2) {
        const raw = parsed as Partial<GameStatsV2>;
        return {
          version: 2,
          daily: normalizeBucket(raw.daily),
          unlimited: normalizeBucket(raw.unlimited),
        };
      }
    }

    const legacy = storage.getItem(LEGACY_STATS_STORAGE_KEY);
    return legacy ? migrateLegacyStats(JSON.parse(legacy)) : createDefaultStats();
  } catch {
    return createDefaultStats();
  }
}

export function recordWin(stats: GameStatsV2, playType: PlayType, mode: GameMode, guessCount: number): GameStatsV2 {
  const bucket = stats[playType];
  const modeStats = bucket.byMode[mode];
  const nextStreak = bucket.currentStreak + 1;
  const count = Math.max(1, Math.floor(guessCount));

  return {
    ...stats,
    [playType]: {
      ...bucket,
      played: bucket.played + 1,
      won: bucket.won + 1,
      currentStreak: nextStreak,
      maxStreak: Math.max(bucket.maxStreak, nextStreak),
      guessDistribution: {
        ...bucket.guessDistribution,
        [count]: (bucket.guessDistribution[count] || 0) + 1,
      },
      byMode: {
        ...bucket.byMode,
        [mode]: {
          ...modeStats,
          played: modeStats.played + 1,
          won: modeStats.won + 1,
          guessDistribution: {
            ...modeStats.guessDistribution,
            [count]: (modeStats.guessDistribution[count] || 0) + 1,
          },
        },
      },
    },
  } as GameStatsV2;
}

export function recordLoss(stats: GameStatsV2, playType: PlayType, mode: GameMode): GameStatsV2 {
  const bucket = stats[playType];
  const modeStats = bucket.byMode[mode];

  return {
    ...stats,
    [playType]: {
      ...bucket,
      played: bucket.played + 1,
      currentStreak: 0,
      byMode: {
        ...bucket.byMode,
        [mode]: {
          ...modeStats,
          played: modeStats.played + 1,
        },
      },
    },
  } as GameStatsV2;
}
