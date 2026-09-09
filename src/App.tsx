import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Champion, GameMode, GameStatsV2, PlayType, Skin, BonusState } from './types';
import { getDailyTarget, getRandomTarget, getTodayDateString } from './utils/daily';
import {
  GAME_STATE_STORAGE_KEY,
  ModeState,
  SessionState,
  createEmptySessionState,
  hydrateModeState,
  loadPersistedGameState,
  serializeGameState,
} from './utils/gameState';
import { createDefaultStats, LEGACY_STATS_STORAGE_KEY, loadStats, recordLoss, recordWin, STATS_STORAGE_KEY } from './utils/stats';
import { Header } from './components/Header';
import { ClassicMode } from './components/modes/ClassicMode';
import { QuoteMode } from './components/modes/QuoteMode';
import { AbilityMode } from './components/modes/AbilityMode';
import { SplashMode } from './components/modes/SplashMode';
import { EmojiMode } from './components/modes/EmojiMode';
import { VictoryModal } from './components/VictoryModal';
import { StatsModal } from './components/StatsModal';
import { HelpModal } from './components/HelpModal';
import { SurrenderModal } from './components/SurrenderModal';
import { RefreshCw, Flag, Loader2, RotateCcw } from 'lucide-react';

interface RoundIdentity {
  playType: PlayType;
  mode: GameMode;
  targetId: string;
  serial: number;
}

interface VictoryContext {
  identity: RoundIdentity;
  champion: Champion;
  skin?: Skin;
  mode: GameMode;
  playType: PlayType;
  guessCount: number;
  streak: number;
  abilityKey?: ModeState['abilityKey'];
  bonus?: BonusState;
  isSurrendered: boolean;
}

const BONUS_MODES: GameMode[] = ['ability', 'splash'];

