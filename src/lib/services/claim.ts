import { prisma } from '@/lib/db';

interface CreateClaimResult {
  success: boolean;
  claim?: {
    id: string;
    gameId: string;
    claimerUserId: string;
    status: string;
    paymentStatus: string;
    transferStatus: string;
  };
  error?: string;
}

export async function createClaim(
  gameId: string,
  claimerUserId: string
): Promise<CreateClaimResult> {
  // Use a transaction with serializable isolation to handle race conditions.
  // If two users try to claim the same game simultaneously, only one will
  // succeed — the other will get a conflict error.
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the game row by reading it inside the transaction
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: {
          package: { select: { id: true, userId: true } },
        },
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'AVAILABLE') {
        throw new Error('Game is no longer available');
      }

      // Prevent holders from claiming their own games
      if (game.package.userId === claimerUserId) {
        throw new Error('You cannot claim your own game');
      }

      // Check if claimer already has an active claim on this game
      const existingClaim = await tx.claim.findUnique({
        where: { gameId },
      });

      if (existingClaim) {
        throw new Error('Game has already been claimed');
      }

      // Determine payment status based on price
      const isFree = !game.pricePerTicket || Number(game.pricePerTicket) === 0;
      const paymentStatus = isFree ? 'WAIVED' : 'UNPAID';

      // Create the claim
      const claim = await tx.claim.create({
        data: {
          gameId,
          claimerUserId,
          status: 'CONFIRMED',
          paymentStatus,
          transferStatus: 'NOT_STARTED',
        },
      });

      // Update game status to CLAIMED
      await tx.game.update({
        where: { id: gameId },
        data: { status: 'CLAIMED' },
      });

      // Create invitation linking claimer to package (if not exists)
      await tx.invitation.upsert({
        where: {
          packageId_claimerUserId: {
            packageId: game.packageId,
            claimerUserId,
          },
        },
        update: {},
        create: {
          packageId: game.packageId,
          claimerUserId,
        },
      });

      return claim;
    });

    return {
      success: true,
      claim: {
        id: result.id,
        gameId: result.gameId,
        claimerUserId: result.claimerUserId,
        status: result.status,
        paymentStatus: result.paymentStatus,
        transferStatus: result.transferStatus,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create claim';
    return { success: false, error: message };
  }
}

export async function releaseClaim(
  claimId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id: claimId },
        include: { game: true },
      });

      if (!claim) {
        throw new Error('Claim not found');
      }

      if (claim.claimerUserId !== userId) {
        throw new Error('You can only release your own claims');
      }

      if (claim.status === 'RELEASED') {
        throw new Error('Claim has already been released');
      }

      // Update claim status
      await tx.claim.update({
        where: { id: claimId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // Set game back to available
      await tx.game.update({
        where: { id: claim.gameId },
        data: { status: 'AVAILABLE' },
      });
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to release claim';
    return { success: false, error: message };
  }
}
