'use client';

import { useState, useEffect } from 'react';
import { isColorDark } from '@/lib/team-colors';

interface MLBGame {
  homeTeam: string;
  homeAbbr: string;
  homeScore: number | null;
  awayTeam: string;
  awayAbbr: string;
  awayScore: number | null;
  status: string;
  gameDate: string;
}

interface ScoreData {
  games: MLBGame[];
  featured: MLBGame | null;
}

const TEAM_COLORS: Record<string, string> = {
  LAD: '#005A9C', SF: '#FD5A1E', AZ: '#A71930', COL: '#33006F',
  SEA: '#0C7B8B', MIL: '#12284B', CHC: '#0E3386', STL: '#C41E3A',
  HOU: '#EB6E1F', ATL: '#CE1141', NYM: '#002D72', PHI: '#E81828',
  CIN: '#C6011F', NYY: '#003087', BOS: '#BD3039', TB: '#092C5C',
  BAL: '#DF4601', TOR: '#134A8E', DET: '#0C2C56', MIN: '#002B5C',
  CWS: '#27251F', KC: '#004687', CLE: '#00385D', TEX: '#003278',
  OAK: '#003831', LAA: '#BA0021', WSH: '#AB0003', PIT: '#FDB827',
  SD: '#FFC425', MIA: '#00A3E0',
};

function getColor(abbr: string): string {
  return TEAM_COLORS[abbr] || '#555';
}

export function ScoreTicker({ bgColor }: { bgColor?: string } = {}) {
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const res = await fetch(`/api/scores?date=${localDate}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent fail
      }
    }
    fetchScores();
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data || data.games.length === 0) {
    // Show placeholder bar even with no data
    return (
      <div
        className={`h-[128px] flex items-center justify-center ${bgColor ? '' : 'bg-navy'}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <span className="text-xs text-white/30">No games today</span>
      </div>
    );
  }

  const { featured, games } = data;
  const scrollGames = games.filter((g) => g !== featured);
  // Duplicate for seamless loop
  const allScrollGames = [...scrollGames, ...scrollGames];

  return (
    <div
      className={`flex items-stretch overflow-hidden h-[128px] relative p-4 ${bgColor ? '' : 'bg-navy'}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {/* Featured game */}
      {featured && (
        <div className="flex items-center gap-4 px-5 bg-white/[0.06] border border-white/[0.08] rounded-[10px] shrink-0 z-[2]">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: getColor(featured.awayAbbr) }}
              >
                {featured.awayAbbr}
              </div>
              <span className={`text-[9px] ${bgColor && isColorDark(bgColor) ? 'text-white/60' : 'text-white/35'}`}>vs</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: getColor(featured.homeAbbr) }}
              >
                {featured.homeAbbr}
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5 ml-1">
              <span
                className={`text-base font-semibold ${
                  featured.awayScore !== null &&
                  featured.homeScore !== null &&
                  featured.awayScore > featured.homeScore
                    ? 'text-accent'
                    : 'text-white/50'
                }`}
              >
                {featured.awayScore ?? '-'}
              </span>
              <div />
              <span
                className={`text-base font-semibold ${
                  featured.homeScore !== null &&
                  featured.awayScore !== null &&
                  featured.homeScore > featured.awayScore
                    ? 'text-accent'
                    : 'text-white/50'
                }`}
              >
                {featured.homeScore ?? '-'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-semibold text-white/85">
              {featured.status}
            </div>
            <div className="text-[11px] text-white/50">
              {(() => {
                const d = new Date(featured.gameDate);
                if (isNaN(d.getTime())) return featured.gameDate;
                const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const mon = d.toLocaleDateString('en-US', { month: 'short' });
                const day = d.getDate();
                return `${dow}, ${mon} ${day}`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden flex items-center relative">
        <div
          className={`absolute left-0 top-0 bottom-0 w-10 z-[1] ${bgColor ? '' : 'bg-gradient-to-r from-navy to-transparent'}`}
          style={bgColor ? { background: `linear-gradient(to right, ${bgColor}, transparent)` } : undefined}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-10 z-[1] ${bgColor ? '' : 'bg-gradient-to-l from-navy to-transparent'}`}
          style={bgColor ? { background: `linear-gradient(to left, ${bgColor}, transparent)` } : undefined}
        />
        <div
          className="flex gap-3 whitespace-nowrap"
          style={{
            animation: `tickerScroll ${Math.max(20, scrollGames.length * 5)}s linear infinite`,
          }}
        >
          {allScrollGames.map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.06] rounded-md shrink-0"
            >
              <span className="text-[11px] font-semibold text-white/70">
                {g.awayAbbr}
              </span>
              <span className="text-[13px] font-semibold text-white/90">
                {g.awayScore ?? '-'}
              </span>
              <span className="text-[11px] text-white/25">-</span>
              <span className="text-[11px] font-semibold text-white/70">
                {g.homeAbbr}
              </span>
              <span className="text-[13px] font-semibold text-white/90">
                {g.homeScore ?? '-'}
              </span>
              <span className="text-[10px] text-white/35 ml-1">
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
