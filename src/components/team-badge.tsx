'use client';

import { getTeamColors } from '@/lib/team-colors';
import { getOpponentAbbr } from '@/lib/game-utils';

interface Props {
  team: string;
  className?: string;
  children?: React.ReactNode;
}

export function TeamBadge({ team, className, children }: Props) {
  const { primary, accent, badgeTextColor } = getTeamColors(team);
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className ?? ''}`}
      style={{ backgroundColor: accent, color: badgeTextColor ?? primary }}
    >
      {children ?? getOpponentAbbr(team)}
    </div>
  );
}
