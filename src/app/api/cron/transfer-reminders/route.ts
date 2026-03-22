import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/services/email';
import { buildTransferActionEmail } from '@/lib/emails/transfer-action';
import { getTicketingInfo } from '@/lib/data/ticketing-platforms';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import { createToken } from '@/lib/services/tokens';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  // Simple auth for cron — check for a secret header
  const cronSecret = request.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return jsonError('Unauthorized', 401);
  }

  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find claims where: game within 48h, transfer NOT_STARTED, no reminder sent
  const claims = await prisma.claim.findMany({
    where: {
      status: 'CONFIRMED',
      transferStatus: 'NOT_STARTED',
      reminderSentAt: null,
      game: {
        date: { gte: now, lte: in48Hours },
      },
    },
    include: {
      claimer: { select: { firstName: true, lastName: true, email: true } },
      game: {
        include: {
          package: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const claim of claims) {
    const { game } = claim;
    const pkg = game.package;
    const holder = pkg.user;

    const gameDate = game.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const team = MLB_TEAMS.find((t) => t.name === pkg.team);
    const ticketingInfo = team ? getTicketingInfo(team.id) : null;

    try {
      const actionToken = await createToken(holder.id, 'MAGIC_LINK');
      const markTransferredUrl = `${BASE_URL}/api/games/${game.id}/mark-transferred?token=${actionToken.token}`;

      const email = buildTransferActionEmail({
        holderName: `${holder.firstName} ${holder.lastName}`,
        claimerName: `${claim.claimer.firstName} ${claim.claimer.lastName}`,
        claimerEmail: claim.claimer.email,
        team: pkg.team,
        opponent: game.opponent,
        gameDate: `REMINDER: ${gameDate} — game is soon!`,
        section: pkg.section,
        row: pkg.row,
        seats: pkg.seats,
        seatCount: pkg.seatCount,
        pricePerTicket: game.pricePerTicket
          ? Number(game.pricePerTicket)
          : null,
        platformName:
          ticketingInfo?.platformDisplayName ?? 'your ticketing app',
        transferSteps: ticketingInfo?.holderTransferSteps ?? [
          'Open your ticketing app',
          'Find the game and transfer the tickets',
          "Enter the recipient's email",
        ],
        transferDeepLink:
          ticketingInfo?.transferDeepLink ?? 'https://www.mlb.com/tickets',
        markTransferredUrl,
      });

      await sendEmail({
        to: holder.email,
        subject: `Reminder: ${email.subject}`,
        html: email.html,
      });

      // Mark reminder as sent
      await prisma.claim.update({
        where: { id: claim.id },
        data: { reminderSentAt: new Date() },
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send reminder for claim ${claim.id}:`, error);
    }
  }

  return jsonSuccess({
    checked: claims.length,
    sent,
  });
}
