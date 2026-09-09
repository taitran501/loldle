/**
 * Normalize champion names and user input to make punctuation and accents
 * harmless while keeping the search contract predictable.
 */
export function normalizeChampionSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Champion search is intentionally prefix-based. A one-letter query such as
 * "a" should only expose champions whose names begin with A, rather than
 * every champion whose name happens to contain an A.
 */
export function championNameMatchesQuery(name: string, query: string): boolean {
  const normalizedQuery = normalizeChampionSearch(query);
  if (!normalizedQuery) return false;
  return normalizeChampionSearch(name).startsWith(normalizedQuery);
}
