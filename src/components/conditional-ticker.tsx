'use client';

import { usePathname } from 'next/navigation';
import { ScoreTicker } from './score-ticker';

export function ConditionalTicker() {
  const pathname = usePathname();
  if (pathname === '/' || pathname.startsWith('/share/') || pathname.startsWith('/dashboard') || pathname.startsWith('/packages') || pathname.startsWith('/signup') || pathname.startsWith('/login')) return null;
  return (
    <div className="hidden md:block">
      <ScoreTicker />
    </div>
  );
}
