import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Champion, GameMode, Skin } from '../types';
import { 
  Trophy, 
  ArrowRight, 
  Share2, 
  X, 
  Flame, 
  Swords, 
  Quote as QuoteIcon, 
  Sparkles, 
  Smile, 
  Image as ImageIcon 
} from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  champion: Champion;
  skin?: Skin;
  mode: GameMode;
  guessCount: number;
  isUnlimited: boolean;
  streak: number;
  onNextRound: () => void;
  onShare: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  champion,
  skin,
  mode,
  guessCount,
  isUnlimited,
  streak,
  onNextRound,
  onShare,
  onSelectMode,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Golden confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c8aa6e', '#f0e6d2', '#0ac8b9', '#f59e0b'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allModes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'classic', label: 'Classic', icon: <Swords className="w-3.5 h-3.5" /> },
    { id: 'quote', label: 'Quote', icon: <QuoteIcon className="w-3.5 h-3.5" /> },
    { id: 'ability', label: 'Ability', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'emoji', label: 'Emoji', icon: <Smile className="w-3.5 h-3.5" /> },
    { id: 'splash', label: 'Splash', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  ];
  const otherModes = allModes.filter(m => m.id !== mode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-md bg-[#1e2328] border-2 border-[#c8aa6e] rounded-2xl shadow-[0_0_40px_rgba(200,170,110,0.35)] overflow-hidden relative animate-flip-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header with Champion Splash/Avatar */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-[#091428]">
          <img
            src={skin?.splashFullUrl || `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`}
            alt={champion.name}
            onError={e => {
              e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
            }}
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2328] via-[#1e2328]/50 to-transparent" />

          {/* Victory Badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#091428]/85 backdrop-blur px-4 py-1 rounded-full border border-[#c8aa6e] text-[#c8aa6e] text-xs font-bold uppercase tracking-wider shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Victory!</span>
          </div>

          {/* Champion Name */}
          <div className="absolute bottom-3 left-0 right-0 text-center px-4">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#f0e6d2] tracking-wide drop-shadow">
              {champion.name}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-6 my-1">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-[#f0e6d2]">{guessCount}</span>
              <span className="text-xs text-[#a09b8c] uppercase tracking-wider">
                {guessCount === 1 ? 'Guess' : 'Guesses'}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-[#785a28]/40" />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-amber-400">{streak}</span>
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-xs text-[#a09b8c] uppercase tracking-wider">Streak</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-5">
            {isUnlimited ? (
              <button
                onClick={onNextRound}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c8aa6e] to-[#785a28] hover:from-[#e0c488] hover:to-[#967032] text-black font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
              >
                <span>Play Next Champion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onShare}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Results</span>
              </button>
            )}

            {/* Switch Mode Options */}
            <div className="mt-2 pt-3 border-t border-[#785a28]/30">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#a09b8c] block mb-2">
                Or Switch To Another Mode:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {otherModes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onClose();
                      onSelectMode(m.id);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#091428] hover:bg-[#c8aa6e]/20 text-xs font-semibold text-[#c8aa6e] border border-[#785a28]/40 hover:border-[#c8aa6e] transition-all"
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {isUnlimited && (
              <button
                onClick={onShare}
                className="w-full flex items-center justify-center gap-1.5 text-[#a09b8c] hover:text-[#f0e6d2] text-xs transition py-1 mt-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Streak ({streak})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
