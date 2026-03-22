import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/services/tokens';
import { jsonError } from '@/lib/api-utils';
import { logActivity } from '@/lib/services/activity';
import { Prisma } from '@/generated/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return jsonError('Token is required', 400);
  }

  // Verify the action token
  const user = await verifyToken(token, 'MAGIC_LINK');
  if (!user) {
    return jsonError('Invalid or expired link', 400);
  }

  // Find the game and claim
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      claim: {
        include: {
          claimer: { select: { firstName: true, lastName: true } },
        },
      },
      package: { select: { id: true, userId: true } },
    },
  });

  if (!game) {
    return jsonError('Game not found', 404);
  }

  if (game.package.userId !== user.id) {
    return jsonError('Forbidden', 403);
  }

  if (!game.claim || game.claim.status === 'RELEASED') {
    return jsonError('No active claim on this game', 400);
  }

  // Update transfer status
  await prisma.claim.update({
    where: { id: game.claim.id },
    data: { transferStatus: 'SENT' },
  });

  await prisma.game.update({
    where: { id: gameId },
    data: { status: 'TRANSFERRED' },
  });

  // Log activity
  const claimerName = `${game.claim.claimer.firstName} ${game.claim.claimer.lastName}`;
  logActivity(
    game.package.id,
    'TRANSFER_UPDATED',
    `Tickets for ${game.opponent} marked as transferred to ${claimerName}`,
    { gameId, claimId: game.claim.id } as Prisma.InputJsonValue
  ).catch(() => {});

  // Return a simple HTML confirmation page
  const html = `
    <!DOCTYPE html>
    <html><head><title>Tickets Transferred</title></head>
    <body style="font-family:-apple-system,sans-serif;max-width:480px;margin:40px auto;padding:24px;text-align:center">
      <h1 style="font-size:48px;margin:0">&#10003;</h1>
      <h2>Tickets Marked as Transferred</h2>
      <p style="color:#666">${game.opponent} tickets transferred to ${claimerName}.</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none">Go to Dashboard</a>
    </body></html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
