import { NextRequest } from 'next/server';
import { getTicketingInfo } from '@/lib/data/ticketing-platforms';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);

  if (isNaN(teamId)) {
    return jsonError('Invalid team ID', 400);
  }

  const info = getTicketingInfo(teamId);
  if (!info) {
    return jsonError('No ticketing info found for this team', 404);
  }

  return jsonSuccess(info);
}
