import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Champion } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { Volume2, VolumeX, Quote as QuoteIcon, CheckCircle, XCircle, Sparkles, Crown, MapPin } from 'lucide-react';

interface QuoteModeProps {
  target: Champion;
  quoteIndex: number;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

export const QuoteMode: React.FC<QuoteModeProps> = ({
  target,
  quoteIndex,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  const [playingQuoteIndex, setPlayingQuoteIndex] = useState<1 | 2 | 3 | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Progressive Clue Milestones: 3, 5, 7, 9
  // 3 guesses: Audio voice line of Quote 1
  // 5 guesses: Quote 2 (Interaction with another champion) + Audio 2
  // 7 guesses: Quote 3 (Signature / Champion Select Pick line) + Audio 3
  // 9 guesses: Region Clue
  const isAudio1Unlocked = guesses.length >= 3 || isSolved;
  const isQuote2Unlocked = guesses.length >= 5 || isSolved;
  const isQuote3Unlocked = guesses.length >= 7 || isSolved;
  const isRegionUnlocked = guesses.length >= 9 || isSolved;

  // 1. Quote 1: Random quote based on quoteIndex
  const activeQuote = target.quotes?.[quoteIndex] ?? target.quotes?.[0] ?? null;
  const audioUrl1 = activeQuote?.audioUrl ?? '';
  const quote1Text = activeQuote?.text ?? '';

  // 2. Quote 2: Prioritize interaction voice line with another champion
  const quote2 = useMemo(() => {
    if (!target.quotes || target.quotes.length <= 1) return null;
    const interaction = target.quotes.find((q, idx) => {
      if (idx === quoteIndex || q.text === quote1Text) return false;
      const url = q.audioUrl.toLowerCase();
      const isInteractionUrl = url.includes('kill') || url.includes('taunt') || url.includes('interaction') || url.includes('respawn');
      const mentionsOtherChamp = allChampions.some(c => c.id !== target.id && q.text.toLowerCase().includes(c.name.toLowerCase()));
      return isInteractionUrl || mentionsOtherChamp;
    });
    return interaction ?? target.quotes.find((q, idx) => idx !== quoteIndex && q.text !== quote1Text) ?? null;
  }, [target.id, target.quotes, quoteIndex, quote1Text, allChampions]);

  // 3. Quote 3: Prioritize iconic signature / champion select pick quote
  const quote3 = useMemo(() => {
    if (!target.quotes || target.quotes.length <= 2) return null;
    const signature = target.quotes.find((q, idx) => {
      if (idx === quoteIndex || q.text === quote1Text || (quote2 && q.text === quote2.text)) return false;
      const url = q.audioUrl.toLowerCase();
      return url.includes('champion-choose-vo') || url.includes('select') || url.includes('pick') || url.includes('choose');
    });
    if (signature) return signature;
    const firstQuote = target.quotes[0];
    if (firstQuote && firstQuote.text !== quote1Text && (!quote2 || firstQuote.text !== quote2.text)) {
      return firstQuote;
    }
    return target.quotes.find((q, idx) => idx !== quoteIndex && q.text !== quote1Text && (!quote2 || q.text !== quote2.text)) ?? null;
  }, [target.id, target.quotes, quoteIndex, quote1Text, quote2]);

  // Stop and reset audio if target champion or quotes change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingQuoteIndex(null);
  }, [target.id, audioUrl1, quote2?.audioUrl, quote3?.audioUrl]);

