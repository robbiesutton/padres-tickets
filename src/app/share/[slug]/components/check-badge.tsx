'use client';

type Variant = 'pill' | 'legend';

export function CheckBadge({ variant }: { variant: Variant }) {
  if (variant === 'legend') {
    return (
      <div className="absolute right-[-2px] bottom-[-2px] w-[12px] h-[12px] rounded-full bg-[#047857] flex items-center justify-center">
        <svg viewBox="0 0 12 12" width={7} height={7} fill="none">
          <path
            d="M2.5 6.2L4.8 8.5L9.5 3.8"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute right-[-3px] bottom-[-3px] w-[14px] h-[14px] md:w-[18px] md:h-[18px] rounded-full bg-[#047857] flex items-center justify-center">
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className="w-[8px] h-[8px] md:w-[10px] md:h-[10px]"
      >
        <path
          d="M2.5 6.2L4.8 8.5L9.5 3.8"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
