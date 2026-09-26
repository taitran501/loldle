import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemMode } from '../../src/components/modes/ItemMode';
import { DEFAULT_FALLBACK_ITEMS, pickTargetItemAndChoices } from '../../src/utils/itemMode';

describe('ItemMode Component', () => {
  it('renders the recipe tree with component #1 unlocked and 5 selectable item choices', () => {
    render(
      <ItemMode
        allItems={DEFAULT_FALLBACK_ITEMS}
        playType="daily"
        dateStr="2026-09-26"
      />
    );

    expect(screen.getByRole('heading', { name: 'Item Shop Mode' })).toBeInTheDocument();
    expect(screen.getByTestId('item-recipe-tree')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-component-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-choices-grid')).toBeInTheDocument();

    const buttons = screen.getByTestId('item-choices-grid').querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });

  it('unlocks subsequent recipe components on wrong picks and solves when the target item is picked', () => {
    const { targetItem, choices } = pickTargetItemAndChoices(DEFAULT_FALLBACK_ITEMS, 'daily', '2026-09-26');
    const wrongChoice = choices.find(c => c.id !== targetItem.id)!;

    render(
      <ItemMode
        allItems={DEFAULT_FALLBACK_ITEMS}
        playType="daily"
        dateStr="2026-09-26"
      />
    );

    // Pick a wrong item first
    fireEvent.click(screen.getByTestId(`item-choice-${wrongChoice.id}`));

    // Now pick the target item
    fireEvent.click(screen.getByTestId(`item-choice-${targetItem.id}`));
    expect(screen.getByTestId('item-solved-banner')).toBeInTheDocument();
    expect(screen.getByText(/Recipe Completed!/i)).toBeInTheDocument();
  });
});
