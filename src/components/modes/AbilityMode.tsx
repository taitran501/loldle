import React, { useState, useEffect } from 'react';
import { AbilityKey, BonusState, Champion } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { ABILITY_KEY_HINT_UNLOCK_GUESSES } from '../../utils/constants';
import { CheckCircle, XCircle, Sparkles, SlidersHorizontal, RotateCw, Palette, ArrowRight } from 'lucide-react';

interface AbilityModeProps {
  target: Champion;
  targetAbilityKey: AbilityKey;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
  bonus?: BonusState;
  /** Kept as a compatibility fallback for standalone consumers; App uses onBonusSkip. */
  onOpenVictory?: () => void;
  onBonusComplete?: (bonusKey: AbilityKey, isCorrect: boolean) => void;
  onBonusSkip?: () => void;
}

interface AbilityModifiers {
  grayscale: boolean;
  rotate: boolean;
}

const STORAGE_KEY = 'loldle_ability_modifiers';

export const AbilityMode: React.FC<AbilityModeProps> = ({
  target,
  targetAbilityKey,
  guesses,
  onGuess,
  isSolved,
  allChampions,
  bonus,
  onOpenVictory,
  onBonusComplete,
  onBonusSkip,
}) => {
  const currentAbility = target.abilities.find(a => a.key === targetAbilityKey) || target.abilities[0];

  // Bonus Spell Key Guessing state (secondary mini-quiz after solving champion)
  const [selectedBonusKey, setSelectedBonusKey] = useState<AbilityKey | null>(null);

  useEffect(() => {
    setSelectedBonusKey(bonus?.selectionKey ?? (bonus?.status === 'skipped' ? targetAbilityKey : null));
  }, [bonus?.selectionKey, bonus?.status, target.id, targetAbilityKey]);

  const handleSelectBonusKey = (key: AbilityKey) => {
    if (selectedBonusKey !== null || (bonus && bonus.status !== 'pending')) return;
    setSelectedBonusKey(key);
    const isBonusCorrect = key === targetAbilityKey;
    onBonusComplete?.(key, isBonusCorrect);
  };

  const handleSkipBonus = () => {
    if (selectedBonusKey !== null || (bonus && bonus.status !== 'pending')) return;
    setSelectedBonusKey(targetAbilityKey);
    if (onBonusSkip) onBonusSkip();
    else onOpenVictory?.();
  };

  // Key hint unlocked after 3 wrong guesses
  const isKeyHintUnlocked = guesses.length >= ABILITY_KEY_HINT_UNLOCK_GUESSES || isSolved;

  // Challenge Modes / Modifiers cached in localStorage
  const [modifiers, setModifiers] = useState<AbilityModifiers>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { grayscale: false, rotate: false };
    } catch {
      return { grayscale: false, rotate: false };
    }
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modifiers));
    } catch (e) {
      console.warn('Could not save modifiers to cache', e);
    }
  }, [modifiers]);

  const toggleGrayscale = () => {
    setModifiers(prev => ({ ...prev, grayscale: !prev.grayscale }));
  };

  const toggleRotate = () => {
    setModifiers(prev => ({ ...prev, rotate: !prev.rotate }));
  };

  // Deterministic random orthogonal rotation (90°, 180°, or 270°) per round
  const rotationAngle = React.useMemo(() => {
    const seed = (target.numericId * 7 + (currentAbility?.key.charCodeAt(0) || 0)) % 3;
    return [90, 180, 270][seed];
  }, [target.id, currentAbility?.key]);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
    setImageAttempt(0);
  }, [target.id, currentAbility?.key]);

  const retryImage = () => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
    setImageAttempt(attempt => attempt + 1);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Ability Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Which champion does this ability icon belong to?
        </p>
      </div>

      {/* Challenger / Modifier Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-center px-2 mb-2">
        <button
          onClick={() => setShowSettings(prev => !prev)}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all border ${
            modifiers.grayscale || modifiers.rotate
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-[#1e2328] text-[#a09b8c] border-[#785a28]/40 hover:text-[#f0e6d2]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Challenge Mode</span>
        </button>
      </div>

      {/* Challenge Mode Settings Panel (Cached in localStorage) */}
      {showSettings && (
        <div className="w-full max-w-md bg-[#1e2328]/95 border border-[#c8aa6e]/50 rounded-xl p-3 mb-4 shadow-xl backdrop-blur animate-flip-in">
          <div className="text-xs font-bold text-[#c8aa6e] uppercase tracking-wider mb-2">
            Ability Modifiers (Cached):
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#f0e6d2] select-none hover:text-[#c8aa6e]">
              <input
                type="checkbox"
                checked={modifiers.grayscale}
                onChange={toggleGrayscale}
                className="w-4 h-4 rounded bg-[#091428] border-[#785a28] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <Palette className="w-3.5 h-3.5 text-[#a09b8c]" />
              <span>Black & White (Grayscale)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#f0e6d2] select-none hover:text-[#c8aa6e]">
              <input
                type="checkbox"
                checked={modifiers.rotate}
                onChange={toggleRotate}
                className="w-4 h-4 rounded bg-[#091428] border-[#785a28] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <RotateCw className="w-3.5 h-3.5 text-[#a09b8c]" />
              <span>Rotate Icon</span>
            </label>
          </div>
        </div>
      )}

      {/* Ability Icon Display */}
      <div className="flex flex-col items-center my-3">
        <div className="relative p-2 rounded-2xl bg-gradient-to-b from-[#c8aa6e]/60 via-[#785a28]/40 to-[#091428] shadow-[0_0_25px_rgba(200,170,110,0.3)]">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-[#091428] border-2 border-[#c8aa6e] flex items-center justify-center relative">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-[#1e2328] animate-pulse flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#c8aa6e]/40 animate-spin" />
              </div>
            )}
            {currentAbility ? (
              imageError ? (
                <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-[#a09b8c]">
                  <span>Ability image unavailable</span>
                  <button type="button" onClick={retryImage} className="inline-flex items-center gap-1 rounded-lg border border-[#c8aa6e]/60 px-2.5 py-1 text-[#c8aa6e] hover:bg-[#c8aa6e]/20">
                    <RotateCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              ) : (
              <img
                key={`${target.id}-${currentAbility.key}-${imageAttempt}`}
                src={usingFallback ? `https://cdn.communitydragon.org/latest/champion/${target.id}/ability-icon/${currentAbility.key.toLowerCase()}` : currentAbility.iconUrl}
                alt="Ability Icon"
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  const fallbackUrl = `https://cdn.communitydragon.org/latest/champion/${target.id}/ability-icon/${currentAbility.key.toLowerCase()}`;
                  if (!usingFallback && currentAbility.iconUrl !== fallbackUrl) setUsingFallback(true);
                  else setImageError(true);
                }}
                style={{
                  filter: modifiers.grayscale && !isSolved ? 'grayscale(100%) contrast(110%)' : 'none',
                  transform: modifiers.rotate && !isSolved ? `rotate(${rotationAngle}deg)` : 'none',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
                className="w-full h-full object-cover"
              />
              )
            ) : (
              <Sparkles className="w-12 h-12 text-[#c8aa6e]" />
            )}
          </div>
        </div>

        {/* Ability Key / Name Hint or Bonus Guess */}
        <div className="mt-3 w-full flex flex-col items-center">
          {isSolved ? (
            <div className="w-full max-w-sm bg-[#1e2328]/95 border border-[#785a28]/60 rounded-xl p-3 shadow-xl backdrop-blur text-center animate-flip-in">
              {selectedBonusKey === null || (bonus?.status === 'pending') ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#c8aa6e] uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bonus: Which spell key is this?</span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {(['P', 'Q', 'W', 'E', 'R'] as const).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectBonusKey(key)}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg font-bold text-sm bg-[#091428] border border-[#c8aa6e]/50 text-[#f0e6d2] hover:bg-[#c8aa6e]/20 hover:border-[#c8aa6e] hover:text-white transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleSkipBonus}
                      className="text-[11px] text-[#a09b8c] hover:text-[#f0e6d2] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Skip / View results</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2">
                    {bonus?.status === 'skipped' ? (
                      <span className="text-[#c8aa6e] flex items-center gap-1">Skipped — answer revealed</span>
                    ) : selectedBonusKey === targetAbilityKey ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Bonus Correct!
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Bonus Missed!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    {(['P', 'Q', 'W', 'E', 'R'] as const).map(key => {
                      const isTarget = key === targetAbilityKey;
                      const isSelected = key === selectedBonusKey;
                      let btnClass = 'bg-[#091428] border-[#785a28]/40 text-[#a09b8c]/50 opacity-40';

                      if (isTarget) {
                        btnClass = 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)] scale-105';
                      } else if (isSelected && !isTarget) {
                        btnClass = 'bg-rose-600/90 border-rose-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]';
                      }

                      return (
                        <div
                          key={key}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg font-bold text-sm border flex items-center justify-center transition-all ${btnClass}`}
                        >
                          {key}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#785a28]/30">
                    <span className="text-emerald-400 font-bold text-sm block">
                      {currentAbility.name} ({currentAbility.key === 'P' ? 'Passive' : `Key: ${currentAbility.key}`})
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : isKeyHintUnlocked ? (
            <div className="bg-[#1e2328] px-4 py-1.5 rounded-full border border-[#c8aa6e]/50 text-xs font-semibold text-[#c8aa6e]">
              Hint: This is the {currentAbility.key === 'P' ? 'Passive' : `[${currentAbility.key}]`} skill!
            </div>
          ) : (
            <span className="text-xs text-[#a09b8c]">
              Key hint unlocks after {ABILITY_KEY_HINT_UNLOCK_GUESSES} guesses ({Math.max(1, ABILITY_KEY_HINT_UNLOCK_GUESSES - guesses.length)} left)
            </span>
          )}
        </div>
      </div>

      {/* Autocomplete Input */}
      <AutocompleteInput
        champions={allChampions}
        guessedChampionIds={guesses.map(g => g.id)}
        onSelectChampion={onGuess}
        disabled={isSolved}
        placeholder="Guess the champion..."
      />

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="w-full max-w-md flex flex-col gap-2 mt-4">
          {guesses.map(guess => {
            const isCorrect = guess.id === target.id;
            return (
              <div
                key={guess.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all animate-flip-in ${
                  isCorrect
                    ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                    : 'bg-[#1e2328] border-rose-600/60 text-[#a09b8c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={guess.iconUrl}
                    alt={guess.name}
                    onError={e => {
                      e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${guess.id}.png`;
                    }}
                    className="w-8 h-8 rounded-full border border-[#c8aa6e]/40 object-cover"
                  />
                  <span className={isCorrect ? 'text-white font-bold' : 'text-[#f0e6d2]'}>
                    {guess.name}
                  </span>
                </div>
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
