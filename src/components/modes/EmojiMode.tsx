import React from 'react';
import { Champion } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { EmojiRender } from '../EmojiRender';
import { CheckCircle, XCircle, Lock, Sparkles } from 'lucide-react';
import { getEmojiRevealCount, normalizeEmojiClues } from '../../utils/emoji';
import { getChampionIconUrl } from '../../utils/constants';

interface EmojiModeProps {
  target: Champion;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

export const EmojiMode: React.FC<EmojiModeProps> = ({
  target,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  const emojiClues = normalizeEmojiClues(target.emojis);
  const revealedCount = getEmojiRevealCount(emojiClues.length, guesses.length, isSolved);

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

      {/* One card per source emoji. The rendered glyph comes from the pinned
          emoji data/spritesheet, not from the machine's emoji font. */}
      <div
        data-testid="emoji-clues"
        role="list"
        aria-label={`Emoji clues: ${revealedCount} of ${emojiClues.length} revealed`}
        className="grid grid-cols-2 items-center justify-items-center gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-5 my-5 w-full max-w-2xl"
      >
        {emojiClues.map((emoji, idx) => {
          const isUnlocked = idx < revealedCount;

          return (
            <div
              key={`${emoji}-${idx}`}
              role="listitem"
              data-testid={`emoji-clue-${idx}`}
              aria-label={isUnlocked ? `Emoji clue ${idx + 1}: ${emoji}` : `Emoji clue ${idx + 1}: locked`}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center relative transition-all duration-300 select-none p-3 ${
                isUnlocked
                  ? 'bg-[#1e2328]/95 border-2 border-[#c8aa6e] shadow-[0_0_20px_rgba(200,170,110,0.25)] animate-flip-in hover:scale-105'
                  : 'bg-[#091428]/80 border-2 border-[#785a28]/40 text-[#a09b8c]/50'
              }`}
            >
              {isUnlocked ? (
                <EmojiRender emoji={emoji} className="w-14 h-14 sm:w-16 sm:h-16" />
              ) : (
                <Lock className="w-5 h-5 text-[#785a28]/80" />
              )}
            </div>
          );
        })}
        {emojiClues.length === 0 && (
          <div role="status" className="col-span-4 text-sm text-rose-300">
            No emoji clues available.
          </div>
        )}
      </div>

      {/* Progressive Clues when stuck (after 4+ wrong guesses) */}
      {guesses.length >= 4 && !isSolved && (
        <div className="mb-4 px-4 py-1.5 rounded-full bg-[#1e2328] border border-[#c8aa6e]/40 text-xs text-[#c8aa6e] flex items-center gap-1.5 animate-flip-in shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Clue ({guesses.length} tries): Region: <strong className="text-[#f0e6d2]">{target.regions.join(', ')}</strong>
            {guesses.length >= 7 && (
              <> • Role: <strong className="text-[#f0e6d2]">{target.positions.join(', ')}</strong></>
            )}
            {guesses.length >= 10 && (
              <> • Release: <strong className="text-[#f0e6d2]">{target.releaseYear}</strong></>
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
                      e.currentTarget.src = getChampionIconUrl(guess.id);
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
