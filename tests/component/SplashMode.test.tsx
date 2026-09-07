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
  quote: { text: "Don't you trust me?", audioUrl: '' },
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

  it('starts at 4.6x scale and zooms out with incorrect guesses', () => {
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
    expect(img.style.transform).toBe('scale(4.6)');

    // 1 wrong guess -> 4.6 - 0.24 = 4.36
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
    expect(img.style.transform).toBe('scale(4.36)');

    // 2 wrong guesses -> 4.6 - 0.48 = 4.12
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
    expect(img.style.transform).toBe('scale(4.12)');
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
