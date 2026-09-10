import fs from 'node:fs/promises';
import path from 'node:path';
import { getEmojiConfig } from './emoji-config.mjs';

const LOLDLE_URL = 'https://raw.githubusercontent.com/joulsen/loldle-information-theory/main/resources/loldle-champ-data.json';
const MERAKI_URL = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json';
const CDRAGON_SUMMARY_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json';

// Normalize names for fuzzy mapping
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getEmojiFields(championKey) {
  const config = getEmojiConfig(championKey);
  if (config?.status !== 'approved') {
    return { emojis: [], emojiClueStatus: 'unavailable' };
  }

  return {
    emojis: [...config.clues],
    emojiClueStatus: 'approved',
    ...(config.revision ? { emojiClueRevision: config.revision } : {})
  };
}

// Verified official Champion Select Pick quotes (100% matched with champion-choose-vo audio)
const ICONIC_QUOTES = {
  aatrox: "Now, hear the silence of annihilation!",
  ahri: "Don't you trust me?",
  akali: "Fear the assassin with no master.",
  akshan: "Here's to getting even.",
  alistar: "Nothing can hold me back!",
  ambessa: "Only the ruthless survive.",
  amumu: "I thought you'd never pick me.",
  anivia: "On my wings.",
  annie: "You wanna play too? It'll be fun!",
  aphelios: "So many weapons, Aphelios. The deadliest is your faith.",
  ashe: "All the world on one arrow.",
  aurelionsol: "Naturally.",
  aurora: "The spirit realm is calling.",
  azir: "Shurima! Your emperor has returned!",
  bard: "*Whimsical chimes echo*",
  belveth: "All will become the Lavender Sea.",
  blitzcrank: "Fired up and ready to serve.",
  brand: "Ready to set the world on fire? Heheheh...",
  braum: "The heart is the strongest muscle.",
  briar: "I'm so hungry! Who's first?",
  caitlyn: "I'm on the case.",
  camille: "Precision is the difference between a butcher and a surgeon.",
  cassiopeia: "There is no antidote for me.",
  chogath: "You'd wish the world you know to end! Yesss...",
  corki: "I'm up to snuff, and gots me an ace machine!",
  darius: "They will regret opposing me.",
  diana: "A new moon is rising.",
  drmundo: "Mundo!",
  draven: "Welcome to the League of Draven.",
  ekko: "It's not about how much time you have, it's how you use it.",
  elise: "Only the spider is safe in her web.",
  evelynn: "You know you want me.",
  ezreal: "Time for a true display of skill!",
  fiddlesticks: "Fear...",
  fiora: "I long for a worthy opponent.",
  fizz: "Let me at 'em!",
  galio: "Time to make an impact!",
  gangplank: "Neither the flames nor the depths could claim me.",
  garen: "My heart and sword always for Demacia.",
  gnar: "Gnar gada!",
  gragas: "If you're buying, I'm in!",
  graves: "Dead man walking.",
  gwen: "Head high, chin up, scissors ready!",
  hecarim: "Behold the might of the Shadow Isles.",
  heimerdinger: "Order, entropy, a never-ending cycle.",
  hwei: "Pain, painted in every hue.",
  illaoi: "I'm not big on sermons; broken bones teach better lessons.",
  irelia: "Fight for the First Lands!",
  ivern: "My favorite color is spring.",
  janna: "The tempest is at your command.",
  jarvaniv: "By my will, this shall be finished!",
  jax: "Let's do this!",
  jayce: "I fight for a brighter tomorrow.",
  jhin: "In carnage, I bloom, like a flower in the dawn.",
  jinx: "Rules are made to be broken. Like buildings! Or people!",
  kaisa: "Are you the hunter... or the prey?",
  kalista: "Death to all betrayers.",
  karma: "Always trust your spirit.",
  karthus: "Agony, ecstasy, peace. Every passing has a beauty all its own.",
  kassadin: "The balance of power must be preserved.",
  katarina: "Violence solves everything!",
  kayle: "They shall tremble at my perfection.",
  kayn: "Will you prove worthy? Probably not.",
  kennen: "The eyes never lie.",
  khazix: "Change is good.",
  kindred: "Never one... without the other.",
  kled: "I find courage unpredictable. It's total insanity you can rely on!",
  kogmaw: "Time to feast!",
  ksante: "Better to fight than to live in fear.",
  leblanc: "The Black Rose shall bloom once more.",
  leesin: "Your will, my hands.",
  leona: "The dawn has arrived.",
  lillia: "Eep! Can I really help... or am I just dreaming?",
  lissandra: "I will bury the world in ice.",
  locke: "Purge the shadow, salt the earth.",
  lucian: "Everybody dies. Some just need a little help.",
  lulu: "Pleased to meet you!",
  lux: "Tactical decision, summoner.",
  malphite: "Rock solid.",
  malzahar: "Oblivion awaits.",
  maokai: "I would end this burden, but it always returns.",
  masteryi: "My blade is yours.",
  mel: "Gold bends, but it does not break.",
  milio: "Adventure is out there, and I'm gonna find it!",
  missfortune: "Fortune doesn't favor fools.",
  mordekaiser: "Destiny. Domination. Deceit.",
  morgana: "Share in my torment!",
  naafiri: "We give chase!",
  nami: "I decide what the tide will bring.",
  nasus: "The cycle of life and death continues. We will live, they will die.",
  nautilus: "Beware the depths.",
  neeko: "Neeko is best decision!",
  nidalee: "They will fear the wild.",
  nilah: "The world is a tapestry of joy and suffering. I shall embrace it all!",
  nocturne: "Darkness...",
  nunu: "Every adventure is better with a friend!",
  nunuwillump: "Every adventure is better with a friend!",
  olaf: "Leave nothing behind!",
  orianna: "We will kill your enemies. That will be fun.",
  ornn: "Name's Ornn. No further pleasantries needed.",
  pantheon: "In battle, we are reborn.",
  poppy: "I'm no hero. Just a Yordle with a hammer.",
  pyke: "Sink 'em all.",
  qiyana: "You may now revere me.",
  quinn: "Justice takes wing.",
  rakan: "Let's dance!",
  rammus: "Alright.",
  reksai: "*Terrifying burrowing screech*",
  rell: "Break their armor. Break their wills.",
  renata: "Work for me, or work against me.",
  renataglasc: "Work for me, or work against me.",
  renekton: "As I live, all will die!",
  rengar: "Tonight, we hunt!",
  riven: "What is broken can be reforged.",
  rumble: "Let's get in the fight!",
  ryze: "A step ahead of cataclysm.",
  samira: "You want style? You found her.",
  sejuani: "Trust nothing but your strength.",
  senna: "No one fights alone in the Mist.",
  seraphine: "Let's change the world!",
  sett: "I'm the boss. I'm the one who runs this place.",
  shaco: "How about a magic trick?",
  shen: "A demonstration of superior judgment.",
  shyvana: "They are nothing before me.",
  singed: "How about a drink?",
  sion: "Rest is for the living!",
  sivir: "I always take my toll. Blood, or gold.",
  skarner: "The earth remembers.",
  smolder: "I'm a dragon, rawr!",
  sona: "Only you can hear me, Summoner. What masterpiece shall we play today?",
  soraka: "Let me guide you.",
  swain: "They are five steps from realizing: I am ten steps ahead.",
  sylas: "No more cages!",
  syndra: "So much untapped power!",
  tahmkench: "Call me king, call me demon. Water forgets the names of the drowned.",
  taliyah: "Know the loom, be the stone.",
  talon: "Live and die by the blade.",
  taric: "More than just precious stones, I bring you an ancient power.",
  teemo: "Captain Teemo on duty!",
  thresh: "What delightful agony we shall inflict.",
  tristana: "I wanna shoot something!",
  trundle: "Time to troll!",
  tryndamere: "This'll be a slaughter.",
  twistedfate: "Lady Luck is smilin'.",
  twitch: "I was hiding! Hehehe.",
  udyr: "Our path is made of iron will.",
  urgot: "You cannot know strength until you are broken.",
  varus: "The guilty will know agony.",
  vayne: "Let us hunt those who have fallen to darkness.",
  veigar: "Know that if the tables were turned, I would show you no mercy!",
  velkoz: "Knowledge through disintegration.",
  vex: "Ugh, do I have to?",
  vi: "Punch first. Ask questions while punching.",
  viego: "No price is too great. No atrocity beyond my reach.",
  viktor: "Join the glorious evolution!",
  vladimir: "The rivers will run red.",
  volibear: "Let the storm follow in my wake!",
  warwick: "Blood runs... they all run.",
  wukong: "Every mistake is a lesson.",
  xayah: "I'll do the killing. You look good.",
  xerath: "I am transcendent!",
  xinzhao: "Here's a tip, and a spear behind it!",
  yasuo: "Death is like the wind; always by my side.",
  yone: "One blade for the breath, one for the soul.",
  yorick: "I must dig.",
  yuumi: "You and me, we got this!",
  yunara: "The age of retribution!",
  zaahen: "I am the unsundered wrath.",
  zac: "I was made for this. Literally.",
  zed: "The unseen blade is the deadliest.",
  zeri: "Spark ready!",
  ziggs: "This'll be a blast!",
  zilean: "I knew you would do that.",
  zoe: "Yes! This'll be fun! Right?",
  zyra: "Feel the thorns' embrace."
};

