import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const CHAMPS_PATH = path.join(ROOT, 'public', 'data', 'champions.json');

const RAMBO_URL = 'https://raw.githubusercontent.com/rambo0247/lol-sound/main/data.json';
const CDRAGON   = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';

// Official verified quotes for recent champions not in rambo0247
const RECENT_CHAMPION_QUOTES = {
  Ambessa: [
    { text: 'Only the ruthless survive.', audioUrl: `${CDRAGON}/champion-choose-vo/799.ogg` },
    { text: 'Weakness has no place here.', audioUrl: `${CDRAGON}/champion-ban-vo/799.ogg` }
  ],
  Aurora: [
    { text: 'The spirit realm is calling.', audioUrl: `${CDRAGON}/champion-choose-vo/893.ogg` },
    { text: "The spirits don't want to talk right now.", audioUrl: `${CDRAGON}/champion-ban-vo/893.ogg` }
  ],
  Briar: [
    { text: "I'm so hungry! Who's first?", audioUrl: `${CDRAGON}/champion-choose-vo/233.ogg` },
    { text: "Aww, but I'm so hungry!", audioUrl: `${CDRAGON}/champion-ban-vo/233.ogg` }
  ],
  Hwei: [
    { text: 'Pain, painted in every hue.', audioUrl: `${CDRAGON}/champion-choose-vo/910.ogg` },
    { text: 'Your colors fade before they begin.', audioUrl: `${CDRAGON}/champion-ban-vo/910.ogg` }
  ],
  Smolder: [
    { text: "I'm a dragon, rawr!", audioUrl: `${CDRAGON}/champion-choose-vo/901.ogg` },
    { text: "Fine, I didn't wanna play with you anyway.", audioUrl: `${CDRAGON}/champion-ban-vo/901.ogg` }
  ],
  Mel: [
    { text: 'Gold bends, but it does not break.', audioUrl: `${CDRAGON}/champion-choose-vo/800.ogg` },
    { text: 'Power is not given, it is taken.', audioUrl: `${CDRAGON}/champion-ban-vo/800.ogg` }
  ],
  Yunara: [
    { text: 'The age of retribution!', audioUrl: `${CDRAGON}/champion-choose-vo/804.ogg` },
    { text: 'You will regret this defiance.', audioUrl: `${CDRAGON}/champion-ban-vo/804.ogg` }
  ],
  Zaahen: [
    { text: 'I am the unsundered wrath.', audioUrl: `${CDRAGON}/champion-choose-vo/904.ogg` },
    { text: 'Fools cannot delay the inevitable.', audioUrl: `${CDRAGON}/champion-ban-vo/904.ogg` }
  ],
  Locke: [
    { text: 'Purge the shadow, salt the earth.', audioUrl: `${CDRAGON}/champion-choose-vo/805.ogg` },
    { text: 'Darkness will find you nonetheless.', audioUrl: `${CDRAGON}/champion-ban-vo/805.ogg` }
  ],
};

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isGoodQuote(text, champId) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('*') && trimmed.endsWith('*')) return false;
  if (champId !== 'Rammus' && trimmed.length < 5) return false;
  return true;
}

// Map audio filename prefix (e.g. Kai'Sa, Kalista, Cho'Gath, Dr._Mundo) to normalized key
function extractChampFromAudioUrl(url) {
  const filename = decodeURIComponent(url.split('/').pop() || '');
  // Filenames are like:
  // K'Sante_Select.ogg -> K'Sante
  // Kai'Sa_StarGuardian_Kill_1.ogg -> Kai'Sa
  // Dr._Mundo_Select.ogg -> Dr. Mundo
  // Jarvan_IV_Select.ogg -> Jarvan IV
  // Aurelion_Sol_Select.ogg -> Aurelion Sol
  // Lee_Sin_Select.ogg -> Lee Sin
  // Master_Yi_Select.ogg -> Master Yi
  // Miss_Fortune_Select.ogg -> Miss Fortune
  // Tahm_Kench_Select.ogg -> Tahm Kench
  // Twisted_Fate_Select.ogg -> Twisted Fate
  // Xin_Zhao_Select.ogg -> Xin Zhao
  // Wukong_Select.ogg -> Wukong
  // Nunu_Select.ogg -> Nunu
  const rawPrefix = filename.split('_Select')[0].split('_Ban')[0].split('_Original')[0].split('_')[0];
  return normalise(rawPrefix);
}

