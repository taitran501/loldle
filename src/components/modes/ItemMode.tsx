import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { LoLItem, PlayType } from '../../types';
import { pickTargetItemAndChoices } from '../../utils/itemMode';
import {
  Lock,
  Sparkles,
  Coins,
  CheckCircle,
  XCircle,
  RefreshCw,
  Share2,
  Eye,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';

interface ItemModeProps {
  allItems: LoLItem[];
  playType: PlayType;
  dateStr: string;
  onRoundComplete?: (guessCount: number, targetItem: LoLItem) => void;
  onShareResult?: (text: string) => void;
}

export const ItemMode: React.FC<ItemModeProps> = ({
  allItems,
  playType,
  dateStr,
  onRoundComplete,
  onShareResult,
}) => {
  const [roundSeed, setRoundSeed] = useState(1);
  const [lastTargetId, setLastTargetId] = useState<string | undefined>(undefined);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [extraReveals, setExtraReveals] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  const puzzle = useMemo(
    () => pickTargetItemAndChoices(allItems, playType, dateStr, roundSeed, lastTargetId),
    [allItems, playType, dateStr, roundSeed, lastTargetId]
  );

  const { targetItem, choices, recipeTree } = puzzle;

  // Reset state when playType or dateStr changes
  useEffect(() => {
    setGuessedIds([]);
    setExtraReveals(0);
    setIsSolved(false);
  }, [playType, dateStr, targetItem.id]);

  // Total effective clue progress = wrong guesses + manual clue unlocks
  const wrongGuessCount = guessedIds.filter(id => id !== targetItem.id).length;
  const clueStep = wrongGuessCount + extraReveals;

  // Progressive Clue Unlocks:
  // Step 0 (Start): Branch #1 (Level 2 + its Level 3 sub-components) is revealed
  // Step 1: Branch #2 is revealed
  // Step 2: Branch #3 (if any) + Total Gold / Combine Cost revealed
  // Step 3: Item Stats Summary revealed
  // Step 4: Blurred Target Item Icon revealed
  const isGoldUnlocked = clueStep >= 2 || isSolved;
  const isStatsUnlocked = clueStep >= 3 || isSolved;
  const isBlurredIconUnlocked = clueStep >= 4 || isSolved;

  const handlePickItem = (item: LoLItem) => {
    if (isSolved || guessedIds.includes(item.id)) return;

    const nextGuesses = [...guessedIds, item.id];
    setGuessedIds(nextGuesses);

    if (item.id === targetItem.id) {
      setIsSolved(true);
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#c8aa6e', '#f0e6d2', '#10b981'],
        });
      } catch {
        // Ignore confetti errors in headless test environments
      }
      onRoundComplete?.(nextGuesses.length + extraReveals, targetItem);
    }
  };

  const handleRevealNextClue = () => {
    if (isSolved || clueStep >= 4) return;
    setExtraReveals(prev => prev + 1);
  };

  const handleNextRound = () => {
    if (playType !== 'unlimited') return;
    setLastTargetId(targetItem.id);
    setRoundSeed(prev => prev + 1);
    setGuessedIds([]);
    setExtraReveals(0);
    setIsSolved(false);
  };

  const handleShare = () => {
    const totalAttempts = Math.max(1, guessedIds.length + extraReveals);
    const text = `LoLdle (ITEM SHOP) - ${
      playType === 'daily' ? `Daily ${dateStr}` : 'Unlimited'
    }\nSolved "${targetItem.name}" in ${totalAttempts} ${
      totalAttempts === 1 ? 'try' : 'tries'
    }! 🗡️\nPlay at: ${window.location.origin}`;

    if (onShareResult) {
      onShareResult(text);
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="w-full flex flex-col items-center" data-testid="item-mode">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f0e6d2]">
          Item Shop Mode
        </h2>
        <p className="text-sm text-[#a09b8c] mt-1">
          Inspect the recipe tree and pick the completed item from the Shop!
        </p>
      </div>

      {/* HEXTECH RECIPE TREE BOARD */}
      <div
        data-testid="item-recipe-tree"
        className="w-full max-w-2xl bg-[#1e2328]/95 border-2 border-[#785a28]/70 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden mb-5"
      >
        {/* Top Row: Attempts & Optional Unlock Clue Button */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#c8aa6e]" />
            <span className="text-[#a09b8c]">Picks used:</span>
            <span className="font-bold text-[#f0e6d2] bg-[#091428] px-2.5 py-0.5 rounded border border-[#785a28]/50">
              {guessedIds.length + extraReveals}
            </span>
          </div>

          {!isSolved && clueStep < 4 && (
            <button
              type="button"
              data-testid="item-unlock-clue"
              onClick={handleRevealNextClue}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#091428] hover:bg-[#c8aa6e]/20 text-[#c8aa6e] border border-[#c8aa6e]/50 font-semibold transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Next Clue (+1)</span>
            </button>
          )}
        </div>

        {/* LEVEL 1: TARGET COMPLETED ITEM (ROOT OF TREE) */}
        <div className="flex flex-col items-center">
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all duration-500 ${
              isSolved
                ? 'border-emerald-400 bg-[#091428] shadow-[0_0_28px_rgba(16,185,129,0.5)] scale-105'
                : 'border-[#c8aa6e] bg-[#091428] shadow-[0_0_18px_rgba(200,170,110,0.3)]'
            }`}
          >
            {isSolved || isBlurredIconUnlocked ? (
              <img
                src={targetItem.iconUrl}
                alt={isSolved ? targetItem.name : 'Blurred Mystery Item'}
                style={{
                  filter: isSolved ? 'none' : 'blur(10px) saturate(1.2)',
                  transform: isSolved ? 'scale(1)' : 'scale(1.15)',
                }}
                className="w-full h-full object-cover transition-all duration-500"
              />
            ) : (
              <div className="flex flex-col items-center text-[#c8aa6e]">
                <HelpCircle className="w-8 h-8 animate-pulse" />
              </div>
            )}
          </div>

          {/* Root Item Name & Gold Badge */}
          <div className="mt-1.5 text-center">
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#f0e6d2]">
              {isSolved ? targetItem.name : '???'}
            </h3>
            <div className="mt-0.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#091428] border border-[#785a28]/60 text-[11px] font-semibold">
              <Coins className="w-3 h-3 text-amber-400" />
              {isGoldUnlocked ? (
                <span className="text-amber-300">
                  {targetItem.totalGold}g{' '}
                  <span className="text-[#a09b8c]">
                    ({targetItem.combineGold}g)
                  </span>
                </span>
              ) : (
                <span className="text-[#a09b8c]">???g</span>
              )}
            </div>
          </div>

          {/* Vertical Stem from Level 1 Root down to Level 2 Branch Bar */}
          <div className="w-0.5 h-5 bg-[#c8aa6e]/70" />

          {/* LEVEL 2 & LEVEL 3 HIERARCHICAL TREE BRANCHES */}
          <div className="w-full overflow-x-auto pb-1">
            <div className="flex flex-row items-start justify-center min-w-fit mx-auto px-2">
              {recipeTree.map((branch, idx) => {
                const comp = branch.item;
                const subComps = branch.subComponents;
                const isCompUnlocked = isSolved || clueStep >= idx;
                const isFirst = idx === 0;
                const isLast = idx === recipeTree.length - 1;
                const isOnly = recipeTree.length === 1;

                return (
                  <div
                    key={`${comp.id}-${idx}`}
                    data-testid={`recipe-component-${idx}`}
                    className="flex flex-col items-center relative px-2 sm:px-4"
                  >
                    {/* Horizontal Connector Bar segments across Level 2 siblings */}
                    {!isOnly && (
                      <div className="w-full h-0.5 flex flex-row">
                        <div
                          className={`w-1/2 h-full ${
                            isFirst ? 'bg-transparent' : 'bg-[#c8aa6e]/65'
                          }`}
                        />
                        <div
                          className={`w-1/2 h-full ${
                            isLast ? 'bg-transparent' : 'bg-[#c8aa6e]/65'
                          }`}
                        />
                      </div>
                    )}

                    {/* Vertical Drop Line into Level 2 Component Slot */}
                    <div className="w-0.5 h-4 bg-[#c8aa6e]/70" />

                    {/* LEVEL 2 COMPONENT SQUARE ICON SLOT */}
                    <div className="flex flex-col items-center">
                      <div
                        title={isCompUnlocked ? `${comp.name} (${comp.totalGold}g)` : `Locked Component #${idx + 1}`}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                          isCompUnlocked
                            ? 'bg-[#091428] border-[#c8aa6e] shadow-[0_0_12px_rgba(200,170,110,0.25)] animate-flip-in'
                            : 'bg-[#091428]/80 border-[#785a28]/50 text-[#a09b8c]/60'
                        }`}
                      >
                        {isCompUnlocked ? (
                          <img
                            src={comp.iconUrl}
                            alt={comp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Lock className="w-5 h-5 text-[#c8aa6e]/60" />
                        )}
                      </div>

                      {/* Gold & Compact Label under Level 2 Square */}
                      <span className="text-[11px] font-bold text-amber-400 mt-1 leading-none">
                        {isCompUnlocked ? `${comp.totalGold}g` : '???g'}
                      </span>
                      <span className="text-[10px] font-medium text-[#f0e6d2] mt-0.5 max-w-[88px] sm:max-w-[105px] text-center truncate">
                        {isCompUnlocked ? comp.name : `Slot #${idx + 1}`}
                      </span>
                    </div>

                    {/* LEVEL 3 BASIC SUB-COMPONENTS (If this Level 2 item is built from Basic items) */}
                    {subComps.length > 0 && (
                      <div className="flex flex-col items-center w-full mt-1">
                        {/* Vertical Stem from Level 2 Component down to Level 3 Sub-Branch */}
                        <div
                          className={`w-0.5 h-3.5 ${
                            isCompUnlocked ? 'bg-[#c8aa6e]/60' : 'bg-[#785a28]/40'
                          }`}
                        />

                        <div className="flex flex-row items-start justify-center">
                          {subComps.map((sub, subIdx) => {
                            const subFirst = subIdx === 0;
                            const subLast = subIdx === subComps.length - 1;
                            const subOnly = subComps.length === 1;
                            const lineColor = isCompUnlocked
                              ? 'bg-[#c8aa6e]/55'
                              : 'bg-[#785a28]/35';

                            return (
                              <div
                                key={`${sub.id}-${subIdx}`}
                                className="flex flex-col items-center px-1 sm:px-1.5"
                              >
                                {!subOnly && (
                                  <div className="w-full h-0.5 flex flex-row">
                                    <div
                                      className={`w-1/2 h-full ${
                                        subFirst ? 'bg-transparent' : lineColor
                                      }`}
                                    />
                                    <div
                                      className={`w-1/2 h-full ${
                                        subLast ? 'bg-transparent' : lineColor
                                      }`}
                                    />
                                  </div>
                                )}

                                <div className={`w-0.5 h-2.5 ${lineColor}`} />

                                {/* Level 3 Basic Item Square Slot */}
                                <div
                                  title={
                                    isCompUnlocked
                                      ? `${sub.name} (${sub.totalGold}g)`
                                      : 'Locked Sub-Component'
                                  }
                                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center overflow-hidden transition-all ${
                                    isCompUnlocked
                                      ? 'bg-[#091428] border-[#c8aa6e]/80 shadow-sm'
                                      : 'bg-[#091428]/50 border-[#785a28]/40'
                                  }`}
                                >
                                  {isCompUnlocked ? (
                                    <img
                                      src={sub.iconUrl}
                                      alt={sub.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-[#785a28]/60" />
                                  )}
                                </div>

                                <span className="text-[10px] font-semibold text-[#a09b8c] mt-0.5 leading-none">
                                  {isCompUnlocked ? `${sub.totalGold}g` : '?'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progressive Stats Clue Banner */}
          {isStatsUnlocked && targetItem.statsSummary.length > 0 && (
            <div className="w-full mt-4 pt-3 border-t border-[#785a28]/40 text-center animate-flip-in">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#c8aa6e] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Item Stats Clue</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#f0e6d2]">
                {targetItem.statsSummary.join(' • ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SELECTABLE ITEM CHOICES GRID ("Cho lựa chọn để pick") */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#c8aa6e]">
            Pick the Completed Item ({choices.length} Candidates):
          </h3>
          <span className="text-xs text-[#a09b8c]">
            Click an item card to guess
          </span>
        </div>

        <div
          data-testid="item-choices-grid"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3"
        >
          {choices.map(choice => {
            const wasPicked = guessedIds.includes(choice.id);
            const isCorrectPick = choice.id === targetItem.id;

            let cardStyle =
              'bg-[#1e2328] border-[#785a28]/60 hover:border-[#c8aa6e] hover:bg-[#c8aa6e]/15 text-[#f0e6d2] cursor-pointer hover:scale-[1.02] active:scale-95';

            if (wasPicked && isCorrectPick) {
              cardStyle =
                'bg-emerald-700/90 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.45)] scale-[1.02]';
            } else if (wasPicked && !isCorrectPick) {
              cardStyle =
                'bg-rose-900/50 border-rose-500/60 text-[#a09b8c] opacity-60 cursor-not-allowed';
            } else if (isSolved && isCorrectPick) {
              cardStyle =
                'bg-emerald-700/90 border-emerald-400 text-white';
            } else if (isSolved) {
              cardStyle =
                'bg-[#1e2328]/50 border-[#785a28]/30 text-[#a09b8c]/50 cursor-default';
            }

            return (
              <button
                key={choice.id}
                type="button"
                data-testid={`item-choice-${choice.id}`}
                disabled={isSolved || wasPicked}
                onClick={() => handlePickItem(choice)}
                className={`flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 relative text-center ${cardStyle}`}
              >
                {wasPicked && (
                  <div className="absolute top-2 right-2">
                    {isCorrectPick ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                )}

                <img
                  src={choice.iconUrl}
                  alt={choice.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-[#c8aa6e]/60 object-cover shadow-md"
                />

                <span className="text-xs font-bold mt-2 line-clamp-2 leading-snug">
                  {choice.name}
                </span>

                {wasPicked && !isCorrectPick && (
                  <span className="text-[10px] text-rose-300 mt-1">
                    {choice.totalGold}g
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SOLVED BANNER & NEXT ITEM BUTTON */}
      {isSolved && (
        <div
          data-testid="item-solved-banner"
          className="w-full max-w-lg mt-6 bg-[#1e2328] border-2 border-[#c8aa6e] rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(200,170,110,0.3)] animate-flip-in"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Recipe Completed!</span>
          </div>

          <h4 className="text-xl font-serif font-bold text-[#f0e6d2]">
            {targetItem.name} ({targetItem.totalGold}g)
          </h4>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {playType === 'unlimited' && (
              <button
                type="button"
                data-testid="item-next-round"
                onClick={handleNextRound}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c8aa6e] to-[#785a28] hover:from-[#e0c488] hover:to-[#967032] text-[#091428] font-bold text-sm shadow-lg transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Next Item</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#091428] hover:bg-[#c8aa6e]/20 text-[#c8aa6e] border border-[#c8aa6e]/50 font-semibold text-sm transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Result</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
