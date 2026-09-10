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
  iconUrl: string;
  abilities: Ability[];
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

export type GameMode = 'classic' | 'quote' | 'ability' | 'emoji' | 'splash';

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