// Supplement for newest champions not in older LoLdle dump
const NEW_CHAMPIONS_DATA = {
  ambessa: {
    gender: 'Female',
    positions: ['Top'],
    species: ['Human'],
    resource: 'Energy',
    range_type: ['Melee'],
    regions: ['Noxus'],
    release_date: '2024-11-06'
  },
  aurora: {
    gender: 'Female',
    positions: ['Middle', 'Top'],
    species: ['Vastayan'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Freljord'],
    release_date: '2024-07-17'
  },
  briar: {
    gender: 'Female',
    positions: ['Jungle'],
    species: ['Golem'],
    resource: 'Health',
    range_type: ['Melee'],
    regions: ['Noxus'],
    release_date: '2023-09-13'
  },
  hwei: {
    gender: 'Male',
    positions: ['Middle'],
    species: ['Human', 'Magicborn'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Ionia'],
    release_date: '2023-12-06'
  },
  milio: {
    gender: 'Male',
    positions: ['Support'],
    species: ['Human'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Ixtal'],
    release_date: '2023-03-22'
  },
  naafiri: {
    gender: 'Female',
    positions: ['Middle'],
    species: ['Darkin'],
    resource: 'Mana',
    range_type: ['Melee'],
    regions: ['Shurima'],
    release_date: '2023-07-19'
  },
  smolder: {
    gender: 'Male',
    positions: ['Bottom'],
    species: ['Dragon'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Camavor', 'Runeterra'],
    release_date: '2024-01-31'
  },
  yunara: {
    gender: 'Female',
    positions: ['Bottom'],
    species: ['Human', 'Spirit'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Ionia'],
    release_date: '2025-07-16'
  },
  mel: {
    gender: 'Female',
    positions: ['Support', 'Middle'],
    species: ['Human'],
    resource: 'Mana',
    range_type: ['Ranged'],
    regions: ['Noxus', 'Piltover'],
    release_date: '2025-01-23'
  },
  zaahen: {
    gender: 'Male',
    positions: ['Top', 'Middle'],
    species: ['Darkin'],
    resource: 'Mana',
    range_type: ['Melee'],
    regions: ['Shurima', 'Runeterra'],
    release_date: '2025-11-19'
  },
  locke: {
    gender: 'Male',
    positions: ['Middle', 'Jungle'],
    species: ['Human'],
    resource: 'Mana',
    range_type: ['Melee'],
    regions: ['Demacia'],
    release_date: '2026-06-24'
  }
};

async function main() {
  console.log('Fetching raw datasets...');
  const [loldleRes, merakiRes, cdragonRes] = await Promise.all([
    fetch(LOLDLE_URL),
    fetch(MERAKI_URL),
    fetch(CDRAGON_SUMMARY_URL)
  ]);

  const loldleList = await loldleRes.json();
  const merakiMap = await merakiRes.json();
  const cdragonList = await cdragonRes.json();

  console.log(`Loaded ${loldleList.length} loldle entries, ${Object.keys(merakiMap).length} meraki champs, ${cdragonList.length} cdragon summaries.`);

  // Build lookup index from loldle list
  const loldleMap = new Map();
  for (const c of loldleList) {
    const key = normalize(c.championName);
    loldleMap.set(key, c);
  }
  // Alias MonkeyKing -> Wukong
  if (loldleMap.has('wukong')) {
    loldleMap.set('monkeyking', loldleMap.get('wukong'));
  }
  if (loldleMap.has('nunuwillump')) {
    loldleMap.set('nunu', loldleMap.get('nunuwillump'));
  }
  if (loldleMap.has('renataglasc')) {
    loldleMap.set('renata', loldleMap.get('renataglasc'));
  }

  // Build lookup for CDragon summary to get numeric IDs
  const cdragonMap = new Map();
  for (const c of cdragonList) {
    if (c.id > 0) {
      cdragonMap.set(normalize(c.name), c);
      cdragonMap.set(normalize(c.alias), c);
    }
  }

  const existingDataPath = path.resolve('public/data/champions.json');
  let existingData = [];
  try {
    existingData = JSON.parse(await fs.readFile(existingDataPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const existingChampions = new Map();
  for (const champion of existingData) {
    existingChampions.set(normalize(champion.id), champion);
    existingChampions.set(normalize(champion.name), champion);
  }

  const finalChampions = [];

  for (const [merakiKey, champ] of Object.entries(merakiMap)) {
    const normKey = normalize(champ.name || merakiKey);
    // Skip placeholder or unreleased
    if (!champ.id || !champ.abilities || champ.id === 0 || normKey === 'mel' || normKey === 'yunara') continue;
    const loldleData = loldleMap.get(normKey) || NEW_CHAMPIONS_DATA[normKey];
    const cdragonData = cdragonMap.get(normKey);

    const numericId = champ.id || (cdragonData ? cdragonData.id : 0);

    // Attributes extraction
    let gender = loldleData?.gender || 'Other';
    let positions = loldleData?.positions || champ.positions?.map(p => {
      const lower = p.toLowerCase();
      if (lower === 'top') return 'Top';
      if (lower === 'jungle') return 'Jungle';
      if (lower === 'middle' || lower === 'mid') return 'Middle';
      if (lower === 'bottom' || lower === 'bot') return 'Bottom';
      if (lower === 'support') return 'Support';
      return p;
    }) || ['Middle'];

    let species = loldleData?.species || ['Human'];
    let resource = loldleData?.resource || (champ.resource ? champ.resource.charAt(0).toUpperCase() + champ.resource.slice(1).toLowerCase().replace('_', ' ') : 'Mana');
    let rangeType = loldleData?.range_type || (champ.attackType === 'RANGED' ? ['Ranged'] : ['Melee']);
    
    let regions = loldleData?.regions || (champ.faction && champ.faction !== 'unaffiliated' ? [champ.faction.charAt(0).toUpperCase() + champ.faction.slice(1)] : ['Runeterra']);
    let releaseDateStr = loldleData?.release_date || champ.releaseDate || '2020-01-01';
    let releaseYear = parseInt(releaseDateStr.split('-')[0], 10) || 2020;

    const champKey = champ.key || champ.id;

    // Format abilities: P, Q, W, E, R (Served from local static assets)
    const abilities = [];
    const keys = ['P', 'Q', 'W', 'E', 'R'];
    for (const k of keys) {
      const abList = champ.abilities[k];
      if (abList && abList[0]) {
        abilities.push({
          key: k,
          name: abList[0].name,
          iconUrl: `/assets/abilities/${champKey}_${k.toLowerCase()}.png`
        });
      }
    }

    // Format skins (Riot Games Official Data Dragon Full HD 1215x717)
    const skins = (champ.skins || []).map((s, idx) => {
      const skinNum = typeof s.id === 'number' ? s.id % 1000 : idx;
      const fullSplashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champKey}_${skinNum}.jpg`;
      return {
        id: s.id,
        num: skinNum,
        name: s.name === 'default' || s.name === 'Original' ? `${champ.name} (Base)` : s.name,
        splashCenteredUrl: fullSplashUrl,
        splashFullUrl: fullSplashUrl
      };
    });

    // Voice line quote & audio URL
    const quoteText = ICONIC_QUOTES[normKey] || `I fight for what I believe in.`;
    const audioUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/${numericId}.ogg`;
    const previousChampion = existingChampions.get(normKey);

    // Emoji clues are source-backed build-time data. Missing records remain in
    // the roster for other modes but are unavailable to Emoji mode.
    const emojiFields = getEmojiFields(normKey);

    finalChampions.push({
      id: champKey,
      numericId,
      name: champ.name,
      title: champ.title || '',
      gender,
      positions,
      species,
      resource,
      rangeType,
      regions,
      releaseYear,
      iconUrl: `/assets/champions/${champKey}.png`,
      abilities,
      quote: previousChampion?.quote || {
        text: quoteText,
        audioUrl
      },
      ...emojiFields,
      skins,
      quotes: previousChampion?.quotes || []
    });
  }

  // Keep locally maintained champions when an upstream feed lags behind the
  // checked-in roster (for example newly released champions).
  const generatedKeys = new Set(finalChampions.map(champion => normalize(champion.id)));
  for (const champion of existingData) {
    const key = normalize(champion.id);
    if (!generatedKeys.has(key)) {
      finalChampions.push({
        ...champion,
        ...getEmojiFields(key)
      });
    }
  }

  // Sort alphabetically by name
  finalChampions.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Generated ${finalChampions.length} champions dataset.`);
  console.log(`Total skins across all champions: ${finalChampions.reduce((acc, c) => acc + c.skins.length, 0)}`);

  const outputPath = path.resolve('public/data/champions.json');
  await fs.writeFile(outputPath, JSON.stringify(finalChampions), 'utf8');
  const stats = await fs.stat(outputPath);
  console.log(`Successfully wrote ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('Failed to generate dataset:', err);
  process.exit(1);
});
