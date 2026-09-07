import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AbilityMode } from '../../src/components/modes/AbilityMode';
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
    { key: 'Q', name: 'Orb of Deception', iconUrl: '/assets/abilities/Ahri_q.png' },
    { key: 'W', name: 'Fox-Fire', iconUrl: '/assets/abilities/Ahri_w.png' },
    { key: 'E', name: 'Charm', iconUrl: '/assets/abilities/Ahri_e.png' },
    { key: 'R', name: 'Spirit Rush', iconUrl: '/assets/abilities/Ahri_r.png' }
  ],
  quotes: [{ text: "Don't you trust me?", audioUrl: '' }],
  emojis: ['🦊', '🔮', '💖', '💎'],
  skins: []
};

const mockWrongChamp1: Champion = {
  ...mockTarget,
  id: 'Darius',
  name: 'Darius'
};

const mockWrongChamp2: Champion = {
  ...mockTarget,
  id: 'Garen',
  name: 'Garen'
};

const mockWrongChamp3: Champion = {
  ...mockTarget,
  id: 'Zed',
  name: 'Zed'
};

const allChamps = [mockTarget, mockWrongChamp1, mockWrongChamp2, mockWrongChamp3];

describe('AbilityMode Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders ability image pointing to local static asset path', () => {
    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    const img = screen.getByAltText('Ability Icon') as HTMLImageElement;
    expect(img.src).toContain('/assets/abilities/Ahri_q.png');
  });

  it('shows countdown for key hint before 3 guesses', () => {
    const { rerender } = render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Key hint unlocks after 3 guesses \(3 left\)/)).toBeInTheDocument();

    rerender(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[mockWrongChamp1, mockWrongChamp2]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Key hint unlocks after 3 guesses \(1 left\)/)).toBeInTheDocument();
  });

  it('reveals key hint after 3 wrong guesses', () => {
    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[mockWrongChamp1, mockWrongChamp2, mockWrongChamp3]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText('Hint: This is the [Q] skill!')).toBeInTheDocument();
  });

  it('displays bonus spell key prompt when round is solved and reveals ability name upon guessing', () => {
    const onBonusCompleteMock = vi.fn();
    const onOpenVictoryMock = vi.fn();

    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onBonusComplete={onBonusCompleteMock}
        onOpenVictory={onOpenVictoryMock}
      />
    );

    // Prompt is visible
    expect(screen.getByText('Bonus: Which spell key is this?')).toBeInTheDocument();

    // 5 buttons are present
    const qButton = screen.getByRole('button', { name: 'Q' });
    expect(qButton).toBeInTheDocument();

    // Guess the correct key
    fireEvent.click(qButton);

    expect(screen.getByText('Bonus Correct!')).toBeInTheDocument();
    expect(screen.getByText('Orb of Deception (Key: Q)')).toBeInTheDocument();
    expect(onBonusCompleteMock).toHaveBeenCalledWith('Q', true);
  });

  it('handles incorrect bonus spell key guess and reveals correct answer', () => {
    const onBonusCompleteMock = vi.fn();

    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onBonusComplete={onBonusCompleteMock}
      />
    );

    // Click wrong key W
    const wButton = screen.getByRole('button', { name: 'W' });
    fireEvent.click(wButton);

    expect(screen.getByText('Bonus Missed!')).toBeInTheDocument();
    expect(screen.getByText('Orb of Deception (Key: Q)')).toBeInTheDocument();
    expect(onBonusCompleteMock).toHaveBeenCalledWith('W', false);
  });

  it('allows skipping the bonus spell guess and reveals answer', () => {
    const onOpenVictoryMock = vi.fn();

    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onOpenVictory={onOpenVictoryMock}
      />
    );

    const skipButton = screen.getByRole('button', { name: /skip \/ view results/i });
    fireEvent.click(skipButton);

    expect(screen.getByText('Orb of Deception (Key: Q)')).toBeInTheDocument();
    expect(onOpenVictoryMock).toHaveBeenCalled();
  });

  it('toggles Challenge Mode settings panel and saves modifiers to localStorage', () => {
    render(
      <AbilityMode
        target={mockTarget}
        targetAbilityKey="Q"
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    const challengeBtn = screen.getByRole('button', { name: /challenge mode/i });
    fireEvent.click(challengeBtn);

    expect(screen.getByText('Ability Modifiers (Cached):')).toBeInTheDocument();

    const grayscaleCheckbox = screen.getByRole('checkbox', { name: /black & white \(grayscale\)/i });
    expect(grayscaleCheckbox).not.toBeChecked();

    fireEvent.click(grayscaleCheckbox);
    expect(grayscaleCheckbox).toBeChecked();

    const stored = JSON.parse(localStorage.getItem('loldle_ability_modifiers') || '{}');
    expect(stored.grayscale).toBe(true);
  });
});
