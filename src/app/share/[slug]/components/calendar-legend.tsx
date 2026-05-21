'use client';

import type { Game } from '../types';
import { getOpponentAbbr, getOpponentColor } from '../utils';
import { CheckBadge } from './check-badge';

interface Props {
  games: Game[];
}

function pickExampleOpponent(games: Game[]): { abbr: string; color: string } {
  const abbrs = new Set<string>();
  for (const g of games) abbrs.add(getOpponentAbbr(g.opponent));
  const pick = abbrs.has('LAD')
    ? 'LAD'
    : [...abbrs].sort()[0] ?? 'LAD';
  return { abbr: pick, color: getOpponentColor(pick) };
}

export function CalendarLegend({ games }: Props) {
  const { abbr, color } = pickExampleOpponent(games);

  return (
    <div className="flex gap-4 md:gap-6 items-center justify-center mt-3 md:mt-4 flex-wrap">
      <div className="flex items-center gap-[6px]">
        <div
          className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {abbr}
        </div>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">Available</span>
      </div>
      <div className="flex items-center gap-[6px]">
        <div className="relative w-[24px] h-[24px]">
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white opacity-[0.16]"
            style={{ backgroundColor: color }}
          >
            {abbr}
          </div>
          <CheckBadge variant="legend" />
        </div>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">Claimed</span>
      </div>
      <div className="flex items-center gap-[6px]">
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">02</span>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">No game</span>
      </div>
    </div>
  );
}
