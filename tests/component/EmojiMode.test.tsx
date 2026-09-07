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
  emojis: ['🦊', '🔮', '💖', '💎'],
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

const allChamps = [mockTarget, champ1, champ2, champ3];

describe('EmojiMode Component Tests', () => {
  it('initially reveals only 1 emoji card and locks remaining 3', () => {
    const { container } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // Should have 1 emoji img and 3 lock icons
    const emojiImgs = screen.getAllByRole('img', { name: /🦊|🔮|💖|💎/ });
    expect(emojiImgs.length).toBe(1);
    expect(emojiImgs[0]).toHaveAttribute('alt', '🦊');

    // SVG Twemoji link
    expect(emojiImgs[0].getAttribute('src')).toContain('twemoji');

    // Remaining 3 are locked (check for lucide-lock icon)
    const lockIcons = container.querySelectorAll('.lucide-lock');
    expect(lockIcons.length).toBe(3);
  });

  it('progressively reveals emojis with each wrong guess', () => {
    const { container, rerender } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    // 1 guess -> 2 revealed, 2 locked
    let emojiImgs = screen.getAllByRole('img', { name: /🦊|🔮|💖|💎/ });
    expect(emojiImgs.length).toBe(2);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(2);

    // 2 guesses -> 3 revealed, 1 locked
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    emojiImgs = screen.getAllByRole('img', { name: /🦊|🔮|💖|💎/ });
    expect(emojiImgs.length).toBe(3);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(1);

    // 3 guesses -> all 4 revealed
    rerender(
      <EmojiMode
        target={mockTarget}
        guesses={[champ1, champ2, champ3]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    emojiImgs = screen.getAllByRole('img', { name: /🦊|🔮|💖|💎/ });
    expect(emojiImgs.length).toBe(4);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(0);
  });

  it('reveals all 4 emojis immediately when round is solved even with 0 guesses', () => {
    const { container } = render(
      <EmojiMode
        target={mockTarget}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
      />
    );

    const emojiImgs = screen.getAllByRole('img', { name: /🦊|🔮|💖|💎/ });
    expect(emojiImgs.length).toBe(4);
    expect(container.querySelectorAll('.lucide-lock').length).toBe(0);
  });

  it('displays region clue when player has 4 or more failed guesses', () => {
    const champ4 = createMockChamp('Champ4', 'Champion Four');
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
