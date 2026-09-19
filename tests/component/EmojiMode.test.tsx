import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmojiMode } from '../../src/components/modes/EmojiMode';
import { Champion } from '../../src/types';

const mockTarget: Champion = {
  id: 'TestChampion',
  numericId: 103,
  name: 'Test Champion',
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
  quotes: [{ text: "Don't you trust me?", audioUrl: '' }],
  emojis: ['🦊', '🔮', '💖', '💎', '✨'],
  emojiClueStatus: 'approved',
  emojiClueRevision: 'test-revision',
  skins: []
};

const createMockChamp = (id: string, name: string): Champion => ({
  ...mockTarget,
  id,
  name
});

const champ1 = createMockChamp('Champ1', 'Champion One');
const champ2 = createMockChamp('Champ2', 'Champion Two');
const champ3 = createMockChamp('Champ3', 'Champion Three');
const champ4 = createMockChamp('Champ4', 'Champion Four');
const warwickTarget: Champion = {
  ...mockTarget,
  id: 'Warwick',
  name: 'Warwick',
  emojis: ['👃', '🍽️', '🩸', '🐺'],
};

const allChamps = [mockTarget, champ1, champ2, champ3, champ4];

describe('EmojiMode Component Tests', () => {
  it('initially reveals only 1 emoji card and locks the remaining clues', () => {
    const { container } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // This target has five configured clues, so four remain locked.
    const clueItems = screen.getAllByRole('listitem');
    expect(clueItems.length).toBe(5);
    expect(screen.getByRole('listitem', { name: 'Emoji clue 1: 🦊' })).toBeInTheDocument();
    expect(screen.getByTestId('emoji-clues').querySelectorAll('[data-testid="emoji-render"]')).toHaveLength(1);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(4);
    expect(screen.getByRole('list', { name: 'Emoji clues: 1 of 5 revealed' })).toBeInTheDocument();
  });

  it('progressively reveals the configured number of emojis with each wrong guess', () => {
    const { container, rerender } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // 1 guess -> 2 revealed, 3 locked
    let revealedClues = screen.getAllByRole('listitem').filter(item => !item.getAttribute('aria-label')?.includes('locked'));
    expect(revealedClues.length).toBe(2);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(3);

    // 2 guesses -> 3 revealed, 2 locked
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    revealedClues = screen.getAllByRole('listitem').filter(item => !item.getAttribute('aria-label')?.includes('locked'));
    expect(revealedClues.length).toBe(3);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(2);

    // 3 guesses -> 4 revealed, 1 locked
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2, champ3]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    revealedClues = screen.getAllByRole('listitem').filter(item => !item.getAttribute('aria-label')?.includes('locked'));
    expect(revealedClues.length).toBe(4);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(1);

    // 4 guesses -> all 5 revealed
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2, champ3, champ4]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    revealedClues = screen.getAllByRole('listitem').filter(item => !item.getAttribute('aria-label')?.includes('locked'));
    expect(revealedClues.length).toBe(5);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(0);
  });

  it('reveals all configured clues immediately when the round is solved', () => {
    const { container } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
      />
    );

    const revealedClues = screen.getAllByRole('listitem').filter(item => !item.getAttribute('aria-label')?.includes('locked'));
    expect(revealedClues.length).toBe(5);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(0);
  });

  it('renders the source sequence as pure rendered emoji cards without text hints', () => {
    render(
      <EmojiMode
        target={warwickTarget}
        guesses={[champ1]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={[...allChamps, warwickTarget]}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByTestId('emoji-clue-0').querySelectorAll('[data-testid="emoji-render"]')).toHaveLength(1);
    expect(screen.getByTestId('emoji-clue-1').querySelectorAll('[data-testid="emoji-render"]')).toHaveLength(1);
    expect(screen.queryByText(/Region:|Role:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/clues revealed/)).not.toBeInTheDocument();
  });

  it('displays progressive clues (Region, Role) when player has 4 or more wrong guesses', () => {
    const fourGuesses = [champ1, champ2, champ3, champ4];
    const { rerender } = render(
      <EmojiMode
        target={mockTarget}
        guesses={fourGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Clue \(4 tries\): Region:/)).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();

    // 7 guesses -> includes Role
    const sevenGuesses = Array.from({ length: 7 }, (_, i) => ({
      ...champ1,
      id: `Champ${i}`,
      name: `Champ ${i}`,
    }));
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={sevenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    expect(screen.getByText(/Role:/)).toBeInTheDocument();
    expect(screen.getByText('Middle')).toBeInTheDocument();
  });
});