  const handlePlayAudio = (quoteNum: 1 | 2 | 3 = 1) => {
    const targetAudio = quoteNum === 1
      ? audioUrl1
      : quoteNum === 2
        ? (quote2?.audioUrl ?? '')
        : (quote3?.audioUrl ?? '');
    if (!targetAudio) return;

    if (playingQuoteIndex === quoteNum) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingQuoteIndex(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(targetAudio);
    audio.onended = () => setPlayingQuoteIndex(null);
    audio.onerror = () => setPlayingQuoteIndex(null);
    audioRef.current = audio;

    audio.play().then(() => {
      setPlayingQuoteIndex(quoteNum);
    }).catch(err => {
      console.warn('Audio playback error:', err);
      setPlayingQuoteIndex(null);
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Quote Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Who says this quote in League of Legends?
        </p>
      </div>

      {/* Quote Display Card */}
      <div className="w-full max-w-xl bg-[#1e2328]/90 border-2 border-[#785a28]/60 rounded-2xl p-6 sm:p-8 my-3 shadow-2xl relative overflow-hidden backdrop-blur">
        <QuoteIcon className="absolute -top-2 -left-2 w-16 h-16 text-[#c8aa6e]/10 -rotate-12 pointer-events-none" />
        
        <div className="text-center relative z-10 flex flex-col items-center">
          {/* Quote #1 Header & Text */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#c8aa6e]/15 text-[#c8aa6e] border border-[#c8aa6e]/30 mb-2">
            Quote #1
          </div>

          <p className="text-xl sm:text-2xl font-serif italic font-semibold text-[#f0e6d2] leading-relaxed tracking-wide drop-shadow">
            &quot;{quote1Text}&quot;
          </p>

          {/* Audio Hint Button for Quote 1 (Unlocked at >= 3 tries or solved) */}
          {isAudio1Unlocked && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={() => handlePlayAudio(1)}
                disabled={!audioUrl1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border shadow-lg ${
                  playingQuoteIndex === 1
                    ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                    : 'bg-[#091428] text-[#c8aa6e] border-[#c8aa6e]/60 hover:bg-[#c8aa6e]/20'
                } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
              >
                {playingQuoteIndex === 1 ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Volume2 className="w-5 h-5" />}
                <span>{playingQuoteIndex === 1 ? 'Playing Voice...' : 'Listen to Voice Line'}</span>
              </button>
            </div>
          )}

          {/* Quote 2 Section: Interaction voice line (Unlocked at >= 5 tries or solved) */}
          {isQuote2Unlocked && quote2 && (
            <div className="w-full border-t border-[#785a28]/40 pt-5 mt-5 flex flex-col items-center animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quote #2 • Interaction Clue</span>
              </div>
              <p className="text-lg sm:text-xl font-serif italic font-semibold text-[#f0e6d2] leading-relaxed tracking-wide drop-shadow text-center">
                &quot;{quote2.text}&quot;
              </p>

              {quote2.audioUrl && (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(2)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border shadow-lg ${
                      playingQuoteIndex === 2
                        ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                        : 'bg-[#091428] text-[#c8aa6e] border-[#c8aa6e]/60 hover:bg-[#c8aa6e]/20'
                    } cursor-pointer`}
                  >
                    {playingQuoteIndex === 2 ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Volume2 className="w-5 h-5" />}
                    <span>{playingQuoteIndex === 2 ? 'Playing 2nd Voice...' : 'Listen to 2nd Voice'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quote 3 Section: Signature Pick voice line (Unlocked at >= 7 tries or solved) */}
          {isQuote3Unlocked && quote3 && (
            <div className="w-full border-t border-[#785a28]/40 pt-5 mt-5 flex flex-col items-center animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Quote #3 • Signature Pick Line</span>
              </div>
              <p className="text-lg sm:text-xl font-serif italic font-semibold text-[#f0e6d2] leading-relaxed tracking-wide drop-shadow text-center">
                &quot;{quote3.text}&quot;
              </p>

              {quote3.audioUrl && (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(3)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border shadow-lg ${
                      playingQuoteIndex === 3
                        ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                        : 'bg-[#091428] text-[#c8aa6e] border-[#c8aa6e]/60 hover:bg-[#c8aa6e]/20'
                    } cursor-pointer`}
                  >
                    {playingQuoteIndex === 3 ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Volume2 className="w-5 h-5" />}
                    <span>{playingQuoteIndex === 3 ? 'Playing 3rd Voice...' : 'Listen to 3rd Voice'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Final Clue: Region (Unlocked at >= 9 tries or solved) */}
          {isRegionUnlocked && target.regions && target.regions.length > 0 && (
            <div className="w-full border-t border-[#785a28]/40 pt-5 mt-5 flex flex-col items-center animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-blue-500/15 text-blue-300 border border-blue-500/30 mb-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Final Clue • Region</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-[#a09b8c]">Champion Region:</span>
                <p className="text-base sm:text-lg font-bold text-[#c8aa6e] mt-0.5">
                  {target.regions.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Progressive Countdown for next clue (when not solved) */}
          {!isSolved && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-[#a09b8c] bg-[#091428]/60 px-4 py-2 rounded-full border border-[#785a28]/30 shadow-md">
                <VolumeX className="w-4 h-4 text-[#a09b8c]" />
                <span>
                  {guesses.length < 3 ? (
                    `Audio clue in ${3 - guesses.length} ${3 - guesses.length === 1 ? 'try' : 'tries'}`
                  ) : guesses.length < 5 ? (
                    `Quote #2 (Interaction) in ${5 - guesses.length} ${5 - guesses.length === 1 ? 'try' : 'tries'}`
                  ) : guesses.length < 7 ? (
                    `Signature Quote in ${7 - guesses.length} ${7 - guesses.length === 1 ? 'try' : 'tries'}`
                  ) : guesses.length < 9 ? (
                    `Region clue in ${9 - guesses.length} ${9 - guesses.length === 1 ? 'try' : 'tries'}`
                  ) : (
                    'All clues unlocked'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Input */}
      <AutocompleteInput
        champions={allChampions}
        guessedChampionIds={guesses.map(g => g.id)}
        onSelectChampion={onGuess}
        disabled={isSolved}
        placeholder="Guess who said it..."
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
