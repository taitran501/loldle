import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplashMode } from '../../src/components/modes/SplashMode';
import { Champion, Skin } from '../../src/types';

const mockSkinBase: Skin = {
  id: 103000,
  num: 0,
  name: 'Ahri (Base)',
  splashCenteredUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg',
  splashFullUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg'
};

const mockSkinDynasty: Skin = {
  id: 103001,
  num: 1,
  name: 'Dynasty Ahri',
  splashCenteredUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_1.jpg',
  splashFullUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_1.jpg'
};

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
  skins: [mockSkinBase, mockSkinDynasty]
};

const mockWrongChamp: Champion = {
  ...mockTarget,
  id: 'Garen',
  name: 'Garen'
};

const allChamps = [mockTarget, mockWrongChamp];

describe('SplashMode Component Tests', () => {
  it('renders splash art image pointing to Riot DDragon URL and uses non-center focal point', () => {
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    const img = screen.getByAltText('Champion Splash Art') as HTMLImageElement;
    expect(img.src).toBe(mockSkinDynasty.splashFullUrl);
    // Non-center transformOrigin
    expect(img.style.transformOrigin).not.toBe('center center');
    expect(img.style.transformOrigin).toMatch(/\d+% \d+%/);
  });

  it('starts at 3.5x scale and zooms out 0.25x with incorrect guesses reaching 1.0x in 10 tries without zoom text indicator', () => {
    const { rerender } = render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    let img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(3.5)');
    // Zoom indicator text was turned off
    expect(screen.queryByText(/Full view in/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zoom:/)).not.toBeInTheDocument();

    // 1 wrong guess -> 3.5 - 0.25 = 3.25
    rerender(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockWrongChamp]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(3.25)');

    // 2 wrong guesses -> 3.5 - 0.5 = 3.0
    rerender(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockWrongChamp, { ...mockWrongChamp, id: 'Darius', name: 'Darius' }]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(3)');

    // 10 wrong guesses -> reaches 1.0x full view
    const tenGuesses = Array.from({ length: 10 }, (_, i) => ({
      ...mockWrongChamp,
      id: `Champ${i}`,
      name: `Champ ${i}`,
    }));
    rerender(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={tenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(1)');
  });

  it('displays region clue when player has 5 or more failed guesses', () => {
    const fiveGuesses = Array.from({ length: 5 }, (_, i) => ({
      ...mockWrongChamp,
      id: `Champ${i}`,
      name: `Champ ${i}`,
    }));
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Clue \(5 tries\): Region:/)).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();
  });

  it('zooms to 1.0x full view and prompts to guess the skin upon solving champion', () => {
    const onBonusCompleteMock = vi.fn();
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onBonusComplete={onBonusCompleteMock}
      />
    );

    const img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(1)');
    expect(screen.getByText('Bonus: Which skin is this?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dynasty Ahri' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ahri (Base)' })).toBeInTheDocument();
  });

  it('handles selecting correct skin with positive feedback', () => {
    const onBonusCompleteMock = vi.fn();
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onBonusComplete={onBonusCompleteMock}
      />
    );

    const dynastyBtn = screen.getByRole('button', { name: 'Dynasty Ahri' });
    fireEvent.click(dynastyBtn);

    expect(onBonusCompleteMock).toHaveBeenCalledWith(mockSkinDynasty, true);
    expect(screen.getByText('Bonus Correct!')).toBeInTheDocument();
    expect(screen.getByText('Dynasty Ahri')).toBeInTheDocument();
  });

  it('handles selecting wrong skin with missed feedback', () => {
    const onBonusCompleteMock = vi.fn();
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onBonusComplete={onBonusCompleteMock}
      />
    );

    const baseBtn = screen.getByRole('button', { name: 'Ahri (Base)' });
    fireEvent.click(baseBtn);

    expect(onBonusCompleteMock).toHaveBeenCalledWith(mockSkinBase, false);
    expect(screen.getByText('Bonus Missed!')).toBeInTheDocument();
    expect(screen.getByText(/You guessed: Ahri \(Base\)/)).toBeInTheDocument();
  });

  it('handles skipping bonus skin guess', () => {
    const onOpenVictoryMock = vi.fn();
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkinDynasty}
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
        onOpenVictory={onOpenVictoryMock}
      />
    );

    const skipBtn = screen.getByRole('button', { name: /Skip \/ View results/i });
    fireEvent.click(skipBtn);

    expect(onOpenVictoryMock).toHaveBeenCalled();
  });
});
