'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear } from '../utils';

interface Props {
  games: Game[]; // all games (unfiltered)
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
  let subtitle = 'Try adjusting your opponent or month selection.';
  let pills: { month: number; count: number }[] = [];

  if (opponentFilter && monthName) {
    title = `No ${opponentFilter} games in ${monthName}`;
    const oppGames = games.filter((g) => g.opponent === opponentFilter);
    if (oppGames.length > 0) {
      const mCounts = new Map<number, number>();
      for (const g of oppGames) {
        const { month } = getGameMonthYear(g);
        mCounts.set(month, (mCounts.get(month) || 0) + 1);
      }
      subtitle = `The ${opponentFilter} play at Petco Park in:`;
      pills = [...mCounts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([month, count]) => ({ month, count }));
    }
  } else if (opponentFilter) {
    title = `No ${opponentFilter} games available`;
    subtitle = 'All their games may have been reserved.';
  } else if (monthName) {
    title = `No games in ${monthName}`;
    const allMonths = new Map<number, number>();
    for (const g of games) {
      const { month } = getGameMonthYear(g);
      allMonths.set(month, (allMonths.get(month) || 0) + 1);
    }
    subtitle = 'Games are available in:';
    pills = [...allMonths.entries()]
      .sort(([a], [b]) => a - b)
      .map(([month, count]) => ({ month, count }));
  }

  return (
    <div className="py-9 px-5 text-center">
      <div className="mx-auto mb-2.5 w-10 h-10 rounded-full bg-background flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="11"
            rx="1.5"
            stroke="#8C8984"
            strokeWidth="1.2"
          />
          <line
            x1="1.5"
            y1="6"
            x2="14.5"
            y2="6"
            stroke="#8C8984"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      <div className="text-sm font-medium text-foreground mb-1">{title}</div>
      <div className="text-xs text-muted mb-3.5">{subtitle}</div>
      {pills.length > 0 && (
        <div className="flex gap-1.5 justify-center flex-wrap mb-4">
          {pills.map(({ month, count }) => (
            <button
              key={month}
              onClick={() => onJumpToMonth(month)}
              className="px-3 py-[5px] rounded-2xl text-[11px] font-medium cursor-pointer border border-border bg-card text-muted inline-flex items-center gap-1"
            >
              {MONTH_NAMES[month]}
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-semibold">
                {count}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onClearFilters}
        className="px-4 py-[7px] rounded-[7px] text-xs font-medium cursor-pointer border border-border bg-none text-foreground"
      >
        Clear all filters
      </button>
    </div>
  );
}
