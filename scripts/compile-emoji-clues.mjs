import fs from 'node:fs/promises';
import path from 'node:path';

const RESEARCH_DIR = path.resolve('scripts/emoji-research');
const OUTPUT_FILE = path.resolve('scripts/emoji-clues.json');
const DATA_FILE = path.resolve('public/data/champions.json');
const RANGE_KEYS = ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z'];
const KEY_ALIASES = {
  monkeyking: 'wukong',
  nunu: 'nunuwillump',
  renata: 'renataglasc'
};

// The independent review is the final gate for a range. Its suggested set is
// preferred for needs_review records; pass records retain the curator set.
const MANUAL_OVERRIDES = {
  ambessa: ['🗡️', '⛓️', '👊', '🔀', '💨'],
  bard: ['🔔', '👻', '🌀', '🚪'],
  elise: ['🕷️', '🧍', '🪂', '🔄'],
  galio: ['🗿', '🛡️', '⬇️', '💥'],
  hwei: ['🎨', '🔥', '😌', '🌀'],
  ivern: ['🌳', '🌼', '🪨', '🛡️'],
  janna: ['🌪️', '🙏', '🛡️', '🌀'],
  lulu: ['🧚', '✨', '🍄', '⬆️', '🔄'],
  mel: ['🌹', '🪞', '☀️', '🪤'],
  nasus: ['🐕', '🏜️', '📈', '🌪️'],
  nautilus: ['⚓', '🌊', '🪝', '🤿', '⬆️'],
  nidalee: ['🐆', '🌿', '🎯', '🐾'],
  nunu: ['🧒', '⛄', '❄️', '⚪', '🌨️'],
  pantheon: ['🛡️', '🔱', '☄️', '⬇️', '💥'],
  ryze: ['📜', '🌍', '🔒', '🌀', '⚡'],
  seraphine: ['🎤', '🪩', '🔁', '👥', '💖'],
  sona: ['🎻', '🤫', '🎵', '🔊'],
  wukong: ['🐒', '🪄', '👥', '🌪️'],
  xayah: ['🪶', '🗡️', '💑', '🪃'],
  xinzhao: ['🔱', '3️⃣', '🛡️', '⭕'],
  yunara: ['📿', '🏹', '🌀', '⚡'],
  zaahen: ['🔱', '👿', '♾️', '⚔️', '🏜️'],
  zac: ['🦠', '🫧', '🤸', '♻️', '🧪']
};

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function validateClues(key, clues) {
  if (!Array.isArray(clues)) {
    throw new Error(`Missing emoji array for ${key}`);
  }

  const normalized = [...new Set(clues.filter(emoji => typeof emoji === 'string' && emoji.trim().length > 0))];
  if (normalized.length < 4 || normalized.length > 6) {
    throw new Error(`${key} must contain 4-6 unique emoji clues`);
  }

  return normalized;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(RESEARCH_DIR, file), 'utf8'));
}

async function main() {
  const curations = (await Promise.all(RANGE_KEYS.map(range => readJson(`emoji-curation-${range}.json`)))).flat();
  const reviews = (await Promise.all(RANGE_KEYS.map(range => readJson(`emoji-review-${range}.json`)))).flat();
  const reviewByKey = new Map(reviews.map(review => [review.championKey, review]));
  const cluesByKey = {};

  for (const curation of curations) {
    const review = reviewByKey.get(curation.championKey);
    const reviewedClues = review?.status === 'needs_review' && Array.isArray(review.suggestedEmojis)
      ? review.suggestedEmojis
      : curation.emojis;
    const outputKey = KEY_ALIASES[curation.championKey] || curation.championKey;
    cluesByKey[outputKey] = validateClues(outputKey, reviewedClues);
  }

  for (const [key, clues] of Object.entries(MANUAL_OVERRIDES)) {
    const outputKey = KEY_ALIASES[key] || key;
    cluesByKey[outputKey] = validateClues(outputKey, clues);
  }

  const localChampions = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const missing = localChampions
    .map(champion => normalizeKey(champion.id))
    .map(key => KEY_ALIASES[key] || key)
    .filter(key => !cluesByKey[key]);
  if (missing.length > 0) {
    throw new Error(`Emoji map is missing local champions: ${missing.join(', ')}`);
  }

  const output = Object.fromEntries(Object.entries(cluesByKey).sort(([left], [right]) => left.localeCompare(right)));
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const statusCounts = reviews.reduce((counts, review) => {
    counts[review.status] = (counts[review.status] || 0) + 1;
    return counts;
  }, {});
  console.log(`Compiled ${Object.keys(output).length} emoji clue sets from ${curations.length} curated records.`);
  console.log(`Review status: ${JSON.stringify(statusCounts)}.`);
  console.log(`Wrote ${OUTPUT_FILE}.`);
}

main().catch(error => {
  console.error('Failed to compile emoji clues:', error);
  process.exit(1);
});