export const App: React.FC = () => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [currentMode, setCurrentMode] = useState<GameMode>(() =>
    loadPersistedGameState(undefined, getTodayDateString()).currentMode
  );
  const [playType, setPlayType] = useState<PlayType>(() =>
    loadPersistedGameState(undefined, getTodayDateString()).playType
  );
  const [sessions, setSessions] = useState<SessionState>(() => createEmptySessionState());
  const [stateHydrated, setStateHydrated] = useState(false);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false);
  const [victoryContext, setVictoryContext] = useState<VictoryContext | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<GameStatsV2>(() => loadStats());
  const statsRef = useRef(stats);
  const currentModeRef = useRef(currentMode);
  const playTypeRef = useRef(playType);
  const dailyDateRef = useRef(getTodayDateString());
  const roundSerialRef = useRef(0);
  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surrenderIdentityRef = useRef<RoundIdentity | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentState = sessions[playType][currentMode];

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    playTypeRef.current = playType;
  }, [playType]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Could not save statistics', error);
    }
  }, [stats]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => () => {
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch('/data/champions.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Dataset request failed (${response.status})`);
        const data: Champion[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Dataset is empty');
        if (!cancelled) setChampions(data);
      } catch (error) {
        if (!cancelled) {
          console.error('Data loading error:', error);
          setChampions([]);
          setLoadError('Could not load the local champion data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const initModeState = useCallback((mode: GameMode, type: PlayType, champList: Champion[], excludeIds: string[] = []): ModeState => {
    const result = type === 'unlimited'
      ? getRandomTarget(champList, mode, excludeIds)
      : getDailyTarget(champList, mode, getTodayDateString());

    return {
      target: result.champion,
      skin: result.skin,
      abilityKey: result.abilityKey || result.champion.abilities[0]?.key || 'Q',
      quoteIndex: result.quoteIndex ?? 0,
      guesses: [],
      isSolved: false,
    };
  }, []);

  useEffect(() => {
    if (champions.length === 0 || stateHydrated) return;

    const persisted = loadPersistedGameState(undefined, getTodayDateString());
    const nextSessions = createEmptySessionState();

    (['daily', 'unlimited'] as const).forEach(type => {
      (['classic', 'quote', 'ability', 'emoji', 'splash'] as GameMode[]).forEach(mode => {
        const restored = hydrateModeState(persisted[type].modes[mode], champions, mode);
        nextSessions[type][mode] = restored || initModeState(mode, type, champions);
      });
    });

    roundSerialRef.current += 1;
    setSessions(nextSessions);
    setCurrentMode(persisted.currentMode);
    setPlayType(persisted.playType);
    dailyDateRef.current = getTodayDateString();
    setStateHydrated(true);
  }, [champions, initModeState, stateHydrated]);

  useEffect(() => {
    if (!stateHydrated) return;
    try {
      localStorage.setItem(
        GAME_STATE_STORAGE_KEY,
        JSON.stringify(serializeGameState(currentMode, playType, sessions, getTodayDateString()))
      );
    } catch (error) {
      console.warn('Could not save game state', error);
    }
  }, [currentMode, playType, sessions, stateHydrated]);

  // Preload target media without making the game depend on remote media availability.
  useEffect(() => {
    const abilityState = sessions[playType].ability;
    const ability = abilityState?.target.abilities.find(item => item.key === abilityState.abilityKey);
    if (ability?.iconUrl) {
      const image = new Image();
      image.src = ability.iconUrl;
    }

    const splashState = sessions[playType].splash;
    if (splashState?.skin?.splashFullUrl) {
      const image = new Image();
      image.src = splashState.skin.splashFullUrl;
    }
  }, [playType, sessions]);

  const clearVictoryTimer = useCallback(() => {
    if (victoryTimerRef.current) {
      clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = null;
    }
  }, []);

  // Keep an open tab in sync when UTC rolls over. Reloading also performs the
  // same check through loadPersistedGameState, but a player should not have to
  // refresh the page to unlock the next Daily round.
  useEffect(() => {
    if (!stateHydrated || champions.length === 0) return;

    dailyDateRef.current = getTodayDateString();
    const checkForNewDaily = () => {
      const today = getTodayDateString();
      if (today === dailyDateRef.current) return;

      dailyDateRef.current = today;
      const nextDaily = Object.fromEntries(
        (['classic', 'quote', 'ability', 'emoji', 'splash'] as GameMode[])
          .map(mode => [mode, initModeState(mode, 'daily', champions)])
      ) as SessionState['daily'];

      if (playTypeRef.current === 'daily') {
        clearVictoryTimer();
        setIsVictoryOpen(false);
        setVictoryContext(null);
      }
      roundSerialRef.current += 1;
      setSessions(prev => ({ ...prev, daily: nextDaily }));
    };

    const interval = window.setInterval(checkForNewDaily, 30_000);
    return () => window.clearInterval(interval);
  }, [champions, clearVictoryTimer, initModeState, stateHydrated]);

  const closeVictory = useCallback(() => {
    clearVictoryTimer();
    setIsVictoryOpen(false);
    setVictoryContext(null);
  }, [clearVictoryTimer]);

  const getIdentity = useCallback((mode: GameMode, type: PlayType, state: ModeState): RoundIdentity => ({
    mode,
    playType: type,
    targetId: state.target.id,
    serial: roundSerialRef.current,
  }), []);

  const makeVictoryContext = useCallback((
    state: ModeState,
    identity: RoundIdentity,
    streak: number
  ): VictoryContext => ({
    identity,
    champion: state.target,
    skin: state.skin,
    mode: identity.mode,
    playType: identity.playType,
    guessCount: state.guesses.length,
    streak,
    abilityKey: state.abilityKey,
    bonus: state.bonus,
    isSurrendered: Boolean(state.isSurrendered),
  }), []);

  const scheduleVictory = useCallback((identity: RoundIdentity, context: VictoryContext, delayMs: number) => {
    clearVictoryTimer();
    victoryTimerRef.current = setTimeout(() => {
      const current = sessions[playTypeRef.current][currentModeRef.current];
      const isCurrentRound = identity.serial === roundSerialRef.current
        && identity.playType === playTypeRef.current
        && identity.mode === currentModeRef.current
        && current?.target.id === identity.targetId;

      if (isCurrentRound) {
        setVictoryContext(context);
        setIsVictoryOpen(true);
      }
      victoryTimerRef.current = null;
    }, delayMs);
  }, [clearVictoryTimer, sessions]);

  const updateModeState = useCallback((type: PlayType, mode: GameMode, nextState: ModeState) => {
    setSessions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [mode]: nextState,
      },
    }));
  }, []);

  const handleGuess = useCallback((guess: Champion) => {
    const state = sessions[playType][currentMode];
    if (!state || state.isSolved || state.guesses.some(item => item.id === guess.id)) return;

    const newGuesses = [guess, ...state.guesses];
    const isCorrect = guess.id === state.target.id;
    const updatedState: ModeState = {
      ...state,
      guesses: newGuesses,
      isSolved: isCorrect,
      ...(isCorrect && BONUS_MODES.includes(currentMode) ? { bonus: { status: 'pending' } } : {}),
    };
    const identity = getIdentity(currentMode, playType, state);

    updateModeState(playType, currentMode, updatedState);

    if (!isCorrect) return;

    const nextStats = recordWin(statsRef.current, playType, currentMode, newGuesses.length);
    statsRef.current = nextStats;
    setStats(nextStats);

    if (!BONUS_MODES.includes(currentMode)) {
      scheduleVictory(
        identity,
        makeVictoryContext(updatedState, identity, nextStats[playType].currentStreak),
        1600
      );
    }
  }, [currentMode, getIdentity, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleGiveUp = useCallback(() => {
    const state = sessions[playType][currentMode];
    if (!state || state.isSolved || playType !== 'unlimited') return;
    surrenderIdentityRef.current = getIdentity(currentMode, playType, state);
    setIsSurrenderModalOpen(true);
  }, [currentMode, getIdentity, playType, sessions]);

  const handleConfirmSurrender = useCallback(() => {
    const identity = surrenderIdentityRef.current;
    const state = sessions[playType][currentMode];
    if (!identity || !state || state.isSolved || identity.serial !== roundSerialRef.current
      || identity.targetId !== state.target.id || identity.mode !== currentMode || identity.playType !== playType) {
      setIsSurrenderModalOpen(false);
      surrenderIdentityRef.current = null;
      return;
    }

    const updatedState: ModeState = {
      ...state,
      isSolved: true,
      isSurrendered: true,
    };
    updateModeState(playType, currentMode, updatedState);
    const nextStats = recordLoss(statsRef.current, playType, currentMode);
    statsRef.current = nextStats;
    setStats(nextStats);
    setIsSurrenderModalOpen(false);
    surrenderIdentityRef.current = null;
    scheduleVictory(
      identity,
      makeVictoryContext(updatedState, identity, nextStats[playType].currentStreak),
      350
    );
  }, [currentMode, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleNextRound = useCallback(() => {
    const state = sessions[playType][currentMode];
    if (!champions.length || playType !== 'unlimited' || !state?.isSolved) return;

    closeVictory();
    setIsSurrenderModalOpen(false);
    surrenderIdentityRef.current = null;
    roundSerialRef.current += 1;
    updateModeState(
      playType,
      currentMode,
      initModeState(currentMode, 'unlimited', champions, [state.target.id])
    );
  }, [champions, closeVictory, currentMode, initModeState, playType, sessions, updateModeState]);

  const handleSelectMode = useCallback((mode: GameMode) => {
    if (mode === currentMode) return;
    clearVictoryTimer();
    setIsVictoryOpen(false);
    setVictoryContext(null);
    setIsSurrenderModalOpen(false);
    surrenderIdentityRef.current = null;
    roundSerialRef.current += 1;
    setCurrentMode(mode);
  }, [clearVictoryTimer, currentMode]);

  const handleTogglePlayType = useCallback((targetVal?: boolean) => {
    const nextType: PlayType = typeof targetVal === 'boolean'
      ? (targetVal ? 'unlimited' : 'daily')
      : (playType === 'unlimited' ? 'daily' : 'unlimited');
    if (nextType === playType) return;

    clearVictoryTimer();
    setIsVictoryOpen(false);
    setVictoryContext(null);
    setIsSurrenderModalOpen(false);
    surrenderIdentityRef.current = null;
    roundSerialRef.current += 1;
    setPlayType(nextType);
    showToast(nextType === 'unlimited' ? 'Switched to Unlimited Mode!' : 'Switched to Daily Mode!');
  }, [clearVictoryTimer, playType, showToast]);

  const handleAbilityBonus = useCallback((bonusKey: ModeState['abilityKey'], isCorrect: boolean) => {
    const state = sessions[playType].ability;
    if (!state?.isSolved || state.bonus?.status !== 'pending') return;

    const identity = getIdentity('ability', playType, state);
    const updatedState: ModeState = {
      ...state,
      bonus: { status: isCorrect ? 'correct' : 'missed', selectionKey: bonusKey },
    };
    updateModeState(playType, 'ability', updatedState);
    scheduleVictory(
      identity,
      makeVictoryContext(updatedState, identity, statsRef.current[playType].currentStreak),
      1200
    );
  }, [getIdentity, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleAbilityBonusSkip = useCallback(() => {
    const state = sessions[playType].ability;
    if (!state?.isSolved || state.bonus?.status !== 'pending') return;

    const identity = getIdentity('ability', playType, state);
    const updatedState: ModeState = { ...state, bonus: { status: 'skipped' } };
    updateModeState(playType, 'ability', updatedState);
    scheduleVictory(
      identity,
      makeVictoryContext(updatedState, identity, statsRef.current[playType].currentStreak),
      0
    );
  }, [getIdentity, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleSplashBonus = useCallback((selectedSkin: Skin, isCorrect: boolean) => {
    const state = sessions[playType].splash;
    if (!state?.isSolved || state.bonus?.status !== 'pending') return;

    const identity = getIdentity('splash', playType, state);
    const updatedState: ModeState = {
      ...state,
      bonus: {
        status: isCorrect ? 'correct' : 'missed',
        selectionSkinId: selectedSkin.id,
      },
    };
    updateModeState(playType, 'splash', updatedState);
    scheduleVictory(
      identity,
      makeVictoryContext(updatedState, identity, statsRef.current[playType].currentStreak),
      1400
    );
  }, [getIdentity, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleSplashBonusSkip = useCallback(() => {
    const state = sessions[playType].splash;
    if (!state?.isSolved || state.bonus?.status !== 'pending') return;

    const identity = getIdentity('splash', playType, state);
    const updatedState: ModeState = { ...state, bonus: { status: 'skipped' } };
    updateModeState(playType, 'splash', updatedState);
    scheduleVictory(
      identity,
      makeVictoryContext(updatedState, identity, statsRef.current[playType].currentStreak),
      0
    );
  }, [getIdentity, makeVictoryContext, playType, scheduleVictory, sessions, updateModeState]);

  const handleShare = useCallback(() => {
    const context = victoryContext;
    if (!context) return;
    const text = `LoLdle (${context.mode.toUpperCase()}) - ${
      context.playType === 'unlimited' ? `Streak ${context.streak} 🔥` : `Daily ${getTodayDateString()}`
    }\nGuesses: ${context.guessCount}\nPlay at: ${window.location.origin}`;

    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied result to clipboard! 📋'))
      .catch(() => showToast('Could not copy the result.'));
  }, [showToast, victoryContext]);

  const retryData = useCallback(() => {
    // Prevent the hydration effect from restoring old objects while the
    // retried request is still in flight.
    setChampions([]);
    setStateHydrated(false);
    setLoadAttempt(attempt => attempt + 1);
  }, []);

  const openStats = useCallback(() => setIsStatsOpen(true), []);
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeStats = useCallback(() => setIsStatsOpen(false), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const closeSurrender = useCallback(() => {
    setIsSurrenderModalOpen(false);
    surrenderIdentityRef.current = null;
  }, []);
  const resetStats = useCallback(() => {
    const reset = createDefaultStats();
    statsRef.current = reset;
    setStats(reset);
    try {
      localStorage.removeItem(LEGACY_STATS_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures; the v2 state is still reset in memory.
    }
  }, []);

  const activeStatsBucket = stats[playType];

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#091428] text-[#f0e6d2] px-6 text-center" data-testid="dataset-error">
        <RotateCcw className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-serif font-bold text-[#f0e6d2]">Champion data unavailable</h2>
        <p className="text-sm text-[#a09b8c] mt-2 max-w-sm">{loadError} Please retry to load the game.</p>
        <button
          type="button"
          onClick={retryData}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#c8aa6e] px-5 py-2.5 font-bold text-[#091428] hover:bg-[#e0c488] transition"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (loading || !stateHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#091428] text-[#f0e6d2]" data-testid="app-loading">
        <Loader2 className="w-12 h-12 text-[#c8aa6e] animate-spin mb-4" />
        <h2 className="text-xl font-serif font-bold text-[#c8aa6e]">Loading LoLdle data...</h2>
        <p className="text-sm text-[#a09b8c] mt-1">Preparing the local champion dataset</p>
      </div>
    );
  }

  const isUnlimited = playType === 'unlimited';

  return (
    <div className="min-h-screen flex flex-col bg-[#091428] text-[#f0e6d2]" data-testid="app-ready">
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        isUnlimited={isUnlimited}
        onToggleUnlimited={handleTogglePlayType}
        onOpenStats={openStats}
        onOpenHelp={openHelp}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 flex flex-col items-center min-w-0">
        {currentState && (
          <div className="w-full flex items-center justify-between max-w-md mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#a09b8c]">Guesses:</span>
              <span className="font-bold text-[#f0e6d2] bg-[#1e2328] px-2 py-0.5 rounded border border-[#785a28]/40">
                {currentState.guesses.length}
              </span>
            </div>

            {isUnlimited && !currentState.isSolved && currentState.guesses.length >= 3 && (
              <button
                onClick={handleGiveUp}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Give Up</span>
              </button>
            )}

            {isUnlimited && currentState.isSolved && !isVictoryOpen && (
              <button
                onClick={handleNextRound}
                className="flex items-center gap-1 text-[#c8aa6e] hover:text-[#f0e6d2] font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Next Champion</span>
              </button>
            )}
          </div>
        )}

        {currentState && currentMode === 'classic' && (
          <ClassicMode
            key={`${playType}-classic`}
            target={currentState.target}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'quote' && (
          <QuoteMode
            key={`${playType}-quote`}
            target={currentState.target}
            quoteIndex={currentState.quoteIndex}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'ability' && (
          <AbilityMode
            key={`${playType}-ability`}
            target={currentState.target}
            targetAbilityKey={currentState.abilityKey}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
            bonus={currentState.bonus}
            onBonusComplete={handleAbilityBonus}
            onBonusSkip={handleAbilityBonusSkip}
          />
        )}

        {currentState && currentMode === 'emoji' && (
          <EmojiMode
            key={`${playType}-emoji`}
            target={currentState.target}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
          />
        )}

        {currentState && currentMode === 'splash' && (
          <SplashMode
            key={`${playType}-splash`}
            target={currentState.target}
            targetSkin={currentState.skin || currentState.target.skins[0]}
            guesses={currentState.guesses}
            onGuess={handleGuess}
            isSolved={currentState.isSolved}
            allChampions={champions}
            bonus={currentState.bonus}
            onBonusComplete={handleSplashBonus}
            onBonusSkip={handleSplashBonusSkip}
          />
        )}
      </main>

      <footer className="w-full py-4 border-t border-[#785a28]/20 text-center text-xs text-[#a09b8c]/70 px-3">
        <p>LoLdle isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games.</p>
        <p className="mt-1">League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.</p>
      </footer>

      {toastMessage && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e2328] border border-[#c8aa6e] text-[#f0e6d2] px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold animate-bounce">
          {toastMessage}
        </div>
      )}

      {victoryContext && (
        <VictoryModal
          isOpen={isVictoryOpen}
          onClose={closeVictory}
          champion={victoryContext.champion}
          skin={victoryContext.skin}
          mode={victoryContext.mode}
          guessCount={victoryContext.guessCount}
          playType={victoryContext.playType}
          streak={victoryContext.streak}
          abilityKey={victoryContext.abilityKey}
          bonus={victoryContext.bonus}
          isSurrendered={victoryContext.isSurrendered}
          onNextRound={handleNextRound}
          onShare={handleShare}
          onSelectMode={handleSelectMode}
        />
      )}

      <SurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={closeSurrender}
        onConfirm={handleConfirmSurrender}
        streak={activeStatsBucket.currentStreak}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={closeStats}
        stats={stats}
        activePlayType={playType}
        onResetStats={resetStats}
      />

      <HelpModal isOpen={isHelpOpen} onClose={closeHelp} />
    </div>
  );
};
