import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'public', 'data', 'champions.json');
const ABILITIES_DIR = path.join(ROOT_DIR, 'public', 'assets', 'abilities');
const CHAMPIONS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'champions');

// Ensure output directories exist
fs.mkdirSync(ABILITIES_DIR, { recursive: true });
fs.mkdirSync(CHAMPIONS_DIR, { recursive: true });

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
    return true; // Already downloaded
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return false;
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

// Concurrency pool runner
async function runPool(items, concurrency, workerFn) {
  let index = 0;
  const total = items.length;
  let completed = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      try {
        await workerFn(current);
      } catch (e) {
        // ignore
      }
      completed++;
      if (completed % 50 === 0 || completed === total) {
        process.stdout.write(`Progress: ${completed}/${total} assets downloaded...\r`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(`\nCompleted ${completed}/${total} downloads.`);
}

async function main() {
  console.log('Loading champions data...');
  if (!fs.existsSync(DATA_FILE)) {
    console.error('champions.json not found!');
    process.exit(1);
  }

  const champions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`Found ${champions.length} champions to process.`);

  const downloadQueue = [];

  for (const champ of champions) {
    // 1. Champion Avatar
    const avatarDest = path.join(CHAMPIONS_DIR, `${champ.id}.png`);
    const avatarUrl = `https://ddragon.leagueoflegends.com/cdn/16.17.1/img/champion/${champ.id}.png`;
    const avatarFallback = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.numericId}.png`;

    downloadQueue.push(async () => {
      let ok = await downloadFile(avatarUrl, avatarDest);
      if (!ok) {
        await downloadFile(avatarFallback, avatarDest);
      }
    });

    // 2. Abilities (P, Q, W, E, R)
    for (const ab of champ.abilities) {
      const key = ab.key.toLowerCase();
      const abilityDest = path.join(ABILITIES_DIR, `${champ.id}_${key}.png`);
      const abilityUrl = `https://cdn.communitydragon.org/latest/champion/${champ.id}/ability-icon/${key}`;

      downloadQueue.push(async () => {
        await downloadFile(abilityUrl, abilityDest);
      });
    }
  }

  console.log(`Starting parallel download of ${downloadQueue.length} assets with concurrency 20...`);
  const t0 = Date.now();
  await runPool(downloadQueue, 20, (fn) => fn());
  console.log(`Finished in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
