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
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3 mb-3 md:mb-4 flex-wrap">
      <div className="relative flex w-full md:w-auto h-11 bg-[#f5f4f2] rounded-lg p-[3px] gap-[3px]">
        <button
          className={`relative z-10 flex-1 md:flex-none md:w-[38px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all text-sm font-medium ${
            viewMode === 'calendar' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
          }`}
          onClick={() => onViewChange('calendar')}
        >
          <span className="md:hidden">Calendar</span>
          <svg className="hidden md:block" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className={`relative z-10 flex-1 md:flex-none md:w-[38px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all text-sm font-medium ${
            viewMode === 'list' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
          }`}
          onClick={() => onViewChange('list')}
        >
          <span className="md:hidden">List</span>
          <svg className="hidden md:block" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 w-full md:w-auto min-w-0">
        <select
          className="flex-1 md:flex-none min-w-0 h-11 px-4 pr-9 md:px-5 md:pr-10 rounded-lg border border-[#eceae5] bg-white hover:bg-[#f5f4f2] transition-colors text-sm md:text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] md:bg-[right_8px_center]"
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
          className="flex-1 md:flex-none min-w-0 h-11 px-4 pr-9 md:px-5 md:pr-10 rounded-lg border border-[#eceae5] bg-white hover:bg-[#f5f4f2] transition-colors text-sm md:text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] md:bg-[right_8px_center]"
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
