import { Champion } from '../types';
import { EMOJI_MAX_CLUES, EMOJI_MIN_CLUES } from './constants';
import { hasEmojiRenderAsset } from './emojiRender';

// A source-backed archive row can still be visually inadequate for this mode.
// Keep Kayn out of the playable pool until a pure-emoji representation can
// identify the champion without pretending a generic weapon is his scythe.
const EMOJI_VISUAL_REVIEW_HOLD_KEYS = new Set(['kayn']);

const normalizeChampionKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const normalizeEmojiClues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  // The source sequence is data, not a set. Preserve both order and repeated
  // clues because that is part of what was published by the archive.
  return value.filter((emoji): emoji is string => typeof emoji === 'string' && emoji.length > 0);
};

export const isEmojiEligible = (champion: Champion): boolean => {
  if (champion.emojiClueStatus !== 'approved') return false;
  if (EMOJI_VISUAL_REVIEW_HOLD_KEYS.has(normalizeChampionKey(champion.id))) return false;

  const clues = normalizeEmojiClues(champion.emojis);
  const clueCountIsValid = clues.length >= EMOJI_MIN_CLUES && clues.length <= EMOJI_MAX_CLUES;
  const cluesHaveRenderAssets = clues.every(hasEmojiRenderAsset);

  return clueCountIsValid && cluesHaveRenderAssets;
};

export const getEmojiPool = (champions: Champion[]): Champion[] => champions.filter(isEmojiEligible);

export const getEmojiRevealCount = (
  emojiCount: number,
  guessCount: number,
  isSolved: boolean
): number => {
  const safeEmojiCount = Math.max(0, Math.floor(emojiCount));
  if (safeEmojiCount === 0) return 0;
  if (isSolved) return safeEmojiCount;

  const safeGuessCount = Math.max(0, Math.floor(guessCount));
  return Math.min(safeEmojiCount, safeGuessCount + 1);
};
