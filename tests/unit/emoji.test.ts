import { describe, expect, it } from 'vitest';
import { getEmojiRevealCount, normalizeEmojiClues } from '../../src/utils/emoji';

describe('emoji clue utilities', () => {
  it('preserves source order and repeated clues while removing invalid entries', () => {
    expect(normalizeEmojiClues(['🦊', '🔮', '🦊', '', null, '💖'])).toEqual(['🦊', '🔮', '🦊', '💖']);
  });

  it('reveals one additional clue per guess for any configured clue count', () => {
    expect(getEmojiRevealCount(4, 0, false)).toBe(1);
    expect(getEmojiRevealCount(5, 3, false)).toBe(4);
    expect(getEmojiRevealCount(6, 5, false)).toBe(6);
  });

  it('reveals every configured clue when solved', () => {
    expect(getEmojiRevealCount(6, 0, true)).toBe(6);
    expect(getEmojiRevealCount(0, 4, true)).toBe(0);
  });
});
