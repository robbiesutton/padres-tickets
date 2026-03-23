'use client';

interface Props {
  message?: string;
}

export function SoldOutBar({
  message = 'All games in these months have been reserved by others. Use the arrows to check other months.',
}: Props) {
  return (
    <div className="mb-2.5 px-3.5 py-2.5 rounded-[10px] bg-warning-bg border border-warning-border text-xs text-warning-text flex items-center gap-2">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 5v3M8 10.5v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
