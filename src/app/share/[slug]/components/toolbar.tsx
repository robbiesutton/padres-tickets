'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
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
  teamPrimary?: string;
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
  teamPrimary,
}: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasActiveFilters = !!(opponentFilter || monthFilter);

  const desktopSelectClass =
    "flex-1 md:flex-none min-w-0 h-11 px-5 pr-10 rounded-lg border border-[#eceae5] bg-white hover:bg-[#f5f4f2] transition-colors text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]";

  const sheetSelectClass =
    "w-full h-12 px-4 pr-10 rounded-lg border border-[#eceae5] bg-white text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]";

  return (
    <>
      {/* ── Mobile: View toggle + Filters + Clear all ── */}
      <div className="md:hidden flex items-center gap-2 mb-4">
        <div className="relative flex h-11 bg-[#f5f4f2] rounded-lg p-[3px] gap-[3px]">
          <button
            className={`relative z-10 w-[44px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all ${
              viewMode === 'calendar' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
            }`}
            onClick={() => onViewChange('calendar')}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.2" />
              <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={`relative z-10 w-[44px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all ${
              viewMode === 'list' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
            }`}
            onClick={() => onViewChange('list')}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="h-11 px-4 rounded-lg border border-[#eceae5] bg-white text-sm font-medium text-[#2c2a2b] flex items-center gap-2 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
          </svg>
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => { onOpponentFilterChange(''); onMonthFilterChange(''); }}
            className="text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer ml-auto"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Mobile: Filter bottom sheet ── */}
      {mobileFiltersOpen && createPortal(
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#dcd7d4]" />
            </div>
            <div className="px-4 pt-2 pb-8">
              <h3 className="text-lg font-semibold text-[#2c2a2b] mb-6">Filters</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8e8985] uppercase tracking-wider mb-2 pl-1">Opponent</label>
                  <select className={sheetSelectClass} value={opponentFilter} onChange={(e) => onOpponentFilterChange(e.target.value)}>
                    <option value="">All opponents</option>
                    {opponents.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8e8985] uppercase tracking-wider mb-2 pl-1">Month</label>
                  <select className={sheetSelectClass} value={monthFilter} onChange={(e) => onMonthFilterChange(e.target.value)}>
                    <option value="">All months</option>
                    {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-12 mt-6 rounded-lg text-base font-semibold text-white cursor-pointer border-none transition-opacity hover:opacity-90"
                style={{ backgroundColor: teamPrimary || '#2c2a2b' }}
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => { onOpponentFilterChange(''); onMonthFilterChange(''); setMobileFiltersOpen(false); }}
                  className="w-full mt-3 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer py-2"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Desktop: Inline (unchanged) ── */}
      <div className="hidden md:flex md:items-center md:gap-4 mb-4 flex-wrap">
        <div className="relative flex w-auto h-11 bg-[#f5f4f2] rounded-lg p-[3px] gap-[3px]">
          <button
            className={`relative z-10 w-[38px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all text-sm font-medium ${
              viewMode === 'calendar' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
            }`}
            onClick={() => onViewChange('calendar')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.2" />
              <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={`relative z-10 w-[38px] h-[38px] flex items-center justify-center rounded-md border-none cursor-pointer transition-all text-sm font-medium ${
              viewMode === 'list' ? 'bg-white shadow-sm text-[#2c2a2b]' : 'bg-transparent text-[#8e8985]'
            }`}
            onClick={() => onViewChange('list')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex gap-4 w-auto min-w-0">
          <select className={desktopSelectClass} value={opponentFilter} onChange={(e) => onOpponentFilterChange(e.target.value)}>
            <option value="">All opponents</option>
            {opponents.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className={desktopSelectClass} value={monthFilter} onChange={(e) => onMonthFilterChange(e.target.value)}>
            <option value="">All months</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
