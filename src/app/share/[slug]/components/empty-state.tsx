'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear, isGameAvailable } from '../utils';
import { PrimaryButton } from '@/components/primary-button';

interface Props {
  games: Game[];
  opponentFilter: string;
  monthFilter: string;
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
  const monthIndex = monthFilter ? parseInt(monthFilter) - 1 : -1;
  const monthName = monthIndex >= 0 ? MONTH_NAMES[monthIndex] : null;

  let title = 'No games match your filters';
  let alsoPlaysLabel = '';
  let pills: { month: number; count: number }[] = [];

  if (opponentFilter && monthName) {
    title = `No ${opponentFilter} games in ${monthName}`;
    const oppGames = games.filter(
      (g) => g.opponent === opponentFilter && isGameAvailable(g)
    );
    if (oppGames.length > 0) {
      alsoPlaysLabel = `${opponentFilter} also play in:`;
      const mCounts = new Map<number, number>();
      for (const g of oppGames) {
        const { month } = getGameMonthYear(g);
        mCounts.set(month, (mCounts.get(month) || 0) + 1);
      }
      pills = [...mCounts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([month, count]) => ({ month, count }));
    }
  } else if (opponentFilter) {
    title = `No ${opponentFilter} games available`;
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
            {pills.map(({ month, count }) => (
              <button
                key={month}
                onClick={() => onJumpToMonth(month)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-3xl bg-[#f5f4f2] border border-[#ffad00] cursor-pointer hover:bg-[#f7edd0] transition-colors"
              >
                <span className="text-xs font-medium text-[#2c2a2b] leading-5">
                  {MONTH_NAMES[month]}
                </span>
                <span className="w-5 h-5 rounded-full bg-[#ffad00] flex items-center justify-center text-[10px] font-medium text-white">
                  {count}
                </span>
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
