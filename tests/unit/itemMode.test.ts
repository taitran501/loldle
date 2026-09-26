import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FALLBACK_ITEMS,
  ITEM_CHOICE_COUNT,
  getTargetItems,
  pickTargetItemAndChoices,
  resolveItemComponents,
} from '../../src/utils/itemMode';

describe('itemMode utilities', () => {
  it('filters completed target-eligible items accurately', () => {
    const targets = getTargetItems(DEFAULT_FALLBACK_ITEMS);
    expect(targets.length).toBeGreaterThanOrEqual(8);
    expect(targets.every(item => item.isTargetEligible && item.from.length >= 2)).toBe(true);
  });

  it('resolves recipe component items from component IDs', () => {
    const ie = DEFAULT_FALLBACK_ITEMS.find(i => i.id === '3031')!;
    const comps = resolveItemComponents(ie, DEFAULT_FALLBACK_ITEMS);
    expect(comps.map(c => c.name)).toEqual(['B.F. Sword', 'Pickaxe', 'Cloak of Agility']);
  });

  it('generates 5 selectable choices containing the target item deterministically in daily mode', () => {
    const puzzle1 = pickTargetItemAndChoices(DEFAULT_FALLBACK_ITEMS, 'daily', '2026-09-26');
    const puzzle2 = pickTargetItemAndChoices(DEFAULT_FALLBACK_ITEMS, 'daily', '2026-09-26');

    expect(puzzle1.targetItem.id).toBe(puzzle2.targetItem.id);
    expect(puzzle1.choices.length).toBe(ITEM_CHOICE_COUNT);
    expect(puzzle1.choices.some(c => c.id === puzzle1.targetItem.id)).toBe(true);
  });

  it('selects decoys of the same archetype with distinct recipes and distinct tree branch structures', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const fullItems = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'public/data/items.json'), 'utf8')
    );
    const byId = new Map(fullItems.map((i: any) => [i.id, i]));
    const getSubCounts = (item: any) =>
      item.from
        .map((cid: string) => (byId.get(cid) as any)?.from?.length || 0)
        .sort((a: number, b: number) => a - b)
        .join('-');

    for (let seed = 1; seed <= 50; seed++) {
      const { targetItem, choices } = pickTargetItemAndChoices(
        fullItems,
        'unlimited',
        '2026-09-26',
        seed
      );
      const targetRecipeSig = [...targetItem.from].sort().join(',');
      const targetSubCounts = getSubCounts(targetItem);

      const decoys = choices.filter(c => c.id !== targetItem.id);
      expect(decoys.length).toBe(4);

      for (const decoy of decoys) {
        const decoyRecipeSig = [...decoy.from].sort().join(',');
        const decoySubCounts = getSubCounts(decoy);
        expect(decoyRecipeSig).not.toBe(targetRecipeSig);
        expect(decoySubCounts).not.toBe(targetSubCounts);
      }
    }
  });
});
