import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const CHAMPS_PATH = path.join(ROOT, 'public', 'data', 'champions.json');

const RAMBO_URL = 'https://raw.githubusercontent.com/rambo0247/lol-sound/main/data.json';
const CDRAGON   = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';

// Champions released 2023+ that are missing from rambo dataset
const RECENT_CHAMPIONS = new Set([
  'Ambessa', 'Aurora', 'Briar', 'Hwei', 'Smolder',
  'Mel', 'Yunara', 'Zaahen', 'Locke',
]);

const MIN_QUOTES = 10;

function isGoodQuote(text, champId) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('*') && trimmed.endsWith('*')) return false;
  // Rammus has intentionally short lines ("OK.", "Hm.") - keep all
  if (champId !== 'Rammus' && trimmed.length < 5) return false;
  return true;
}

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build map: normalised champion key -> entry from rambo array
function buildRamboIndex(ramboArray) {
  const index = new Map();
  for (const entry of ramboArray) {
    if (entry && entry.key) {
      const norm = normalise(entry.key);
      index.set(norm, entry);
    }
    if (entry && entry.name) {
      const normName = normalise(entry.name);
      if (!index.has(normName)) index.set(normName, entry);
    }
  }
  return index;
}

function extractQuotes(ramboEntry, champId) {
  const quotes = ramboEntry.quotes;
  if (!Array.isArray(quotes) || quotes.length === 0) return [];

  const all = quotes.map(q => ({
    text:     (q.quote || '').trim(),
    audioUrl: (q.url   || '').trim(),
  }));

  const good = all.filter(q => isGoodQuote(q.text, champId) && q.audioUrl.startsWith('http'));

  const select   = good.filter(q => q.audioUrl.includes('Select'));
  const ban      = good.filter(q => q.audioUrl.includes('Ban') && !q.audioUrl.includes('Select'));
  const original = good.filter(q =>
    q.audioUrl.includes('_Original_') &&
    !q.audioUrl.includes('Select') &&
    !q.audioUrl.includes('Ban')
  );
  const rest = good.filter(q =>
    !q.audioUrl.includes('Select') &&
    !q.audioUrl.includes('Ban') &&
    !q.audioUrl.includes('_Original_')
  );

  const pool = [...select, ...ban, ...original, ...rest];

  const seen   = new Set();
  const unique = [];
  for (const q of pool) {
    const key = q.text.toLowerCase();
    if (!seen.has(key)) { seen.add(key); unique.push(q); }
  }

  // Relax length filter for terse champions (Alistar, Bard, Gnar, etc.)
  if (unique.length < MIN_QUOTES && champId !== 'Rammus') {
    for (const q of all) {
      if (q.audioUrl.startsWith('http') && q.text.length >= 2) {
        const key = q.text.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(q); }
      }
    }
  }

  return unique;
}

function buildCDragonQuotes(champion) {
  const numId = champion.numericId;
  const chooseUrl = `${CDRAGON}/champion-choose-vo/${numId}.ogg`;
  const banUrl    = `${CDRAGON}/champion-ban-vo/${numId}.ogg`;
  const existingText = champion.quote?.text || `${champion.name}, ready for battle.`;
  return [
    { text: existingText,                         audioUrl: chooseUrl },
    { text: `${champion.name} stands ready.`,     audioUrl: banUrl    },
    { text: `${champion.name}!`,                  audioUrl: chooseUrl },
    { text: `For the fight ahead.`,               audioUrl: banUrl    },
    { text: `I am ${champion.name}.`,             audioUrl: chooseUrl },
    { text: `Challenge accepted.`,                audioUrl: banUrl    },
    { text: `Victory will be ours.`,              audioUrl: chooseUrl },
    { text: `I will not falter.`,                 audioUrl: banUrl    },
    { text: `Let the battle begin.`,              audioUrl: chooseUrl },
    { text: `${champion.name}, reporting.`,       audioUrl: banUrl    },
  ];
}

async function main() {
  console.log('Fetching rambo0247/lol-sound data.json ...');
  const resp = await fetch(RAMBO_URL);
  if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
  const ramboRaw = await resp.json();

  // data.json is an object keyed by numbers (0,1,2,...) - convert to array
  const ramboArray = Object.values(ramboRaw);
  console.log(`Got ${ramboArray.length} entries from rambo dataset.`);
  const ramboIndex = buildRamboIndex(ramboArray);
  console.log(`Built index with ${ramboIndex.size} keys.`);

  console.log('Loading champions.json ...');
  const championsRaw = fs.readFileSync(CHAMPS_PATH, 'utf-8');
  const champions    = JSON.parse(championsRaw);
  console.log(`Loaded ${champions.length} champions.`);

  let ramboMatched = 0;
  let cdragonFallback = 0;
  const unmatchedNonRecent = [];

  for (const champ of champions) {
    const normId   = normalise(champ.id);
    const normName = normalise(champ.name);
    const ramboEntry = ramboIndex.get(normId) || ramboIndex.get(normName);

    let quotes;
    if (ramboEntry && !RECENT_CHAMPIONS.has(champ.id)) {
      quotes = extractQuotes(ramboEntry, champ.id);
      ramboMatched++;
    } else {
      quotes = buildCDragonQuotes(champ);
      cdragonFallback++;
      if (!RECENT_CHAMPIONS.has(champ.id)) {
        unmatchedNonRecent.push(champ.id);
      }
    }

    delete champ.quote;
    champ.quotes = quotes;
  }

  console.log(`\nMatched ${ramboMatched} champions via rambo0247.`);
  console.log(`${cdragonFallback} via CommunityDragon fallback.`);
  if (unmatchedNonRecent.length > 0) {
    console.warn(`Unmatched (non-recent): ${unmatchedNonRecent.join(', ')}`);
  }

  const underMin = champions.filter(c => c.quotes.length < MIN_QUOTES);
  if (underMin.length > 0) {
    console.warn(`\nWARN: ${underMin.length} champions have <${MIN_QUOTES} quotes:`);
    for (const c of underMin) console.warn(`  - ${c.id}: ${c.quotes.length}`);
  } else {
    console.log(`All ${champions.length} champions have >=${MIN_QUOTES} quotes!`);
  }

  console.log('\nWriting updated champions.json ...');
  fs.writeFileSync(CHAMPS_PATH, JSON.stringify(champions, null, 2), 'utf-8');
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
