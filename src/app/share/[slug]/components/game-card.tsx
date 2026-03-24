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

function CheckSvg() {
  return (
    <svg viewBox="0 0 16 16" width={24} height={24} fill="none">
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

  const totalPrice =
    game.pricePerTicket !== null ? game.pricePerTicket * seatCount : null;

  let cardClass =
    'rounded-lg px-6 py-4 border border-solid cursor-pointer flex items-center gap-4 transition-all';

  if (isReservedByMe) {
    cardClass +=
      ' bg-[rgba(15,111,87,0.15)] border-[#dcd7d4] hover:border-[#0f6f57]';
  } else if (isSelected) {
    cardClass += ' bg-white border-[#005ca1]';
  } else if (isTakenByOthers) {
    cardClass += ' bg-white border-[#dcd7d4] opacity-40 !cursor-default';
  } else {
    cardClass += ' bg-white border-[#dcd7d4] hover:border-[#005ca1]';
  }

  return (
    <div
      className={cardClass}
      onClick={clickable ? onClick : undefined}
    >
      {/* Date column */}
      <div className="text-center min-w-[30px] flex flex-col items-center gap-px">
        <div className="text-sm font-medium text-[#8e8985] uppercase">
          {dow}
        </div>
        <div className="text-base font-bold text-[#2c2a2b] leading-tight">
          {day}
        </div>
        <div className="text-sm font-medium text-[#8e8985]">{month}</div>
      </div>

      {/* Separator */}
      <div className="w-px h-[57px] bg-[#dcd7d4] shrink-0" />

      {/* Team badge */}
      {isReservedByMe ? (
        <div className="w-[42px] h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
          <CheckSvg />
        </div>
      ) : (
        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {abbr}
        </div>
      )}

      {/* Game info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="text-base font-bold text-[#2c2a2b]">
          vs {game.opponent}
        </div>
        <div className="text-sm font-medium text-[#8e8985] flex items-center gap-1.5 flex-wrap">
          {formatTime(game.time)} &middot; Petco Park
          {totalPrice !== null && (
            <>
              {' '}&middot; {seatCount} ticket{seatCount !== 1 ? 's' : ''} for ${totalPrice}
            </>
          )}
          {!isReservedByMe && !isTakenByOthers && game.notes && (
            <span className="text-sm font-semibold px-1.5 py-0.5 rounded-[10px] bg-[rgba(212,168,67,0.09)] text-accent border border-[rgba(212,168,67,0.19)]">
              {game.notes}
            </span>
          )}
        </div>
        {isReservedByMe && (
          <div>
            <span className="text-sm font-semibold text-green bg-green-light px-2 py-0.5 rounded-[10px]">
              Reserved
            </span>
          </div>
        )}
        {isTakenByOthers && (
          <div>
            <span className="text-sm text-[#8e8985]">Reserved by others</span>
          </div>
        )}
      </div>

      {/* Reserve button */}
      {!isReservedByMe && !isTakenByOthers && (
        <button
          className="shrink-0 h-10 px-4 rounded-lg text-base font-medium text-black cursor-pointer border-none bg-[#f5f4f2] hover:bg-transparent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Reserve
        </button>
      )}
    </div>
  );
}
