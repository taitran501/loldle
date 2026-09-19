import { describe, expect, it } from 'vitest';
import { getEmojiPool, getEmojiRevealCount, isEmojiEligible, normalizeEmojiClues } from '../../src/utils/emoji';
import { EMOJI_RENDER_SPRITESHEET_URL, getEmojiRenderAsset, hasEmojiRenderAsset } from '../../src/utils/emojiRender';
import { Champion } from '../../src/types';

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

  it('maps the source Unicode string to the Apple emoji data coordinates', () => {
    expect(getEmojiRenderAsset('🗡️')).toMatchObject({
      id: 'dagger_knife',
      unified: '1f5e1-fe0f',
      x: 32,
      y: 10,
    });
    expect(getEmojiRenderAsset('🧚‍♀️')).toMatchObject({
      id: 'female_fairy',
      unified: '1f9da-200d-2640-fe0f',
    });
    expect(getEmojiRenderAsset('🗡️')).not.toBeNull();
    expect(EMOJI_RENDER_SPRITESHEET_URL).toBe(
      'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/sheets-256/64.png'
    );
  });

  it('normalizes presentation selectors without inventing a different clue', () => {
    expect(getEmojiRenderAsset('©')).toMatchObject({ id: 'copyright', unified: '00a9-fe0f' });
    expect(hasEmojiRenderAsset('🪄')).toBe(true);
    expect(hasEmojiRenderAsset('not-an-emoji')).toBe(false);
  });

  it('does not invent a Kayn weapon symbol when the source only provides a dagger', () => {
    const kayn = {
      id: 'Kayn',
      emojis: ['🌑', '🗡️', '👤', '🔵', '🔴'],
      emojiClueStatus: 'approved',
    } as Champion;

    expect(normalizeEmojiClues(kayn.emojis)).toEqual(['🌑', '🗡️', '👤', '🔵', '🔴']);
    expect(isEmojiEligible(kayn)).toBe(false);
    expect(getEmojiPool([kayn])).toEqual([]);
  });

  it('keeps an unconfigured champion as its source sequence', () => {
    const unknownChampion = {
      id: 'UnknownChampion',
      emojis: ['🦊', '🔮', '💖', '💎'],
    } as Champion;

    expect(normalizeEmojiClues(unknownChampion.emojis)).toEqual(['🦊', '🔮', '💖', '💎']);
  });
});
