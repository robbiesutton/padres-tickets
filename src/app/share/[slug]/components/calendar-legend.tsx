'use client';

export function CalendarLegend() {
  return (
    <div className="flex gap-[25px] items-center justify-center mt-2">
      <div className="flex items-center gap-1">
        <div className="w-[19px] h-[19px] rounded-full bg-[#ffc425] flex items-center justify-center text-[7px] font-bold text-[#1a1a1a]">
          SD
        </div>
        <span className="text-sm font-normal text-[#8e8985]">Available</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-[19px] h-[19px] rounded-full bg-[#0f6f57] flex items-center justify-center">
          <svg viewBox="0 0 16 16" width={11} height={11} fill="none">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-sm font-normal text-[#8e8985]">Your reservation</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-[19px] h-[19px] flex items-center justify-center">
          <span className="text-sm font-normal text-[#8e8985]">02</span>
        </div>
        <span className="text-sm font-normal text-[#8e8985]">No game</span>
      </div>
    </div>
  );
}
