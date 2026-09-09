import { describe, expect, it } from 'vitest';
import { createDefaultStats, loadStats, recordLoss, recordWin } from '../../src/utils/stats';

describe('versioned statistics', () => {
  it('keeps streaks and distributions isolated by Daily/Unlimited bucket', () => {
    let stats = createDefaultStats();
    stats = recordWin(stats, 'daily', 'classic', 2);
    stats = recordWin(stats, 'unlimited', 'quote', 1);
    stats = recordLoss(stats, 'unlimited', 'ability');

    expect(stats.daily.currentStreak).toBe(1);
    expect(stats.unlimited.currentStreak).toBe(0);
    expect(stats.daily.byMode.classic.guessDistribution[2]).toBe(1);
    expect(stats.unlimited.byMode.quote.guessDistribution[1]).toBe(1);
    expect(stats.unlimited.byMode.ability.played).toBe(1);
  });

  it('migrates legacy aggregate statistics into Unlimited/Unattributed', () => {
    localStorage.setItem('loldle_stats', JSON.stringify({
      played: 4,
      won: 3,
      currentStreak: 2,
      maxStreak: 3,
      guessDistribution: { 1: 1, 3: 2 },
    }));

    const stats = loadStats(localStorage);
    expect(stats.version).toBe(2);
    expect(stats.daily.played).toBe(0);
    expect(stats.unlimited.played).toBe(4);
    expect(stats.unlimited.unattributed.won).toBe(3);
    expect(stats.unlimited.byMode.classic.played).toBe(0);
  });

  it('normalizes malformed stored statistics to a usable schema', () => {
    localStorage.setItem('loldle_stats_v2', JSON.stringify({ version: 2, daily: null, unlimited: {} }));
    const stats = loadStats(localStorage);
    expect(stats.daily.byMode.splash.played).toBe(0);
    expect(stats.unlimited.currentStreak).toBe(0);
  });
});
