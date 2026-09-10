import { Champion } from '../types';
import { EMOJI_MAX_CLUES, EMOJI_MIN_CLUES } from './constants';

export const normalizeEmojiClues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  // The source sequence is data, not a set. Preserve both order and repeated
  // clues because that is part of what was published by the archive.
  return value.filter((emoji): emoji is string => typeof emoji === 'string' && emoji.length > 0);
};

export const isEmojiEligible = (champion: Champion): boolean => {
  if (champion.emojiClueStatus !== 'approved') return false;
  const clueCount = normalizeEmojiClues(champion.emojis).length;
  return clueCount >= EMOJI_MIN_CLUES && clueCount <= EMOJI_MAX_CLUES;
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
