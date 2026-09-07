import React from 'react';
import { GameStats } from '../types';
import { X, BarChart2, Flame, Award, CheckCircle2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#1e2328] border-2 border-[#785a28] rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#a09b8c] hover:text-[#f0e6d2] rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#c8aa6e] mb-4">
          <BarChart2 className="w-5 h-5" />
          <h3 className="text-xl font-bold font-serif text-[#f0e6d2]">Statistics</h3>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-[#f0e6d2]">{stats.played}</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Played</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-emerald-400">{winRate}%</span>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Win Rate</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-amber-400">{stats.currentStreak}</span>
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Current Streak</span>
          </div>
          <div className="bg-[#091428] border border-[#785a28]/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-[#c8aa6e]">{stats.maxStreak}</span>
              <Award className="w-4 h-4 text-[#c8aa6e]" />
            </div>
            <span className="text-xs text-[#a09b8c] block mt-0.5">Best Streak</span>
          </div>
        </div>

        {/* Reset button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your statistics?')) {
                onResetStats();
              }
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
