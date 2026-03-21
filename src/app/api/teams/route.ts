import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import { jsonSuccess } from '@/lib/api-utils';

export async function GET() {
  return jsonSuccess({ teams: MLB_TEAMS });
}
