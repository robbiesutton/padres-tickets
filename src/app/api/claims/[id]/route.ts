import { NextRequest } from 'next/server';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { releaseClaim } from '@/lib/services/claim';
import { DESIGN_MODE } from '@/lib/mock-data';
import { removeDesignClaim } from '@/lib/design-claims-store';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  const { id } = await params;

  if (DESIGN_MODE) {
    const result = removeDesignClaim(id);
    if (!result.success) {
      return jsonError(result.error!, 400);
    }
    return jsonSuccess({ message: 'Claim released successfully' });
  }

  const result = await releaseClaim(id, user.id);

  if (!result.success) {
    return jsonError(result.error!, 400);
  }

  return jsonSuccess({ message: 'Claim released successfully' });
}
