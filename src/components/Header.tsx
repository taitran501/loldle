import React from 'react';
import { GameMode } from '../types';
import { 
  Swords, 
  Quote as QuoteIcon, 
  Sparkles, 
  Image as ImageIcon, 
  Smile, 
  Infinity as InfinityIcon,
  Calendar,
  BarChart2,
  HelpCircle
} from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isUnlimited: boolean;
  onToggleUnlimited: (targetVal?: boolean) => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isUnlimited,
  onToggleUnlimited,
  onOpenHelp,
}) => {
  const modes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'classic', label: 'Classic', icon: <Swords className="w-5 h-5" /> },
    { id: 'quote', label: 'Quote', icon: <QuoteIcon className="w-5 h-5" /> },
    { id: 'ability', label: 'Ability', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'emoji', label: 'Emoji', icon: <Smile className="w-5 h-5" /> },
    { id: 'splash', label: 'Splash', icon: <ImageIcon className="w-5 h-5" /> },
  ];

  return (
    <header className="w-full border-b border-[#785a28]/40 bg-[#091428]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col lg:flex-row items-center lg:justify-between gap-2.5 lg:gap-4">
        {/* Row 1 on Mobile/Tablet / Left & Right Sections on Desktop */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          {/* Brand & Logo Emblem */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/favicon.png"
              alt="LoLdle Emblem"
              className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(0,180,255,0.5)] transition-transform hover:scale-110"
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#f0e6d2] font-serif uppercase bg-gradient-to-b from-[#f0e6d2] to-[#c8aa6e] bg-clip-text text-transparent drop-shadow">
              LoLdle
            </h1>
          </div>

          {/* Controls: Segmented Switcher & Help (visible on mobile/tablet right side) */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Segmented Daily vs Unlimited Switcher */}
            <div
              className="flex items-center bg-[#091428] border-2 border-[#785a28]/60 p-0.5 rounded-full shadow-inner select-none flex-shrink-0"
              role="group"
              aria-label="Game Mode: Daily or Unlimited"
            >
              <button
                onClick={() => onToggleUnlimited(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  !isUnlimited
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/80 font-bold'
                    : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-white/5 border border-transparent'
                }`}
                title="Daily Mode: Solve today's puzzle (same for everyone worldwide)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Daily</span>
              </button>
              <button
                onClick={() => onToggleUnlimited(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isUnlimited
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-[#091428] shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 font-extrabold'
                    : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-white/5 border border-transparent'
                }`}
                title="Unlimited Mode: Play unlimited rounds with instant next champion"
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Unlimited</span>
              </button>
            </div>

            <button
              onClick={onOpenHelp}
              className="p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-[#1e2328] rounded-lg transition border border-[#785a28]/30 flex-shrink-0"
              title="How to play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Mode Navigation Tabs (Centered on desktop/tablet, scrollable from start on mobile) */}
        <nav className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto max-w-full px-2 pb-1 lg:pb-0 select-none flex-shrink-0">
          {modes.map(mode => {
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1e2328] text-[#c8aa6e] border border-[#c8aa6e]/60 shadow-[0_0_10px_rgba(200,170,110,0.2)]'
                    : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-[#1e2328]/50 border border-transparent'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Controls (hidden on mobile/tablet, shown on lg screens on the right) */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* Segmented Daily vs Unlimited Mode Switcher */}
          <div
            className="flex items-center bg-[#091428] border-2 border-[#785a28]/60 p-0.5 rounded-full shadow-inner select-none"
            role="group"
            aria-label="Game Mode: Daily or Unlimited"
          >
            <button
              onClick={() => onToggleUnlimited(false)}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                !isUnlimited
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/80 font-bold scale-[1.02]'
                  : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-white/5 border border-transparent'
              }`}
              title="Daily Mode: Solve today's puzzle (same for everyone worldwide)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily</span>
            </button>

            <button
              onClick={() => onToggleUnlimited(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isUnlimited
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-[#091428] shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 font-extrabold scale-[1.02]'
                  : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-white/5 border border-transparent'
              }`}
              title="Unlimited Mode: Play unlimited rounds with instant next champion"
            >
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>Unlimited</span>
            </button>
          </div>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-[#1e2328] rounded-lg transition border border-[#785a28]/30 cursor-pointer"
            title="How to play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
