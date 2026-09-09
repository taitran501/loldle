import React, { useEffect, useRef } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import {
  CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES,
  CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES,
  CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES,
  EMOJI_MAX_CLUES,
  EMOJI_MIN_CLUES,
  QUOTE_AUDIO_UNLOCK_GUESSES,
} from '../utils/constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement as HTMLElement;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className="w-full max-w-lg bg-[#1e2328] border-2 border-[#785a28] rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close help"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="help-modal-title" className="text-xl font-bold font-serif text-[#f0e6d2] mb-3">How to Play</h3>

        <div className="space-y-4 text-xs sm:text-sm text-[#f0e6d2]/90 leading-relaxed">
          <div>
            <h4 className="font-bold text-[#c8aa6e] uppercase tracking-wider text-xs mb-1">
              Classic Mode Color Indicators
            </h4>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-emerald-600 border border-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  ✓
                </span>
                <span><strong className="text-emerald-400">Green:</strong> Correct attribute (exact match).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-amber-600 border border-amber-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  ~
                </span>
                <span><strong className="text-amber-400">Orange:</strong> Partial match (e.g. one matching role or one matching region).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-rose-700 border border-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  ✗
                </span>
                <span><strong className="text-rose-400">Red:</strong> Incorrect attribute (no overlap).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-600 border border-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  <ArrowUp className="w-3.5 h-3.5" />
                </span>
                <span><strong className="text-blue-300">Arrow Up:</strong> Target champion was released after your guess (later year).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-600 border border-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  <ArrowDown className="w-3.5 h-3.5" />
                </span>
                <span><strong className="text-blue-300">Arrow Down:</strong> Target champion was released before your guess (earlier year).</span>
              </div>
            </div>
          </div>

          <hr className="border-[#785a28]/40" />

          <div>
            <h4 className="font-bold text-[#c8aa6e] uppercase tracking-wider text-xs mb-1">
              Game Modes
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[#a09b8c]">
              <li><strong className="text-[#f0e6d2]">Classic:</strong> Deduce champion attributes (Gender, Positions, Species, Resource, Range, Region, Release Year). Quote, Ability, and Splash clues unlock after {CLASSIC_QUOTE_CLUE_UNLOCK_GUESSES}, {CLASSIC_ABILITY_CLUE_UNLOCK_GUESSES}, and {CLASSIC_SPLASH_CLUE_UNLOCK_GUESSES} guesses.</li>
              <li><strong className="text-[#f0e6d2]">Quote:</strong> Identify who says the iconic quote. Audio voice line unlocks after {QUOTE_AUDIO_UNLOCK_GUESSES} guesses.</li>
              <li><strong className="text-[#f0e6d2]">Ability:</strong> Identify the champion by their skill icon. Key hint unlocks after 3 guesses.</li>
              <li><strong className="text-[#f0e6d2]">Splash:</strong> Zooms out from over 2,000+ official skins with each guess.</li>
              <li><strong className="text-[#f0e6d2]">Emoji:</strong> Guess the champion from {EMOJI_MIN_CLUES}-{EMOJI_MAX_CLUES} thematic emoji clues. Each champion can use a different number of clues.</li>
            </ul>
          </div>

          <hr className="border-[#785a28]/40" />

          <div>
            <h4 className="font-bold text-[#c8aa6e] uppercase tracking-wider text-xs mb-1">
              Making a Guess
            </h4>
            <p className="text-[#a09b8c]">
              Search by the beginning of a champion's name, select a suggestion, then press <strong>Guess</strong> to submit it. Press Enter to submit the highlighted suggestion with the keyboard.
            </p>
          </div>

          <hr className="border-[#785a28]/40" />

          <div>
            <h4 className="font-bold text-[#c8aa6e] uppercase tracking-wider text-xs mb-1">
              Unlimited Mode
            </h4>
            <p className="text-[#a09b8c]">
              Toggle the <strong>Unlimited / Daily</strong> badge in the top bar anytime. Each mode keeps its own round and streak; a completed Daily puzzle stays locked until the next UTC day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
