'use client';

import { getTeamColors, isColorDark } from '../team-colors';

interface Props {
  team: string;
}

export function ShareFooter({ team }: Props) {
  const { primary } = getTeamColors(team);
  const isDark = isColorDark(primary);

  return (
    <>
      {/* Desktop footer */}
      <footer className="hidden md:flex px-7 py-4 justify-between items-center bg-card mt-0">
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

      {/* Mobile footer — matches global nav color */}
      <footer
        className="md:hidden py-6 flex flex-col items-center gap-3"
        style={{ backgroundColor: primary }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isDark ? '/benchbuddy-mark-white.svg' : '/benchbuddy-logo.svg'}
          alt="BenchBuddy"
          className="w-6 h-6 opacity-50"
        />
        <p className={`text-[10px] text-center px-6 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
          Not affiliated with the {team}. &copy; {new Date().getFullYear()} BenchBuddy
        </p>
      </footer>
    </>
  );
}
