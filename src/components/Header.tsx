import React, { useEffect, useRef, useState } from 'react';
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
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isUnlimited: boolean;
  onToggleUnlimited: (targetVal?: boolean) => void;
  emojiModeEnabled: boolean;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

const modes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
  { id: 'classic', label: 'Classic', icon: <Swords className="w-5 h-5" /> },
  { id: 'quote', label: 'Quote', icon: <QuoteIcon className="w-5 h-5" /> },
  { id: 'ability', label: 'Ability', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'emoji', label: 'Emoji', icon: <Smile className="w-5 h-5" /> },
  { id: 'splash', label: 'Splash', icon: <ImageIcon className="w-5 h-5" /> },
];

const ModeNavigation: React.FC<{
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  emojiModeEnabled: boolean;
  className?: string;
}> = ({ currentMode, onSelectMode, emojiModeEnabled, className = '' }) => {
  const navRef = useRef<HTMLElement>(null);
  const [hasMoreModes, setHasMoreModes] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateScrollHint = () => {
      const hasOverflow = nav.scrollWidth > nav.clientWidth + 2;
      const canScrollRight = nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 2;
      setHasMoreModes(hasOverflow && canScrollRight);
    };

    updateScrollHint();
    nav.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);
    return () => {
      nav.removeEventListener('scroll', updateScrollHint);
      window.removeEventListener('resize', updateScrollHint);
    };
  }, []);

  return (
    <div className={`relative min-w-0 ${className}`}>
      <nav
        ref={navRef}
        aria-label="Game modes"
        className="flex w-full items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto max-w-full px-0.5 pb-1 lg:pb-0 select-none flex-shrink-0"
      >
        {modes.map(mode => {
          const isActive = currentMode === mode.id;
          const isDisabled = mode.id === 'emoji' && !emojiModeEnabled;
          return (
            <button
              type="button"
              key={mode.id}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => onSelectMode(mode.id)}
              title={isDisabled ? 'Emoji catalog is being reviewed' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-[#1e2328] text-[#c8aa6e] border border-[#c8aa6e]/60 shadow-[0_0_10px_rgba(200,170,110,0.2)]'
                  : isDisabled
                    ? 'text-[#a09b8c]/45 border border-transparent cursor-not-allowed'
                    : 'text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-[#1e2328]/50 border border-transparent cursor-pointer'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </nav>
      {hasMoreModes && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-1 flex w-9 items-center justify-end bg-gradient-to-r from-transparent via-[#091428]/80 to-[#091428] pr-0.5 lg:hidden"
        >
          <ChevronRight className="h-4 w-4 text-[#c8aa6e]" />
        </div>
      )}
      {hasMoreModes && (
        <span className="sr-only" role="status">
          More game modes are available. Swipe horizontally to view them.
        </span>
      )}
    </div>
  );
};

interface PlayTypeSwitcherProps {
  isUnlimited: boolean;
  onToggleUnlimited: (targetVal?: boolean) => void;
  compact?: boolean;
}

const PlayTypeSwitcher: React.FC<PlayTypeSwitcherProps> = ({
  isUnlimited,
  onToggleUnlimited,
  compact = false,
}) => (
  <div
    className={`flex items-center bg-[#091428] border-2 border-[#785a28]/60 p-0.5 rounded-full shadow-inner select-none flex-shrink-0 ${compact ? '' : ''}`}
    role="group"
    aria-label="Game mode: Daily or Unlimited"
  >
    <button
      type="button"
      aria-pressed={!isUnlimited}
      onClick={() => onToggleUnlimited(false)}
      className={`flex items-center gap-1 ${compact ? 'px-2 py-1' : 'gap-1.5 px-3.5 py-1'} rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
      type="button"
      aria-pressed={isUnlimited}
      onClick={() => onToggleUnlimited(true)}
      className={`flex items-center gap-1 ${compact ? 'px-2 py-1' : 'gap-1.5 px-3.5 py-1'} rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
);

const IconButton: React.FC<{
  label: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, title, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    title={title}
    onClick={onClick}
    className="p-1.5 lg:p-2 text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-[#1e2328] rounded-lg transition border border-[#785a28]/30 cursor-pointer flex-shrink-0"
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isUnlimited,
  onToggleUnlimited,
  emojiModeEnabled,
  onOpenStats,
  onOpenHelp,
}) => (
  <header className="w-full max-w-full overflow-hidden border-b border-[#785a28]/40 bg-[#091428]/95 backdrop-blur sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col lg:flex-row items-center lg:justify-between gap-2.5 lg:gap-4 min-w-0">
        <div className="flex items-center justify-between w-full lg:w-auto gap-2 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
          <img
            src="/favicon.png"
            alt="LoLdle Emblem"
            className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(0,180,255,0.5)] transition-transform hover:scale-110"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#f0e6d2] font-serif uppercase bg-gradient-to-b from-[#f0e6d2] to-[#c8aa6e] bg-clip-text text-transparent drop-shadow">
            LoLdle
          </h1>
        </div>

        <div className="flex items-center gap-1 lg:hidden flex-shrink-0">
          <IconButton label="Statistics" title="Statistics" onClick={onOpenStats}>
            <BarChart2 className="w-4 h-4" />
          </IconButton>
          <IconButton label="How to play" title="How to play" onClick={onOpenHelp}>
            <HelpCircle className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full min-w-0 lg:hidden">
        <PlayTypeSwitcher isUnlimited={isUnlimited} onToggleUnlimited={onToggleUnlimited} compact />
        <ModeNavigation currentMode={currentMode} onSelectMode={onSelectMode} emojiModeEnabled={emojiModeEnabled} className="flex-1 min-w-0" />
      </div>

      <ModeNavigation currentMode={currentMode} onSelectMode={onSelectMode} emojiModeEnabled={emojiModeEnabled} className="hidden lg:flex w-auto" />

      <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
        <PlayTypeSwitcher isUnlimited={isUnlimited} onToggleUnlimited={onToggleUnlimited} />
        <IconButton label="Statistics" title="Statistics" onClick={onOpenStats}>
          <BarChart2 className="w-4 h-4" />
        </IconButton>
        <IconButton label="How to play" title="How to play" onClick={onOpenHelp}>
          <HelpCircle className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  </header>
);
