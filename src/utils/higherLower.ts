import { Champion, HigherLowerFilter, HigherLowerMetric } from '../types';

export const HIGHER_LOWER_METRICS: HigherLowerMetric[] = [
  'skins',
  'releaseYear',
  'attackRange',
  'daysSinceLastSkin',
];

export const DAILY_HIGHER_LOWER_ROUNDS = 10;
export const DAILY_HIGHER_LOWER_LIVES = 3;

export interface MetricMetadata {
  id: HigherLowerMetric;
  label: string;
  shortLabel: string;
  higherVerb: string;
  lowerVerb: string;
  unit: string;
  description: string;
}

export const METRIC_METADATA: Record<HigherLowerMetric, MetricMetadata> = {
  skins: {
    id: 'skins',
    label: 'Total Skins',
    shortLabel: 'Total Skins',
    higherVerb: 'MORE skins',
    lowerVerb: 'FEWER skins',
    unit: 'skins',
    description: 'Total official skins (including base)',
  },
  releaseYear: {
    id: 'releaseYear',
    label: 'Release Year',
    shortLabel: 'Release Year',
    higherVerb: 'LATER (Newer)',
    lowerVerb: 'EARLIER (Older)',
    unit: '',
    description: 'Year the champion was released in League of Legends',
  },
  attackRange: {
    id: 'attackRange',
    label: 'Attack Range',
    shortLabel: 'Attack Range',
    higherVerb: 'HIGHER range',
    lowerVerb: 'LOWER range',
    unit: 'range',
    description: 'Base basic attack range in game units',
  },
  daysSinceLastSkin: {
    id: 'daysSinceLastSkin',
    label: 'Days Since Last Skin',
    shortLabel: 'Skin Drought',
    higherVerb: 'LONGER wait',
    lowerVerb: 'SHORTER wait',
    unit: 'days',
    description: 'Days elapsed since the champion last received a skin',
  },
};

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Compute days between two YYYY-MM-DD UTC dates.
 */
