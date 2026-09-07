import React, { useState, useEffect, useCallback } from 'react';
import { Champion, GameMode, GameStats, Skin } from './types';
import { getDailyTarget, getRandomTarget, getTodayDateString } from './utils/daily';
import { Header } from './components/Header';
import { ClassicMode } from './components/modes/ClassicMode';
import { QuoteMode } from './components/modes/QuoteMode';
import { AbilityMode } from './components/modes/AbilityMode';
import { SplashMode } from './components/modes/SplashMode';
import { EmojiMode } from './components/modes/EmojiMode';
import { VictoryModal } from './components/VictoryModal';
import { StatsModal } from './components/StatsModal';
import { HelpModal } from './components/HelpModal';
import { RefreshCw, Flag, Loader2, Sparkles } from 'lucide-react';

interface SingleModeState {
  target: Champion;
  skin?: Skin;
  abilityKey?: 'P' | 'Q' | 'W' | 'E' | 'R';
  quoteIndex?: number;
  bonusWon?: boolean;
  guesses: Champion[];
  isSolved: boolean;
}

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {},
};

export const App: React.FC = () => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<GameMode>('classic');
  const [isUnlimited, setIsUnlimited] = useState<boolean>(true);

  // States per mode
  const [modeStates, setModeStates] = useState<Record<GameMode, SingleModeState | null>>({
    classic: null,
    quote: null,
    ability: null,
    splash: null,
    emoji: null,
  });

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('loldle_stats');
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  useEffect(() => {
    localStorage.setItem('loldle_stats', JSON.stringify(stats));
  }, [stats]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load champions data from static JSON
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/data/champions.json');
        if (!res.ok) throw new Error('Failed to load dataset');
        const data: Champion[] = await res.json();
        setChampions(data);
      } catch (err) {
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize mode target
  const initModeTarget = useCallback(
    (mode: GameMode, champList: Champion[], unlimited: boolean): SingleModeState => {
      const result = unlimited
        ? getRandomTarget(champList, mode)
        : getDailyTarget(champList, mode, getTodayDateString());

      return {
        target: result.champion,
        skin: result.skin,
        abilityKey: result.abilityKey || 'Q',
        quoteIndex: result.quoteIndex ?? 0,
        guesses: [],
        isSolved: false,
      };
    },
    []
  );

  // Initialize all modes once champions are loaded
  useEffect(() => {
    if (champions.length > 0) {
      setModeStates({
        classic: initModeTarget('classic', champions, isUnlimited),
        quote: initModeTarget('quote', champions, isUnlimited),
        ability: initModeTarget('ability', champions, isUnlimited),
        splash: initModeTarget('splash', champions, isUnlimited),
        emoji: initModeTarget('emoji', champions, isUnlimited),
      });
    }
  }, [champions, isUnlimited, initModeTarget]);

  // Preload target assets (ability icons, splash arts, audio) in the background
  useEffect(() => {
    const abilityState = modeStates.ability;
    if (abilityState?.target) {
      const currentAbility = abilityState.target.abilities.find(a => a.key === abilityState.abilityKey) || abilityState.target.abilities[0];
      if (currentAbility?.iconUrl) {
        const img = new Image();
        img.src = currentAbility.iconUrl;
      }
    }
    const splashState = modeStates.splash;
    if (splashState?.skin?.splashFullUrl) {
      const img = new Image();
      img.src = splashState.skin.splashFullUrl;
    }
    const quoteState = modeStates.quote;
    if (quoteState?.target?.quotes) {
      const qi = quoteState.quoteIndex ?? 0;
      const q = quoteState.target.quotes[qi] || quoteState.target.quotes[0];
      if (q?.audioUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = q.audioUrl;
      }
    }
  }, [modeStates.ability?.target, modeStates.ability?.abilityKey, modeStates.splash?.skin?.splashFullUrl, modeStates.quote?.target?.id, modeStates.quote?.quoteIndex]);

  // Current mode state
  const currentState = modeStates[currentMode];

  // Handle a guess
  const handleGuess = (guess: Champion) => {
    if (!currentState || currentState.isSolved) return;

    const newGuesses = [guess, ...currentState.guesses];
    const isCorrect = guess.id === currentState.target.id;

    const updatedState: SingleModeState = {
      ...currentState,
      guesses: newGuesses,
      isSolved: isCorrect,
    };

    setModeStates(prev => ({
      ...prev,
      [currentMode]: updatedState,
    }));

    if (isCorrect) {
      // Update statistics
      setStats(prev => {
        const nextStreak = prev.currentStreak + 1;
        return {
          ...prev,
          played: prev.played + 1,
          won: prev.won + 1,
          currentStreak: nextStreak,
          maxStreak: Math.max(prev.maxStreak, nextStreak),
          guessDistribution: {
            ...prev.guessDistribution,
            [newGuesses.length]: (prev.guessDistribution[newGuesses.length] || 0) + 1,
          },
        };
      });

      // Delay victory modal popup so player can see all tiles finish flipping green
      // For Ability mode, victory modal opens after secondary spell guess (or skip)
      if (currentMode !== 'ability') {
        setTimeout(() => {
          setIsVictoryOpen(true);
        }, 1600);
      }
    }
  };

  // Skip / Give Up in Unlimited Mode
  const handleGiveUp = () => {
    if (!currentState || currentState.isSolved) return;

    if (window.confirm(`Give up? The answer was ${currentState.target.name}.`)) {
      setModeStates(prev => ({
        ...prev,
        [currentMode]: {
          ...currentState,
          isSolved: true,
        },
      }));
      setStats(prev => ({
        ...prev,
        played: prev.played + 1,
        currentStreak: 0,
      }));
      setTimeout(() => {
        setIsVictoryOpen(true);
      }, 500);
    }
  };

  // Next round in Unlimited Mode
  const handleNextRound = () => {
    if (!champions.length) return;
    setIsVictoryOpen(false);

    const newState = getRandomTarget(champions, currentMode, [currentState?.target.id || '']);
    setModeStates(prev => ({
      ...prev,
      [currentMode]: {
        target: newState.champion,
        skin: newState.skin,
        abilityKey: newState.abilityKey || 'Q',
        quoteIndex: newState.quoteIndex ?? 0,
        bonusWon: undefined,
        guesses: [],
        isSolved: false,
      },
    }));
  };

  // Toggle Unlimited / Daily mode
  const handleToggleUnlimited = (targetVal?: boolean) => {
    const nextVal = typeof targetVal === 'boolean' ? targetVal : !isUnlimited;
    if (nextVal === isUnlimited) return;
    setIsUnlimited(nextVal);
    showToast(nextVal ? 'Switched to Unlimited Mode!' : 'Switched to Daily Mode!');
  };

  // Share result to clipboard
  const handleShare = () => {
    if (!currentState) return;
    const text = `LoLdle (${currentMode.toUpperCase()}) - ${
      isUnlimited ? `Streak ${stats.currentStreak} 🔥` : `Daily ${getTodayDateString()}`
    }\nGuesses: ${currentState.guesses.length}\nPlay at: ${window.location.origin}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied result to clipboard! 📋');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#091428] text-[#f0e6d2]">
        <Loader2 className="w-12 h-12 text-[#c8aa6e] animate-spin mb-4" />
        <h2 className="text-xl font-serif font-bold text-[#c8aa6e]">Loading LoLdle Assets...</h2>
        <p className="text-sm text-[#a09b8c] mt-1">Connecting to Cloud Data Dragon & CommunityDragon</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#091428] text-[#f0e6d2]">
      {/* Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        isUnlimited={isUnlimited}
        onToggleUnlimited={handleToggleUnlimited}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Game Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 flex flex-col items-center">
        {/* Top Controls: Give up / Next round */}
        {currentState && (
          <div className="w-full flex items-center justify-between max-w-md mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#a09b8c]">Guesses:</span>
              <span className="font-bold text-[#f0e6d2] bg-[#1e2328] px-2 py-0.5 rounded border border-[#785a28]/40">
                {currentState.guesses.length}
              </span>
            </div>

            {isUnlimited && !currentState.isSolved && currentState.guesses.length >= 3 && (
              <button
                onClick={handleGiveUp}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Give Up</span>
              </button>
            )}

            {isUnlimited && currentState.isSolved && (
              <button
                onClick={handleNextRound}
                className="flex items-center gap-1 text-[#c8aa6e] hover:text-[#f0e6d2] font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Next Champion</span>
              </button>
            )}
          </div>
        )}

        {/* Game Mode Views */}
        {currentState && currentMode === 'classic' && (
          <ClassicMode
            target={currentState.target}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'quote' && (
          <QuoteMode
            target={currentState.target}
            quoteIndex={currentState.quoteIndex ?? 0}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'ability' && (
          <AbilityMode
            target={currentState.target}
            targetAbilityKey={currentState.abilityKey || 'Q'}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
            onOpenVictory={() => setIsVictoryOpen(true)}
            onBonusComplete={(_bonusKey, isCorrect) => {
              setModeStates(prev => {
                const abilityState = prev.ability;
                if (!abilityState) return prev;
                return {
                  ...prev,
                  ability: {
                    ...abilityState,
                    bonusWon: isCorrect,
                  },
                };
              });
            }}
          />
        )}

        {currentState && currentMode === 'emoji' && (
          <EmojiMode
            target={currentState.target}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'splash' && (
          <SplashMode
            target={currentState.target}
            targetSkin={currentState.skin || currentState.target.skins[0]}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-[#785a28]/20 text-center text-xs text-[#a09b8c]/70">
        <p>
          LoLdle isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games.
        </p>
        <p className="mt-1">
          League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
        </p>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e2328] border border-[#c8aa6e] text-[#f0e6d2] px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      {currentState && (
        <VictoryModal
          isOpen={isVictoryOpen}
          onClose={() => setIsVictoryOpen(false)}
          champion={currentState.target}
          skin={currentState.skin}
          mode={currentMode}
          guessCount={currentState.guesses.length}
          isUnlimited={isUnlimited}
          streak={stats.currentStreak}
          abilityKey={currentState.abilityKey}
          bonusWon={currentState.bonusWon}
          onNextRound={handleNextRound}
          onShare={handleShare}
          onSelectMode={setCurrentMode}
        />
      )}

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={() => setStats(DEFAULT_STATS)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
