import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { GameStatus } from '@/generated/prisma/client';

// Status transitions that require releasing a claim first
const CLAIMED_STATUSES: GameStatus[] = ['CLAIMED', 'TRANSFERRED', 'COMPLETE'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id, gameId } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { claim: true },
  });

  if (!game || game.packageId !== id) {
    return jsonError('Game not found in this package', 404);
  }

  const body = await request.json();
  const { status, pricePerTicket, notes } = body;

  // Validate status transitions
  if (status) {
    const hasClaim = game.claim && game.claim.status !== 'RELEASED';

    // Can't change away from a claimed status without releasing the claim first
    if (
      CLAIMED_STATUSES.includes(game.status) &&
      !CLAIMED_STATUSES.includes(status) &&
      hasClaim
    ) {
      return jsonError(
        'Cannot change status while game has an active claim. Release the claim first.',
        409
      );
    }

    // Can't set to CLAIMED manually — claims are created through the claim API
    if (status === 'CLAIMED' && !hasClaim) {
      return jsonError(
        'Cannot set status to CLAIMED manually. Use the claim API.',
        400
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (pricePerTicket !== undefined) {
    updateData.pricePerTicket = pricePerTicket
      ? parseFloat(pricePerTicket)
      : null;
  }
  if (notes !== undefined) updateData.notes = notes || null;

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
  });

  return jsonSuccess({ game: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id, gameId } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { claim: true },
  });

  if (!game || game.packageId !== id) {
    return jsonError('Game not found in this package', 404);
  }

  if (game.claim && game.claim.status !== 'RELEASED') {
    return jsonError('Cannot delete a game with an active claim', 409);
  }

  await prisma.game.delete({ where: { id: gameId } });

  return jsonSuccess({ message: 'Game deleted' });
}
