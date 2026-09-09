export const normalizeEmojiClues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(
    value.filter((emoji): emoji is string => typeof emoji === 'string' && emoji.trim().length > 0)
  ));
};

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
