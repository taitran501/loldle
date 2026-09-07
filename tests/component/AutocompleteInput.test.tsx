import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { Champion } from '../../src/types';

const mockChampions: Champion[] = [
  {
    id: 'Aatrox',
    numericId: 266,
    name: 'Aatrox',
    title: 'the Darkin Blade',
    gender: 'Male',
    positions: ['Top'],
    species: ['Darkin'],
    resource: 'Manaless',
    rangeType: ['Melee'],
    regions: ['Runeterra'],
    releaseYear: 2013,
    iconUrl: '/assets/champions/Aatrox.png',
    abilities: [],
    quote: { text: 'Now, hear the silence of annihilation!', audioUrl: '' },
    emojis: ['🗡️', '🩸', '💀', '👿'],
    skins: []
  },
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
    iconUrl: '/assets/champions/Ahri.png',
    abilities: [],
    quote: { text: "Don't you trust me?", audioUrl: '' },
    emojis: ['🦊', '🔮', '💖', '💎'],
    skins: []
  },
  {
    id: 'Akali',
    numericId: 84,
    name: 'Akali',
    title: 'the Rogue Assassin',
    gender: 'Female',
    positions: ['Middle'],
    species: ['Human'],
    resource: 'Energy',
    rangeType: ['Melee'],
    regions: ['Ionia'],
    releaseYear: 2010,
    iconUrl: '/assets/champions/Akali.png',
    abilities: [],
    quote: { text: 'Fear the assassin with no master.', audioUrl: '' },
    emojis: ['🥷', '💨', '🗡️', '🐉'],
    skins: []
  },
  {
    id: 'DrMundo',
    numericId: 36,
    name: 'Dr. Mundo',
    title: 'the Madman of Zaun',
    gender: 'Male',
    positions: ['Top'],
    species: ['Human'],
    resource: 'Health',
    rangeType: ['Melee'],
    regions: ['Zaun'],
    releaseYear: 2009,
    iconUrl: '/assets/champions/DrMundo.png',
    abilities: [],
    quote: { text: 'Mundo!', audioUrl: '' },
    emojis: ['💉', '💜', '🪓', '💪'],
    skins: []
  }
];

describe('AutocompleteInput Component Tests', () => {
  it('renders input with default placeholder and search icon', () => {
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Type champion name...')).toBeInTheDocument();
  });

  it('filters champions based on query typing', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'Ah');

    expect(screen.getByText('Ahri')).toBeInTheDocument();
    expect(screen.queryByText('Aatrox')).not.toBeInTheDocument();
    expect(screen.queryByText('Dr. Mundo')).not.toBeInTheDocument();
  });

  it('handles punctuation and special characters normalized search (e.g. Dr. Mundo without period)', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'drmundo');

    expect(screen.getByText('Dr. Mundo')).toBeInTheDocument();
  });

  it('does not display champions that have already been guessed', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={['Ahri']}
        onSelectChampion={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'A');

    expect(screen.queryByText('Ahri')).not.toBeInTheDocument();
    expect(screen.getByText('Aatrox')).toBeInTheDocument();
    expect(screen.getByText('Akali')).toBeInTheDocument();
  });

  it('selects champion on item click and clears input', async () => {
    const user = userEvent.setup();
    const onSelectMock = vi.fn();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={onSelectMock}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'Akali');

    const item = screen.getByText('Akali');
    await user.click(item);

    expect(onSelectMock).toHaveBeenCalledWith(mockChampions[2]);
    expect(input).toHaveValue('');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation: ArrowDown, ArrowUp, and Enter', async () => {
    const user = userEvent.setup();
    const onSelectMock = vi.fn();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={onSelectMock}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'A'); // Matches Aatrox, Ahri, Akali

    // Initially first item (Aatrox) is selected (index 0)
    // Press ArrowDown to move to Ahri (index 1)
    await user.keyboard('{ArrowDown}');
    // Press Enter to select Ahri
    await user.keyboard('{Enter}');

    expect(onSelectMock).toHaveBeenCalledWith(mockChampions[1]); // Ahri
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type champion name...');
    await user.type(input, 'A');
    expect(screen.getByText('Aatrox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Aatrox')).not.toBeInTheDocument();
  });

  it('disables input and shows round completed placeholder when disabled', () => {
    render(
      <AutocompleteInput
        champions={mockChampions}
        guessedChampionIds={[]}
        onSelectChampion={vi.fn()}
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Round completed!');
    expect(input).toBeDisabled();
  });
});
