'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear, isGameAvailable } from '../utils';

interface Props {
  games: Game[];
  opponentFilter: string;
  monthFilter: string;
  onJumpToMonth: (monthIndex: number) => void;
}

export function AlsoPlaysIn({ games, opponentFilter, monthFilter, onJumpToMonth }: Props) {
  if (!opponentFilter) return null;

  const oppGames = games.filter(
    (g) => g.opponent === opponentFilter && isGameAvailable(g)
  );
  const monthCounts = new Map<number, number>();
  for (const g of oppGames) {
    const { month } = getGameMonthYear(g);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }

  if (monthCounts.size <= 1) return null;

  const sortedMonths = [...monthCounts.entries()].sort(([a], [b]) => a - b);
  const selectedMonth = monthFilter ? parseInt(monthFilter) - 1 : -1;

  return (
    <div className="flex items-center gap-2 p-1 -mt-4 mb-4 flex-wrap">
      <span className="text-sm font-normal text-[#2c2a2b]">
        {opponentFilter} also play in:
      </span>
      {sortedMonths.map(([month, count]) => {
        const isSelected = month === selectedMonth;
        return (
          <button
            key={month}
            onClick={() => onJumpToMonth(month)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-3xl border border-[#ffad00] cursor-pointer hover:bg-[#f7edd0] transition-colors ${
              isSelected ? 'bg-[#f7edd0]' : 'bg-[#f5f4f2]'
            }`}
          >
            <span className="text-xs font-medium text-[#2c2a2b] leading-5">
              {MONTH_NAMES[month]}
            </span>
            <span className="w-5 h-5 rounded-full bg-[#ffad00] flex items-center justify-center text-[10px] font-medium text-white">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
