import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplashMode } from '../../src/components/modes/SplashMode';
import { Champion, Skin } from '../../src/types';

const mockSkin: Skin = {
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
  skins: [mockSkin]
};

const mockWrongChamp: Champion = {
  ...mockTarget,
  id: 'Garen',
  name: 'Garen'
};

const allChamps = [mockTarget, mockWrongChamp];

describe('SplashMode Component Tests', () => {
  it('renders splash art image pointing to Riot DDragon URL', () => {
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkin}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    const img = screen.getByAltText('Champion Splash Art') as HTMLImageElement;
    expect(img.src).toBe(mockSkin.splashFullUrl);
  });

  it('starts at 3.5x scale and zooms out 0.25x with incorrect guesses reaching 1.0x in 10 tries', () => {
    const { rerender } = render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkin}
        guesses={[]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    let img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(3.5)');
    expect(screen.getByText('Full view in 10 tries')).toBeInTheDocument();

    // 1 wrong guess -> 3.5 - 0.25 = 3.25
    rerender(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkin}
        guesses={[mockWrongChamp]}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(3.25)');
    expect(screen.getByText('Full view in 9 tries')).toBeInTheDocument();

    // 2 wrong guesses -> 3.5 - 0.5 = 3.0
    rerender(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkin}
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
        targetSkin={mockSkin}
        guesses={tenGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );
    img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(1)');
    expect(screen.getByText('Full view unlocked')).toBeInTheDocument();
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
        targetSkin={mockSkin}
        guesses={fiveGuesses}
        onGuess={vi.fn()}
        isSolved={false}
        allChampions={allChamps}
      />
    );

    expect(screen.getByText(/Clue \(5 tries\): Region:/)).toBeInTheDocument();
    expect(screen.getByText('Ionia')).toBeInTheDocument();
  });

  it('zooms to 1.0x full view and displays skin name upon victory', () => {
    render(
      <SplashMode
        target={mockTarget}
        targetSkin={mockSkin}
        guesses={[mockTarget]}
        onGuess={vi.fn()}
        isSolved={true}
        allChampions={allChamps}
      />
    );

    const img = screen.getByAltText('Champion Splash Art');
    expect(img.style.transform).toBe('scale(1)');
    expect(screen.getByText('Dynasty Ahri')).toBeInTheDocument();
  });
});
