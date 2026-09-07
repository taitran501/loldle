import React from 'react';
import { Champion, Skin } from '../../types';
import { AutocompleteInput } from '../AutocompleteInput';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface SplashModeProps {
  target: Champion;
  targetSkin: Skin;
  guesses: Champion[];
  onGuess: (champion: Champion) => void;
  isSolved: boolean;
  allChampions: Champion[];
}

export const SplashMode: React.FC<SplashModeProps> = ({
  target,
  targetSkin,
  guesses,
  onGuess,
  isSolved,
  allChampions,
}) => {
  // Continuous gradual zoom out with every guess:
  // Starts at 3.5x magnification (previously 4.6x), stepping down 0.25x per guess
  // reaching full view (1.0x) smoothly in 10 guesses instead of 15.
  const INITIAL_SCALE = 3.5;
  const STEP_PER_GUESS = 0.25;

  const rawScale = isSolved
    ? 1.0
    : Math.max(1.0, INITIAL_SCALE - guesses.length * STEP_PER_GUESS);
  const currentScale = Math.round(rawScale * 100) / 100;

  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    setImageLoaded(false);
  }, [target.id, targetSkin.id]);

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
      <div className="relative my-3 flex flex-col items-center">
        <div className="w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-2xl overflow-hidden border-2 border-[#c8aa6e]/80 shadow-[0_0_30px_rgba(200,170,110,0.25)] bg-[#091428] relative flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#1e2328] animate-pulse flex items-center justify-center z-10">
              <Sparkles className="w-8 h-8 text-[#c8aa6e]/40 animate-spin" />
            </div>
          )}
          <img
            key={`${target.id}-${targetSkin.id}`}
            src={targetSkin.splashFullUrl || targetSkin.splashCenteredUrl}
            alt="Champion Splash Art"
            onLoad={() => setImageLoaded(true)}
            onError={e => {
              const img = e.currentTarget;
              if (img.src !== targetSkin.splashCenteredUrl && targetSkin.splashCenteredUrl) {
                img.src = targetSkin.splashCenteredUrl;
              }
            }}
            style={{
              transform: `scale(${currentScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease',
              opacity: imageLoaded ? 1 : 0,
            }}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>

        {/* Zoom Level Indicator & Progressive Clues */}
        <div className="flex flex-col items-center gap-1.5 mt-2.5">
          {!isSolved && (
            <div className="flex items-center gap-2 text-xs text-[#a09b8c]">
              <span>Zoom: <strong className="text-[#c8aa6e]">{currentScale}x</strong></span>
              <span>•</span>
              <span>
                {guesses.length >= 10
                  ? 'Full view unlocked'
                  : `Full view in ${10 - guesses.length} ${10 - guesses.length === 1 ? 'try' : 'tries'}`}
              </span>
            </div>
          )}

          {/* Progressive Clue when stuck (after 5+ wrong guesses) */}
          {guesses.length >= 5 && !isSolved && (
            <div className="px-4 py-1.5 rounded-full bg-[#1e2328] border border-[#c8aa6e]/40 text-xs text-[#c8aa6e] flex items-center gap-1.5 animate-flip-in shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Clue ({guesses.length} tries): Region: <strong className="text-[#f0e6d2]">{target.regions.join(', ')}</strong>
                {guesses.length >= 8 && (
                  <> • Role: <strong className="text-[#f0e6d2]">{target.positions.join(', ')}</strong></>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Revealed Skin Name on Victory */}
        {isSolved && (
          <div className="mt-3 text-center flex items-center justify-center gap-2 bg-[#1e2328]/90 px-4 py-1.5 rounded-full border border-[#c8aa6e]/60 animate-flip-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[#c8aa6e] font-bold text-sm">
              {targetSkin.name}
            </span>
          </div>
        )}
      </div>

      {/* Autocomplete Input */}
      <AutocompleteInput
        champions={allChampions}
        guessedChampionIds={guesses.map(g => g.id)}
        onSelectChampion={onGuess}
        disabled={isSolved}
        placeholder="Guess the champion in the splash..."
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