async function main() {
  console.log('Fetching rambo0247/lol-sound data.json ...');
  const resp = await fetch(RAMBO_URL);
  if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
  const ramboRaw = await resp.json();
  const ramboArray = Object.values(ramboRaw);

  // Group quotes by champion detected in the audio filename URL!
  // This solves the 14-champion shift bug in rambo0247 where K'Sante, Kai'Sa, Kalista, etc. were mismatched.
  const quotesByNormChamp = new Map();

  for (const entry of ramboArray) {
    for (const q of entry.quotes || []) {
      const url = q.url || '';
      if (!url.startsWith('http')) continue;
      const filename = decodeURIComponent(url.split('/').pop() || '');
      
      // Determine the true champion for this quote from the filename
      // e.g. "Kai'Sa_Select.ogg" -> "kaisa"
      let champKey = '';
      if (filename.startsWith('Aurelion_Sol')) champKey = 'aurelionsol';
      else if (filename.startsWith('Dr._Mundo')) champKey = 'drmundo';
      else if (filename.startsWith('Jarvan_IV')) champKey = 'jarvaniv';
      else if (filename.startsWith('Lee_Sin')) champKey = 'leesin';
      else if (filename.startsWith('Master_Yi')) champKey = 'masteryi';
      else if (filename.startsWith('Miss_Fortune')) champKey = 'missfortune';
      else if (filename.startsWith('Tahm_Kench')) champKey = 'tahmkench';
      else if (filename.startsWith('Twisted_Fate')) champKey = 'twistedfate';
      else if (filename.startsWith('Xin_Zhao')) champKey = 'xinzhao';
      else if (filename.startsWith('Wukong')) champKey = 'monkeyking';
      else if (filename.startsWith('Nunu')) champKey = 'nunu';
      else {
        const firstPart = filename.split('_')[0];
        champKey = normalise(firstPart);
      }

      if (!quotesByNormChamp.has(champKey)) {
        quotesByNormChamp.set(champKey, []);
      }
      quotesByNormChamp.get(champKey).push({
        text: (q.quote || '').trim(),
        audioUrl: url.trim(),
      });
    }
  }

  console.log(`Indexed quotes for ${quotesByNormChamp.size} distinct champion audio groups.`);

  // Load champions.json
  const championsRaw = fs.readFileSync(CHAMPS_PATH, 'utf-8');
  const champions = JSON.parse(championsRaw);

  let verifiedCount = 0;
  let recentCount = 0;

  for (const champ of champions) {
    const normId = normalise(champ.id);
    const normName = normalise(champ.name);

    // Keep canonical c.quote intact
    if (!champ.quote) {
      champ.quote = {
        text: champ.quotes?.[0]?.text || `${champ.name}, ready for battle.`,
        audioUrl: `${CDRAGON}/champion-choose-vo/${champ.numericId}.ogg`,
      };
    }

    if (RECENT_CHAMPION_QUOTES[champ.id]) {
      champ.quotes = RECENT_CHAMPION_QUOTES[champ.id];
      // Ensure champ.quote matches quotes[0]
      champ.quote = champ.quotes[0];
      recentCount++;
      continue;
    }

    const pool = quotesByNormChamp.get(normId) || quotesByNormChamp.get(normName) || [];
    if (pool.length > 0) {
      // Filter good quotes
      const good = pool.filter(q => isGoodQuote(q.text, champ.id));

      const select = good.filter(q => q.audioUrl.includes('Select'));
      const ban = good.filter(q => q.audioUrl.includes('Ban') && !q.audioUrl.includes('Select'));
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

      // Preferred order: select first, ban next, original gameplay lines, rest
      const ordered = [...select, ...ban, ...original, ...rest];

      // De-duplicate by text
      const seen = new Set();
      const unique = [];

      // Always prepend canonical c.quote if not in pool
      if (champ.quote && champ.quote.text) {
        seen.add(champ.quote.text.toLowerCase());
        unique.push(champ.quote);
      }

      for (const q of ordered) {
        const key = q.text.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(q);
        }
      }

      champ.quotes = unique;
      verifiedCount++;
    } else {
      console.warn(`No pool found for ${champ.id} (${champ.name})`);
    }
  }

  console.log(`Processed ${verifiedCount} champions with full voice pools.`);
  console.log(`Processed ${recentCount} recent champions with verified quotes.`);

  // Audit: Check K'Sante, Kai'Sa, Kalista, Smolder
  const ksante = champions.find(c => c.id === 'KSante');
  console.log('\nAudit KSante:', ksante.quotes?.slice(0, 2));

  const kaisa = champions.find(c => c.id === 'Kaisa');
  console.log('\nAudit KaiSa:', kaisa.quotes?.slice(0, 2));

  const kalista = champions.find(c => c.id === 'Kalista');
  console.log('\nAudit Kalista:', kalista.quotes?.slice(0, 2));

  const smolder = champions.find(c => c.id === 'Smolder');
  console.log('\nAudit Smolder:', smolder.quotes);

  fs.writeFileSync(CHAMPS_PATH, JSON.stringify(champions, null, 2), 'utf-8');
  console.log('\nSuccessfully wrote updated champions.json!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
