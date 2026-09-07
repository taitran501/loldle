import { Champion, ClassicComparison, MatchStatus } from '../types';

function compareArrays(targetArr: string[], guessArr: string[]): MatchStatus {
  const targetLower = targetArr.map(s => s.toLowerCase());
  const guessLower = guessArr.map(s => s.toLowerCase());

  const targetSet = new Set(targetLower);
  const guessSet = new Set(guessLower);

  const intersection = guessLower.filter(x => targetSet.has(x));

  if (targetSet.size === guessSet.size && intersection.length === targetSet.size) {
    return 'correct';
  }
  if (intersection.length > 0) {
    return 'partial';
  }
  return 'incorrect';
}

export function compareChampions(target: Champion, guess: Champion): ClassicComparison {
  const genderMatch: MatchStatus =
    target.gender.toLowerCase() === guess.gender.toLowerCase() ? 'correct' : 'incorrect';

  const positionsMatch = compareArrays(target.positions, guess.positions);
  const speciesMatch = compareArrays(target.species, guess.species);

  const resourceMatch: MatchStatus =
    target.resource.toLowerCase() === guess.resource.toLowerCase() ? 'correct' : 'incorrect';

  const rangeTypeMatch = compareArrays(target.rangeType, guess.rangeType);
  const regionsMatch = compareArrays(target.regions, guess.regions);

  let releaseYearMatch: ClassicComparison['releaseYearMatch'];
  if (target.releaseYear === guess.releaseYear) {
    releaseYearMatch = { status: 'correct' };
  } else if (target.releaseYear > guess.releaseYear) {
    releaseYearMatch = { status: 'incorrect', direction: 'higher' };
  } else {
    releaseYearMatch = { status: 'incorrect', direction: 'lower' };
  }

  return {
    champion: guess,
    genderMatch,
    positionsMatch,
    speciesMatch,
    resourceMatch,
    rangeTypeMatch,
    regionsMatch,
    releaseYearMatch,
  };
}
