import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HigherLowerMode } from '../../src/components/modes/HigherLowerMode';
import { Champion } from '../../src/types';

const mockRoster: Champion[] = [
  {
    id: 'Ahri',
    numericId: 103,
    name: 'Ahri',
    title: 'the Nine-Tailed Fox',
    gender: 'Female',
    positions: ['Middle'],
    species: ['Vastayan'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Ionia'],
    releaseYear: 2011,
    releaseDate: '2011-12-14',
    attackRange: 550,
    lastSkinDate: '2024-06-12',
    lastSkinName: 'Immortalized Legend Ahri',
    iconUrl: '/assets/champions/Ahri.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(20).fill({ id: 1, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
  {
    id: 'Ornn',
    numericId: 516,
    name: 'Ornn',
    title: 'The Fire Below the Mountain',
    gender: 'Male',
    positions: ['Top'],
    species: ['Spirit God'],
    resource: 'Mana',
    rangeType: ['Melee'],
    regions: ['Freljord'],
    releaseYear: 2017,
    releaseDate: '2017-08-23',
    attackRange: 175,
    lastSkinDate: '2022-11-16',
    lastSkinName: 'Space Groove Ornn',
    iconUrl: '/assets/champions/Ornn.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(4).fill({ id: 2, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
  {
    id: 'Caitlyn',
    numericId: 51,
    name: 'Caitlyn',
    title: 'the Sheriff of Piltover',
    gender: 'Female',
    positions: ['Bottom'],
    species: ['Human'],
    resource: 'Mana',
    rangeType: ['Ranged'],
    regions: ['Piltover'],
    releaseYear: 2011,
    releaseDate: '2011-01-04',
    attackRange: 650,
    lastSkinDate: '2023-07-20',
    lastSkinName: 'DRX Caitlyn',
    iconUrl: '/assets/champions/Caitlyn.png',
    abilities: [],
    quotes: [],
    emojis: [],
    emojiClueStatus: 'unavailable',
    skins: new Array(16).fill({ id: 3, num: 0, name: 'Skin', splashCenteredUrl: '', splashFullUrl: '' }),
  },
];

describe('HigherLowerMode Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the comparison arena, prominent criterion banner, and bottom action buttons without champion titles', () => {
    render(
      <HigherLowerMode
        allChampions={mockRoster}
        playType="unlimited"
        dateStr="2026-09-26"
      />
    );

    expect(screen.getByRole('heading', { name: 'Higher or Lower Mode' })).toBeInTheDocument();
    expect(screen.getByTestId('hl-criterion-banner')).toBeInTheDocument();
    expect(screen.getByTestId('hl-left-card')).toBeInTheDocument();
    expect(screen.getByTestId('hl-right-card')).toBeInTheDocument();
    expect(screen.getByTestId('hl-guess-higher')).toBeInTheDocument();
    expect(screen.getByTestId('hl-guess-lower')).toBeInTheDocument();
    expect(screen.queryByText('the Nine-Tailed Fox')).not.toBeInTheDocument();
  });

  it('allows switching criteria filter and making a guess', () => {
    render(
      <HigherLowerMode
        allChampions={mockRoster}
        playType="daily"
        dateStr="2026-09-26"
      />
    );

    // Filter by Total Skins
    fireEvent.click(screen.getByRole('button', { name: /Total Skins/i }));
    expect(screen.getByTestId('hl-criterion-banner')).toHaveTextContent(/Total Skins/i);

    // Click one of the guess buttons
    const higherBtn = screen.getByTestId('hl-guess-higher');
    fireEvent.click(higherBtn);

    // Reveal value should appear
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('hl-right-value')).toBeInTheDocument();
  });
});
