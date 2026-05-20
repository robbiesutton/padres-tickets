/**
 * Team Color Theming System
 *
 * Nested registry keyed by league → team slug (lowercase abbreviation).
 * Each entry carries the team's abbreviation, full name, primary + accent
 * colors, and an optional badgeTextColor override for teams whose accent
 * is a saturated mid-tone that doesn't read well behind primary-colored text.
 *
 * Public API:
 *   getTeamColors(teamName) → { primary, accent, badgeTextColor? }
 *   isColorDark(hex)         → boolean
 *
 * Lookups are by full team name (e.g. "San Diego Padres"). The abbreviation
 * accessor (getOpponentAbbr) currently lives in src/lib/game-utils.ts; the
 * abbr field on each entry is the canonical source going forward but the
 * accessor itself is not yet routed through this registry (separate wave).
 */

export interface TeamEntry {
  abbr: string;
  name: string;
  primary: string;
  accent: string;
  badgeTextColor?: string;
}

export type LeagueKey = 'mlb' | 'nba' | 'nhl' | 'wnba' | 'mls' | 'nwsl' | 'ncaa';

export const TEAM_REGISTRY: Record<LeagueKey, Record<string, TeamEntry>> = {
  mlb: {
    sd:  { abbr: 'SD',  name: 'San Diego Padres',       primary: '#2F241D', accent: '#FFC72C' },
    lad: { abbr: 'LAD', name: 'Los Angeles Dodgers',    primary: '#005A9C', accent: '#FFFFFF' },
    sf:  { abbr: 'SF',  name: 'San Francisco Giants',   primary: '#000000', accent: '#FD5A1E', badgeTextColor: '#FFFFFF' },
    col: { abbr: 'COL', name: 'Colorado Rockies',       primary: '#33006F', accent: '#C4CED4' },
    az:  { abbr: 'AZ',  name: 'Arizona Diamondbacks',   primary: '#000000', accent: '#A71930', badgeTextColor: '#FFFFFF' },
    mil: { abbr: 'MIL', name: 'Milwaukee Brewers',      primary: '#0A2351', accent: '#FFC52F' },
    chc: { abbr: 'CHC', name: 'Chicago Cubs',           primary: '#0E3386', accent: '#CC3433', badgeTextColor: '#FFFFFF' },
    cin: { abbr: 'CIN', name: 'Cincinnati Reds',        primary: '#000000', accent: '#C6011F', badgeTextColor: '#FFFFFF' },
    pit: { abbr: 'PIT', name: 'Pittsburgh Pirates',     primary: '#000000', accent: '#FDB827' },
    stl: { abbr: 'STL', name: 'St. Louis Cardinals',    primary: '#0C2340', accent: '#C41E3A', badgeTextColor: '#FFFFFF' },
    atl: { abbr: 'ATL', name: 'Atlanta Braves',         primary: '#13274F', accent: '#CE1141', badgeTextColor: '#FFFFFF' },
    mia: { abbr: 'MIA', name: 'Miami Marlins',          primary: '#000000', accent: '#00A3E0', badgeTextColor: '#FFFFFF' },
    nym: { abbr: 'NYM', name: 'New York Mets',          primary: '#002D72', accent: '#FF5910', badgeTextColor: '#FFFFFF' },
    phi: { abbr: 'PHI', name: 'Philadelphia Phillies',  primary: '#002D72', accent: '#E81828', badgeTextColor: '#FFFFFF' },
    wsh: { abbr: 'WSH', name: 'Washington Nationals',   primary: '#14225B', accent: '#AB0003' },
    hou: { abbr: 'HOU', name: 'Houston Astros',         primary: '#002D62', accent: '#EB6E1F' },
    laa: { abbr: 'LAA', name: 'Los Angeles Angels',     primary: '#003263', accent: '#BA0021' },
    oak: { abbr: 'OAK', name: 'Oakland Athletics',      primary: '#003831', accent: '#EFB21E' },
    sea: { abbr: 'SEA', name: 'Seattle Mariners',       primary: '#0C2C56', accent: '#C4CED4' },
    tex: { abbr: 'TEX', name: 'Texas Rangers',          primary: '#003278', accent: '#C0111F', badgeTextColor: '#FFFFFF' },
    bal: { abbr: 'BAL', name: 'Baltimore Orioles',      primary: '#000000', accent: '#DF4601', badgeTextColor: '#FFFFFF' },
    bos: { abbr: 'BOS', name: 'Boston Red Sox',         primary: '#0C2340', accent: '#BD3039', badgeTextColor: '#FFFFFF' },
    nyy: { abbr: 'NYY', name: 'New York Yankees',       primary: '#003087', accent: '#FFFFFF' },
    tb:  { abbr: 'TB',  name: 'Tampa Bay Rays',         primary: '#092C5C', accent: '#8FBCE6' },
    tor: { abbr: 'TOR', name: 'Toronto Blue Jays',      primary: '#134A8E', accent: '#FFFFFF' },
    cws: { abbr: 'CWS', name: 'Chicago White Sox',      primary: '#000000', accent: '#C4CED4' },
    cle: { abbr: 'CLE', name: 'Cleveland Guardians',    primary: '#0C2340', accent: '#E31937', badgeTextColor: '#FFFFFF' },
    det: { abbr: 'DET', name: 'Detroit Tigers',         primary: '#0C2340', accent: '#FA4616', badgeTextColor: '#FFFFFF' },
    kc:  { abbr: 'KC',  name: 'Kansas City Royals',     primary: '#004687', accent: '#FFFFFF' },
    min: { abbr: 'MIN', name: 'Minnesota Twins',        primary: '#002B5C', accent: '#D31145', badgeTextColor: '#FFFFFF' },
  },
  nba: {},
  nhl: {},
  wnba: {},
  mls: {},
  nwsl: {},
  ncaa: {},
};

const FALLBACK_COLORS: { primary: string; accent: string } = {
  primary: '#2C2A2B',
  accent: '#810100',
};

// Flat name→entry index built once at module load for O(1) lookup.
const TEAM_BY_NAME: Record<string, TeamEntry> = {};
for (const league of Object.values(TEAM_REGISTRY)) {
  for (const entry of Object.values(league)) {
    TEAM_BY_NAME[entry.name] = entry;
  }
}

export function getTeamColors(teamName: string): {
  primary: string;
  accent: string;
  badgeTextColor?: string;
} {
  const entry = TEAM_BY_NAME[teamName];
  if (!entry) return { ...FALLBACK_COLORS };
  return {
    primary: entry.primary,
    accent: entry.accent,
    badgeTextColor: entry.badgeTextColor,
  };
}

// Backward-compat: the re-export at src/app/share/[slug]/team-colors.ts still
// names TEAM_COLORS, so we expose a name→{primary,accent} map for any future
// consumer that depends on it.
export const TEAM_COLORS: Record<string, { primary: string; accent: string }> = {};
for (const entry of Object.values(TEAM_BY_NAME)) {
  TEAM_COLORS[entry.name] = { primary: entry.primary, accent: entry.accent };
}

export function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L <= 0.4;
}
