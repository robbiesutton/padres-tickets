import { NextRequest } from 'next/server';
import { getHomeSchedule } from '@/lib/services/schedule';
import { getTeamById } from '@/lib/data/mlb-teams';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);

  if (isNaN(teamId)) {
    return jsonError('Invalid team ID', 400);
  }

  const team = getTeamById(teamId);
  if (!team) {
    return jsonError('Unknown MLB team', 404);
  }

  const season =
    request.nextUrl.searchParams.get('season') ||
    new Date().getFullYear().toString();

  try {
    const games = await getHomeSchedule(teamId, season);
    return jsonSuccess({
      team: {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        venue: team.venue,
      },
      season,
      totalGames: games.length,
      games,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch schedule';
    return jsonError(message, 500);
  }
}
