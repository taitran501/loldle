import { LoLItem, PlayType } from '../types';

export const ITEM_CHOICE_COUNT = 5;

export interface RecipeBranchNode {
  item: LoLItem;
  subComponents: LoLItem[];
}

export const DEFAULT_FALLBACK_ITEMS: LoLItem[] = [
  { id: '1036', name: 'Long Sword', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/1036.png', totalGold: 350, combineGold: 350, from: [], statsSummary: ['+10 Attack Damage'], passiveHint: '', tags: ['Damage'], isTargetEligible: false },
  { id: '2022', name: 'Glowing Mote', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/2022.png', totalGold: 250, combineGold: 250, from: [], statsSummary: ['+5 Ability Haste'], passiveHint: '', tags: ['AbilityHaste'], isTargetEligible: false },
  { id: '3133', name: "Caulfield's Warhammer", iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3133.png', totalGold: 1050, combineGold: 100, from: ['1036', '2022', '1036'], statsSummary: ['+20 Attack Damage', '+10 Ability Haste'], passiveHint: '', tags: ['Damage', 'AbilityHaste'], isTargetEligible: false },
  { id: '1038', name: 'B.F. Sword', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/1038.png', totalGold: 1300, combineGold: 1300, from: [], statsSummary: ['+40 Attack Damage'], passiveHint: '', tags: ['Damage'], isTargetEligible: false },
  { id: '1037', name: 'Pickaxe', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/1037.png', totalGold: 875, combineGold: 875, from: [], statsSummary: ['+25 Attack Damage'], passiveHint: '', tags: ['Damage'], isTargetEligible: false },
  { id: '1018', name: 'Cloak of Agility', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/1018.png', totalGold: 600, combineGold: 600, from: [], statsSummary: ['+15% Critical Strike Chance'], passiveHint: '', tags: ['CriticalStrike'], isTargetEligible: false },
  { id: '3031', name: 'Infinity Edge', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3031.png', totalGold: 3500, combineGold: 725, from: ['1038', '1037', '1018'], statsSummary: ['+70 Attack Damage', '+25% Critical Strike Chance'], passiveHint: '', tags: ['Damage', 'CriticalStrike'], isTargetEligible: true },
  { id: '6692', name: 'Eclipse', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/6692.png', totalGold: 2900, combineGold: 625, from: ['3133', '1037', '1036'], statsSummary: ['+60 Attack Damage', '+15 Ability Haste'], passiveHint: '', tags: ['Damage', 'AbilityHaste'], isTargetEligible: true },
  { id: '3072', name: 'Bloodthirster', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3072.png', totalGold: 3400, combineGold: 800, from: ['1038', '1037', '1036'], statsSummary: ['+80 Attack Damage', '+15% Life Steal'], passiveHint: '', tags: ['Damage', 'LifeSteal'], isTargetEligible: true },
  { id: '3508', name: 'Essence Reaver', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3508.png', totalGold: 2900, combineGold: 450, from: ['3133', '1037', '1018'], statsSummary: ['+60 Attack Damage', '+15 Ability Haste', '+25% Critical Strike Chance'], passiveHint: '', tags: ['Damage', 'CriticalStrike'], isTargetEligible: true },
  { id: '3026', name: 'Guardian Angel', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3026.png', totalGold: 3200, combineGold: 600, from: ['1038', '1037'], statsSummary: ['+55 Attack Damage', '+45 Armor'], passiveHint: '', tags: ['Damage', 'Armor'], isTargetEligible: true },
  { id: '6676', name: 'The Collector', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/6676.png', totalGold: 3000, combineGold: 525, from: ['1037', '1036', '1018'], statsSummary: ['+50 Attack Damage', '+10 Lethality', '+25% Critical Strike Chance'], passiveHint: '', tags: ['Damage', 'CriticalStrike'], isTargetEligible: true },
  { id: '3036', name: "Lord Dominik's Regards", iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3036.png', totalGold: 3100, combineGold: 650, from: ['1037', '1018'], statsSummary: ['+35 Attack Damage', '+35% Armor Penetration'], passiveHint: '', tags: ['Damage', 'CriticalStrike'], isTargetEligible: true },
  { id: '3046', name: 'Phantom Dancer', iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.19.1/img/item/3046.png', totalGold: 2650, combineGold: 850, from: ['1018', '1036'], statsSummary: ['+60% Attack Speed', '+25% Critical Strike Chance'], passiveHint: '', tags: ['AttackSpeed', 'CriticalStrike'], isTargetEligible: true },
];

function hashSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getTargetItems(allItems: LoLItem[]): LoLItem[] {
  return allItems.filter(item => item.isTargetEligible && item.from.length >= 2);
}

export function resolveItemComponents(targetItem: LoLItem, allItems: LoLItem[]): LoLItem[] {
  const byId = new Map(allItems.map(item => [item.id, item]));
  return targetItem.from
    .map(compId => byId.get(compId))
    .filter((comp): comp is LoLItem => Boolean(comp));
}

export function resolveRecipeTree(targetItem: LoLItem, allItems: LoLItem[]): RecipeBranchNode[] {
  const byId = new Map(allItems.map(item => [item.id, item]));
  return targetItem.from
    .map(compId => byId.get(compId))
    .filter((comp): comp is LoLItem => Boolean(comp))
    .map(comp => ({
      item: comp,
      subComponents: (comp.from || [])
        .map(subId => byId.get(subId))
        .filter((sub): sub is LoLItem => Boolean(sub)),
    }));
}

function getPrimaryArchetype(item: LoLItem): string {
  const t = new Set(item.tags);
  if (t.has('CriticalStrike') || (t.has('AttackSpeed') && !t.has('SpellDamage'))) {
    return 'MARKSMAN_CRIT_AS';
  }
  if (t.has('Damage')) return 'AD_FIGHTER_ASSASSIN';
  if (t.has('SpellDamage')) return 'AP_MAGE';
  if (t.has('ManaRegen') || t.has('HealAndShieldPower')) return 'ENCHANTER_SUPPORT';
  if (t.has('Armor') || t.has('SpellBlock') || t.has('Health')) return 'TANK';
  return 'OTHER';
}

function getSortedSubCounts(item: LoLItem, byId: Map<string, LoLItem>): string {
  return item.from
    .map(compId => byId.get(compId)?.from?.length || 0)
    .sort((a, b) => a - b)
    .join('-');
}

export function pickTargetItemAndChoices(
  allItems: LoLItem[],
  playType: PlayType,
  dateStr: string,
  roundSeed = 0,
  excludeId?: string
): {
  targetItem: LoLItem;
  choices: LoLItem[];
  components: LoLItem[];
  recipeTree: RecipeBranchNode[];
} {
  const eligible = getTargetItems(allItems);
  if (eligible.length === 0) {
    throw new Error('No eligible completed items found');
  }

  const byId = new Map(allItems.map(item => [item.id, item]));
  const availableTargets = excludeId
    ? eligible.filter(item => item.id !== excludeId)
    : eligible;
  const pool = availableTargets.length > 0 ? availableTargets : eligible;

  const baseSeed =
    playType === 'daily'
      ? hashSeed(`${dateStr}-item-daily`)
      : hashSeed(`unlimited-item-${roundSeed}-${excludeId || ''}`);

  const targetItem = pool[baseSeed % pool.length];
  const components = resolveItemComponents(targetItem, allItems);
  const recipeTree = resolveRecipeTree(targetItem, allItems);
  const firstCompId = targetItem.from[0];
  const targetRecipeSignature = [...targetItem.from].sort().join(',');
  const targetSubCounts = getSortedSubCounts(targetItem, byId);
  const targetArchetype = getPrimaryArchetype(targetItem);

  // Score candidate decoys:
  // 1. Strongly require the SAME primary archetype (AD Fighter with AD Fighter, AP Mage with AP Mage, Crit/AS with Crit/AS, Tank with Tank)
  // 2. Reward sharing components (including `firstCompId`) so players can't guess just by AD/AP tag or a single component name
  // 3. Strictly exclude identical recipes AND identical branch sub-component structures (`sortedSubCounts`) so every candidate has a distinct tree shape on Guess #1
  const scoredCandidates = eligible
    .filter(item => item.id !== targetItem.id)
    .map(item => {
      const itemRecipeSignature = [...item.from].sort().join(',');
      const itemSubCounts = getSortedSubCounts(item, byId);
      const itemArchetype = getPrimaryArchetype(item);

      let score = 0;

      // Same archetype is top priority so all 5 items belong to the same class (AD / AP / Crit / Tank / Support)
      if (itemArchetype === targetArchetype) {
        score += 300;
      } else if (item.tags.some(tag => targetItem.tags.includes(tag))) {
        score += 120;
      }

      // Reward sharing components from the same build family (e.g. Warhammer / B.F. Sword / Lost Chapter / Kindlegem)
      if (firstCompId && item.from.includes(firstCompId)) {
        score += 65;
      }
      const sharedComps = item.from.filter(compId => targetItem.from.includes(compId)).length;
      if (sharedComps >= 1) {
        score += 40 + Math.min(sharedComps, 2) * 15;
      }

      const tieBreaker = hashSeed(`${baseSeed}-${item.id}`) % 25;
      return {
        item,
        recipeSignature: itemRecipeSignature,
        subCounts: itemSubCounts,
        score: score + tieBreaker,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Pick 4 decoys from the same archetype/component family, strictly enforcing unique recipe AND unique branch sub-component structure
  const decoys: LoLItem[] = [];
  const usedRecipes = new Set<string>([targetRecipeSignature]);
  const usedSubCounts = new Set<string>([targetSubCounts]);

  for (const candidate of scoredCandidates) {
    if (decoys.length >= ITEM_CHOICE_COUNT - 1) break;
    if (usedRecipes.has(candidate.recipeSignature)) continue;
    if (usedSubCounts.has(candidate.subCounts)) continue;

    decoys.push(candidate.item);
    usedRecipes.add(candidate.recipeSignature);
    usedSubCounts.add(candidate.subCounts);
  }

  // Fallback fill if the item pool is small (e.g. unit test mock pool)
  for (const candidate of scoredCandidates) {
    if (decoys.length >= ITEM_CHOICE_COUNT - 1) break;
    if (!decoys.some(d => d.id === candidate.item.id) && !usedRecipes.has(candidate.recipeSignature)) {
      decoys.push(candidate.item);
      usedRecipes.add(candidate.recipeSignature);
    }
  }

  // Deterministically shuffle the 5 choices
  const rawChoices = [targetItem, ...decoys];
  const choices = rawChoices
    .map(item => ({
      item,
      order: hashSeed(`${baseSeed}-shuffle-${item.id}`),
    }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.item);

  return {
    targetItem,
    choices,
    components,
    recipeTree,
  };
}
