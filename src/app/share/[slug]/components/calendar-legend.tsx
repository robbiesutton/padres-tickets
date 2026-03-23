'use client';

export function CalendarLegend() {
  return (
    <div className="flex gap-3.5 justify-center mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-1 text-sm text-muted">
        <div className="w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center text-[7px] font-bold text-white">
          SD
        </div>
        Available
      </div>
      <div className="flex items-center gap-1 text-sm text-muted">
        <div className="w-[18px] h-[18px] rounded-full bg-green flex items-center justify-center">
          <svg viewBox="0 0 16 16" width={10} height={10} fill="none">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        Your reservation
      </div>
      <div className="flex items-center gap-1 text-sm text-muted">
        <span className="text-muted-light text-xs">14</span>
        &nbsp;No game
      </div>
    </div>
  );
}
