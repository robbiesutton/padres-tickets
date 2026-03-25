'use client';

export function CalendarLegend() {
  return (
    <div className="flex gap-4 md:gap-6 items-center justify-center mt-2 flex-wrap">
      <div className="flex items-center gap-1">
        <div className="w-[16px] h-[16px] md:w-[19px] md:h-[19px] rounded-full bg-[#ffc425] flex items-center justify-center text-[6px] md:text-[7px] font-bold text-[#1a1a1a]">
          SD
        </div>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">Available</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-[16px] h-[16px] md:w-[19px] md:h-[19px] rounded-full bg-[#0f6f57] flex items-center justify-center">
          <svg viewBox="0 0 16 16" width={9} height={9} fill="none" className="md:w-[11px] md:h-[11px]">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">Reserved</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-[16px] h-[16px] md:w-[19px] md:h-[19px] flex items-center justify-center">
          <span className="text-xs md:text-sm font-normal text-[#8e8985]">02</span>
        </div>
        <span className="text-xs md:text-sm font-normal text-[#8e8985]">No game</span>
      </div>
    </div>
  );
}
