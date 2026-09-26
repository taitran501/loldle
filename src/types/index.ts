export interface Ability {
  key: AbilityKey;
  name: string;
  iconUrl: string;
}

export type AbilityKey = 'P' | 'Q' | 'W' | 'E' | 'R';

export interface Skin {
  id: number;
  num: number;
  name: string;
  splashCenteredUrl: string;
  splashFullUrl: string;
}

export interface Champion {
  id: string;
  numericId: number;
  name: string;
  title: string;
  gender: 'Male' | 'Female' | 'Other';
  positions: string[];
  species: string[];
  resource: string;
  rangeType: string[];
  regions: string[];
  releaseYear: number;
  releaseDate?: string;
  attackRange?: number;
  lastSkinDate?: string;
  lastSkinName?: string;
  iconUrl: string;
  abilities: Ability[];
  quote?: {
    text: string;
    audioUrl: string;
  };
  quotes: {
    text: string;
    audioUrl: string;
  }[];
  /** Source-backed clue sequence. Unavailable champions have an empty array. */
  emojis: string[];
  emojiClueStatus: 'approved' | 'unavailable';
  emojiClueRevision?: string;
  skins: Skin[];
}

export interface LoLItem {
  id: string;
  name: string;
  iconUrl: string;
  totalGold: number;
  combineGold: number;
  from: string[];
  statsSummary: string[];
  passiveHint: string;
  tags: string[];
  isTargetEligible: boolean;
}

export type HigherLowerMetric = 'skins' | 'releaseYear' | 'attackRange' | 'daysSinceLastSkin';

export type HigherLowerFilter = 'all' | HigherLowerMetric;

export type GameMode = 'classic' | 'quote' | 'ability' | 'emoji' | 'splash' | 'higherlower' | 'item';

export type PlayType = 'daily' | 'unlimited';

export type BonusStatus = 'pending' | 'correct' | 'missed' | 'skipped';

export interface BonusState {
  status: BonusStatus;
  selectionKey?: AbilityKey;
  selectionSkinId?: number;
}

export type MatchStatus = 'correct' | 'partial' | 'incorrect';

export interface ClassicComparison {
  champion: Champion;
  genderMatch: MatchStatus;
  positionsMatch: MatchStatus;
  speciesMatch: MatchStatus;
  resourceMatch: MatchStatus;
  rangeTypeMatch: MatchStatus;
  regionsMatch: MatchStatus;
  releaseYearMatch: {
    status: MatchStatus;
    direction?: 'higher' | 'lower'; // 'higher' means target was released later (up arrow)
  };
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
}

export interface ModeStats {
  played: number;
  won: number;
  guessDistribution: Record<number, number>;
}

export interface StatsBucket extends GameStats {
  byMode: Record<GameMode, ModeStats>;
  unattributed: ModeStats;
}

export interface GameStatsV2 {
  version: 2;
  daily: StatsBucket;
  unlimited: StatsBucket;
}
