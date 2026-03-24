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
  onSelectGame: (id: string) => void;
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
}: Props) {
  return (
    <div>
      <div className="text-base font-semibold text-foreground text-center mb-4">
        {month.label}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {/* Day of week headers */}
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-sm text-[#8e8985] text-center py-1 font-semibold uppercase tracking-wider"
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
                <span className="text-[15px] font-normal text-[#8e8985] w-[42px] h-[42px] flex items-center justify-center">
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
          const isSelected = expandedGameId === game.id && !isReserved;
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
          else if (isSelected && inFilter) cellClass += ' bg-[rgba(27,42,74,0.06)]';
          else if (clickable) cellClass += ' cursor-pointer';
          if (isTaken || dimmed) cellClass += ' cursor-default';

          return (
            <div
              key={day}
              className={cellClass}
              onClick={clickable ? () => onSelectGame(game.id) : undefined}
            >
              {isReserved ? (
                <>
                  {/* Reserved default: green filled circle with white check */}
                  <div className="w-[42px] h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center group-hover:hidden">
                    <CheckSvg color="#fff" />
                  </div>
                  {/* Reserved hover: green border ring with green check */}
                  <div
                    className="w-[42px] h-[42px] rounded-full hidden group-hover:flex items-center justify-center"
                    style={{ border: '2px solid #0f6f57' }}
                  >
                    <CheckSvg color="#0f6f57" />
                  </div>
                </>
              ) : (
                <>
                  {/* Available default: filled circle with abbreviation */}
                  <div
                    className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-[13px] font-bold text-white group-hover:hidden ${
                      isTaken || dimmed ? 'opacity-25' : ''
                    }`}
                    style={{
                      backgroundColor:
                        isSelected && inFilter ? 'var(--color-navy)' : color,
                    }}
                  >
                    {abbr}
                  </div>
                  {/* Available hover: border ring with abbreviation */}
                  <div
                    className={`w-[42px] h-[42px] rounded-full hidden group-hover:flex items-center justify-center text-[13px] font-bold ${
                      isTaken || dimmed ? 'opacity-25' : ''
                    }`}
                    style={{
                      border: `2px solid ${isSelected && inFilter ? 'var(--color-navy)' : color}`,
                      color: isSelected && inFilter ? 'var(--color-navy)' : color,
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
