import fs from 'node:fs/promises';
import path from 'node:path';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' • ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStatLines(descriptionHtml) {
  if (!descriptionHtml) return [];
  const statsMatch = descriptionHtml.match(/<stats>([\s\S]*?)<\/stats>/i);
  if (!statsMatch) return [];
  return statsMatch[1]
    .split(/<br\s*\/?>/i)
    .map(line => stripHtml(line))
    .filter(Boolean);
}

async function main() {
  console.log('Fetching latest Riot Data Dragon version...');
  const verRes = await fetch(VERSIONS_URL);
  if (!verRes.ok) throw new Error(`Failed to fetch versions: ${verRes.status}`);
  const versions = await verRes.json();
  const latestVersion = versions[0] || '16.19.1';

  const itemUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`;
  console.log(`Fetching Data Dragon items (${latestVersion})...`);
  const res = await fetch(itemUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  const rawItems = payload.data || {};

  // First pass: collect valid Summoner's Rift (Map 11) purchasable items
  const itemsById = new Map();

  for (const [id, item] of Object.entries(rawItems)) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId > 9999) continue;
    if (item.requiredChampion || item.requiredAlly) continue;
    if (item.inStore === false) continue;
    if (!item.maps || !item.maps['11']) continue;
    if (!item.gold || !item.gold.purchasable || item.gold.total < 250) continue;

    const tags = item.tags || [];
    if (tags.includes('Consumable') || tags.includes('Trinket') || tags.includes('Vision')) continue;

    const statsSummary = extractStatLines(item.description);

    itemsById.set(id, {
      id,
      name: item.name,
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${id}.png`,
      totalGold: item.gold.total,
      combineGold: item.gold.base,
      from: Array.isArray(item.from) ? item.from : [],
      into: Array.isArray(item.into) ? item.into : [],
      depth: item.depth || 1,
      statsSummary,
      passiveHint: '',
      tags,
    });
  }

  // Second pass: validate component trees and mark target-eligible completed items
  const finalItems = [];
  const seenNames = new Set();

  for (const item of itemsById.values()) {
    // Preserve exact recipe array (including repeated components like 2x Needlessly Large Rod or 2x Giant's Belt)
    const validFrom = item.from.filter(compId => itemsById.has(compId));
    const isCompletedLegendary =
      validFrom.length >= 2 &&
      item.totalGold >= 2100 &&
      item.into.filter(upId => itemsById.has(upId)).length === 0;

    const normName = item.name.toLowerCase();
    const isTargetEligible = isCompletedLegendary && !seenNames.has(normName);
    if (isTargetEligible) {
      seenNames.add(normName);
    }

    finalItems.push({
      id: item.id,
      name: item.name,
      iconUrl: item.iconUrl,
      totalGold: item.totalGold,
      combineGold: item.combineGold,
      from: validFrom,
      statsSummary: item.statsSummary,
      passiveHint: '',
      tags: item.tags,
      isTargetEligible,
    });
  }

  finalItems.sort((a, b) => a.name.localeCompare(b.name));

  const targetCount = finalItems.filter(i => i.isTargetEligible).length;
  console.log(
    `Version ${latestVersion}: saved ${finalItems.length} items (${targetCount} target-eligible completed items)`
  );

  const outPath = path.resolve('public/data/items.json');
  await fs.writeFile(outPath, JSON.stringify(finalItems, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
