'use client';

import { usePathname } from 'next/navigation';
import { ScoreTicker } from './score-ticker';

export function ConditionalTicker() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <ScoreTicker />;
}
