import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassicMode } from '../../src/components/modes/ClassicMode';
import { Champion } from '../../src/types';

const mockTarget: Champion = {
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
  abilities: [
    { key: 'P', name: 'Essence Theft', iconUrl: '/assets/abilities/Ahri_p.png' },
    { key: 'Q', name: 'Orb of Deception', iconUrl: '/assets/abilities/Ahri_q.png' }
  ],
  quotes: [{ text: "Don't you trust me?", audioUrl: 'https://example.com/ahri.ogg' }],
  emojis: ['🦊', '🔮', '💖', '💎'],
  skins: [
    { id: 103000, num: 0, name: 'default', splashCenteredUrl: 'https://example.com/0.jpg', splashFullUrl: 'https://example.com/0.jpg' }
  ]
};

const createMockChamp = (id: string, name: string, year: number): Champion => ({
  id,
  numericId: Math.floor(Math.random() * 1000),
  name,
  title: 'Test Title',
  gender: 'Male',
  positions: ['Top'],
  species: ['Human'],
  resource: 'Energy',
  rangeType: ['Melee'],
  regions: ['Noxus'],
  releaseYear: year,
  iconUrl: `/assets/champions/${id}.png`,
  abilities: [],
  quotes: [{ text: 'Clue quote', audioUrl: '' }],
  emojis: ['⚔️', '🛡️', '🗡️', '🔥'],
  skins: []
});

const champ1 = createMockChamp('Champ1', 'Champion One', 2010);
const champ2 = createMockChamp('Champ2', 'Champion Two', 2012);
const champ3 = createMockChamp('Champ3', 'Champion Three', 2013);
const champ4 = createMockChamp('Champ4', 'Champion Four', 2014);
const champ5 = createMockChamp('Champ5', 'Champion Five', 2015);
const champ6 = createMockChamp('Champ6', 'Champion Six', 2016);
const champ7 = createMockChamp('Champ7', 'Champion Seven', 2017);
const champ8 = createMockChamp('Champ8', 'Champion Eight', 2018);
const champ9 = createMockChamp('Champ9', 'Champion Nine', 2019);
const champ10 = createMockChamp('Champ10', 'Champion Ten', 2020);
const champ11 = createMockChamp('Champ11', 'Champion Eleven', 2021);
const champ12 = createMockChamp('Champ12', 'Champion Twelve', 2022);
const champ13 = createMockChamp('Champ13', 'Champion Thirteen', 2023);
const champ14 = createMockChamp('Champ14', 'Champion Fourteen', 2024);
const champ15 = createMockChamp('Champ15', 'Champion Fifteen', 2025);

const allChamps = [
  mockTarget, champ1, champ2, champ3, champ4, champ5, champ6, champ7, champ8, champ9,
  champ10, champ11, champ12, champ13, champ14, champ15,
];

describe('ClassicMode Component Tests', () => {
  it('renders Classic Mode title, subtitle and input', () => {
    render(
      <ClassicMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText('Classic Mode')).toBeInTheDocument();
    expect(screen.getByText(/Guess the mystery League champion/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Guess a champion/)).toBeInTheDocument();
  });

  it('renders 3 Hextech Clue Tokens with initial locked statuses', () => {
    render(
      <ClassicMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Ability')).toBeInTheDocument();
    expect(screen.getByText('Splash')).toBeInTheDocument();

    // 0 guesses: Quote needs 5, Ability needs 10, Splash needs 15
    expect(screen.getByText('5 tries')).toBeInTheDocument();
    expect(screen.getByText('10 tries')).toBeInTheDocument();
    expect(screen.getByText('15 tries')).toBeInTheDocument();
  });

  it('unlocks Quote clue at 5 guesses and allows opening popover card', () => {
    const fiveGuesses = [champ1, champ2, champ3, champ4, champ5];
    render(
      <ClassicMode
        target={mockTarget}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // Quote should now be Ready
    const readyLabels = screen.getAllByText('Ready');
    expect(readyLabels.length).toBeGreaterThan(0);

    // Click quote token
    const quoteButton = screen.getByTitle('Quote Clue');
    fireEvent.click(quoteButton);

    // Popover card should display quote clue
    expect(screen.getByText('Quote Clue')).toBeInTheDocument();
    expect(screen.getByText('"Don\'t you trust me?"')).toBeInTheDocument();

    // Close popover
    const closeBtn = screen.getByTitle('Close clue');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Quote Clue')).not.toBeInTheDocument();
  });

  it('unlocks Ability clue at 10 guesses and Splash clue at 15 guesses', () => {
    const tenGuesses = [champ1, champ2, champ3, champ4, champ5, champ6, champ7, champ8, champ9, champ10];
    const fifteenGuesses = [...tenGuesses, champ11, champ12, champ13, champ14, champ15];
    const { rerender } = render(
      <ClassicMode
        target={mockTarget}
        guesses={tenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // At 10 guesses Quote and Ability are ready; Splash needs 5 more.
    expect(screen.getAllByText('Ready').length).toBe(2);
    expect(screen.getByText('5 tries')).toBeInTheDocument();

    // Click Ability button
    const abilityButton = screen.getByTitle('Ability Clue');
    fireEvent.click(abilityButton);
    expect(screen.getByText('Ability Clue (Spell Icon)')).toBeInTheDocument();
    fireEvent.click(abilityButton);

    rerender(
      <ClassicMode
        target={mockTarget}
        guesses={fifteenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // All 3 clues should now be Ready.
    expect(screen.getAllByText('Ready').length).toBe(3);

    // Click Splash button
    const splashButton = screen.getByTitle('Splash Clue');
    fireEvent.click(splashButton);
    expect(screen.getByText('Splash Art Clue')).toBeInTheDocument();
  });

  it('renders comparison row with proper attribute headers and values', () => {
    render(
      <ClassicMode
        target={mockTarget}
        guesses={[champ1]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // Check table headers
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Position(s)')).toBeInTheDocument();
    expect(screen.getByText('Species')).toBeInTheDocument();
    expect(screen.getByText('Resource')).toBeInTheDocument();
    expect(screen.getByText('Range type')).toBeInTheDocument();
    expect(screen.getByText('Region(s)')).toBeInTheDocument();
    expect(screen.getByText('Release')).toBeInTheDocument();

    // Check row values
    expect(screen.getAllByText('Champion One').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Male').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2010').length).toBeGreaterThanOrEqual(1);
  });
});
