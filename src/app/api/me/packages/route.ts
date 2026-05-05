import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { getUserPackagesWithRole } from '@/lib/services/package-auth';

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  const packages = await getUserPackagesWithRole(user.id);

  return jsonSuccess({ packages, total: packages.length });
}
