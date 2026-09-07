import React, { useState, useRef, useEffect } from 'react';
import { Champion } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { Volume2, VolumeX, Quote as QuoteIcon, CheckCircle, XCircle } from 'lucide-react';

interface QuoteModeProps {
  target: Champion;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

export const QuoteMode: React.FC<QuoteModeProps> = ({
  target,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Hint unlocked after 5 guesses or on solve
  const isAudioUnlocked = guesses.length >= 5 || isSolved;

  // Stop and reset audio if target champion or audio URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, [target.id, target.quote.audioUrl]);

  const handlePlayAudio = () => {
    if (!target.quote.audioUrl) return;

    // Always ensure audioRef matches the current target's audioUrl
    if (!audioRef.current || audioRef.current.src !== target.quote.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(target.quote.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audioRef.current = audio;
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
      });
    }
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
        
        <div className="text-center relative z-10">
          <p className="text-xl sm:text-2xl font-serif italic font-semibold text-[#f0e6d2] leading-relaxed tracking-wide drop-shadow">
            "{target.quote.text}"
          </p>

          {/* Audio Hint Button */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {isAudioUnlocked ? (
              <button
                onClick={handlePlayAudio}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border shadow-lg ${
                  isPlaying
                    ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                    : 'bg-[#091428] text-[#c8aa6e] border-[#c8aa6e]/60 hover:bg-[#c8aa6e]/20'
                }`}
              >
                {isPlaying ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Volume2 className="w-5 h-5" />}
                <span>{isPlaying ? 'Playing Voice...' : 'Listen to Voice Line'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#a09b8c] bg-[#091428]/60 px-4 py-2 rounded-full border border-[#785a28]/30">
                <VolumeX className="w-4 h-4 text-[#a09b8c]" />
                <span>Audio clue in {Math.max(1, 5 - guesses.length)} {5 - guesses.length === 1 ? 'try' : 'tries'}</span>
              </div>
            )}
          </div>
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
