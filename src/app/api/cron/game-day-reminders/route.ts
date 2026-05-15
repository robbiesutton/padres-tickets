import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/services/email';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { MLB_TEAMS } from '@/lib/data/mlb-teams';
import {
  buildClaimerGameDayEmail,
  buildHolderGameDayClaimedEmail,
  buildHolderGameDayAvailableEmail,
  buildHolderGameDayGoingEmail,
} from '@/lib/emails/game-day';

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

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return jsonError('Unauthorized', 401);
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowGames = await prisma.game.findMany({
    where: {
      date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
      status: { in: ['CLAIMED', 'AVAILABLE', 'GOING_MYSELF'] },
    },
    include: {
      package: { include: { user: { select: { firstName: true, email: true } } } },
      claim: { include: { claimer: { select: { firstName: true, lastName: true } } } },
    },
  });

  const todayGames = await prisma.game.findMany({
    where: {
      date: { gte: startOfDay(now), lte: endOfDay(now) },
      status: 'CLAIMED',
    },
    include: {
      package: { include: { user: { select: { firstName: true } } } },
      claim: { include: { claimer: { select: { firstName: true, email: true } } } },
    },
  });

  let sent = 0;

  for (const game of tomorrowGames) {
    const pkg = game.package;
    const holder = pkg.user;
    const team = MLB_TEAMS.find((t) => t.name === pkg.team);
    const venue = team?.venue ?? 'the ballpark';
    const gameDayStr = formatGameDay(game.date);
    const timeVenue = formatTimeVenue(game.time, venue);
    const dashboardUrl = `${BASE_URL}/dashboard`;

    try {
      if (game.status === 'CLAIMED' && game.claim) {
        const claimerName = `${game.claim.claimer.firstName} ${game.claim.claimer.lastName}`;
        const email = buildHolderGameDayClaimedEmail({ holderFirstName: holder.firstName, claimerName, opponent: game.opponent, gameDayStr, timeVenue, dashboardUrl });
        await sendEmail({ to: holder.email, subject: email.subject, html: email.html });
        sent++;
      } else if (game.status === 'AVAILABLE') {
        const email = buildHolderGameDayAvailableEmail({ holderFirstName: holder.firstName, opponent: game.opponent, gameDayStr, timeVenue, dashboardUrl });
        await sendEmail({ to: holder.email, subject: email.subject, html: email.html });
        sent++;
      } else if (game.status === 'GOING_MYSELF') {
        const email = buildHolderGameDayGoingEmail({ holderFirstName: holder.firstName, opponent: game.opponent, gameDayStr, timeVenue });
        await sendEmail({ to: holder.email, subject: email.subject, html: email.html });
        sent++;
      }
    } catch (err) {
      console.error(`Failed to send holder game-day email for game ${game.id}:`, err);
    }
  }

  for (const game of todayGames) {
    if (!game.claim) continue;
    const pkg = game.package;
    const claimer = game.claim.claimer;
    const team = MLB_TEAMS.find((t) => t.name === pkg.team);
    const venue = team?.venue ?? 'the ballpark';
    const gameDayStr = formatGameDay(game.date);
    const timeVenue = formatTimeVenue(game.time, venue);

    try {
      const email = buildClaimerGameDayEmail({ claimerFirstName: claimer.firstName, opponent: game.opponent, gameDayStr, timeVenue, section: pkg.section, row: pkg.row });
      await sendEmail({ to: claimer.email, subject: email.subject, html: email.html });
      sent++;
    } catch (err) {
      console.error(`Failed to send claimer game-day email for game ${game.id}:`, err);
    }
  }

  return jsonSuccess({ tomorrowGamesChecked: tomorrowGames.length, todayGamesChecked: todayGames.length, sent });
}
