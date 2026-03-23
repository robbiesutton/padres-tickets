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
  availableCount: number;
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
  availableCount,
  months,
}: Props) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
      <div className="flex bg-card border border-border rounded-lg overflow-hidden">
        <button
          className={`flex items-center justify-center w-9 h-8 border-none cursor-pointer transition-all ${
            viewMode === 'calendar'
              ? 'bg-background text-foreground'
              : 'bg-transparent text-muted-light'
          }`}
          onClick={() => onViewChange('calendar')}
          title="Calendar view"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.2" />
            <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className={`flex items-center justify-center w-9 h-8 border-none cursor-pointer transition-all ${
            viewMode === 'list'
              ? 'bg-background text-foreground'
              : 'bg-transparent text-muted-light'
          }`}
          onClick={() => onViewChange('list')}
          title="List view"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <line x1="1" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <select
        className="py-1.5 pl-2.5 pr-7 rounded-[7px] border border-border bg-card text-base text-foreground cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
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
        className="py-1.5 pl-2.5 pr-7 rounded-[7px] border border-border bg-card text-base text-foreground cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
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
      <div className="ml-auto text-base text-muted">
        <strong className="text-foreground font-semibold">{availableCount}</strong> available
      </div>
    </div>
  );
}
