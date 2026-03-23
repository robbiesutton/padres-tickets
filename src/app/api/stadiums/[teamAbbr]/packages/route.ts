import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { SEASON_PACKAGES } from '@/lib/data/season-ticket-packages';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamAbbr: string }> }
) {
  const { teamAbbr } = await params;
  const packages = SEASON_PACKAGES[teamAbbr.toUpperCase()];

  if (!packages) {
    return jsonError(`No package data for team: ${teamAbbr}`, 404);
  }

  return jsonSuccess({ packages });
}
