import { describe, expect, it } from 'vitest';
import { championNameMatchesQuery, normalizeChampionSearch } from '../../src/utils/search';

describe('champion search engine', () => {
  it('matches only the beginning of a normalized champion name', () => {
    expect(championNameMatchesQuery('Aatrox', 'A')).toBe(true);
    expect(championNameMatchesQuery('Ahri', 'a')).toBe(true);
    expect(championNameMatchesQuery('Dr. Mundo', 'A')).toBe(false);
    expect(championNameMatchesQuery('Aurelion Sol', 'sol')).toBe(false);
  });

  it('ignores punctuation and accents while preserving prefix semantics', () => {
    expect(normalizeChampionSearch("Kai'Sa")).toBe('kaisa');
    expect(championNameMatchesQuery("Kai'Sa", 'kaisa')).toBe(true);
    expect(championNameMatchesQuery('Dr. Mundo', 'drm')).toBe(true);
  });

  it('does not treat an empty query as a match', () => {
    expect(championNameMatchesQuery('Ahri', '')).toBe(false);
    expect(championNameMatchesQuery('Ahri', '...')).toBe(false);
  });
});
