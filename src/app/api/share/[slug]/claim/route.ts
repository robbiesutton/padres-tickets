import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { createClaim } from '@/lib/services/claim';
import { trackServerEvent, AnalyticsEvents } from '@/lib/analytics';
import { DESIGN_MODE } from '@/lib/mock-data';
import { addDesignClaim } from '@/lib/design-claims-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await requireAuth();
  if (!user) {
    return jsonError('Authentication required to claim tickets', 401);
  }

  const { gameId } = await request.json();

  if (!gameId) {
    return jsonError('gameId is required', 400);
  }

  if (DESIGN_MODE) {
    const result = addDesignClaim(gameId);
    if (!result.success) {
      return jsonError(result.error!, 409);
    }
    return jsonSuccess({ claim: result.claim }, 201);
  }

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { id: true, status: true },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return jsonError('Share link not found or deactivated', 404);
  }

  // Verify the game belongs to this package
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { packageId: true },
  });

  if (!game || game.packageId !== pkg.id) {
    return jsonError('Game not found in this package', 404);
  }

  const result = await createClaim(gameId, user.id);

  if (!result.success) {
    return jsonError(result.error!, 409);
  }

  trackServerEvent(AnalyticsEvents.CLAIM_COMPLETED, {
    slug,
    gameId,
    userId: user.id,
  });

  return jsonSuccess({ claim: result.claim }, 201);
}
