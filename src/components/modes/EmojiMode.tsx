import React from 'react';
import { Champion } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { CheckCircle, XCircle, Lock, HelpCircle } from 'lucide-react';

interface EmojiModeProps {
  target: Champion;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

const getEmojiSvgUrl = (emoji: string): string => {
  try {
    const hasZwj = emoji.includes('\u200d');
    const codePoints = Array.from(emoji)
      .map(char => char.codePointAt(0)!.toString(16))
      .filter(cp => hasZwj ? true : cp !== 'fe0f');
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
  } catch {
    return '';
  }
};

export const EmojiMode: React.FC<EmojiModeProps> = ({
  target,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  // Emojis reveal progressively:
  // 0 guesses: 1st emoji
  // 1 guess: 2nd emoji
  // 2 guesses: 3rd emoji
  // 3+ guesses or solved: 4th emoji (all revealed)
  const revealedCount = isSolved ? target.emojis.length : Math.min(guesses.length + 1, target.emojis.length);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Emoji Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Guess the champion from thematic emojis. A new emoji unlocks with each guess!
        </p>
      </div>

      {/* Emoji Cards Container */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-5">
        {target.emojis.map((emoji, idx) => {
          const isUnlocked = idx < revealedCount;

          return (
            <div
              key={idx}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 select-none p-3 ${
                isUnlocked
                  ? 'bg-[#1e2328]/95 border-2 border-[#c8aa6e] shadow-[0_0_20px_rgba(200,170,110,0.25)] animate-flip-in hover:scale-105'
                  : 'bg-[#091428]/80 border-2 border-[#785a28]/40 text-[#a09b8c]/50'
              }`}
            >
              {isUnlocked ? (
                <>
                  <img
                    src={getEmojiSvgUrl(emoji)}
                    alt={emoji}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow pointer-events-none select-none"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (sibling) sibling.style.display = 'inline';
                    }}
                  />
                  <span style={{ display: 'none' }} className="text-3xl sm:text-4xl">{emoji}</span>
                </>
              ) : (
                <Lock className="w-5 h-5 text-[#785a28]/80" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progressive Clue when stuck (after 4+ wrong guesses) */}
      {guesses.length >= 4 && !isSolved && (
        <div className="mb-4 px-4 py-1.5 rounded-full bg-[#1e2328] border border-[#c8aa6e]/40 text-xs text-[#c8aa6e] flex items-center gap-1.5 animate-flip-in shadow-md">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Clue ({guesses.length} tries): Region: <strong className="text-[#f0e6d2]">{target.regions.join(', ')}</strong>
            {guesses.length >= 6 && (
              <> • Role: <strong className="text-[#f0e6d2]">{target.positions.join(', ')}</strong></>
            )}
          </span>
        </div>
      )}

      {/* Autocomplete Input */}
      <AutocompleteInput
        champions={allChampions}
        guessedChampionIds={guesses.map(g => g.id)}
        onSelectChampion={onGuess}
        disabled={isSolved}
        placeholder="Guess the champion behind the emojis..."
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
