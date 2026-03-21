import { getTeamById } from '@/lib/data/mlb-teams';
import { cacheGet, cacheSet } from '@/lib/cache';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export interface ScheduleGame {
  date: string; // ISO date string (e.g. "2026-04-03")
  time: string; // Local time (e.g. "18:10")
  gameDate: string; // Full ISO datetime
  opponent: string; // Team name
  opponentId: number;
  opponentAbbreviation: string;
  venue: string;
  dayNight: string;
  gameNumber: number;
  doubleHeader: string;
}

interface MlbApiGame {
  gameDate: string;
  officialDate: string;
  dayNight: string;
  gameNumber: number;
  doubleHeader: string;
  status: { detailedState: string };
  teams: {
    home: { team: { id: number; name: string } };
    away: { team: { id: number; name: string } };
  };
  venue: { name: string };
}

interface MlbApiDate {
  date: string;
  games: MlbApiGame[];
}

interface MlbApiResponse {
  dates: MlbApiDate[];
}

export async function getHomeSchedule(
  teamId: number,
  season: string
): Promise<ScheduleGame[]> {
  const team = getTeamById(teamId);
  if (!team) {
    throw new Error(`Unknown MLB team ID: ${teamId}`);
  }

  const cacheKey = `schedule:${teamId}:${season}`;
  const cached = cacheGet<ScheduleGame[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${MLB_API_BASE}/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&hydrate=team`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }

  const data: MlbApiResponse = await response.json();

  if (!data.dates || data.dates.length === 0) {
    return [];
  }

  const homeGames: ScheduleGame[] = [];

  for (const dateEntry of data.dates) {
    for (const game of dateEntry.games) {
      // Only include games where this team is the home team
      if (game.teams.home.team.id !== teamId) continue;

      // Skip postponed/cancelled games
      const state = game.status.detailedState;
      if (state === 'Cancelled' || state === 'Postponed') continue;

      const gameDateTime = new Date(game.gameDate);
      const time = gameDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/New_York', // MLB API returns ET
      });

      const opponent = game.teams.away.team;
      const opponentTeam = getTeamById(opponent.id);

      homeGames.push({
        date: game.officialDate,
        time,
        gameDate: game.gameDate,
        opponent: opponent.name,
        opponentId: opponent.id,
        opponentAbbreviation: opponentTeam?.abbreviation ?? '',
        venue: game.venue?.name ?? team.venue,
        dayNight: game.dayNight ?? 'night',
        gameNumber: game.gameNumber,
        doubleHeader: game.doubleHeader,
      });
    }
  }

  // Sort by date
  homeGames.sort(
    (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
  );

  cacheSet(cacheKey, homeGames, CACHE_TTL);

  return homeGames;
}
