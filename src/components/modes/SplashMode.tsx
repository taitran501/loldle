import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BonusState, Champion, Skin } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { CheckCircle, XCircle, Sparkles, Search, ChevronDown, ArrowRight } from 'lucide-react';

interface SplashModeProps {
  target: Champion;
  targetSkin: Skin;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
  bonus?: BonusState;
  /** Kept as a compatibility fallback for standalone consumers; App uses onBonusSkip. */
  onOpenVictory?: () => void;
  onBonusComplete?: (selectedSkin: Skin, isCorrect: boolean) => void;
  onBonusSkip?: () => void;
}

export const SplashMode: React.FC<SplashModeProps> = ({
  target,
  targetSkin,
  guesses,
  onGuess,
  isSolved,
  allChampions,
  bonus,
  onOpenVictory,
  onBonusComplete,
  onBonusSkip,
}) => {
  // Continuous gradual zoom out with every guess:
  // Starts at 3.5x magnification, stepping down 0.25x per guess
  // reaching full view (1.0x) smoothly in 10 guesses.
  const INITIAL_SCALE = 3.5;
  const STEP_PER_GUESS = 0.25;

  const rawScale = isSolved
    ? 1.0
    : Math.max(1.0, INITIAL_SCALE - guesses.length * STEP_PER_GUESS);
  const currentScale = Math.round(rawScale * 100) / 100;

  // Deterministic random focal point (X, Y in %) based on champion & skin IDs
  // Ensures consistent framing per skin round across re-renders (20% - 80% range)
  const { focalX, focalY } = useMemo(() => {
    const seedStr = `${target.id}_${targetSkin.id}_${targetSkin.num || 0}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const x = 20 + (absHash % 61); // 20% to 80%
    const y = 20 + (Math.floor(absHash / 61) % 61); // 20% to 80%
    return { focalX: x, focalY: y };
  }, [target.id, targetSkin.id, targetSkin.num]);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const primaryImageUrl = targetSkin.splashFullUrl || targetSkin.splashCenteredUrl;
  const fallbackImageUrl = targetSkin.splashCenteredUrl;
  const imageSource = usingFallback ? fallbackImageUrl : primaryImageUrl;

  const IMAGE_LOAD_TIMEOUT_MS = 5000;

  // Bonus Skin Guessing state (secondary mini-quiz after solving champion)
  const [selectedBonusSkin, setSelectedBonusSkin] = useState<Skin | null>(null);
  const [skinQuery, setSkinQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
    setImageAttempt(0);
  }, [target.id, targetSkin.id, targetSkin.splashFullUrl, targetSkin.splashCenteredUrl]);

  // A cached image can finish before React receives the onLoad event. Check
  // the DOM after each source change so the loading overlay cannot stay stuck.
  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete || image.naturalWidth === 0) return;
    setImageLoaded(true);
    setImageError(false);
  }, [imageSource, imageAttempt, target.id, targetSkin.id]);

  // Remote CDN requests may hang without emitting either load or error.
  // Bound each attempt and expose the existing retry state instead of leaving
  // the player on an infinite skeleton.
  useEffect(() => {
    if (imageLoaded || imageError) return;

    const timeoutId = window.setTimeout(() => {
      if (!usingFallback && fallbackImageUrl && primaryImageUrl !== fallbackImageUrl) {
        setUsingFallback(true);
        setImageLoaded(false);
      } else {
        setImageError(true);
      }
    }, IMAGE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fallbackImageUrl, imageError, imageLoaded, imageSource, primaryImageUrl, usingFallback]);

  useEffect(() => {
    const savedBonusSkin = bonus?.selectionSkinId === undefined
      ? (bonus?.status === 'skipped' ? targetSkin : null)
      : target.skins.find(skin => skin.id === bonus.selectionSkinId) || null;
    setSelectedBonusSkin(savedBonusSkin);
    setSkinQuery('');
    setIsDropdownOpen(false);
  }, [bonus?.selectionSkinId, bonus?.status, target.id, targetSkin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSkin = (skin: Skin) => {
    if (selectedBonusSkin !== null || (bonus && bonus.status !== 'pending')) return;
    setSelectedBonusSkin(skin);
    setIsDropdownOpen(false);
    const isBonusCorrect = skin.id === targetSkin.id || skin.name.toLowerCase() === targetSkin.name.toLowerCase();
    onBonusComplete?.(skin, isBonusCorrect);
  };

  const handleSkipBonus = () => {
    if (selectedBonusSkin !== null || (bonus && bonus.status !== 'pending')) return;
    setSelectedBonusSkin(targetSkin);
    if (onBonusSkip) onBonusSkip();
    else onOpenVictory?.();
  };

  const retryImage = () => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
    setImageAttempt(attempt => attempt + 1);
  };

  const filteredSkins = (target.skins || []).filter(s => {
    const q = skinQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!q) return true;
    const nameNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return nameNorm.includes(q);
  });

  const handleSkinInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSkins.length > 0) {
        handleSelectSkin(filteredSkins[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Splash Art Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Guess the champion from their skin artwork. The image zooms out gradually with every guess!
        </p>
      </div>

      {/* Splash Art Viewport */}
      <div className="relative z-30 my-3 flex flex-col items-center">
        <div className="w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-2xl overflow-hidden border-2 border-[#c8aa6e]/80 shadow-[0_0_30px_rgba(200,170,110,0.25)] bg-[#091428] relative flex items-center justify-center">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-[#1e2328] animate-pulse flex items-center justify-center z-10">
              <Sparkles className="w-8 h-8 text-[#c8aa6e]/40 animate-spin" />
            </div>
          )}
          {imageError ? (
            <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-[#a09b8c]">
              <span>Splash image unavailable</span>
              <button type="button" onClick={retryImage} className="inline-flex items-center gap-1 rounded-lg border border-[#c8aa6e]/60 px-2.5 py-1 text-[#c8aa6e] hover:bg-[#c8aa6e]/20">
                <Sparkles className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : (
            <img
              key={`${target.id}-${targetSkin.id}-${imageAttempt}`}
              ref={imageRef}
              src={imageSource}
              alt="Champion Splash Art"
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                if (!usingFallback && targetSkin.splashCenteredUrl && targetSkin.splashFullUrl !== targetSkin.splashCenteredUrl) setUsingFallback(true);
                else setImageError(true);
              }}
              style={{
                transform: `scale(${currentScale})`,
                transformOrigin: `${focalX}% ${focalY}%`,
                transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease',
                opacity: imageLoaded ? 1 : 0,
              }}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          )}
        </div>

        {/* Progressive Clues when stuck (after 5+ wrong guesses) */}
        {guesses.length >= 5 && !isSolved && (
          <div className="mt-2.5 px-4 py-1.5 rounded-full bg-[#1e2328] border border-[#c8aa6e]/40 text-xs text-[#c8aa6e] flex items-center gap-1.5 animate-flip-in shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Clue ({guesses.length} tries): Region: <strong className="text-[#f0e6d2]">{target.regions.join(', ')}</strong>
              {guesses.length >= 8 && (
                <> • Role: <strong className="text-[#f0e6d2]">{target.positions.join(', ')}</strong></>
              )}
            </span>
          </div>
        )}

        {/* Bonus Skin Guess Section upon Champion Solve */}
        {isSolved && (
          <div className="mt-3 w-full max-w-sm bg-[#1e2328]/95 border border-[#785a28]/60 rounded-xl p-3.5 shadow-xl backdrop-blur text-center animate-flip-in">
            {selectedBonusSkin === null ? (
              <>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#c8aa6e] uppercase tracking-wider mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bonus: Which skin is this?</span>
                </div>

                {/* Quick select chips if champion has 8 or fewer skins */}
                {target.skins && target.skins.length > 1 && target.skins.length <= 8 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-2.5">
                    {target.skins.map(skin => (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => handleSelectSkin(skin)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#091428] border border-[#c8aa6e]/50 text-[#f0e6d2] hover:bg-[#c8aa6e]/20 hover:border-[#c8aa6e] transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {skin.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Searchable input / dropdown for all skins */}
                <div ref={dropdownRef} className="relative w-full text-left">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={skinQuery}
                      onChange={e => {
                        setSkinQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onKeyDown={handleSkinInputKeyDown}
                      placeholder="Search or select a skin..."
                      className="w-full bg-[#091428] border border-[#c8aa6e]/60 focus:border-[#c8aa6e] text-[#f0e6d2] placeholder-[#a09b8c]/60 px-3 py-2 pl-8.5 pr-8 rounded-lg text-xs sm:text-sm shadow-inner outline-none transition-all"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c8aa6e]/70 pointer-events-none" />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a09b8c]/70 pointer-events-none" />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#1e2328] border-2 border-[#785a28] rounded-xl max-h-56 overflow-y-auto z-50 shadow-2xl divide-y divide-[#785a28]/30 animate-fade-in">
                      {filteredSkins.length > 0 ? (
                        filteredSkins.map(skin => (
                          <button
                            key={skin.id}
                            type="button"
                            onClick={() => handleSelectSkin(skin)}
                            className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-[#f0e6d2] hover:bg-[#c8aa6e]/20 hover:text-white transition-colors flex items-center justify-between cursor-pointer active:bg-[#c8aa6e]/30"
                          >
                            <span className="font-medium">{skin.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2.5 text-xs text-[#a09b8c] text-center">
                          No matching skin found
                        </div>
                      )}
                    </div>
                  )}
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
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  {bonus?.status === 'skipped' ? (
                    <span className="text-[#c8aa6e] flex items-center gap-1">Skipped — answer revealed</span>
                  ) : (selectedBonusSkin.id === targetSkin.id || selectedBonusSkin.name.toLowerCase() === targetSkin.name.toLowerCase()) ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Bonus Correct!
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Bonus Missed!
                    </span>
                  )}
                </div>
                <div className="mt-1 text-center">
                  <span className="text-sm font-bold text-[#c8aa6e]">
                    {targetSkin.name}
                  </span>
                  {selectedBonusSkin.id !== targetSkin.id && selectedBonusSkin.name.toLowerCase() !== targetSkin.name.toLowerCase() && (
                    <span className="text-xs text-[#a09b8c] block mt-0.5">
                      You guessed: {selectedBonusSkin.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Autocomplete Input (only when guessing champion) */}
      {!isSolved && (
        <AutocompleteInput
          champions={allChampions}
          guessedChampionIds={guesses.map(g => g.id)}
          onSelectChampion={onGuess}
          disabled={isSolved}
          placeholder="Guess the champion in the splash..."
        />
      )}

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
