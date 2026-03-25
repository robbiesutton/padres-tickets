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
  isReservedByMe: boolean;
  isTakenByOthers: boolean;
  seatCount: number;
  onReserve: () => void;
  onRelease?: () => void;
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
  isReservedByMe,
  isTakenByOthers,
  seatCount,
  onReserve,
  onRelease,
}: Props) {
  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);

  const totalPrice =
    game.pricePerTicket !== null ? game.pricePerTicket * seatCount : null;

  let cardClass =
    'rounded-lg px-3 py-3 md:px-6 md:py-4 border border-solid flex items-center gap-3 md:gap-10';

  if (isReservedByMe) {
    cardClass += ' bg-[rgba(15,111,87,0.15)] border-[#0f6f57]';
  } else if (isTakenByOthers) {
    cardClass += ' bg-white border-[#f5f4f2] opacity-40';
  } else {
    cardClass += ' bg-white border-[#f5f4f2]';
  }

  return (
    <div className={cardClass}>
      {/* Date + separator + badge + info */}
      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Date column */}
          <div className="text-center w-[30px] flex flex-col items-center gap-px">
            <div className="text-sm font-medium text-[#8e8985] uppercase">
              {dow}
            </div>
            <div className="text-base font-bold text-[#2c2a2b] leading-tight">
              {day}
            </div>
            <div className="text-sm font-medium text-[#8e8985]">{month}</div>
          </div>

          {/* Separator */}
          <div className="w-px h-[40px] md:h-[57px] bg-[#dcd7d4]" />

          {/* Team badge / check */}
          {isReservedByMe ? (
            <div className="w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <CheckSvg />
            </div>
          ) : (
            <div
              className="w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {abbr}
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="text-sm md:text-base font-bold text-[#2c2a2b]">
            vs {game.opponent}
          </div>
          <div className="text-xs md:text-sm font-medium text-[#8e8985]">
            {formatTime(game.time)} &bull; Petco Park
            {totalPrice !== null && (
              <> &bull; {seatCount} ticket{seatCount !== 1 ? 's' : ''} for ${totalPrice}</>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      {!isTakenByOthers && (
        isReservedByMe ? (
          <button
            className="shrink-0 h-9 px-3 md:h-10 md:px-4 rounded-lg bg-transparent text-black text-sm md:text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={onRelease}
          >
            Release
          </button>
        ) : (
          <button
            className="shrink-0 h-9 px-3 md:h-10 md:px-4 rounded-lg bg-transparent text-black text-sm md:text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={onReserve}
          >
            Claim
          </button>
        )
      )}
    </div>
  );
}
