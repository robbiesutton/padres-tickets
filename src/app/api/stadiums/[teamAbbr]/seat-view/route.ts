import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import { getSeatViewPhotos } from '@/lib/services/seat-views';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamAbbr: string }> }
) {
  const { teamAbbr } = await params;
  const section = request.nextUrl.searchParams.get('section');

  if (!section) {
    return jsonError('section query parameter is required', 400);
  }

  const team = MLB_TEAMS.find(
    (t) => t.abbreviation.toUpperCase() === teamAbbr.toUpperCase()
  );

  if (!team) {
    return jsonError(`Unknown team: ${teamAbbr}`, 404);
  }

  const photos = await getSeatViewPhotos(team.venue, section);

  return jsonSuccess({
    venue: team.venue,
    section,
    photos: photos.slice(0, 5), // Return top 5
  });
}
