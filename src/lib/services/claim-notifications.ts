import { prisma } from '@/lib/db';
import { sendNotification } from './notifications';
import { createToken } from './tokens';
import { buildTransferActionEmail } from '@/lib/emails/transfer-action';
import { buildClaimConfirmationEmail } from '@/lib/emails/claim-confirmation';
import { getTicketingInfo } from '@/lib/data/ticketing-platforms';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function sendClaimNotifications(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      claimer: true,
      game: {
        include: {
          package: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!claim) return;

  const { game } = claim;
  const pkg = game.package;
  const holder = pkg.user;
  const claimer = claim.claimer;

  const gameDate = game.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const holderName = `${holder.firstName} ${holder.lastName}`;
  const claimerName = `${claimer.firstName} ${claimer.lastName}`;

  // Find team ticketing info
  const team = MLB_TEAMS.find((t) => t.name === pkg.team);
  const ticketingInfo = team ? getTicketingInfo(team.id) : null;

  // 1. Send transfer action email to holder
  try {
    // Create a one-time-use token for the "mark as transferred" link
    const actionToken = await createToken(holder.id, 'MAGIC_LINK');
    const markTransferredUrl = `${BASE_URL}/api/games/${game.id}/mark-transferred?token=${actionToken.token}`;

    const transferEmail = buildTransferActionEmail({
      holderName,
      claimerName,
      claimerEmail: claimer.email,
      team: pkg.team,
      opponent: game.opponent,
      gameDate,
      section: pkg.section,
      row: pkg.row,
      seats: pkg.seats,
      seatCount: pkg.seatCount,
      pricePerTicket: game.pricePerTicket ? Number(game.pricePerTicket) : null,
      platformName: ticketingInfo?.platformDisplayName ?? 'your ticketing app',
      transferSteps: ticketingInfo?.holderTransferSteps ?? [
        'Open your ticketing app',
        'Find the game and transfer the tickets',
        "Enter the recipient's email",
      ],
      transferDeepLink:
        ticketingInfo?.transferDeepLink ?? 'https://www.mlb.com/tickets',
      markTransferredUrl,
    });

    await sendNotification(
      holder.id,
      'TRANSFER_ACTION',
      holder.email,
      transferEmail.subject,
      transferEmail.html,
      { claimId: claim.id, gameId: game.id }
    );
  } catch (error) {
    console.error('Failed to send transfer action email:', error);
  }

  // 2. Send claim confirmation email to claimer
  try {
    const confirmEmail = buildClaimConfirmationEmail({
      claimerName,
      holderName,
      team: pkg.team,
      opponent: game.opponent,
      gameDate,
      section: pkg.section,
      row: pkg.row,
      seatCount: pkg.seatCount,
      pricePerTicket: game.pricePerTicket ? Number(game.pricePerTicket) : null,
      myGamesUrl: `${BASE_URL}/dashboard/my-games`,
    });

    await sendNotification(
      claimer.id,
      'CLAIM_CREATED',
      claimer.email,
      confirmEmail.subject,
      confirmEmail.html,
      { claimId: claim.id, gameId: game.id }
    );
  } catch (error) {
    console.error('Failed to send claim confirmation email:', error);
  }
}
