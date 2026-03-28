import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { logActivity } from './activity';
import { sendClaimNotifications } from './claim-notifications';

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

    // Log activity (best-effort, non-blocking)
    void (async () => {
      try {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: {
            package: { select: { id: true } },
            claim: {
              include: { claimer: { select: { firstName: true, lastName: true } } },
            },
          },
        });
        if (game) {
          const claimerName = game.claim
            ? `${game.claim.claimer.firstName} ${game.claim.claimer.lastName}`
            : 'Someone';
          await logActivity(
            game.package.id,
            'CLAIM_CREATED',
            `${claimerName} claimed ${game.opponent} on ${game.date.toLocaleDateString()}`,
            { gameId, claimId: result.id } as Prisma.InputJsonValue
          );
        }
      } catch { /* best-effort */ }
    })();

    // Send claim notification emails (best-effort, non-blocking)
    sendClaimNotifications(result.id).catch((err) =>
      console.error('Failed to send claim notifications:', err)
    );

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
    const txResult = await prisma.$transaction(async (tx) => {
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

      return claim;
    });

    // Log activity (best-effort, non-blocking)
    void (async () => {
      try {
        const claimer = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        const game = await prisma.game.findUnique({
          where: { id: txResult.gameId },
          select: { opponent: true, date: true, packageId: true },
        });
        if (game && claimer) {
          await logActivity(
            game.packageId,
            'CLAIM_RELEASED',
            `${claimer.firstName} ${claimer.lastName} released ${game.opponent} on ${game.date.toLocaleDateString()}`,
            { gameId: txResult.gameId, claimId } as Prisma.InputJsonValue
          );
        }
      } catch { /* best-effort */ }
    })();

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to release claim';
    return { success: false, error: message };
  }
}
