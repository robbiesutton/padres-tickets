import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { logActivity } from '@/lib/services/activity';
import { sendEmail } from '@/lib/services/email';
import { getTicketingInfo } from '@/lib/data/ticketing-platforms';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import { Prisma } from '@/generated/prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ['SENT'],
  SENT: ['ACCEPTED'],
  ACCEPTED: [], // terminal state
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;
  const { status } = await request.json();

  if (!status) {
    return jsonError('status is required', 400);
  }

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      claimer: true,
      game: {
        include: {
          package: { include: { user: true } },
        },
      },
    },
  });

  if (!claim) return jsonError('Claim not found', 404);

  const pkg = claim.game.package;
  const isHolder = pkg.user.id === user.id;
  const isClaimer = claim.claimerUserId === user.id;

  // Holder can mark SENT, claimer can mark ACCEPTED
  if (status === 'SENT' && !isHolder) {
    return jsonError('Only the ticket holder can mark as transferred', 403);
  }
  if (status === 'ACCEPTED' && !isClaimer) {
    return jsonError('Only the claimer can confirm receipt', 403);
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[claim.transferStatus] || [];
  if (!allowed.includes(status)) {
    return jsonError(
      `Cannot transition from ${claim.transferStatus} to ${status}`,
      400
    );
  }

  // Update status
  const updateData: Record<string, unknown> = { transferStatus: status };

  // If marking as SENT, also update game status
  if (status === 'SENT') {
    await prisma.game.update({
      where: { id: claim.gameId },
      data: { status: 'TRANSFERRED' },
    });
  }

  // If marking as ACCEPTED, mark game as COMPLETE
  if (status === 'ACCEPTED') {
    await prisma.game.update({
      where: { id: claim.gameId },
      data: { status: 'COMPLETE' },
    });
  }

  await prisma.claim.update({
    where: { id },
    data: updateData,
  });

  // Log activity
  const claimerName = `${claim.claimer.firstName} ${claim.claimer.lastName}`;
  const holderName = `${pkg.user.firstName} ${pkg.user.lastName}`;
  const description =
    status === 'SENT'
      ? `${holderName} transferred ${claim.game.opponent} tickets to ${claimerName}`
      : `${claimerName} confirmed receipt of ${claim.game.opponent} tickets`;

  logActivity(pkg.id, 'TRANSFER_UPDATED', description, {
    gameId: claim.gameId,
    claimId: id,
    status,
  } as Prisma.InputJsonValue).catch(() => {});

  // Send notification email
  if (status === 'SENT') {
    // Notify claimer: tickets are ready
    const team = MLB_TEAMS.find((t) => t.name === pkg.team);
    const ticketingInfo = team ? getTicketingInfo(team.id) : null;

    const acceptSteps = ticketingInfo?.claimerAcceptSteps ?? [
      'Check your email for a transfer notification',
      'Accept the tickets in your ticketing app',
    ];

    const stepsHtml = acceptSteps
      .map((s, i) => `<li>${i + 1}. ${s}</li>`)
      .join('');

    await sendEmail({
      to: claim.claimer.email,
      subject: `Your ${pkg.team} vs. ${claim.game.opponent} tickets are ready!`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2>Your Tickets Are Ready!</h2>
          <p>${holderName} transferred your tickets for ${pkg.team} vs. ${claim.game.opponent}.</p>
          <h3>How to accept (${ticketingInfo?.platformDisplayName ?? 'your ticketing app'}):</h3>
          <ol style="padding-left:0;list-style:none">${stepsHtml}</ol>
          ${ticketingInfo?.acceptDeepLink ? `<p><a href="${ticketingInfo.acceptDeepLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">Open ${ticketingInfo.platformDisplayName}</a></p>` : ''}
        </div>
      `,
    }).catch((err) =>
      console.error('Failed to send transfer notification:', err)
    );
  }

  return jsonSuccess({ transferStatus: status });
}
