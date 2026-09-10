import { Champion, GameMode, Skin } from '../types';
import { isEmojiEligible } from './emoji';

function stringHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyTarget(
  champions: Champion[],
  mode: GameMode,
  dateStr = getTodayDateString()
): { champion: Champion; skin?: Skin; abilityKey?: 'P' | 'Q' | 'W' | 'E' | 'R'; quoteIndex?: number } {
  const pool = mode === 'emoji' ? champions.filter(isEmojiEligible) : champions;
  if (!pool.length) throw new Error(mode === 'emoji' ? 'No champions available for emoji' : 'Champions list is empty');

  const seed = stringHash(`${dateStr}-${mode}`);
  const champIndex = seed % pool.length;
  const champion = pool[champIndex];

  let skin: Skin | undefined;
  if (mode === 'splash' && champion.skins.length > 0) {
    const skinSeed = stringHash(`${dateStr}-splash-skin`);
    const skinIndex = skinSeed % champion.skins.length;
    skin = champion.skins[skinIndex];
  }

  let abilityKey: 'P' | 'Q' | 'W' | 'E' | 'R' | undefined;
  if (mode === 'ability' && champion.abilities.length > 0) {
    const abilitySeed = stringHash(`${dateStr}-ability-key`);
    const abilityIndex = abilitySeed % champion.abilities.length;
    abilityKey = champion.abilities[abilityIndex].key;
  }

  let quoteIndex: number | undefined;
  if (mode === 'quote' && champion.quotes && champion.quotes.length > 0) {
    const quoteSeed = stringHash(`${dateStr}-quote-index`);
    quoteIndex = quoteSeed % champion.quotes.length;
  }

  return { champion, skin, abilityKey, quoteIndex };
}

export function getRandomTarget(
  champions: Champion[],
  mode: GameMode,
  excludeIds: string[] = []
): { champion: Champion; skin?: Skin; abilityKey?: 'P' | 'Q' | 'W' | 'E' | 'R'; quoteIndex?: number } {
  const eligibleChampions = mode === 'emoji' ? champions.filter(isEmojiEligible) : champions;
  const available = eligibleChampions.filter(c => !excludeIds.includes(c.id));
  const pool = available.length > 0 ? available : eligibleChampions;

  if (!pool.length) throw new Error(mode === 'emoji' ? 'No champions available for emoji' : 'Champions list is empty');

  const randomIndex = Math.floor(Math.random() * pool.length);
  const champion = pool[randomIndex];

  let skin: Skin | undefined;
  if (mode === 'splash' && champion.skins.length > 0) {
    const skinIndex = Math.floor(Math.random() * champion.skins.length);
    skin = champion.skins[skinIndex];
  }

  let abilityKey: 'P' | 'Q' | 'W' | 'E' | 'R' | undefined;
  if (mode === 'ability' && champion.abilities.length > 0) {
    const abilityIndex = Math.floor(Math.random() * champion.abilities.length);
    abilityKey = champion.abilities[abilityIndex].key;
  }

  let quoteIndex: number | undefined;
  if (mode === 'quote' && champion.quotes && champion.quotes.length > 0) {
    quoteIndex = Math.floor(Math.random() * champion.quotes.length);
  }

  return { champion, skin, abilityKey, quoteIndex };
}
