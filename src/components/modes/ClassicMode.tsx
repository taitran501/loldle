import React, { useEffect, useRef, useState } from 'react';
import { Champion, ClassicComparison, MatchStatus } from '../../types';
import { compareChampions } from '../../utils/compare';
import { CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES, CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES, CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES } from '../../utils/constants';
import { AutocompleteInput } from '../AutocompleteInput';
import { ArrowUp, ArrowDown, Check, Lock, Quote as QuoteIcon, Sparkles, Image as ImageIcon, X } from 'lucide-react';

interface ClassicModeProps {
  target: Champion;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

const statusBg = (status: MatchStatus) => {
  switch (status) {
    case 'correct':
      return 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_rgba(5,150,105,0.4)]';
    case 'partial':
      return 'bg-amber-600 border-amber-400 text-white shadow-[0_0_8px_rgba(217,119,6,0.4)]';
    case 'incorrect':
    default:
      return 'bg-rose-700 border-rose-500 text-white/90 shadow-[0_0_8px_rgba(190,18,60,0.3)]';
  }
};

export const ClassicMode: React.FC<ClassicModeProps> = ({
  target,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  const comparisons: ClassicComparison[] = guesses.map(guess =>
    compareChampions(target, guess)
  );

  // Classic clues unlock thresholds:
  // 1. Quote clue: 5 tries
  // 2. Ability clue: 10 tries
  // 3. Splash clue: 15 tries
  const [activeClue, setActiveClue] = useState<'quote' | 'ability' | 'splash' | null>(null);

  // Track newly added guess to stagger its tile animations from gender to release
  const prevGuessesLengthRef = useRef(guesses.length);
  const [animatingGuessId, setAnimatingGuessId] = useState<string | null>(null);

  useEffect(() => {
    if (guesses.length > prevGuessesLengthRef.current && guesses.length > 0) {
      setAnimatingGuessId(guesses[0].id);
    } else {
      setAnimatingGuessId(null);
    }
    prevGuessesLengthRef.current = guesses.length;
  }, [guesses.length, guesses[0]?.id]);

  useEffect(() => {
    setActiveClue(null);
    setAnimatingGuessId(null);
    prevGuessesLengthRef.current = guesses.length;
  }, [target.id]);

  const getTileAnim = (isNew: boolean, colIndex: number) => {
    if (!isNew) return {};
    return {
      className: 'animate-flip-in',
      style: { animationDelay: `${colIndex * 125}ms` },
    };
  };

  const quoteUnlocked = guesses.length >= CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES || isSolved;
  const abilityUnlocked = guesses.length >= CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES || isSolved;
  const splashUnlocked = guesses.length >= CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES || isSolved;

  const toggleClue = (type: 'quote' | 'ability' | 'splash') => {
    setActiveClue(prev => (prev === type ? null : type));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Classic Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Guess the mystery League champion by deducing their attributes!
        </p>
      </div>

      {/* Autocomplete Input */}
      <AutocompleteInput
        champions={allChampions}
        guessedChampionIds={guesses.map(g => g.id)}
        onSelectChampion={onGuess}
        disabled={isSolved}
        placeholder="Guess a champion (e.g. Ahri, Yasuo...)"
      />

      {/* Hextech Clues Dock (Compact, centered, tactile tokens) */}
      <div className="my-4 flex flex-col items-center w-full">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* 1. Quote Clue Token */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => quoteUnlocked && toggleClue('quote')}
              disabled={!quoteUnlocked}
              title={quoteUnlocked ? 'Quote Clue' : `Quote unlocks in ${Math.max(1, CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES - guesses.length)} tries`}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative transition-all duration-300 border-2 ${
                !quoteUnlocked
                  ? 'bg-[#091428]/70 border-[#785a28]/30 text-[#a09b8c]/40 cursor-not-allowed'
                  : activeClue === 'quote'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105'
                  : 'bg-[#1e2328] border-[#c8aa6e]/70 text-[#c8aa6e] hover:bg-[#c8aa6e]/20 hover:border-amber-300 hover:scale-105 cursor-pointer shadow-md'
              }`}
            >
              <QuoteIcon className="w-6 h-6" />
              {!quoteUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 bg-[#091428] rounded-full p-1 border border-[#785a28]/50 shadow">
                  <Lock className="w-3 h-3 text-[#c8aa6e]/80" />
                </div>
              )}
            </button>
            <span className="text-xs font-bold text-[#c8aa6e] tracking-wide">
              Quote
            </span>
            <span className="text-[10px] text-[#a09b8c]">
              {!quoteUnlocked ? (
                `${Math.max(1, CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES - guesses.length)} tries`
              ) : activeClue === 'quote' ? (
                <span className="text-amber-400 font-medium">Viewing</span>
              ) : (
                <span className="text-emerald-400 font-medium">Ready</span>
              )}
            </span>
          </div>

          {/* 2. Ability Clue Token */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => abilityUnlocked && toggleClue('ability')}
              disabled={!abilityUnlocked}
              title={abilityUnlocked ? 'Ability Clue' : `Ability unlocks in ${Math.max(1, CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES - guesses.length)} tries`}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative transition-all duration-300 border-2 ${
                !abilityUnlocked
                  ? 'bg-[#091428]/70 border-[#785a28]/30 text-[#a09b8c]/40 cursor-not-allowed'
                  : activeClue === 'ability'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105'
                  : 'bg-[#1e2328] border-[#c8aa6e]/70 text-[#c8aa6e] hover:bg-[#c8aa6e]/20 hover:border-amber-300 hover:scale-105 cursor-pointer shadow-md'
              }`}
            >
              <Sparkles className="w-6 h-6" />
              {!abilityUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 bg-[#091428] rounded-full p-1 border border-[#785a28]/50 shadow">
                  <Lock className="w-3 h-3 text-[#c8aa6e]/80" />
                </div>
              )}
            </button>
            <span className="text-xs font-bold text-[#c8aa6e] tracking-wide">
              Ability
            </span>
            <span className="text-[10px] text-[#a09b8c]">
              {!abilityUnlocked ? (
                `${Math.max(1, CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES - guesses.length)} tries`
              ) : activeClue === 'ability' ? (
                <span className="text-amber-400 font-medium">Viewing</span>
              ) : (
                <span className="text-emerald-400 font-medium">Ready</span>
              )}
            </span>
          </div>

          {/* 3. Splash Clue Token */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => splashUnlocked && toggleClue('splash')}
              disabled={!splashUnlocked}
              title={splashUnlocked ? 'Splash Clue' : `Splash unlocks in ${Math.max(1, CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES - guesses.length)} tries`}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative transition-all duration-300 border-2 ${
                !splashUnlocked
                  ? 'bg-[#091428]/70 border-[#785a28]/30 text-[#a09b8c]/40 cursor-not-allowed'
                  : activeClue === 'splash'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105'
                  : 'bg-[#1e2328] border-[#c8aa6e]/70 text-[#c8aa6e] hover:bg-[#c8aa6e]/20 hover:border-amber-300 hover:scale-105 cursor-pointer shadow-md'
              }`}
            >
              <ImageIcon className="w-6 h-6" />
              {!splashUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 bg-[#091428] rounded-full p-1 border border-[#785a28]/50 shadow">
                  <Lock className="w-3 h-3 text-[#c8aa6e]/80" />
                </div>
              )}
            </button>
            <span className="text-xs font-bold text-[#c8aa6e] tracking-wide">
              Splash
            </span>
            <span className="text-[10px] text-[#a09b8c]">
              {!splashUnlocked ? (
                `${Math.max(1, CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES - guesses.length)} tries`
              ) : activeClue === 'splash' ? (
                <span className="text-amber-400 font-medium">Viewing</span>
              ) : (
                <span className="text-emerald-400 font-medium">Ready</span>
              )}
            </span>
          </div>
        </div>

        {/* Active Clue Popover Card */}
        {activeClue && (
          <div className="w-full max-w-md mt-4 bg-[#1e2328]/95 border-2 border-[#c8aa6e]/70 rounded-2xl p-4 shadow-2xl relative animate-flip-in backdrop-blur">
            <button
              onClick={() => setActiveClue(null)}
              className="absolute top-2.5 right-2.5 p-1 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10 transition"
              title="Close clue"
            >
              <X className="w-4 h-4" />
            </button>

            {activeClue === 'quote' && quoteUnlocked && (
              <div className="text-center px-4 py-1">
                <span className="text-[11px] font-bold text-[#c8aa6e] uppercase tracking-wider block mb-1">
                  Quote Clue
                </span>
                <p className="text-sm sm:text-base italic font-serif text-[#f0e6d2] leading-relaxed">
                  "{target.quotes?.[0]?.text}"
                </p>
              </div>
            )}

            {activeClue === 'ability' && abilityUnlocked && (
              <div className="flex flex-col items-center py-1">
                <span className="text-[11px] font-bold text-[#c8aa6e] uppercase tracking-wider block mb-2">
                  Ability Clue (Spell Icon)
                </span>
                <img
                  src={target.abilities[1]?.iconUrl || target.abilities[0]?.iconUrl}
                  alt="Spell Icon Clue"
                  className="w-16 h-16 rounded-xl border-2 border-[#c8aa6e] object-cover shadow-lg"
                />
              </div>
            )}

            {activeClue === 'splash' && splashUnlocked && (
              <div className="flex flex-col items-center py-1">
                <span className="text-[11px] font-bold text-[#c8aa6e] uppercase tracking-wider block mb-2">
                  Splash Art Clue
                </span>
                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-[#c8aa6e] relative shadow-lg">
                  <img
                    src={target.skins[0]?.splashCenteredUrl || `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${target.id}_0.jpg`}
                    alt="Splash Art Clue"
                    style={{ transform: 'scale(3.5)' }}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guesses Table */}
      {comparisons.length > 0 && (
        <div className="w-full max-w-4xl pb-4 mt-2 overflow-x-hidden">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-8 gap-1.5 sm:gap-2 min-w-[680px] text-center font-bold text-xs uppercase tracking-wider text-[#c8aa6e] mb-2 px-1">
            <div className="py-1">Champion</div>
            <div className="py-1">Gender</div>
            <div className="py-1">Position(s)</div>
            <div className="py-1">Species</div>
            <div className="py-1">Resource</div>
            <div className="py-1">Range type</div>
            <div className="py-1">Region(s)</div>
            <div className="py-1">Release</div>
          </div>

          {/* Comparison Rows */}
          <div className="hidden md:flex flex-col gap-2 min-w-[680px] overflow-x-auto">
            {comparisons.map((c) => {
              const isNew = c.champion.id === animatingGuessId;
              const tile0 = getTileAnim(isNew, 0);
              const tile1 = getTileAnim(isNew, 1);
              const tile2 = getTileAnim(isNew, 2);
              const tile3 = getTileAnim(isNew, 3);
              const tile4 = getTileAnim(isNew, 4);
              const tile5 = getTileAnim(isNew, 5);
              const tile6 = getTileAnim(isNew, 6);
              const tile7 = getTileAnim(isNew, 7);

              return (
                <div
                  key={c.champion.id}
                  className="grid grid-cols-8 gap-1.5 sm:gap-2 text-center text-xs sm:text-sm font-medium"
                >
                  {/* Champion Tile */}
                  <div
                    style={tile0.style}
                    className={`h-16 sm:h-20 bg-[#1e2328] border border-[#785a28]/60 rounded-lg flex flex-col items-center justify-center p-1 relative overflow-hidden group ${tile0.className || ''}`}
                  >
                    <img
                      src={c.champion.iconUrl}
                      alt={c.champion.name}
                      onError={e => {
                        e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${c.champion.id}.png`;
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#c8aa6e]/50"
                    />
                    <span className="text-[11px] font-semibold text-[#f0e6d2] mt-0.5 truncate w-full px-0.5">
                      {c.champion.name}
                    </span>
                  </div>

                  {/* Gender */}
                  <div
                    style={tile1.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.genderMatch
                    )} ${tile1.className || ''}`}
                  >
                    <span>{c.champion.gender}</span>
                  </div>

                  {/* Positions */}
                  <div
                    style={tile2.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.positionsMatch
                    )} ${tile2.className || ''}`}
                  >
                    <span>{c.champion.positions.join(', ')}</span>
                  </div>

                  {/* Species */}
                  <div
                    style={tile3.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.speciesMatch
                    )} ${tile3.className || ''}`}
                  >
                    <span className="line-clamp-2">{c.champion.species.join(', ')}</span>
                  </div>

                  {/* Resource */}
                  <div
                    style={tile4.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.resourceMatch
                    )} ${tile4.className || ''}`}
                  >
                    <span>{c.champion.resource}</span>
                  </div>

                  {/* Range Type */}
                  <div
                    style={tile5.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.rangeTypeMatch
                    )} ${tile5.className || ''}`}
                  >
                    <span>{c.champion.rangeType.join(', ')}</span>
                  </div>

                  {/* Regions */}
                  <div
                    style={tile6.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.regionsMatch
                    )} ${tile6.className || ''}`}
                  >
                    <span className="line-clamp-2">{c.champion.regions.join(', ')}</span>
                  </div>

                  {/* Release Year */}
                  <div
                    style={tile7.style}
                    className={`h-16 sm:h-20 rounded-lg border flex items-center justify-center p-1.5 text-center ${statusBg(
                      c.releaseYearMatch.status
                    )} ${tile7.className || ''}`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <span>{c.champion.releaseYear}</span>
                      {c.releaseYearMatch.direction === 'higher' && (
                        <ArrowUp className="w-4 h-4 text-white animate-bounce" />
                      )}
                      {c.releaseYearMatch.direction === 'lower' && (
                        <ArrowDown className="w-4 h-4 text-white animate-bounce" />
                      )}
                      {c.releaseYearMatch.status === 'correct' && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vertical cards on small screens keep every attribute readable without page-level horizontal scrolling. */}
          <div className="md:hidden flex flex-col gap-3">
            {comparisons.map(c => {
              const isNew = c.champion.id === animatingGuessId;
              const tile = getTileAnim(isNew, 0);
              const mobileAttribute = (label: string, value: React.ReactNode, status: MatchStatus, index: number) => {
                const animation = getTileAnim(isNew, index);
                return (
                  <div
                    key={label}
                    style={animation.style}
                    className={`min-h-14 rounded-lg border p-2 flex flex-col justify-center ${statusBg(status)} ${animation.className || ''}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-75">{label}</span>
                    <span className="font-semibold leading-tight">{value}</span>
                  </div>
                );
              };

              return (
                <article
                  key={`mobile-${c.champion.id}`}
                  className={`rounded-xl border border-[#785a28]/60 bg-[#1e2328] p-3 ${tile.className || ''}`}
                  style={tile.style}
                >
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#785a28]/40">
                    <img
                      src={c.champion.iconUrl}
                      alt={c.champion.name}
                      onError={e => {
                        e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${c.champion.id}.png`;
                      }}
                      className="w-12 h-12 rounded-full object-cover border border-[#c8aa6e]/50"
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-[#c8aa6e]">Guess</span>
                      <h3 className="font-bold text-[#f0e6d2]">{c.champion.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {mobileAttribute('Gender match', c.champion.gender, c.genderMatch, 1)}
                    {mobileAttribute('Position(s) match', c.champion.positions.join(', '), c.positionsMatch, 2)}
                    {mobileAttribute('Species match', c.champion.species.join(', '), c.speciesMatch, 3)}
                    {mobileAttribute('Resource match', c.champion.resource, c.resourceMatch, 4)}
                    {mobileAttribute('Range type match', c.champion.rangeType.join(', '), c.rangeTypeMatch, 5)}
                    {mobileAttribute('Region(s) match', c.champion.regions.join(', '), c.regionsMatch, 6)}
                    <div
                      style={getTileAnim(isNew, 7).style}
                      className={`min-h-14 rounded-lg border p-2 flex flex-col justify-center ${statusBg(c.releaseYearMatch.status)} ${getTileAnim(isNew, 7).className || ''}`}
                    >
                      <span className="text-[10px] uppercase tracking-wide opacity-75">Release year</span>
                      <span className="font-semibold flex items-center gap-1">
                        {c.champion.releaseYear}
                        {c.releaseYearMatch.direction === 'higher' && <ArrowUp className="w-3.5 h-3.5" />}
                        {c.releaseYearMatch.direction === 'lower' && <ArrowDown className="w-3.5 h-3.5" />}
                        {c.releaseYearMatch.status === 'correct' && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
