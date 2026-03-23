import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { STADIUM_SEATING } from '@/lib/data/stadium-seating';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamAbbr: string }> }
) {
  const { teamAbbr } = await params;
  const seating = STADIUM_SEATING[teamAbbr.toUpperCase()];

  if (!seating) {
    return jsonError(`No seating data for team: ${teamAbbr}`, 404);
  }

  return jsonSuccess({
    venue: seating.venue,
    sections: seating.sections.map((s) => ({
      id: s.id,
      name: s.name,
      level: s.level,
      tags: s.tags || [],
      rowCount: s.rows.length,
    })),
  });
}
