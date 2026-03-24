'use client';

interface Props {
  message?: string;
}

export function SoldOutBar({
  message = 'All games in these months have been reserved by others. Use the arrows to check other months.',
}: Props) {
  return (
    <div className="mb-4 px-4 py-2 rounded-lg bg-[rgba(255,194,11,0.16)] border border-[#ffb611] flex items-center gap-1">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
        <circle cx="9" cy="9" r="7.5" fill="#ffb611" />
        <path d="M9 6v3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="12.5" r="0.75" fill="#fff" />
      </svg>
      <span className="text-sm font-normal text-[#2c2a2b]">{message}</span>
    </div>
  );
}
