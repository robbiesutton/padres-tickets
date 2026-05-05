'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear, isGameAvailable } from '../utils';
import { PrimaryButton } from '@/components/primary-button';

interface Props {
  games: Game[];
  opponentFilter: string[];
  monthFilter: string[];
  onJumpToMonth: (monthIndex: number) => void;
  onClearFilters: () => void;
}

export function EmptyState({
  games,
  opponentFilter,
  monthFilter,
  onJumpToMonth,
  onClearFilters,
}: Props) {
  const monthIndices = monthFilter.map((m) => parseInt(m) - 1);
  const monthNames = monthIndices.map((i) => MONTH_NAMES[i]).filter(Boolean);
  const monthName = monthNames.length > 0 ? monthNames.join(', ') : null;

  let title = 'No games match your filters';
  let alsoPlaysLabel = '';
  let pills: { month: number; count: number }[] = [];

  if (opponentFilter.length > 0 && monthName) {
    const oppLabel = opponentFilter.length === 1 ? opponentFilter[0] : `${opponentFilter.length} opponents`;
    title = `No ${oppLabel} games in ${monthName}`;
    const oppGames = games.filter(
      (g) => opponentFilter.includes(g.opponent) && isGameAvailable(g)
    );
    if (oppGames.length > 0) {
      alsoPlaysLabel = `Also playing here:`;
      const mCounts = new Map<number, number>();
      for (const g of oppGames) {
        const { month } = getGameMonthYear(g);
        mCounts.set(month, (mCounts.get(month) || 0) + 1);
      }
      pills = [...mCounts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([month, count]) => ({ month, count }));
    }
  } else if (opponentFilter.length > 0) {
    const oppLabel = opponentFilter.length === 1 ? opponentFilter[0] : `${opponentFilter.length} opponents`;
    title = `No ${oppLabel} games available`;
  } else if (monthName) {
    title = `No games in ${monthName}`;
    const availableGames = games.filter(isGameAvailable);
    if (availableGames.length > 0) {
      alsoPlaysLabel = 'Games are available in:';
      const allMonths = new Map<number, number>();
      for (const g of availableGames) {
        const { month } = getGameMonthYear(g);
        allMonths.set(month, (allMonths.get(month) || 0) + 1);
      }
      pills = [...allMonths.entries()]
        .sort(([a], [b]) => a - b)
        .map(([month, count]) => ({ month, count }));
    }
  }

  return (
    <div className="flex flex-col gap-8 items-center py-8">
      <div className="flex flex-col gap-4 items-center">
        <p className="text-base font-medium text-black text-center">
          {title}
        </p>
        {pills.length > 0 && (
          <div className="flex items-center gap-2 p-1 flex-wrap justify-center">
            <span className="text-sm font-normal text-[#2c2a2b]">
              {alsoPlaysLabel}
            </span>
            {pills.map(({ month }) => (
              <button
                key={month}
                onClick={() => onJumpToMonth(month)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-3xl bg-white text-[#2c2a2b] border border-[#dcd7d4] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-[#FFF8E7] hover:border-[#E5AB00] hover:shadow-none transition-all"
              >
                <span className="text-[11px] font-medium leading-4">
                  {MONTH_NAMES[month]}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2c2a2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>
      <PrimaryButton onClick={onClearFilters}>
        Clear all filters
      </PrimaryButton>
    </div>
  );
}
