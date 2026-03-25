'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear } from '../utils';

interface Props {
  games: Game[]; // all games (not filtered)
  opponentFilter: string;
  onJumpToMonth: (monthIndex: number) => void;
  currentVisibleMonths?: number[]; // month indices currently visible in calendar
}

export function AlsoPlaysInBar({
  games,
  opponentFilter,
  onJumpToMonth,
  currentVisibleMonths = [],
}: Props) {
  if (!opponentFilter) return null;

  const oppGames = games.filter((g) => g.opponent === opponentFilter);
  const monthCounts = new Map<number, number>();
  for (const g of oppGames) {
    const { month } = getGameMonthYear(g);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }

  if (monthCounts.size <= 1) return null;

  const sortedMonths = [...monthCounts.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-muted pb-3 mb-3 border-b border-border">
      <span className="text-foreground font-medium">
        Also play in:
      </span>
      {sortedMonths.map(([month, count]) => {
        const isCurrent = currentVisibleMonths.includes(month);
        return (
          <button
            key={month}
            onClick={() => onJumpToMonth(month)}
            className={`px-2.5 py-1 rounded-2xl text-[11px] font-medium cursor-pointer border inline-flex items-center gap-1 my-0.5 ${
              isCurrent
                ? 'border-accent bg-[rgba(212,168,67,0.1)] text-foreground'
                : 'border-border bg-card text-muted'
            }`}
          >
            {MONTH_NAMES[month]}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-semibold">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
