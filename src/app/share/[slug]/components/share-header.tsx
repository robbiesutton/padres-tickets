'use client';

import type { ActiveTab } from '../types';

interface Props {
  holderName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reservedCount: number;
}

export function ShareHeader({ holderName, activeTab, onTabChange, reservedCount }: Props) {
  return (
    <header className="bg-card border-b border-border px-7 h-[54px] flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-[7px] bg-foreground flex items-center justify-center text-[10px] font-bold text-white cursor-pointer"
          onClick={() => onTabChange('available')}
        >
          BB
        </div>
        <span
          className="text-[15px] font-semibold text-foreground cursor-pointer"
          onClick={() => onTabChange('available')}
        >
          BenchBuddy
        </span>
        <span className="text-muted-light text-base">/</span>
        <span className="text-muted text-base">{holderName}</span>
      </div>
      <div className="flex gap-0.5">
        <button
          className={`px-3.5 py-[7px] rounded-[7px] text-base font-medium transition-all border-none bg-none cursor-pointer ${
            activeTab === 'available'
              ? 'bg-background text-foreground'
              : 'text-muted hover:bg-background hover:text-foreground'
          }`}
          onClick={() => onTabChange('available')}
        >
          Available games
        </button>
        <button
          className={`px-3.5 py-[7px] rounded-[7px] text-base font-medium transition-all border-none bg-none cursor-pointer flex items-center gap-[5px] ${
            activeTab === 'my-games'
              ? 'bg-green-light text-green-dark'
              : 'text-muted hover:bg-background hover:text-foreground'
          }`}
          onClick={() => onTabChange('my-games')}
        >
          My games
          {reservedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-green text-white text-[10px] font-semibold px-[5px]">
              {reservedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
