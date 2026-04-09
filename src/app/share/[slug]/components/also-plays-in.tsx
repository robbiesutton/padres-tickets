'use client';

import type { Game } from '../types';
import { MONTH_NAMES, getGameMonthYear, isGameAvailable } from '../utils';

interface Props {
  games: Game[];
  opponentFilter: string[];
  monthFilter: string[];
  onJumpToMonth: (monthIndex: number) => void;
}

export function AlsoPlaysIn({ games, opponentFilter, monthFilter, onJumpToMonth }: Props) {
  if (opponentFilter.length === 0) return null;

  const oppGames = games.filter(
    (g) => opponentFilter.includes(g.opponent) && isGameAvailable(g)
  );
  const monthCounts = new Map<number, number>();
  for (const g of oppGames) {
    const { month } = getGameMonthYear(g);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }

  if (monthCounts.size <= 1) return null;

  const sortedMonths = [...monthCounts.entries()].sort(([a], [b]) => a - b);
  const selectedMonths = new Set(monthFilter.map((m) => parseInt(m) - 1));

  return (
    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
      <span className="text-xs font-normal text-[#2c2a2b]">
        Also playing here:
      </span>
      {sortedMonths.map(([month]) => {
        const isSelected = selectedMonths.has(month);
        return (
          <button
            key={month}
            onClick={() => onJumpToMonth(month)}
            className={`flex items-center gap-0.5 px-2.5 py-1 rounded-3xl cursor-pointer transition-all ${
              isSelected
                ? 'bg-[#E5AB00] border border-transparent'
                : 'bg-white border border-[#dcd7d4] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#FFF8E7] hover:border-[#E5AB00] hover:shadow-none'
            }`}
          >
            <span className={`text-[11px] font-medium leading-4 ${isSelected ? 'text-white' : 'text-[#2c2a2b]'}`}>
              {MONTH_NAMES[month]}
            </span>
            {!isSelected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2c2a2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
