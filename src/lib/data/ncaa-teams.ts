export interface NcaaTeam {
  id: number; // ESPN team ID
  name: string;
  abbreviation: string;
  city: string;
  venue: string;
  sport: 'NCAAB' | 'NCAAW' | 'NCAAF';
  conference: string;
  timezone: string;
}

export const NCAA_TEAMS: NcaaTeam[] = [
  {
    id: 21,
    name: 'San Diego State Aztecs',
    abbreviation: 'SDSU',
    city: 'San Diego',
    venue: 'Viejas Arena',
    sport: 'NCAAB',
    conference: 'Mountain West',
    timezone: 'America/Los_Angeles',
  },
];

export function getTeamById(id: number): NcaaTeam | undefined {
  return NCAA_TEAMS.find((t) => t.id === id);
}

export function getTeamByAbbreviation(abbr: string): NcaaTeam | undefined {
  return NCAA_TEAMS.find(
    (t) => t.abbreviation.toLowerCase() === abbr.toLowerCase()
  );
}

export function getTeamByName(name: string): NcaaTeam | undefined {
  return NCAA_TEAMS.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
