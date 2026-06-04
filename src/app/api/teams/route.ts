import { NextRequest } from 'next/server';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import { NCAA_TEAMS } from '@/lib/data/ncaa-teams';
import { jsonSuccess } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league')?.toUpperCase();

  if (league === 'NCAAB') {
    return jsonSuccess({ teams: NCAA_TEAMS });
  }

  // Default: return all MLB teams
  return jsonSuccess({ teams: MLB_TEAMS });
}
