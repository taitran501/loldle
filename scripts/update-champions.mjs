import fs from 'node:fs/promises';
import path from 'node:path';
import { getEmojiConfig } from './emoji-config.mjs';

const DDRAGON_VERSION = '16.17.1';
const CHAMPIONS_DIR = path.resolve('public/assets/champions');
const ABILITIES_DIR = path.resolve('public/assets/abilities');
const DATA_FILE = path.resolve('public/data/champions.json');

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

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    console.log(`Saved: ${dest} (${buf.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`Failed to download ${url}:`, err.message);
    return false;
  }
}

const NEW_CHAMPS_CONFIG = [
  {
    id: 'Yunara',
    numericId: 804,
    name: 'Yunara',
    title: 'the Unbroken Faith',
    gender: 'Female',
    positions: ['Bottom'],
    species: ['Human', 'Spirit'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Ionia'],
    releaseYear: 2025,
    quote: {
      text: 'The age of retribution!',
      audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/804.ogg'
    },
    passiveImg: 'Yunara_Passive.png',
    spells: ['YunaraQ.png', 'YunaraW.png', 'YunaraE.png', 'YunaraR.png'],
    abilityNames: {
      P: 'Vow of the First Lands',
      Q: 'Cultivation of Spirit',
      W: 'Arc of Judgment',
      E: "Kanmei's Steps",
      R: "Transcend One's Self"
    },
    skins: [
      { id: 804000, num: 0, name: 'Yunara (Base)' },
      { id: 804001, num: 1, name: 'Spirit Blossom Springs Yunara' },
      { id: 804010, num: 10, name: 'T1 Yunara' }
    ]
  },
  {
    id: 'Mel',
    numericId: 800,
    name: 'Mel',
    title: "the Soul's Reflection",
    gender: 'Female',
    positions: ['Support', 'Middle'],
    species: ['Human'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Noxus', 'Piltover'],
    releaseYear: 2025,
    quote: {
      text: 'Gold bends, but it does not break.',
      audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/800.ogg'
    },
    passiveImg: 'Mel_Passive.png',
    spells: ['MelQ.png', 'MelW.png', 'MelE.png', 'MelR.png'],
    abilityNames: {
      P: 'Searing Brilliance',
      Q: 'Radiant Volley',
      W: 'Rebuttal',
      E: 'Solar Snare',
      R: 'Golden Eclipse'
    },
    skins: [
      { id: 800000, num: 0, name: 'Mel (Base)' },
      { id: 800001, num: 1, name: 'Arcane Councilor Mel' },
      { id: 800010, num: 10, name: 'Prestige Winterblessed Mel' }
    ]
  },
  {
    id: 'Zaahen',
    numericId: 904,
    name: 'Zaahen',
    title: 'the Unsundered',
    gender: 'Male',
    positions: ['Top', 'Middle'],
    species: ['Darkin'],
    resource: 'Mana',
    rangeType: ['Melee'],
    regions: ['Shurima', 'Runeterra'],
    releaseYear: 2025,
    quote: {
      text: 'I am the unsundered wrath.',
      audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/904.ogg'
    },
    passiveImg: 'ZaahenP.png',
    spells: ['ZaahenQ.png', 'ZaahenW.png', 'ZaahenE.png', 'ZaahenR.png'],
    abilityNames: {
      P: 'Cultivation of War',
      Q: 'The Darkin Glaive',
      W: 'Dreaded Return',
      E: 'Aureate Rush',
      R: 'Grim Deliverance'
    },
    skins: [
      { id: 904000, num: 0, name: 'Zaahen (Base)' },
      { id: 904001, num: 1, name: 'Immortal Journey Zaahen' }
    ]
  },
  {
    id: 'Locke',
    numericId: 805,
    name: 'Locke',
    title: 'the Ashen Exorcist',
    gender: 'Male',
    positions: ['Middle', 'Jungle'],
    species: ['Human'],
    resource: 'Mana',
    rangeType: ['Melee'],
    regions: ['Demacia'],
    releaseYear: 2026,
    quote: {
      text: 'Purge the shadow, salt the earth.',
      audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/805.ogg'
    },
    passiveImg: 'Locke_Passive.png',
    spells: ['LockeQ.png', 'LockeW.png', 'LockeE.png', 'LockeR.png'],
    abilityNames: {
      P: 'Silver Stake',
      Q: 'Ritual Nails',
      W: 'Soul Ignition',
      E: 'Ashen Pursuit',
      R: 'Purgatory'
    },
    skins: [
      { id: 805000, num: 0, name: 'Locke (Base)' },
      { id: 805001, num: 1, name: 'High Noon Locke' }
    ]
  }
];

async function main() {
  console.log('--- Downloading assets ---');
  await fs.mkdir(CHAMPIONS_DIR, { recursive: true });
  await fs.mkdir(ABILITIES_DIR, { recursive: true });

  for (const c of NEW_CHAMPS_CONFIG) {
    // 1. Portrait
    const avatarUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${c.id}.png`;
    const avatarDest = path.join(CHAMPIONS_DIR, `${c.id}.png`);
    await downloadFile(avatarUrl, avatarDest);

    // 2. Abilities: P, Q, W, E, R
    const pUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/passive/${c.passiveImg}`;
    const pDest = path.join(ABILITIES_DIR, `${c.id}_p.png`);
    await downloadFile(pUrl, pDest);

    const keys = ['q', 'w', 'e', 'r'];
    for (let i = 0; i < keys.length; i++) {
      const spellUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${c.spells[i]}`;
      const spellDest = path.join(ABILITIES_DIR, `${c.id}_${keys[i]}.png`);
      await downloadFile(spellUrl, spellDest);
    }
  }

  console.log('\n--- Updating champions.json ---');
  const existingData = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  console.log(`Current champion count: ${existingData.length}`);
  const existingById = new Map(existingData.map(champion => [champion.id.toLowerCase(), champion]));

  // Filter out any previous draft versions of these 4
  const existingFiltered = existingData.filter(c => !NEW_CHAMPS_CONFIG.some(nc => nc.id.toLowerCase() === c.id.toLowerCase()));

  for (const c of NEW_CHAMPS_CONFIG) {
    const emojiFields = getEmojiFields(c.id);
    const previousChampion = existingById.get(c.id.toLowerCase());

    const abilities = [
      { key: 'P', name: c.abilityNames.P, iconUrl: `/assets/abilities/${c.id}_p.png` },
      { key: 'Q', name: c.abilityNames.Q, iconUrl: `/assets/abilities/${c.id}_q.png` },
      { key: 'W', name: c.abilityNames.W, iconUrl: `/assets/abilities/${c.id}_w.png` },
      { key: 'E', name: c.abilityNames.E, iconUrl: `/assets/abilities/${c.id}_e.png` },
      { key: 'R', name: c.abilityNames.R, iconUrl: `/assets/abilities/${c.id}_r.png` }
    ];

    const skins = c.skins.map(s => {
      const url = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_${s.num}.jpg`;
      return {
        id: s.id,
        num: s.num,
        name: s.name,
        splashCenteredUrl: url,
        splashFullUrl: url
      };
    });

    const champObj = {
      id: c.id,
      numericId: c.numericId,
      name: c.name,
      title: c.title,
      gender: c.gender,
      positions: c.positions,
      species: c.species,
      resource: c.resource,
      rangeType: c.rangeType,
      regions: c.regions,
      releaseYear: c.releaseYear,
      iconUrl: `/assets/champions/${c.id}.png`,
      abilities,
      quote: previousChampion?.quote || c.quote,
      ...emojiFields,
      skins,
      quotes: previousChampion?.quotes || []
    };

    existingFiltered.push(champObj);
  }

  // Sort alphabetically by name
  existingFiltered.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Updated champion count: ${existingFiltered.length}`);
  await fs.writeFile(DATA_FILE, JSON.stringify(existingFiltered, null, 2), 'utf8');
  console.log(`Successfully updated ${DATA_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
