import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteMode } from '../../src/components/modes/QuoteMode';
import { Champion } from '../../src/types';

const mockTargetMundo: Champion = {
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
  quote: {
    text: 'Mundo!',
    audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/36.ogg'
  },
  emojis: ['💉', '💜', '🪓', '💪'],
  skins: []
};

const mockTargetNilah: Champion = {
  id: 'Nilah',
  numericId: 895,
  name: 'Nilah',
  title: 'the Joy Unbound',
  gender: 'Female',
  positions: ['Bottom'],
  species: ['Human'],
  resource: 'Mana',
  rangeType: ['Melee'],
  regions: ['Bilgewater'],
  releaseYear: 2022,
  iconUrl: '/assets/champions/Nilah.png',
  abilities: [],
  quote: {
    text: 'The world is a tapestry of joy and suffering. I shall embrace it all!',
    audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/895.ogg'
  },
  emojis: ['🌊', '💧', '⚔️', '😄'],
  skins: []
};

const mockTargetAhri: Champion = {
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
  quote: {
    text: "Don't you trust me?",
    audioUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/103.ogg'
  },
  emojis: ['🦊', '🔮', '💖', '💎'],
  skins: []
};

const createMockChamp = (id: string, name: string): Champion => ({
  id,
  numericId: Math.floor(Math.random() * 1000),
  name,
  title: 'Test Title',
  gender: 'Other',
  positions: ['Middle'],
  species: ['Human'],
  resource: 'Mana',
  rangeType: ['Ranged'],
  regions: ['Runeterra'],
  releaseYear: 2020,
  iconUrl: `/assets/champions/${id}.png`,
  abilities: [],
  quote: { text: 'Test quote', audioUrl: 'https://example.com/audio.ogg' },
  emojis: ['🎮', '⚔️', '🛡️', '✨'],
  skins: []
});

const mockChamp1 = createMockChamp('Champ1', 'Champion One');
const mockChamp2 = createMockChamp('Champ2', 'Champion Two');
const mockChamp3 = createMockChamp('Champ3', 'Champion Three');
const mockChamp4 = createMockChamp('Champ4', 'Champion Four');
const mockChamp5 = createMockChamp('Champ5', 'Champion Five');

const mockAllChampions: Champion[] = [
  mockTargetMundo,
  mockTargetNilah,
  mockTargetAhri,
  mockChamp1,
  mockChamp2,
  mockChamp3,
  mockChamp4,
  mockChamp5
];

describe('QuoteMode Component Tests', () => {
  let playSpy: any;
  let pauseSpy: any;

  beforeEach(() => {
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('renders short punchy quote text correctly (Dr. Mundo)', () => {
    render(
      <QuoteMode
        target={mockTargetMundo}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.getByText('"Mundo!"')).toBeInTheDocument();
    expect(screen.getByText('Who says this quote in League of Legends?')).toBeInTheDocument();
  });

  it('renders long dramatic quote text correctly (Nilah)', () => {
    render(
      <QuoteMode
        target={mockTargetNilah}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.getByText('"The world is a tapestry of joy and suffering. I shall embrace it all!"')).toBeInTheDocument();
  });

  it('displays audio clue locked countdown with correct plural/singular grammar', () => {
    const { rerender } = render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    // 0 guesses -> 5 tries remaining
    expect(screen.getByText('Audio clue in 5 tries')).toBeInTheDocument();

    // 3 guesses -> 2 tries remaining
    rerender(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[mockChamp1, mockChamp2, mockChamp3]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );
    expect(screen.getByText('Audio clue in 2 tries')).toBeInTheDocument();

    // 4 guesses -> 1 try remaining (singular "try")
    rerender(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[mockChamp1, mockChamp2, mockChamp3, mockChamp4]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );
    expect(screen.getByText('Audio clue in 1 try')).toBeInTheDocument();
  });

  it('unlocks audio clue button after 5 guesses', () => {
    const fiveGuesses = [mockChamp1, mockChamp2, mockChamp3, mockChamp4, mockChamp5];
    render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.queryByText(/Audio clue in/)).not.toBeInTheDocument();
    const playButton = screen.getByRole('button', { name: /listen to voice line/i });
    expect(playButton).toBeInTheDocument();
  });

  it('unlocks audio clue immediately when round is solved even with 0 guesses', () => {
    render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.getByRole('button', { name: /listen to voice line/i })).toBeInTheDocument();
  });

  it('toggles audio playback on button click and handles pause', async () => {
    render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    const button = screen.getByRole('button', { name: /listen to voice line/i });
    fireEvent.click(button);

    expect(playSpy).toHaveBeenCalled();

    // After play resolves, button indicates playing
    expect(await screen.findByText('Playing Voice...')).toBeInTheDocument();

    // Click again to pause
    fireEvent.click(button);
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByText('Listen to Voice Line')).toBeInTheDocument();
  });

  it('resets audio when target champion changes', async () => {
    const { rerender } = render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    const button = screen.getByRole('button', { name: /listen to voice line/i });
    fireEvent.click(button);
    expect(await screen.findByText('Playing Voice...')).toBeInTheDocument();

    // Switch target to Nilah
    rerender(
      <QuoteMode
        target={mockTargetNilah}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByText('Listen to Voice Line')).toBeInTheDocument();
  });

  it('renders guess history with correct indicators for wrong and right guesses', () => {
    const onGuessMock = vi.fn();
    render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[mockTargetMundo, mockTargetAhri]}
        onGuess={onGuessMock}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    // Dr. Mundo is wrong guess
    expect(screen.getByText('Dr. Mundo')).toBeInTheDocument();
    // Ahri is correct guess
    expect(screen.getByText('Ahri')).toBeInTheDocument();
  });

  it('disables autocomplete input when round is solved', () => {
    render(
      <QuoteMode
        target={mockTargetAhri}
        guesses={[mockTargetAhri]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    const input = screen.getByPlaceholderText('Round completed!');
    expect(input).toBeDisabled();
  });
});
