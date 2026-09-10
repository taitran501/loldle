import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmojiMode } from '../../src/components/modes/EmojiMode';
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
    expect(screen.getByTestId('emoji-clues').querySelectorAll('img')).toHaveLength(0);
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

  it('reports the configured clue count instead of assuming four', () => {
    render(
      <EmojiMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText('1 of 5 clues revealed')).toBeInTheDocument();
    expect(screen.getByText(/One new clue unlocks with each guess/)).toBeInTheDocument();
  });

  it('displays region clue when player has 4 or more failed guesses', () => {
    render(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2, champ3, champ4]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Clue \(4 tries\): Region:/)).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();
  });
});
