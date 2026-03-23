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

function CheckSvg({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="#fff"
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
            className="text-sm text-muted-light text-center py-1 font-medium uppercase tracking-wider"
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
                <span className="text-sm text-muted-light">{day}</span>
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

          let cellClass =
            'text-center py-1 rounded-lg aspect-square flex flex-col items-center justify-center gap-1 transition-all relative group';
          if (isReserved) cellClass += ' bg-[rgba(15,110,86,0.06)] cursor-pointer';
          else if (isSelected && inFilter) cellClass += ' bg-[rgba(27,42,74,0.06)]';
          else if (clickable) cellClass += ' cursor-pointer';
          if (isTaken || dimmed) cellClass += ' cursor-default';

          return (
            <div
              key={day}
              className={cellClass}
              onClick={clickable ? () => onSelectGame(game.id) : undefined}
            >
              {/* Day number (shows on hover for game cells) */}
              <span
                className={`text-sm hidden group-hover:flex items-center justify-center w-[42px] h-[42px] rounded-full ${
                  isReserved
                    ? 'font-semibold text-green'
                    : 'font-semibold text-foreground'
                }`}
                style={
                  !isReserved
                    ? { border: `1.5px solid ${color}` }
                    : { border: '1.5px solid var(--color-green)' }
                }
              >
                {day}
              </span>

              {/* Badge (hidden on hover) */}
              {isReserved ? (
                <div className="w-[42px] h-[42px] rounded-full bg-green flex items-center justify-center group-hover:hidden">
                  <CheckSvg size={22} />
                </div>
              ) : (
                <div
                  className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-xs font-bold text-white group-hover:hidden ${
                    isTaken || dimmed ? 'opacity-25' : ''
                  }`}
                  style={{
                    backgroundColor:
                      isSelected && inFilter ? 'var(--color-navy)' : color,
                  }}
                >
                  {abbr}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
