import type { Game } from './types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Maps opponent abbreviation to team color
export const OPPONENT_COLORS: Record<string, string> = {
  LAD: '#005A9C',
  SF: '#FD5A1E',
  AZ: '#A71930',
  COL: '#33006F',
  SEA: '#0C7B8B',
  MIL: '#12284B',
  CHC: '#0E3386',
  STL: '#C41E3A',
  HOU: '#EB6E1F',
  ATL: '#CE1141',
  NYM: '#002D72',
  PHI: '#E81828',
  CIN: '#C6011F',
  NYY: '#003087',
  BOS: '#BD3039',
  TB: '#092C5C',
  BAL: '#DF4601',
  TOR: '#134A8E',
  DET: '#0C2C56',
  MIN: '#002B5C',
  CWS: '#27251F',
  KC: '#004687',
  CLE: '#00385D',
  TEX: '#003278',
  OAK: '#003831',
  LAA: '#BA0021',
  WSH: '#AB0003',
  PIT: '#FDB827',
  SD: '#D4A843',
  MIA: '#00A3E0',
};

// Map full team names to abbreviations
export const TEAM_ABBREVIATIONS: Record<string, string> = {
  'Los Angeles Dodgers': 'LAD',
  'San Francisco Giants': 'SF',
  'Arizona Diamondbacks': 'AZ',
  'Colorado Rockies': 'COL',
  'Seattle Mariners': 'SEA',
  'Milwaukee Brewers': 'MIL',
  'Chicago Cubs': 'CHC',
  'St. Louis Cardinals': 'STL',
  'Houston Astros': 'HOU',
  'Atlanta Braves': 'ATL',
  'New York Mets': 'NYM',
  'Philadelphia Phillies': 'PHI',
  'Cincinnati Reds': 'CIN',
  'New York Yankees': 'NYY',
  'Boston Red Sox': 'BOS',
  'Tampa Bay Rays': 'TB',
  'Baltimore Orioles': 'BAL',
  'Toronto Blue Jays': 'TOR',
  'Detroit Tigers': 'DET',
  'Minnesota Twins': 'MIN',
  'Chicago White Sox': 'CWS',
  'Kansas City Royals': 'KC',
  'Cleveland Guardians': 'CLE',
  'Texas Rangers': 'TEX',
  'Oakland Athletics': 'OAK',
  'Los Angeles Angels': 'LAA',
  'Washington Nationals': 'WSH',
  'Pittsburgh Pirates': 'PIT',
  'San Diego Padres': 'SD',
  'Miami Marlins': 'MIA',
};

export function getOpponentAbbr(opponent: string): string {
  return TEAM_ABBREVIATIONS[opponent] || opponent.slice(0, 3).toUpperCase();
}

export function getOpponentColor(opponent: string): string {
  const abbr = getOpponentAbbr(opponent);
  return OPPONENT_COLORS[abbr] || '#8C8984';
}

export function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): {
  dow: string;
  day: number;
  month: string;
  monthIndex: number;
} {
  const d = new Date(dateStr);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: SHORT_MONTH_NAMES[d.getMonth()],
    monthIndex: d.getMonth(),
  };
}

export function formatPrice(pricePerTicket: number | null, seatCount: number): string {
  if (pricePerTicket === null) return '';
  if (pricePerTicket === 0) return 'Free';
  return `$${pricePerTicket}`;
}

export function formatTotalPrice(pricePerTicket: number | null, seatCount: number): string {
  if (pricePerTicket === null || pricePerTicket === 0) return '$0';
  return `$${pricePerTicket * seatCount}`;
}

export function groupGamesByMonth(games: Game[]): Map<string, Game[]> {
  const groups = new Map<string, Game[]>();
  for (const game of games) {
    const d = new Date(game.date);
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const list = groups.get(key) || [];
    list.push(game);
    groups.set(key, list);
  }
  return groups;
}

export function isGameAvailable(game: Game): boolean {
  return game.status === 'AVAILABLE';
}

export function isGameClaimed(game: Game): boolean {
  return game.status === 'CLAIMED' || game.status === 'TRANSFERRED' || game.status === 'COMPLETE';
}

export function isGameUnavailable(game: Game): boolean {
  return (
    game.status === 'GOING_MYSELF' ||
    game.status === 'SOLD_ELSEWHERE' ||
    game.status === 'UNAVAILABLE'
  );
}

export function getGameMonthYear(game: Game): { month: number; year: number } {
  const d = new Date(game.date);
  return { month: d.getMonth(), year: d.getFullYear() };
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  // If already in 12h format (e.g. "5:40 PM"), return as-is
  if (/[APap][Mm]/.test(time)) return time;
  // Convert 24h "18:40" to "6:40 PM"
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
