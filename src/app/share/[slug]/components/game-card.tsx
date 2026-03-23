'use client';

import type { Game } from '../types';
import {
  formatShortDate,
  getOpponentAbbr,
  getOpponentColor,
  formatTime,
} from '../utils';

interface Props {
  game: Game;
  isSelected: boolean;
  isReservedByMe: boolean;
  isTakenByOthers: boolean;
  seatCount: number;
  onClick: () => void;
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

export function GameCard({
  game,
  isSelected,
  isReservedByMe,
  isTakenByOthers,
  seatCount,
  onClick,
}: Props) {
  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const clickable = !isTakenByOthers;

  let cardClass =
    'bg-card rounded-[10px] p-6 border border-border cursor-pointer flex items-center gap-3 transition-all';
  if (isSelected && !isReservedByMe) {
    cardClass += ' !border-navy bg-[rgba(27,42,74,0.015)]';
  } else if (isReservedByMe) {
    cardClass += ' !border-green-border bg-[rgba(15,110,86,0.02)] hover:!border-green';
  } else if (isTakenByOthers) {
    cardClass += ' opacity-40 !cursor-default';
  } else {
    cardClass += ' hover:!border-accent';
  }

  return (
    <div
      className={cardClass}
      onClick={clickable ? onClick : undefined}
    >
      {/* Date column */}
      <div className="text-center min-w-[34px]">
        <div className="text-sm text-muted uppercase tracking-wider">{dow}</div>
        <div className="text-lg font-semibold text-foreground leading-tight">{day}</div>
        <div className="text-sm text-muted">{month}</div>
      </div>

      {/* Separator */}
      <div className="w-px h-[42px] bg-border shrink-0" />

      {/* Team badge */}
      {isReservedByMe ? (
        <div className="w-[42px] h-[42px] rounded-full bg-green flex items-center justify-center shrink-0">
          <CheckSvg size={22} />
        </div>
      ) : (
        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {abbr}
        </div>
      )}

      {/* Game info */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-foreground">vs {game.opponent}</div>
        <div className="text-sm text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
          {formatTime(game.time)} &middot; Petco Park
          {!isReservedByMe && !isTakenByOthers && game.notes && (
            <span className="text-sm font-semibold px-1.5 py-0.5 rounded-[10px] bg-[rgba(212,168,67,0.09)] text-accent border border-[rgba(212,168,67,0.19)]">
              {game.notes}
            </span>
          )}
        </div>
        {isReservedByMe && (
          <div className="mt-[3px]">
            <span className="text-sm font-semibold text-green bg-green-light px-2 py-0.5 rounded-[10px]">
              Reserved
            </span>
          </div>
        )}
        {isTakenByOthers && (
          <div className="mt-[3px]">
            <span className="text-sm text-muted">Reserved by others</span>
          </div>
        )}
      </div>

      {/* Price */}
      {!isReservedByMe && !isTakenByOthers && game.pricePerTicket !== null && (
        <div className="text-right shrink-0">
          <div className="text-sm text-muted uppercase">per seat</div>
          <div className="text-base font-semibold text-foreground">${game.pricePerTicket}</div>
        </div>
      )}

      {/* Arrow */}
      {clickable && (
        <svg
          className={`shrink-0 opacity-20 transition-transform duration-200 ${isSelected ? 'rotate-90 opacity-40' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="#1A1A1A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
