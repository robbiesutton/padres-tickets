'use client';

import type { CalendarMonth, CalendarCell } from '../types';
import { DAY_LABELS, getOpponentAbbr, getOpponentColor, isGameClaimed } from '../utils';

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

function CheckSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" width={24} height={24} fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <div className="text-base font-semibold text-foreground text-center mb-4">
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
            <div
              key={day}
              className={cellClass}
              onClick={handleClick}
            >
              {isReserved ? (
                <>
                  {/* Reserved default: green filled circle with white check */}
                  <div className="w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center group-hover:hidden">
                    <CheckSvg color="#fff" />
                  </div>
                  {/* Reserved hover: green border ring with green check */}
                  <div
                    className="w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full hidden group-hover:flex items-center justify-center"
                    style={{ border: '2px solid #0f6f57' }}
                  >
                    <CheckSvg color="#0f6f57" />
                  </div>
                </>
              ) : (
                <>
                  {/* Available default: filled circle, or outlined ring when selected */}
                  <div
                    className={`w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[11px] md:text-[13px] font-bold group-hover:hidden ${
                      isTaken || dimmed ? 'opacity-[0.12]' : ''
                    } ${isSelected ? 'text-[#1a1a1a]' : 'text-white'}`}
                    style={isSelected
                      ? { border: `2px solid ${color}`, backgroundColor: 'transparent' }
                      : { backgroundColor: color }
                    }
                  >
                    {abbr}
                  </div>
                  {/* Available hover: border ring with abbreviation */}
                  <div
                    className={`w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full hidden group-hover:flex items-center justify-center text-[11px] md:text-[13px] font-bold ${
                      isTaken || dimmed ? 'opacity-[0.12]' : ''
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
