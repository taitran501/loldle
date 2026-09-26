import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Champion, HigherLowerFilter, HigherLowerMetric, PlayType } from '../../types';
import {
  DAILY_HIGHER_LOWER_LIVES,
  DAILY_HIGHER_LOWER_ROUNDS,
  HIGHER_LOWER_METRICS,
  METRIC_METADATA,
  evaluateHigherLowerChoice,
  formatMetricDisplay,
  getInitialHigherLowerPair,
  getMetricSubtext,
  getMetricValue,
  pickNextComparison,
} from '../../utils/higherLower';
import {
  ArrowUp,
  ArrowDown,
  Flame,
  Trophy,
  Heart,
  CheckCircle,
  XCircle,
  RotateCcw,
  Share2,
  Calendar,
  Crosshair,
  Palette,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface HigherLowerModeProps {
  allChampions: Champion[];
  playType: PlayType;
  dateStr: string;
  onRoundComplete?: (won: boolean, streakOrRounds: number, finalChampion: Champion) => void;
  onShareResult?: (text: string) => void;
}

interface MatchHistoryItem {
  leftChampion: Champion;
  rightChampion: Champion;
  metric: HigherLowerMetric;
  leftVal: number;
  rightVal: number;
  wasCorrect: boolean;
}

const STORAGE_BEST_KEY = 'loldle_higherlower_best_streak';

const metricIcons: Record<HigherLowerMetric, React.ReactNode> = {
  skins: <Palette className="w-3.5 h-3.5" />,
  releaseYear: <Calendar className="w-3.5 h-3.5" />,
  attackRange: <Crosshair className="w-3.5 h-3.5" />,
  daysSinceLastSkin: <Clock className="w-3.5 h-3.5" />,
};

const metricLargeIcons: Record<HigherLowerMetric, React.ReactNode> = {
  skins: <Palette className="w-5 h-5 text-[#c8aa6e]" />,
  releaseYear: <Calendar className="w-5 h-5 text-[#c8aa6e]" />,
  attackRange: <Crosshair className="w-5 h-5 text-[#c8aa6e]" />,
  daysSinceLastSkin: <Clock className="w-5 h-5 text-[#c8aa6e]" />,
};

export const HigherLowerMode: React.FC<HigherLowerModeProps> = ({
  allChampions,
  playType,
  dateStr,
  onRoundComplete,
  onShareResult,
}) => {
  const [filter, setFilter] = useState<HigherLowerFilter>('all');

  const initialPair = React.useMemo(
    () => getInitialHigherLowerPair(allChampions, playType, filter, dateStr),
    [allChampions, playType, filter, dateStr]
  );

  const [leftChampion, setLeftChampion] = useState<Champion>(initialPair.leftChampion);
  const [rightChampion, setRightChampion] = useState<Champion>(initialPair.rightChampion);
  const [metric, setMetric] = useState<HigherLowerMetric>(initialPair.metric);

  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEST_KEY);
      return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [lives, setLives] = useState<number>(
    playType === 'daily' ? DAILY_HIGHER_LOWER_LIVES : 1
  );
  const [roundNumber, setRoundNumber] = useState(1);
  const [recentIds, setRecentIds] = useState<string[]>([
    initialPair.leftChampion.id,
    initialPair.rightChampion.id,
  ]);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);

  // Reveal & Animation States
  const [revealState, setRevealState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [displayedRightVal, setDisplayedRightVal] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (counterIntervalRef.current) {
      clearInterval(counterIntervalRef.current);
      counterIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startNewGame = useCallback(
    (nextFilter: HigherLowerFilter = filter) => {
      clearTimers();
      const pair = getInitialHigherLowerPair(allChampions, playType, nextFilter, dateStr);
      setLeftChampion(pair.leftChampion);
      setRightChampion(pair.rightChampion);
      setMetric(pair.metric);
      setScore(0);
      setLives(playType === 'daily' ? DAILY_HIGHER_LOWER_LIVES : 1);
      setRoundNumber(1);
      setRecentIds([pair.leftChampion.id, pair.rightChampion.id]);
      setHistory([]);
      setRevealState('idle');
      setDisplayedRightVal(null);
      setGameStatus('playing');
    },
    [allChampions, clearTimers, dateStr, filter, playType]
  );

  // Reset when switching between Daily and Unlimited
  useEffect(() => {
    startNewGame(filter);
  }, [playType, dateStr]);

  const handleChangeFilter = (nextFilter: HigherLowerFilter) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    startNewGame(nextFilter);
  };

  const leftVal = getMetricValue(leftChampion, metric, dateStr);
  const rightVal = getMetricValue(rightChampion, metric, dateStr);
  const meta = METRIC_METADATA[metric];
  const rangeSubClass =
    metric === 'attackRange'
      ? leftVal <= 300
        ? 'Melee vs Melee Duel'
        : 'Ranged vs Ranged Duel'
      : null;

  const animateRightValue = useCallback((targetValue: number) => {
    if (counterIntervalRef.current) clearInterval(counterIntervalRef.current);
    const steps = 14;
    let currentStep = 0;
    const startVal = metric === 'releaseYear' ? 2009 : 0;

    counterIntervalRef.current = setInterval(() => {
      currentStep += 1;
      if (currentStep >= steps) {
        setDisplayedRightVal(targetValue);
        if (counterIntervalRef.current) clearInterval(counterIntervalRef.current);
        counterIntervalRef.current = null;
      } else {
        const progress = currentStep / steps;
        const interpolated = Math.round(startVal + (targetValue - startVal) * progress);
        setDisplayedRightVal(interpolated);
      }
    }, 25);
  }, [metric]);

  const advanceToNextPair = useCallback(
    (nextLeft: Champion, nextRound: number, updatedRecentIds: string[]) => {
      const seed =
        playType === 'daily'
          ? nextRound * 997 + nextLeft.numericId
          : Math.floor(Math.random() * 1_000_000) + nextRound;

      // In Attack-Range-only filter, alternate between Melee and Ranged classes every 2 rounds
      // so the player gets tested on both Melee-vs-Melee and Ranged-vs-Ranged duels
      let effectiveLeft = nextLeft;
      if (filter === 'attackRange' && nextRound % 2 === 1) {
        const currentIsMelee = getMetricValue(nextLeft, 'attackRange', dateStr) <= 300;
        const oppositePool = allChampions.filter(c => {
          const val = getMetricValue(c, 'attackRange', dateStr);
          return !updatedRecentIds.slice(-4).includes(c.id) && (currentIsMelee ? val > 300 : val <= 300);
        });
        if (oppositePool.length > 0) {
          effectiveLeft = oppositePool[Math.abs(seed) % oppositePool.length];
        }
      }

      const next = pickNextComparison(
        effectiveLeft,
        allChampions,
        filter,
        seed,
        dateStr,
        updatedRecentIds
      );

      setLeftChampion(effectiveLeft);
      setRightChampion(next.rightChampion);
      setMetric(next.metric);
      setRoundNumber(nextRound);
      setRecentIds([...updatedRecentIds.slice(-6), effectiveLeft.id, next.rightChampion.id]);
      setRevealState('idle');
      setDisplayedRightVal(null);
    },
    [allChampions, dateStr, filter, playType]
  );

  const handleChoice = (choice: 'higher' | 'lower') => {
    if (revealState !== 'idle' || gameStatus !== 'playing') return;

    const isCorrect = evaluateHigherLowerChoice(leftVal, rightVal, choice);
    setRevealState(isCorrect ? 'correct' : 'wrong');
    animateRightValue(rightVal);

    const record: MatchHistoryItem = {
      leftChampion,
      rightChampion,
      metric,
      leftVal,
      rightVal,
      wasCorrect: isCorrect,
    };
    setHistory(prev => [record, ...prev]);

    const updatedRecentIds = [...recentIds, rightChampion.id];

    if (isCorrect) {
      const nextScore = score + 1;
      setScore(nextScore);

      if (nextScore > bestStreak) {
        setBestStreak(nextScore);
        try {
          localStorage.setItem(STORAGE_BEST_KEY, String(nextScore));
        } catch {
          // Ignore storage quota issues
        }
      }

      // Check Daily Victory (10/10 rounds completed)
      if (playType === 'daily' && roundNumber >= DAILY_HIGHER_LOWER_ROUNDS) {
        advanceTimerRef.current = setTimeout(() => {
          setGameStatus('won');
          onRoundComplete?.(true, nextScore, rightChampion);
        }, 1000);
        return;
      }

      advanceTimerRef.current = setTimeout(() => {
        advanceToNextPair(rightChampion, roundNumber + 1, updatedRecentIds);
      }, 1050);
    } else {
      const remainingLives = lives - 1;
      setLives(remainingLives);

      if (remainingLives <= 0) {
        advanceTimerRef.current = setTimeout(() => {
          setGameStatus('lost');
          onRoundComplete?.(false, Math.max(1, score), rightChampion);
        }, 1100);
      } else {
        // Daily Mode still has remaining lives: advance to next pair
        advanceTimerRef.current = setTimeout(() => {
          advanceToNextPair(rightChampion, roundNumber + 1, updatedRecentIds);
        }, 1250);
      }
    }
  };

  const handleShare = () => {
    const modeTitle = playType === 'daily' ? `Daily ${dateStr}` : `Unlimited Streak`;
    const emojiStrip = history
      .slice()
      .reverse()
      .map(item => (item.wasCorrect ? '🟩' : '🟥'))
      .join('');
    const text = `LoLdle (HIGHER OR LOWER) - ${modeTitle}\nScore: ${score}${
      playType === 'daily' ? `/${DAILY_HIGHER_LOWER_ROUNDS}` : ` 🔥 (Best: ${bestStreak})`
    }\n${emojiStrip}\nPlay at: ${window.location.origin}`;

    if (onShareResult) {
      onShareResult(text);
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const getSplashUrl = (champion: Champion) =>
    champion.skins?.[0]?.splashCenteredUrl ||
    `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;

  return (
    <div className="w-full flex flex-col items-center" data-testid="higher-lower-mode">
      {/* Header & Description */}
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Higher or Lower Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          {playType === 'daily'
            ? `Survive ${DAILY_HIGHER_LOWER_ROUNDS} daily duels with ${DAILY_HIGHER_LOWER_LIVES} lives!`
            : 'Decide if the challenger champion ranks Higher or Lower to build your streak!'}
        </p>
      </div>

      {/* Category Filter Pills */}
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-3 max-w-2xl px-2"
        role="group"
        aria-label="Comparison criteria filter"
      >
        <button
          type="button"
          onClick={() => handleChangeFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
            filter === 'all'
              ? 'bg-[#c8aa6e] text-[#091428] border-[#c8aa6e] font-bold shadow-[0_0_12px_rgba(200,170,110,0.35)]'
              : 'bg-[#1e2328] text-[#a09b8c] border-[#785a28]/50 hover:text-[#f0e6d2] hover:border-[#c8aa6e]/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Criteria</span>
        </button>

        {HIGHER_LOWER_METRICS.map(m => {
          const isSelected = filter === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleChangeFilter(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#c8aa6e] text-[#091428] border-[#c8aa6e] font-bold shadow-[0_0_12px_rgba(200,170,110,0.35)]'
                  : 'bg-[#1e2328] text-[#a09b8c] border-[#785a28]/50 hover:text-[#f0e6d2] hover:border-[#c8aa6e]/50'
              }`}
            >
              {metricIcons[m]}
              <span>{METRIC_METADATA[m].shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Compact Score & Lives HUD Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-[#1e2328]/80 border border-[#785a28]/50 rounded-xl px-4 py-2 mb-3 shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs text-[#a09b8c]">Score:</span>
            <span className="text-sm font-bold text-[#f0e6d2]" data-testid="hl-current-score">
              {score}
              {playType === 'daily' ? ` / ${DAILY_HIGHER_LOWER_ROUNDS}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#c8aa6e]" />
            <span className="text-xs text-[#a09b8c]">Best:</span>
            <span className="text-sm font-bold text-[#c8aa6e]" data-testid="hl-best-streak">
              {bestStreak}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {playType === 'daily' && (
            <div className="flex items-center gap-1" aria-label={`${lives} lives remaining`}>
              {Array.from({ length: DAILY_HIGHER_LOWER_LIVES }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all ${
                    idx < lives
                      ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]'
                      : 'text-[#a09b8c]/30'
                  }`}
                />
              ))}
            </div>
          )}
          <span className="text-xs font-semibold text-[#a09b8c]">
            Duel #{roundNumber}
          </span>
        </div>
      </div>

      {/* PROMINENT CENTER CRITERION COMPONENT (Only English criterion name) */}
      <div
        data-testid="hl-criterion-banner"
        className="w-full max-w-md mb-4 rounded-2xl bg-gradient-to-b from-[#1e2328] to-[#091428] border-2 border-[#c8aa6e] px-6 py-3 text-center shadow-[0_0_25px_rgba(200,170,110,0.25)]"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-[#091428] border border-[#c8aa6e]/60 shadow-inner">
            {metricLargeIcons[metric]}
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-serif uppercase tracking-wider text-[#f0e6d2]">
            {meta.label}
          </h3>
        </div>
      </div>

      {/* Main Split Comparison Arena */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative items-stretch">
        {/* LEFT CARD: Known Reference Champion */}
        <div
          data-testid="hl-left-card"
          className="relative rounded-2xl overflow-hidden border-2 border-[#c8aa6e]/80 bg-[#091428] min-h-[260px] sm:min-h-[300px] flex flex-col justify-between p-5 sm:p-6 shadow-[0_0_25px_rgba(200,170,110,0.2)]"
        >
          <img
            src={getSplashUrl(leftChampion)}
            alt={leftChampion.name}
            onError={e => {
              e.currentTarget.src = leftChampion.iconUrl;
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 select-none pointer-events-none transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091428] via-[#091428]/65 to-[#091428]/25" />

          {/* Top Info (Title removed per user request) */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src={leftChampion.iconUrl}
              alt={leftChampion.name}
              onError={e => {
                e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${leftChampion.id}.png`;
              }}
              className="w-12 h-12 rounded-full border-2 border-[#c8aa6e] object-cover shadow-md"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#c8aa6e] font-bold block">
                {leftChampion.regions.join(' • ')}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2] leading-tight">
                {leftChampion.name}
              </h3>
            </div>
          </div>

          {/* Bottom Stat Display */}
          <div className="relative z-10 text-center my-auto py-4">
            <span className="text-xs uppercase tracking-widest text-[#a09b8c] block mb-1">
              {meta.label}
            </span>
            <div
              className="text-3xl sm:text-4xl font-extrabold font-serif text-[#c8aa6e] drop-shadow-[0_2px_10px_rgba(200,170,110,0.4)]"
              data-testid="hl-left-value"
            >
              {formatMetricDisplay(leftVal, metric)}
            </div>
            <span className="mt-2 inline-block px-3 py-1 rounded-full bg-[#1e2328]/90 border border-[#785a28]/50 text-xs text-[#f0e6d2]/90">
              {getMetricSubtext(leftChampion, metric)}
            </span>
          </div>
        </div>

        {/* CENTER VS MEDALLION */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-serif font-extrabold text-sm shadow-2xl transition-all duration-300 ${
              revealState === 'correct'
                ? 'bg-emerald-600 border-emerald-300 text-white scale-110 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                : revealState === 'wrong'
                  ? 'bg-rose-600 border-rose-300 text-white scale-110 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                  : 'bg-[#1e2328] border-[#c8aa6e] text-[#c8aa6e]'
            }`}
          >
            {revealState === 'correct' ? (
              <CheckCircle className="w-7 h-7" />
            ) : revealState === 'wrong' ? (
              <XCircle className="w-7 h-7" />
            ) : (
              'VS'
            )}
          </div>
        </div>

        {/* RIGHT CARD: Challenger Champion (Symmetrical with Left Card) */}
        <div
          data-testid="hl-right-card"
          className={`relative rounded-2xl overflow-hidden border-2 bg-[#091428] min-h-[260px] sm:min-h-[300px] flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 ${
            revealState === 'correct'
              ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              : revealState === 'wrong'
                ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.35)]'
                : 'border-[#785a28]/80 shadow-[0_0_25px_rgba(0,0,0,0.4)]'
          }`}
        >
          <img
            src={getSplashUrl(rightChampion)}
            alt={rightChampion.name}
            onError={e => {
              e.currentTarget.src = rightChampion.iconUrl;
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 select-none pointer-events-none transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091428] via-[#091428]/65 to-[#091428]/25" />

          {/* Top Info (Title removed per user request) */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src={rightChampion.iconUrl}
              alt={rightChampion.name}
              onError={e => {
                e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${rightChampion.id}.png`;
              }}
              className="w-12 h-12 rounded-full border-2 border-[#c8aa6e] object-cover shadow-md"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#c8aa6e] font-bold block">
                {rightChampion.regions.join(' • ')}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2] leading-tight">
                {rightChampion.name}
              </h3>
            </div>
          </div>

          {/* Symmetrical Mystery / Revealed Value Display */}
          <div className="relative z-10 text-center my-auto py-4">
            <span className="text-xs uppercase tracking-widest text-[#a09b8c] block mb-1">
              {meta.label}
            </span>

            {revealState === 'idle' && gameStatus === 'playing' ? (
              <div className="flex flex-col items-center">
                <div className="text-3xl sm:text-4xl font-extrabold font-serif text-[#c8aa6e]/80 flex items-center justify-center gap-1.5 drop-shadow">
                  <HelpCircle className="w-7 h-7 text-[#c8aa6e] animate-pulse" />
                  <span>???</span>
                </div>
                <span className="mt-2 inline-block px-3 py-1 rounded-full bg-[#1e2328]/90 border border-[#785a28]/50 text-xs text-[#a09b8c]">
                  Choose Higher or Lower below
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-flip-in">
                <div
                  data-testid="hl-right-value"
                  className={`text-3xl sm:text-4xl font-extrabold font-serif ${
                    revealState === 'correct' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatMetricDisplay(displayedRightVal ?? rightVal, metric)}
                </div>
                <span className="mt-2 inline-block px-3 py-1 rounded-full bg-[#1e2328]/90 border border-[#785a28]/50 text-xs text-[#f0e6d2]/90">
                  {getMetricSubtext(rightChampion, metric)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION CONTROL DOCK (Placed below the cards per user request) */}
      {gameStatus === 'playing' && (
        <div className="w-full max-w-xl mt-4 bg-[#1e2328]/95 border-2 border-[#785a28]/70 rounded-2xl p-4 shadow-2xl text-center">
          <p className="text-xs sm:text-sm text-[#f0e6d2] mb-3">
            Does <strong className="text-[#c8aa6e]">{rightChampion.name}</strong> have a{' '}
            <span className="underline decoration-[#c8aa6e]/60">higher</span> or{' '}
            <span className="underline decoration-[#c8aa6e]/60">lower</span>{' '}
            <strong className="text-[#c8aa6e]">{meta.label}</strong> than{' '}
            <strong>{leftChampion.name}</strong> ({formatMetricDisplay(leftVal, metric)})?
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              data-testid="hl-guess-higher"
              disabled={revealState !== 'idle'}
              onClick={() => handleChoice('higher')}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base border border-emerald-400/80 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              <span>{meta.higherVerb}</span>
            </button>

            <button
              type="button"
              data-testid="hl-guess-lower"
              disabled={revealState !== 'idle'}
              onClick={() => handleChoice('lower')}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base border border-rose-400/80 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <ArrowDown className="w-5 h-5 stroke-[2.5]" />
              <span>{meta.lowerVerb}</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Daily Cleared Banner */}
      {gameStatus !== 'playing' && (
        <div
          data-testid="hl-game-over"
          className={`w-full max-w-xl mt-5 rounded-2xl border-2 p-5 sm:p-6 text-center shadow-2xl animate-flip-in ${
            gameStatus === 'won'
              ? 'bg-[#1e2328] border-[#c8aa6e] shadow-[0_0_30px_rgba(200,170,110,0.3)]'
              : 'bg-[#1e2328] border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.25)]'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-[#091428] border border-[#c8aa6e]/50 text-[#c8aa6e]">
            {gameStatus === 'won' ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Gauntlet Cleared!</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Streak Ended</span>
              </>
            )}
          </div>

          <h3 className="text-2xl font-serif font-bold text-[#f0e6d2]">
            {gameStatus === 'won'
              ? `Perfect ${score}/${DAILY_HIGHER_LOWER_ROUNDS} Daily Duels!`
              : `You reached a streak of ${score}!`}
          </h3>
          <p className="text-xs sm:text-sm text-[#a09b8c] mt-1">
            {leftChampion.name} ({formatMetricDisplay(leftVal, metric)}) vs {rightChampion.name} (
            {formatMetricDisplay(rightVal, metric)})
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            <button
              type="button"
              data-testid="hl-play-again"
              onClick={() => startNewGame(filter)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c8aa6e] to-[#785a28] hover:from-[#e0c488] hover:to-[#967032] text-[#091428] font-bold text-sm shadow-lg transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#091428] hover:bg-[#c8aa6e]/20 text-[#c8aa6e] border border-[#c8aa6e]/50 font-semibold text-sm transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Score</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Duels History Strip */}
      {history.length > 0 && (
        <div className="w-full max-w-2xl mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8aa6e] mb-2 text-center">
            Recent Duels ({history.filter(h => h.wasCorrect).length} Won)
          </h4>
          <div className="flex flex-col gap-2">
            {history.slice(0, 6).map((item, idx) => (
              <div
                key={`${item.leftChampion.id}-${item.rightChampion.id}-${idx}`}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs ${
                  item.wasCorrect
                    ? 'bg-[#1e2328]/90 border-emerald-500/40 text-[#f0e6d2]'
                    : 'bg-[#1e2328]/90 border-rose-500/50 text-[#f0e6d2]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={item.leftChampion.iconUrl}
                    alt={item.leftChampion.name}
                    className="w-6 h-6 rounded-full border border-[#c8aa6e]/50 object-cover"
                  />
                  <span className="font-semibold truncate">{item.leftChampion.name}</span>
                  <span className="text-[#c8aa6e] font-bold">
                    ({formatMetricDisplay(item.leftVal, item.metric)})
                  </span>
                </div>

                <span className="px-2 text-[10px] uppercase tracking-wider text-[#a09b8c] shrink-0">
                  {METRIC_METADATA[item.metric].shortLabel}
                </span>

                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-bold ${
                      item.wasCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ({formatMetricDisplay(item.rightVal, item.metric)})
                  </span>
                  <span className="font-semibold truncate">{item.rightChampion.name}</span>
                  <img
                    src={item.rightChampion.iconUrl}
                    alt={item.rightChampion.name}
                    className="w-6 h-6 rounded-full border border-[#c8aa6e]/50 object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
