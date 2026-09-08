import React from 'react';
import { Flag, X } from 'lucide-react';

interface SurrenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  streak: number;
}

export const SurrenderModal: React.FC<SurrenderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  streak,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#1e2328] border-2 border-[#785a28] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-6 relative text-center animate-flip-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Flag Icon */}
        <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400 shadow-inner">
          <Flag className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold font-serif text-[#f0e6d2]">
          Surrender Round?
        </h3>

        <p className="text-xs sm:text-sm text-[#a09b8c] mt-2 mb-6 leading-relaxed">
          Are you sure you want to give up? The correct champion will be revealed
          {streak > 0 ? (
            <span> and your current streak of <strong className="text-amber-400 font-bold">{streak}</strong> will be reset to 0.</span>
          ) : (
            <span> and this round will be counted as a loss.</span>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#785a28]/60 bg-[#091428] text-[#f0e6d2] font-semibold text-sm hover:bg-[#c8aa6e]/20 hover:border-[#c8aa6e] transition-all cursor-pointer shadow"
          >
            Keep Trying
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
          >
            Give Up
          </button>
        </div>
      </div>
    </div>
  );
};
