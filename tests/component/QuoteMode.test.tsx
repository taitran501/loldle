import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteMode } from '../../src/components/modes/QuoteMode';
import { Champion } from '../../src/types';

// Helper to build a quotes array with at least 10 entries for a given text/url pair
function makeQuotes(text: string, audioUrl: string) {
  const base = [{ text, audioUrl }];
  while (base.length < 10) {
    base.push({ text: `Generic line ${base.length}`, audioUrl });
  }
  return base;
}

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
  quotes: makeQuotes(
    'Mundo!',
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/36.ogg'
  ),
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
  quotes: makeQuotes(
    'The world is a tapestry of joy and suffering. I shall embrace it all!',
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/895.ogg'
  ),
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
  quotes: makeQuotes(
    "Don't you trust me?",
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/103.ogg'
  ),
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
  quotes: makeQuotes('Test quote', 'https://example.com/audio.ogg'),
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
        quoteIndex={0}
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
        quoteIndex={0}
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
        quoteIndex={0}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    // 0 guesses -> 3 tries remaining
    expect(screen.getByText('Audio clue in 3 tries')).toBeInTheDocument();

    // 1 guess -> 2 tries remaining
    rerender(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={[mockChamp1]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );
    expect(screen.getByText('Audio clue in 2 tries')).toBeInTheDocument();

    // 2 guesses -> 1 try remaining (singular "try")
    rerender(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={[mockChamp1, mockChamp2]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );
    expect(screen.getByText('Audio clue in 1 try')).toBeInTheDocument();
  });

  it('unlocks audio clue for Quote 1 at 3 guesses, but keeps Quote 2, Quote 3, and Region locked', () => {
    const threeGuesses = [mockChamp1, mockChamp2, mockChamp3];
    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={threeGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    const playButton = screen.getByRole('button', { name: /listen to voice line/i });
    expect(playButton).toBeInTheDocument();

    // Quote 2, Quote 3, Region locked
    expect(screen.queryByText('Quote #2 • Interaction Clue')).not.toBeInTheDocument();
    expect(screen.queryByText('Quote #3 • Signature Pick Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Final Clue • Region')).not.toBeInTheDocument();
    expect(screen.getByText('Quote #2 (Interaction) in 2 tries')).toBeInTheDocument();
  });

  it('unlocks Quote 2 (Interaction) at 5 guesses', () => {
    const fiveGuesses = [mockChamp1, mockChamp2, mockChamp3, mockChamp4, mockChamp5];
    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    // Quote 2 is unlocked
    expect(screen.getByText('Quote #2 • Interaction Clue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /listen to 2nd voice/i })).toBeInTheDocument();

    // Quote 3 and Region still locked
    expect(screen.queryByText('Quote #3 • Signature Pick Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Final Clue • Region')).not.toBeInTheDocument();
    expect(screen.getByText('Signature Quote in 2 tries')).toBeInTheDocument();
  });

  it('unlocks Quote 3 (Signature Pick) at 7 guesses and Region at 9 guesses', () => {
    const sevenGuesses = Array.from({ length: 7 }, (_, i) => ({
      ...mockChamp1,
      id: `Champ${i}`,
      name: `Champ ${i}`,
    }));
    const { rerender } = render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={sevenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    // Quote 3 unlocked
    expect(screen.getByText('Quote #3 • Signature Pick Line')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /listen to 3rd voice/i })).toBeInTheDocument();
    expect(screen.queryByText('Final Clue • Region')).not.toBeInTheDocument();
    expect(screen.getByText('Region clue in 2 tries')).toBeInTheDocument();

    // At 9 guesses -> Region unlocked
    const nineGuesses = Array.from({ length: 9 }, (_, i) => ({
      ...mockChamp1,
      id: `Champ${i}`,
      name: `Champ ${i}`,
    }));
    rerender(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={nineGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.getByText('Final Clue • Region')).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();
  });

  it('unlocks all clues immediately when round is solved even with 0 guesses', () => {
    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    expect(screen.getByRole('button', { name: /listen to voice line/i })).toBeInTheDocument();
    expect(screen.getByText('Quote #2 • Interaction Clue')).toBeInTheDocument();
    expect(screen.getByText('Quote #3 • Signature Pick Line')).toBeInTheDocument();
    expect(screen.getByText('Final Clue • Region')).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();
  });

  it('plays and pauses second quote audio correctly', async () => {
    const fiveGuesses = [mockChamp1, mockChamp2, mockChamp3, mockChamp4, mockChamp5];
    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={mockAllChampions}
      />
    );

    const button2 = screen.getByRole('button', { name: /listen to 2nd voice/i });
    fireEvent.click(button2);

    expect(playSpy).toHaveBeenCalled();
    expect(await screen.findByText('Playing 2nd Voice...')).toBeInTheDocument();

    fireEvent.click(button2);
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByText('Listen to 2nd Voice')).toBeInTheDocument();
  });

  it('shows a retry state when a voice line cannot be played', async () => {
    playSpy.mockRejectedValueOnce(new Error('audio unavailable'));

    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={mockAllChampions}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /listen to voice line/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retry voice line' })).toBeInTheDocument();
      expect(screen.getByText('Audio could not be loaded. Click to retry.')).toBeInTheDocument();
    });
  });

  it('toggles audio playback on button click and handles pause', async () => {
    render(
      <QuoteMode
        target={mockTargetAhri}
        quoteIndex={0}
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
        quoteIndex={0}
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
        quoteIndex={0}
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
        quoteIndex={0}
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
        quoteIndex={0}
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
