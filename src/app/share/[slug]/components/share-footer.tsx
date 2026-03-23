'use client';

import type { PackageInfo } from '../types';

interface Props {
  team: string;
}

export function ShareFooter({ team }: Props) {
  return (
    <footer className="px-7 py-4 flex justify-between items-center bg-card mt-0">
      <div className="flex items-center gap-1.5">
        <div className="w-[18px] h-[18px] rounded bg-foreground flex items-center justify-center text-[7px] font-bold text-white">
          BB
        </div>
        <span className="text-xs font-semibold text-foreground">BenchBuddy</span>
        <span className="text-xs text-muted ml-1">
          Your seats. Your friends. Your price.
        </span>
      </div>
      <div className="text-xs text-muted-light">Not affiliated with the {team}</div>
    </footer>
  );
}
