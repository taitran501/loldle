import React, { useEffect, useRef, useState } from 'react';
import { GameMode, GameStatsV2, PlayType, StatsBucket } from '../types';
import { X, BarChart2, Flame, Award } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStatsV2;
  activePlayType: PlayType;
  onResetStats: () => void;
}

const modeLabels: Record<GameMode, string> = {
  classic: 'Classic',
  quote: 'Quote',
  ability: 'Ability',
  emoji: 'Emoji',
  splash: 'Splash',
};

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  activePlayType,
  onResetStats,
}) => {
  const [tab, setTab] = useState<PlayType>(activePlayType);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement as HTMLElement;
    setTab(activePlayType);
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openerRef.current?.focus();
    };
  }, [activePlayType, isOpen, onClose]);

  if (!isOpen) return null;

  const bucket: StatsBucket = stats[tab];
  const distribution = Object.entries(bucket.guessDistribution)
    .map(([guessCount, count]) => ({ guessCount: Number(guessCount), count }))
    .sort((a, b) => a.guessCount - b.guessCount);
  const maxDistribution = Math.max(1, ...distribution.map(item => item.count));
  const totalRecordedGuesses = distribution.reduce(
    (total, item) => total + item.guessCount * item.count,
    0
  );
  const averageGuesses = bucket.won > 0 ? totalRecordedGuesses / bucket.won : 0;
  const oneShots = bucket.guessDistribution[1] || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      data-testid="stats-modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1e2328] border-2 border-[#785a28] rounded-2xl shadow-2xl p-5 sm:p-6 relative"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close statistics"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#c8aa6e] mb-4">
          <BarChart2 className="w-5 h-5" />
          <h3 id="stats-modal-title" className="text-xl font-bold font-serif text-[#f0e6d2]">Statistics</h3>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-[#091428] rounded-xl border border-[#785a28]/40" role="tablist" aria-label="Statistics period">
          {(['daily', 'unlimited'] as PlayType[]).map(type => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={tab === type}
              onClick={() => setTab(type)}
              className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${tab === type ? 'bg-[#c8aa6e] text-[#091428]' : 'text-[#a09b8c] hover:text-[#f0e6d2]'}`}
            >
              {type === 'daily' ? 'Daily' : 'Unlimited'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-[#f0e6d2]">{bucket.played}</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Played</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-emerald-400">{bucket.won}</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Games Won</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-[#c8aa6e]">{averageGuesses > 0 ? averageGuesses.toFixed(1) : '—'}</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Average Guesses</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-sky-300">{oneShots}</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">One Shots</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-amber-400">{bucket.currentStreak}</span>
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Current Streak</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-[#c8aa6e]">{bucket.maxStreak}</span>
              <Award className="w-4 h-4 text-[#c8aa6e]" />
            </div>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Best Streak</span>
          </div>
        </div>

        <section aria-labelledby="distribution-title">
          <div className="flex items-center justify-between mb-2">
            <h4 id="distribution-title" className="text-xs font-bold uppercase tracking-wider text-[#c8aa6e]">Guess Distribution</h4>
            <span className="text-[11px] text-[#a09b8c]">By mode</span>
          </div>
          {distribution.length === 0 ? (
            <p className="text-xs text-[#a09b8c] bg-[#091428] border border-[#785a28]/40 rounded-xl px-3 py-4 text-center">No completed guesses yet.</p>
          ) : (
            <div className="space-y-2 bg-[#091428] border border-[#785a28]/40 rounded-xl p-3">
              {distribution.map(item => (
                <div key={item.guessCount} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-right text-[#a09b8c]">{item.guessCount}</span>
                  <div className="h-5 flex-1 rounded bg-[#1e2328] overflow-hidden">
                    <div className="h-full min-w-[1.5rem] rounded bg-emerald-700/80 text-right px-1.5 text-white leading-5" style={{ width: `${Math.max(8, (item.count / maxDistribution) * 100)}%` }}>
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4" aria-labelledby="mode-breakdown-title">
          <h4 id="mode-breakdown-title" className="text-xs font-bold uppercase tracking-wider text-[#c8aa6e] mb-2">Mode Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(modeLabels) as GameMode[]).map(mode => {
              const modeStats = bucket.byMode[mode];
              const modeDistribution = Object.entries(modeStats.guessDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([guessCount, count]) => `${guessCount}:${count}`)
                .join(' · ');
              return (
                <div key={mode} className="flex items-center justify-between bg-[#091428] border border-[#785a28]/40 rounded-lg px-3 py-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#f0e6d2]">{modeLabels[mode]}</span>
                    <span className="block text-[10px] text-[#a09b8c] mt-0.5">{modeDistribution ? `Guesses: ${modeDistribution}` : 'No wins yet'}</span>
                  </div>
                  <span className="text-[#a09b8c] shrink-0 ml-2">{modeStats.won}/{modeStats.played} wins</span>
                </div>
              );
            })}
          </div>
        </section>

        {bucket.unattributed.played > 0 && (
          <p className="mt-3 text-[11px] text-[#a09b8c]">Legacy/Unattributed: {bucket.unattributed.won}/{bucket.unattributed.played} wins.</p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your statistics?')) onResetStats();
            }}
            className="text-xs text-rose-400/80 hover:text-rose-400 transition"
          >
            Reset statistics
          </button>
        </div>
      </div>
    </div>
  );
};
