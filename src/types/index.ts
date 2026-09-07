export interface Ability {
  key: 'P' | 'Q' | 'W' | 'E' | 'R';
  name: string;
  iconUrl: string;
}

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
  emojis: string[];
  skins: Skin[];
}

export type GameMode = 'classic' | 'quote' | 'ability' | 'emoji' | 'splash';

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
