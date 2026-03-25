'use client';

import type { ViewMode } from '../types';

interface Props {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  opponents: string[];
  opponentFilter: string;
  onOpponentFilterChange: (value: string) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  months: { value: string; label: string }[];
}

export function Toolbar({
  viewMode,
  onViewChange,
  opponents,
  opponentFilter,
  onOpponentFilterChange,
  monthFilter,
  onMonthFilterChange,
  months,
}: Props) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 mb-4 md:mb-6 flex-wrap">
      <div className="flex items-start w-[87px] h-10 bg-white border border-[#f5f4f2] rounded-[9px] overflow-hidden p-px">
        <button
          className={`flex items-center justify-center w-[42px] h-[38px] border-none cursor-pointer transition-all rounded-none ${
            viewMode === 'calendar'
              ? 'bg-[#f8f7f4]'
              : 'bg-white'
          }`}
          onClick={() => onViewChange('calendar')}
          title="Calendar view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="#2c2a2b" strokeWidth="1.2" />
            <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="#2c2a2b" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="4" stroke="#2c2a2b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="11" y1="1" x2="11" y2="4" stroke="#2c2a2b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className={`flex items-center justify-center flex-1 h-[38px] border-none cursor-pointer transition-all rounded-none ${
            viewMode === 'list'
              ? 'bg-[#f8f7f4]'
              : 'bg-white'
          }`}
          onClick={() => onViewChange('list')}
          title="List view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="1" y1="4" x2="15" y2="4" stroke="#2c2a2b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="8" x2="15" y2="8" stroke="#2c2a2b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="12" x2="15" y2="12" stroke="#2c2a2b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <select
          className="flex-1 md:flex-none h-10 px-4 pr-10 rounded-lg border-[1.5px] border-black bg-transparent hover:bg-[#f5f4f2] hover:border-[#dcd7d4] transition-colors text-base font-medium text-black cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%232c2a2b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
          value={opponentFilter}
          onChange={(e) => onOpponentFilterChange(e.target.value)}
        >
          <option value="">All opponents</option>
          {opponents.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          className="flex-1 md:flex-none h-10 px-4 pr-10 rounded-lg border-[1.5px] border-black bg-transparent hover:bg-[#f5f4f2] hover:border-[#dcd7d4] transition-colors text-base font-medium text-black cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%232c2a2b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
          value={monthFilter}
          onChange={(e) => onMonthFilterChange(e.target.value)}
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
