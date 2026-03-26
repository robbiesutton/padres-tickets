/**
 * Team Color Theming System
 *
 * Every team has a primary (nav bg) and accent (details/highlights).
 * Keyed by full team name for easy lookup from PackageInfo.team.
 */

export const TEAM_COLORS: Record<string, { primary: string; accent: string }> = {
  // AL East
  'New York Yankees':       { primary: '#003087', accent: '#C4CED4' },
  'Boston Red Sox':         { primary: '#0C2340', accent: '#BD3039' },
  'Baltimore Orioles':      { primary: '#27251F', accent: '#DF4601' },
  'Tampa Bay Rays':         { primary: '#092C5C', accent: '#8FBCE6' },
  'Toronto Blue Jays':      { primary: '#134A8E', accent: '#E8291C' },

  // AL Central
  'Minnesota Twins':        { primary: '#002B5C', accent: '#D31145' },
  'Cleveland Guardians':    { primary: '#00385D', accent: '#E50022' },
  'Detroit Tigers':         { primary: '#0C2340', accent: '#FA4616' },
  'Kansas City Royals':     { primary: '#004687', accent: '#BD9B60' },
  'Chicago White Sox':      { primary: '#27251F', accent: '#C4CED4' },

  // AL West
  'Houston Astros':         { primary: '#002D62', accent: '#EB6E1F' },
  'Oakland Athletics':      { primary: '#003831', accent: '#EFB21E' },
  'Texas Rangers':          { primary: '#003278', accent: '#C0111F' },
  'Seattle Mariners':       { primary: '#0C2C56', accent: '#005C5C' },
  'Los Angeles Angels':     { primary: '#003263', accent: '#BA0021' },

  // NL East
  'Atlanta Braves':         { primary: '#13274F', accent: '#CE1141' },
  'New York Mets':          { primary: '#002D72', accent: '#FF5910' },
  'Philadelphia Phillies':  { primary: '#002D72', accent: '#E81828' },
  'Miami Marlins':          { primary: '#000000', accent: '#00A3E0' },
  'Washington Nationals':   { primary: '#14225A', accent: '#AB0003' },

  // NL Central
  'St. Louis Cardinals':    { primary: '#0C2340', accent: '#C41E3A' },
  'Chicago Cubs':           { primary: '#0E3386', accent: '#CC3433' },
  'Milwaukee Brewers':      { primary: '#12284B', accent: '#FFC52F' },
  'Cincinnati Reds':        { primary: '#15110D', accent: '#C6011F' },
  'Pittsburgh Pirates':     { primary: '#27251F', accent: '#FDB827' },

  // NL West
  'Los Angeles Dodgers':    { primary: '#005A9C', accent: '#EF3E42' },
  'San Francisco Giants':   { primary: '#27251F', accent: '#FD5A1E' },
  'San Diego Padres':       { primary: '#2F241D', accent: '#FFC425' },
  'Colorado Rockies':       { primary: '#33006F', accent: '#C4CED4' },
  'Arizona Diamondbacks':   { primary: '#A71930', accent: '#E3D4AD' },
};

export function getTeamColors(teamName: string) {
  return TEAM_COLORS[teamName] || { primary: '#2c2a2b', accent: '#D4A843' };
}

export function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L <= 0.4;
}
