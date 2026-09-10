import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const RESEARCH_DIR = path.resolve('scripts/emoji-research');
const OUTPUT_FILE = path.resolve('scripts/emoji-clues.json');
const REPORT_FILE = path.resolve('scripts/emoji-catalog-report.json');
const DATA_FILE = path.resolve('public/data/champions.json');
const RANGE_KEYS = ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z'];
const EMOJI_MIN_CLUES = 4;
const EMOJI_MAX_CLUES = 6;
const EMOJI_RELEASE_GATE = 50;
const KEY_ALIASES = {
  monkeyking: 'wukong',
  nunu: 'nunuwillump',
  renata: 'renataglasc'
};

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveKey(value) {
  const normalized = normalizeKey(value);
  return KEY_ALIASES[normalized] || normalized;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidEmojiGrapheme(value) {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return false;
  const graphemes = [...segmenter.segment(value)].map(item => item.segment);
  if (graphemes.length !== 1) return false;

  // Extended pictographic covers the common emoji blocks and symbols such as
  // ©/⚙️; Emoji also covers keycaps and other valid Unicode emoji sequences.
  return /\p{Extended_Pictographic}/u.test(value) || /\p{Emoji}/u.test(value);
}

function validateRecord(record, range, index) {
  const prefix = `Catalog ${range}[${index}]`;
  if (!record || typeof record !== 'object') throw new Error(`${prefix} must be an object`);

  const rawChampionKey = normalizeKey(record.championKey);
  const championKey = resolveKey(rawChampionKey);
  if (!rawChampionKey) throw new Error(`${prefix} is missing championKey`);
  const expectedLetters = {
    'a-d': 'abcd',
    'e-h': 'efgh',
    'i-l': 'ijkl',
    'm-p': 'mnop',
    'q-t': 'qrst',
    'u-z': 'uvwxyz'
  }[range];
  if (!expectedLetters.includes(rawChampionKey[0])) throw new Error(`${prefix} is outside its ${range} range`);

  if (!Array.isArray(record.clues)
    || record.clues.length < EMOJI_MIN_CLUES
    || record.clues.length > EMOJI_MAX_CLUES
    || !record.clues.every(isValidEmojiGrapheme)) {
    throw new Error(`${prefix} must contain ${EMOJI_MIN_CLUES}-${EMOJI_MAX_CLUES} valid emoji graphemes`);
  }

  const source = record.source;
  if (!source || typeof source !== 'object') throw new Error(`${prefix} is missing source provenance`);
  if (typeof source.title !== 'string' || source.title.trim().length === 0) throw new Error(`${prefix} source.title is required`);
  if (typeof source.url !== 'string' || !/^https:\/\/[^\s]+$/i.test(source.url)) throw new Error(`${prefix} source.url must be HTTPS`);
  if (!isValidDate(source.puzzleDate)) throw new Error(`${prefix} source.puzzleDate must be YYYY-MM-DD`);
  if (!isValidDate(source.accessedAt)) throw new Error(`${prefix} source.accessedAt must be YYYY-MM-DD`);
  if (source.kind !== 'official-loldle' && source.kind !== 'loldle-archive') {
    throw new Error(`${prefix} source.kind is invalid`);
  }

  const verification = record.verification;
  if (!verification || typeof verification !== 'object' || verification.sourceMatched !== true
    || typeof verification.reviewedBy !== 'string' || verification.reviewedBy.trim().length === 0
    || !isValidDate(verification.reviewedAt)) {
    throw new Error(`${prefix} must have complete verification`);
  }

  if (record.status !== 'candidate' && record.status !== 'approved' && record.status !== 'rejected') {
    throw new Error(`${prefix} has invalid status`);
  }

  return {
    championKey,
    clues: [...record.clues],
    source: {
      title: source.title,
      url: source.url,
      puzzleDate: source.puzzleDate,
      accessedAt: source.accessedAt,
      kind: source.kind
    },
    verification: {
      sourceMatched: true,
      reviewedBy: verification.reviewedBy,
      reviewedAt: verification.reviewedAt,
      ...(typeof verification.notes === 'string' && verification.notes.length > 0
        ? { notes: verification.notes }
        : {})
    },
    status: record.status
  };
}

function getRevision(record) {
  return crypto.createHash('sha256')
    .update(JSON.stringify({
      championKey: record.championKey,
      clues: record.clues,
      source: record.source
    }))
    .digest('hex')
    .slice(0, 16);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function main() {
  const rawCatalogs = await Promise.all(
    RANGE_KEYS.map(range => readJson(path.join(RESEARCH_DIR, `emoji-catalog-${range}.json`)))
  );
  const records = rawCatalogs.flatMap((catalog, rangeIndex) => {
    if (!Array.isArray(catalog)) throw new Error(`Catalog ${RANGE_KEYS[rangeIndex]} must be an array`);
    return catalog.map((record, index) => validateRecord(record, RANGE_KEYS[rangeIndex], index));
  });

  const localChampions = await readJson(DATA_FILE);
  const localKeys = new Set(localChampions.map(champion => resolveKey(champion.id)));
  const seenKeys = new Set();
  const approved = [];
  let candidateCount = 0;
  let rejectedCount = 0;

  for (const record of records) {
    if (!localKeys.has(record.championKey)) throw new Error(`Catalog champion is not in local dataset: ${record.championKey}`);
    if (seenKeys.has(record.championKey)) throw new Error(`Duplicate catalog record: ${record.championKey}`);
    seenKeys.add(record.championKey);

    if (record.status === 'candidate') candidateCount += 1;
    if (record.status === 'rejected') rejectedCount += 1;
    if (record.status === 'approved') approved.push(record);
  }

  if (approved.length < EMOJI_RELEASE_GATE) {
    throw new Error(`Emoji release gate requires at least ${EMOJI_RELEASE_GATE} approved champions; found ${approved.length}`);
  }

  const approvedOutput = Object.fromEntries(
    approved
      .sort((left, right) => left.championKey.localeCompare(right.championKey))
      .map(record => [record.championKey, {
        clues: record.clues,
        status: 'approved',
        revision: getRevision(record),
        source: record.source,
        verification: record.verification
      }])
  );

  const missing = [...localKeys].filter(key => !seenKeys.has(key)).sort((left, right) => left.localeCompare(right));
  const sources = approved
    .map(record => ({
      championKey: record.championKey,
      title: record.source.title,
      url: record.source.url,
      puzzleDate: record.source.puzzleDate
    }))
    .sort((left, right) => left.championKey.localeCompare(right.championKey));

  const report = {
    version: 1,
    releaseGate: EMOJI_RELEASE_GATE,
    total: records.length,
    approved: approved.length,
    candidate: candidateCount,
    rejected: rejectedCount,
    missing,
    sources
  };

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(approvedOutput, null, 2)}\n`, 'utf8');
  await fs.writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Compiled ${approved.length} approved emoji clue sets from ${records.length} catalog records.`);
  console.log(`Missing roster entries: ${missing.length}; candidate: ${candidateCount}; rejected: ${rejectedCount}.`);
  console.log(`Wrote ${OUTPUT_FILE} and ${REPORT_FILE}.`);
}

main().catch(error => {
  console.error('Failed to compile emoji clues:', error);
  process.exit(1);
});
