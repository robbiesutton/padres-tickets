import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { STADIUM_SEATING } from '@/lib/data/stadium-seating';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamAbbr: string; sectionId: string }> }
) {
  const { teamAbbr, sectionId } = await params;
  const seating = STADIUM_SEATING[teamAbbr.toUpperCase()];

  if (!seating) {
    return jsonError(`No seating data for team: ${teamAbbr}`, 404);
  }

  const section = seating.sections.find((s) => s.id === sectionId);

  if (!section) {
    return jsonError(`Section ${sectionId} not found`, 404);
  }

  return jsonSuccess({
    sectionId: section.id,
    sectionName: section.name,
    level: section.level,
    rows: section.rows,
    tags: section.tags || [],
  });
}
