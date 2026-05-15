import { prisma } from '@/lib/db';
import { sendNotification } from './notifications';
import { buildGameClaimedEmail } from '@/lib/emails/transfer-action';
import { buildClaimConfirmationEmail } from '@/lib/emails/claim-confirmation';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

function formatGameDay(date: Date): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()
    .replace(',', '');
}

function formatTimeVenue(time: string | null, venue: string): string {
  return time ? `${time} · ${venue}` : venue;
}

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
              games: { select: { status: true } },
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

  const holderName = `${holder.firstName} ${holder.lastName}`;
  const claimerName = `${claimer.firstName} ${claimer.lastName}`;

  const team = MLB_TEAMS.find((t) => t.name === pkg.team);
  const venue = team?.venue ?? 'the ballpark';
  const gameDayStr = formatGameDay(game.date);
  const timeVenue = formatTimeVenue(game.time, venue);

  const totalCount = pkg.games.length;
  const claimedCount = pkg.games.filter(
    (g) => g.status === 'CLAIMED' || g.status === 'TRANSFERRED' || g.status === 'COMPLETE'
  ).length;
  const availableCount = pkg.games.filter((g) => g.status === 'AVAILABLE').length;

  // 1. Notify holder that a game was claimed (email-3)
  try {
    const email = buildGameClaimedEmail({
      holderFirstName: holder.firstName,
      claimerName,
      team: pkg.team,
      opponent: game.opponent,
      gameDayStr,
      timeVenue,
      claimedCount,
      totalCount,
      availableCount,
      dashboardUrl: `${BASE_URL}/dashboard`,
    });
    await sendNotification(holder.id, 'TRANSFER_ACTION', holder.email, email.subject, email.html, { claimId: claim.id, gameId: game.id });
  } catch (error) {
    console.error('Failed to send game claimed email to holder:', error);
  }

  // 2. Confirm to claimer that they got the game (email-4)
  try {
    const email = buildClaimConfirmationEmail({
      claimerName: claimer.firstName,
      holderName,
      team: pkg.team,
      opponent: game.opponent,
      gameDayStr,
      timeVenue,
      section: pkg.section,
      row: pkg.row,
      seatCount: pkg.seatCount,
      pricePerTicket: game.pricePerTicket ? Number(game.pricePerTicket) : null,
      myGamesUrl: `${BASE_URL}/share/${pkg.shareLinkSlug}?tab=my-games`,
    });
    await sendNotification(claimer.id, 'CLAIM_CREATED', claimer.email, email.subject, email.html, { claimId: claim.id, gameId: game.id });
  } catch (error) {
    console.error('Failed to send claim confirmation email to claimer:', error);
  }
}
