import { cacheGet, cacheSet } from '@/lib/cache';
import { getTeamById } from '@/lib/data/ncaa-teams';
import type { ScheduleGame } from './schedule';

const ESPN_NCAAB_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface EspnCompetitor {
  homeAway: 'home' | 'away';
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
  };
  score?: string;
  winner?: boolean;
}

interface EspnCompetition {
  date: string;
  neutralSite: boolean;
  venue?: { fullName: string };
  competitors: EspnCompetitor[];
  status?: { type?: { completed?: boolean } };
}

interface EspnEvent {
  id: string;
  date: string;
  competitions: EspnCompetition[];
}

interface EspnScheduleResponse {
  events: EspnEvent[];
  team?: { id: string; abbreviation: string; displayName: string };
}

export async function getNcaabHomeSchedule(
  teamId: number,
  season: string
): Promise<ScheduleGame[]> {
  const team = getTeamById(teamId);
  if (!team) {
    throw new Error(`Unknown NCAA team ID: ${teamId}`);
  }

  const cacheKey = `espn-schedule:${teamId}:${season}`;
  const cached = cacheGet<ScheduleGame[]>(cacheKey);
  if (cached) return cached;

  const url = `${ESPN_NCAAB_BASE}/teams/${teamId}/schedule?season=${season}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data: EspnScheduleResponse = await response.json();

    if (!data.events || data.events.length === 0) {
      return [];
    }

    const homeGames: ScheduleGame[] = [];
    let gameNumber = 1;

    for (const event of data.events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      // Skip neutral-site games (not true home games)
      if (competition.neutralSite) continue;

      // Find the home competitor and check it's our team
      const homeCompetitor = competition.competitors.find(
        (c) => c.homeAway === 'home'
      );
      if (!homeCompetitor) continue;
      if (homeCompetitor.team.id !== String(teamId)) continue;

      // Away team is the opponent
      const awayCompetitor = competition.competitors.find(
        (c) => c.homeAway === 'away'
      );
      if (!awayCompetitor) continue;

      const gameDateTime = new Date(competition.date);
      const time = gameDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: team.timezone,
      });

      const officialDate = gameDateTime.toLocaleDateString('en-CA', {
        timeZone: team.timezone,
      }); // YYYY-MM-DD

      homeGames.push({
        date: officialDate,
        time,
        gameDate: competition.date,
        opponent: awayCompetitor.team.displayName,
        opponentId: parseInt(awayCompetitor.team.id, 10) || 0,
        opponentAbbreviation: awayCompetitor.team.abbreviation,
        venue: competition.venue?.fullName ?? team.venue,
        dayNight: gameDateTime.getHours() >= 17 ? 'night' : 'day',
        gameNumber: gameNumber++,
        doubleHeader: 'N',
      });
    }

    homeGames.sort(
      (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
    );

    cacheSet(cacheKey, homeGames, CACHE_TTL);
    return homeGames;
  } catch (error) {
    console.error(`Failed to fetch ESPN NCAAB schedule for team ${teamId}:`, error);
    return [];
  }
}