export function calculateDaysBetween(fromDateStr: string, toDateStr: string): number {
  const fromParts = fromDateStr.split('-').map(Number);
  const toParts = toDateStr.split('-').map(Number);
  if (fromParts.length !== 3 || toParts.length !== 3) return 365;

  const fromUtc = Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2]);
  const toUtc = Date.UTC(toParts[0], toParts[1] - 1, toParts[2]);
  if (Number.isNaN(fromUtc) || Number.isNaN(toUtc)) return 365;

  const diffDays = Math.floor((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function getMetricValue(
  champion: Champion,
  metric: HigherLowerMetric,
  referenceDateStr = '2026-09-26'
): number {
  switch (metric) {
    case 'skins':
      return Array.isArray(champion.skins) ? champion.skins.length : 1;
    case 'releaseYear':
      return champion.releaseYear;
    case 'attackRange':
      if (typeof champion.attackRange === 'number' && champion.attackRange > 0) {
        return champion.attackRange;
      }
      return champion.rangeType.includes('Ranged') ? 550 : 175;
    case 'daysSinceLastSkin': {
      const lastDate = champion.lastSkinDate || champion.releaseDate || `${champion.releaseYear}-06-15`;
      return calculateDaysBetween(lastDate, referenceDateStr);
    }
  }
}

export function formatMetricDisplay(value: number, metric: HigherLowerMetric): string {
  switch (metric) {
    case 'skins':
      return `${value.toLocaleString()} ${value === 1 ? 'Skin' : 'Skins'}`;
    case 'releaseYear':
      return `${value}`;
    case 'attackRange':
      return `${value.toLocaleString()} Range`;
    case 'daysSinceLastSkin':
      return `${value.toLocaleString()} Days`;
  }
}

export function getMetricSubtext(champion: Champion, metric: HigherLowerMetric): string {
  switch (metric) {
    case 'skins': {
      const latestSkin = champion.lastSkinName || champion.skins?.[champion.skins.length - 1]?.name;
      return latestSkin ? `Latest: ${latestSkin}` : `${champion.regions.join(', ')}`;
    }
    case 'releaseYear':
      return champion.releaseDate ? `Released: ${champion.releaseDate}` : `Region: ${champion.regions.join(', ')}`;
    case 'attackRange':
      return `${champion.rangeType.join(', ')} • ${champion.positions.join(', ')}`;
    case 'daysSinceLastSkin': {
      const skinName = champion.lastSkinName || champion.skins?.[champion.skins.length - 1]?.name || 'Base';
      const dateLabel = champion.lastSkinDate || `${champion.releaseYear}`;
      return `Last: ${skinName} (${dateLabel})`;
    }
  }
}

export function evaluateHigherLowerChoice(
  leftVal: number,
  rightVal: number,
  choice: 'higher' | 'lower'
): boolean {
  if (rightVal === leftVal) return true;
  if (choice === 'higher') return rightVal > leftVal;
  return rightVal < leftVal;
}

export function pickNextComparison(
  leftChampion: Champion,
  allChampions: Champion[],
  filter: HigherLowerFilter,
  seed: number,
  referenceDateStr: string,
  recentIds: string[] = []
): { rightChampion: Champion; metric: HigherLowerMetric } {
  const metric: HigherLowerMetric =
    filter === 'all'
      ? HIGHER_LOWER_METRICS[Math.abs(seed) % HIGHER_LOWER_METRICS.length]
      : filter;

  const leftVal = getMetricValue(leftChampion, metric, referenceDateStr);
  const excludeSet = new Set([leftChampion.id, ...recentIds.slice(-4)]);

  // Base pool: champions not recently seen with a strictly different metric value
  let baseCandidates = allChampions.filter(
    c => !excludeSet.has(c.id) && getMetricValue(c, metric, referenceDateStr) !== leftVal
  );

  if (baseCandidates.length === 0) {
    baseCandidates = allChampions.filter(
      c => c.id !== leftChampion.id && getMetricValue(c, metric, referenceDateStr) !== leftVal
    );
  }

  let candidates = baseCandidates;

  // Apply smart competitive proximity so matchups are challenging and never lopsided
  if (metric === 'attackRange') {
    const isPureClass = (c: Champion) => c.rangeType.length === 1 && !['Kayle', 'Jayce', 'Nidalee', 'Elise', 'Gnar'].includes(c.id);
    const isLeftMelee = leftVal <= 300;
    // Enforce Melee vs Melee (125-300) or Ranged vs Ranged (>300), excluding form-shifters
    const sameClass = baseCandidates.filter(c => {
      if (!isPureClass(c)) return false;
      const val = getMetricValue(c, 'attackRange', referenceDateStr);
      return isLeftMelee ? val <= 300 : val > 300;
    });

    // Prefer close range differences (e.g., 125 vs 150/175, or 525 vs 550/575)
    const tightClass = sameClass.filter(c => {
      const val = getMetricValue(c, 'attackRange', referenceDateStr);
      const maxDiff = isLeftMelee ? 75 : 100;
      return Math.abs(val - leftVal) <= maxDiff;
    });

    if (tightClass.length > 0) {
      candidates = tightClass;
    } else if (sameClass.length > 0) {
      candidates = sameClass;
    }
  } else if (metric === 'releaseYear') {
    const closeYears = baseCandidates.filter(
      c => Math.abs(getMetricValue(c, 'releaseYear', referenceDateStr) - leftVal) <= 4
    );
    if (closeYears.length > 0) candidates = closeYears;
  } else if (metric === 'skins') {
    const closeSkins = baseCandidates.filter(
      c => Math.abs(getMetricValue(c, 'skins', referenceDateStr) - leftVal) <= 5
    );
    if (closeSkins.length > 0) candidates = closeSkins;
  } else if (metric === 'daysSinceLastSkin') {
    const closeDays = baseCandidates.filter(
      c => Math.abs(getMetricValue(c, 'daysSinceLastSkin', referenceDateStr) - leftVal) <= 450
    );
    if (closeDays.length > 0) candidates = closeDays;
  }

  if (candidates.length === 0) {
    candidates = allChampions.filter(c => c.id !== leftChampion.id);
  }

  const index = Math.abs(hashString(`${seed}-${leftChampion.id}-${metric}`)) % Math.max(1, candidates.length);
  const rightChampion = candidates[index] || allChampions[0];

  return { rightChampion, metric };
}

export function getInitialHigherLowerPair(
  allChampions: Champion[],
  playType: 'daily' | 'unlimited',
  filter: HigherLowerFilter,
  dateStr: string
): { leftChampion: Champion; rightChampion: Champion; metric: HigherLowerMetric } {
  if (allChampions.length === 0) {
    throw new Error('Champions list is empty');
  }

  const baseSeed = playType === 'daily'
    ? hashString(`${dateStr}-higherlower-start-${filter}`)
    : Math.floor(Math.random() * 1_000_000);

  const leftChampion = allChampions[baseSeed % allChampions.length];
  const { rightChampion, metric } = pickNextComparison(
    leftChampion,
    allChampions,
    filter,
    baseSeed + 1,
    dateStr,
    [leftChampion.id]
  );

  return { leftChampion, rightChampion, metric };
}
