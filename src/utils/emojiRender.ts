import emojiData from '@emoji-mart/data/sets/15/apple.json';

// Emoji clues are stored as the original Unicode strings. This module only
// resolves those strings to the coordinates of the same rendered emoji asset;
// it never changes the clue into a semantically different symbol.
export const EMOJI_DATA_VERSION = '15';
export const EMOJI_RENDER_SET = 'apple';
export const EMOJI_RENDER_SPRITESHEET_VERSION = '15.0.1';
export const EMOJI_RENDER_SPRITESHEET_URL =
  `https://cdn.jsdelivr.net/npm/emoji-datasource-${EMOJI_RENDER_SET}@${EMOJI_RENDER_SPRITESHEET_VERSION}/img/${EMOJI_RENDER_SET}/sheets-256/64.png`;

interface EmojiMartSkin {
  unified: string;
  native: string;
  x?: number;
  y?: number;
}

interface EmojiMartEntry {
  id: string;
  skins: EmojiMartSkin[];
}

interface EmojiMartData {
  emojis: Record<string, EmojiMartEntry>;
  sheet: {
    cols: number;
    rows: number;
  };
}

export interface EmojiRenderAsset {
  id: string;
  unified: string;
  x: number;
  y: number;
  sheetColumns: number;
  sheetRows: number;
}

const APPLE_EMOJI_DATA = emojiData as unknown as EmojiMartData;

const stripPresentationSelectors = (value: string): string =>
  value.normalize('NFC').replace(/[\uFE0E\uFE0F]/g, '');

const RENDER_ENTRIES = Object.values(APPLE_EMOJI_DATA.emojis).flatMap(entry =>
  entry.skins
    .filter((skin): skin is EmojiMartSkin & { x: number; y: number } =>
      typeof skin.x === 'number' && typeof skin.y === 'number'
    )
    .map(skin => ({
      native: skin.native,
      normalizedNative: stripPresentationSelectors(skin.native),
      id: entry.id,
      unified: skin.unified,
      x: skin.x,
      y: skin.y,
    }))
);

const EXACT_RENDER_ENTRIES = new Map(RENDER_ENTRIES.map(entry => [entry.native, entry]));
const NORMALIZED_RENDER_ENTRIES = new Map(
  RENDER_ENTRIES.map(entry => [entry.normalizedNative, entry])
);

export const getEmojiRenderAsset = (emoji: string): EmojiRenderAsset | null => {
  if (typeof emoji !== 'string' || emoji.length === 0) return null;

  const entry =
    EXACT_RENDER_ENTRIES.get(emoji) ||
    NORMALIZED_RENDER_ENTRIES.get(stripPresentationSelectors(emoji));

  if (!entry) return null;

  return {
    id: entry.id,
    unified: entry.unified,
    x: entry.x,
    y: entry.y,
    sheetColumns: APPLE_EMOJI_DATA.sheet.cols,
    sheetRows: APPLE_EMOJI_DATA.sheet.rows,
  };
};

export const hasEmojiRenderAsset = (emoji: string): boolean =>
  getEmojiRenderAsset(emoji) !== null;
