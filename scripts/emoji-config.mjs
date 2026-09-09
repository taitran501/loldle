import fs from 'node:fs/promises';

const EMOJI_CLUES_FILE = new URL('./emoji-clues.json', import.meta.url);
const EMOJI_MIN_CLUES = 4;
const EMOJI_MAX_CLUES = 6;

export const EMOJI_CLUES = JSON.parse(await fs.readFile(EMOJI_CLUES_FILE, 'utf8'));

const KEY_ALIASES = {
  monkeyking: 'wukong',
  nunu: 'nunuwillump',
  renata: 'renataglasc'
};

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getEmojiClues(championKey) {
  const normalizedKey = normalizeKey(championKey);
  const resolvedKey = KEY_ALIASES[normalizedKey] || normalizedKey;
  const configured = EMOJI_CLUES[resolvedKey];

  if (!Array.isArray(configured)) {
    throw new Error(`Missing emoji config for ${championKey} (resolved key: ${resolvedKey})`);
  }

  const clues = [...new Set(configured.filter(emoji => typeof emoji === 'string' && emoji.trim().length > 0))];
  if (clues.length < EMOJI_MIN_CLUES || clues.length > EMOJI_MAX_CLUES) {
    throw new Error(`Emoji config for ${championKey} must contain ${EMOJI_MIN_CLUES}-${EMOJI_MAX_CLUES} unique clues`);
  }

  return clues;
}

export { EMOJI_MIN_CLUES, EMOJI_MAX_CLUES };
