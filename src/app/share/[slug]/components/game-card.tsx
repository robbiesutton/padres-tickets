'use client';

import type { Game } from '../types';
import {
  formatShortDate,
  getOpponentAbbr,
  getOpponentColor,
  formatTime,
} from '../utils';

const SHORT_NAMES: Record<string, string> = {
  'Los Angeles Dodgers': 'LA Dodgers',
  'Los Angeles Angels': 'LA Angels',
  'San Francisco Giants': 'SF Giants',
  'San Diego Padres': 'SD Padres',
  'New York Mets': 'NY Mets',
  'New York Yankees': 'NY Yankees',
  'Tampa Bay Rays': 'TB Rays',
  'St. Louis Cardinals': 'STL Cardinals',
  'Kansas City Royals': 'KC Royals',
  'Chicago White Sox': 'Chi White Sox',
  'Chicago Cubs': 'Chi Cubs',
};

function getShortName(opponent: string): string {
  return SHORT_NAMES[opponent] || opponent.split(' ').pop() || opponent;
}

interface Props {
  game: Game;
  isReservedByMe: boolean;
  isTakenByOthers: boolean;
  seatCount: number;
  teamColor?: string;
  onReserve: () => void;
  onRelease?: () => void;
  onMobileTap?: () => void;
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
  teamColor,
  onReserve,
  onRelease,
  onMobileTap,
}: Props) {
  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);

  const totalPrice =
    game.pricePerTicket !== null ? game.pricePerTicket * seatCount : null;

  let cardClass =
    'rounded-lg px-6 py-4 border border-solid flex items-center gap-2 md:gap-10';

  if (isReservedByMe) {
    cardClass += ' bg-white border-[#0f6f57] shadow-[0_2px_4px_rgba(0,0,0,0.08)] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)]';
  } else if (isTakenByOthers) {
    cardClass += ' bg-white border-[#dcd7d4] opacity-40 shadow-[0_2px_4px_rgba(0,0,0,0.08)] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)]';
  } else {
    cardClass += ' bg-white border-[#dcd7d4] shadow-[0_2px_4px_rgba(0,0,0,0.08)] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)]';
  }

  return (
    <div className={cardClass + ' md:cursor-default cursor-pointer'} onClick={() => { if (window.innerWidth < 768 && onMobileTap) onMobileTap(); }}>
      {/* Date + separator + badge + info */}
      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Date column */}
          <div className="text-center w-[30px] flex flex-col items-center gap-px">
            <div className="text-sm font-medium text-[#8e8985] uppercase">
              {dow}
            </div>
            <div className="text-base font-extrabold text-[#2c2a2b] leading-tight">
              {day}
            </div>
            <div className="text-sm font-medium text-[#8e8985]">{month}</div>
          </div>

          {/* Separator */}
          <div className="w-px h-[57px] bg-[#dcd7d4]" />

          {/* Team badge / check */}
          {isReservedByMe ? (
            <div className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <CheckSvg />
            </div>
          ) : (
            <div
              className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[9px] md:text-[13px] font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {abbr}
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-base font-bold text-[#2c2a2b]">
            <span className="md:hidden">vs {getShortName(game.opponent)}</span>
            <span className="hidden md:inline">vs {game.opponent}</span>
          </div>
          <div className="text-base md:text-sm font-medium text-[#8e8985]">
            {formatTime(game.time)} &bull; Petco Park
            <span className="hidden md:inline">
              {totalPrice !== null && (
                <> &bull; {seatCount} ticket{seatCount !== 1 ? 's' : ''} for ${totalPrice}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action button — hidden on mobile */}
      <div className="hidden md:block">
        {!isTakenByOthers && (
          isReservedByMe ? (
            <button
              className="shrink-0 h-10 px-4 rounded-lg bg-transparent text-black text-base font-medium border border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
              onClick={onRelease}
            >
              Release
            </button>
          ) : (
            <button
              className="shrink-0 h-10 px-4 rounded-lg text-white text-base font-medium border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: teamColor || '#2c2a2b' }}
              onClick={onReserve}
            >
              Claim
            </button>
          )
        )}
      </div>
    </div>
  );
}
