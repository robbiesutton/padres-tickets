'use client';

import type { CalendarMonth, CalendarCell } from '../types';
import {
  DAY_LABELS,
  getOpponentAbbr,
  getOpponentColor,
  isGameClaimed,
} from '../utils';
import { CheckBadge } from './check-badge';

interface Props {
  month: CalendarMonth;
  cells: CalendarCell[];
  filteredIds: Set<string>;
  expandedGameId: string | null;
  reservedGameIds: Set<string>;
  currentUserId: string | null;
  onSelectGame: (id: string, rect: DOMRect) => void;
  className?: string;
}

export function CalendarGrid({
  month,
  cells,
  filteredIds,
  expandedGameId,
  reservedGameIds,
  currentUserId,
  onSelectGame,
  className,
}: Props) {
  return (
    <div className={className}>
      <div className="text-base font-semibold text-foreground text-center mb-3">
        {month.label}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {/* Day of week headers */}
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-xs md:text-sm text-[#8e8985] text-center py-1 md:py-1 font-semibold uppercase tracking-wider"
          >
            {d}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: month.startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {cells.map(({ day, game }) => {
          if (!game) {
            // No game on this day
            return (
              <div
                key={day}
                className="text-center py-1 rounded-lg aspect-square flex flex-col items-center justify-center"
              >
                <span className="text-[13px] md:text-[15px] font-normal text-[#8e8985] w-[34px] h-[34px] md:w-[42px] md:h-[42px] flex items-center justify-center">
                  {day}
                </span>
              </div>
            );
          }

          const isReserved =
            reservedGameIds.has(game.id) ||
            (game.claim?.claimerUserId === currentUserId &&
              game.claim?.status !== 'RELEASED');
          const inFilter = filteredIds.has(game.id);
          const isSelected = expandedGameId === game.id;
          const isTaken =
            !isReserved &&
            (isGameClaimed(game) ||
              game.status === 'GOING_MYSELF' ||
              game.status === 'SOLD_ELSEWHERE' ||
              game.status === 'UNAVAILABLE');
          const dimmed = !inFilter && !isReserved;
          const clickable = (inFilter || isReserved) && !isTaken && !dimmed;

          const abbr = getOpponentAbbr(game.opponent);
          const color = getOpponentColor(game.opponent);

          const hasHover = clickable && !isTaken && !dimmed;
          let cellClass =
            'text-center py-1 rounded-lg aspect-square flex flex-col items-center justify-center transition-all relative';
          if (hasHover) cellClass += ' group';
          if (isReserved) cellClass += ' cursor-pointer';
          else if (clickable) cellClass += ' cursor-pointer';
          if (isTaken || dimmed) cellClass += ' cursor-default';

          function handleClick(e: React.MouseEvent<HTMLDivElement>) {
            if (!clickable || !game) return;
            const rect = e.currentTarget.getBoundingClientRect();
            onSelectGame(game.id, rect);
          }

          return (
            <div key={day} className={cellClass} onClick={handleClick}>
              {isReserved ? (
                <div className="relative w-[34px] h-[34px] md:w-[42px] md:h-[42px]">
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center text-[11px] md:text-[13px] font-bold text-white opacity-[0.16]"
                    style={{ backgroundColor: color }}
                  >
                    {abbr}
                  </div>
                  <CheckBadge variant="pill" />
                </div>
              ) : (
                <>
                  {/* Available default: filled circle, or outlined ring when selected */}
                  <div
                    className={`w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[11px] md:text-[13px] font-bold group-hover:hidden ${
                      isTaken || dimmed ? 'opacity-[0.16]' : ''
                    } ${isSelected ? 'text-[#1a1a1a]' : 'text-white'}`}
                    style={
                      isSelected
                        ? {
                            border: `2px solid ${color}`,
                            backgroundColor: 'transparent',
                          }
                        : { backgroundColor: color }
                    }
                  >
                    {abbr}
                  </div>
                  {/* Available hover: border ring with abbreviation */}
                  <div
                    className={`w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full hidden group-hover:flex items-center justify-center text-[11px] md:text-[13px] font-bold ${
                      isTaken || dimmed ? 'opacity-[0.16]' : ''
                    }`}
                    style={{
                      border: `2px solid ${color}`,
                      color: color,
                    }}
                  >
                    {abbr}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
