import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create test holder
  const holder = await prisma.user.upsert({
    where: { email: 'holder@test.com' },
    update: {},
    create: {
      firstName: 'Mark',
      lastName: 'Thompson',
      email: 'holder@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'HOLDER',
      venmoHandle: '@mark-thompson',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created holder: ${holder.email}`);

  // Create test claimer
  const claimer = await prisma.user.upsert({
    where: { email: 'claimer@test.com' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'claimer@test.com',
      role: 'CLAIMER',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created claimer: ${claimer.email}`);

  // Create package (Colorado Rockies 2026)
  const pkg = await prisma.package.upsert({
    where: { shareLinkSlug: 'mark-rockies' },
    update: {},
    create: {
      userId: holder.id,
      sport: 'MLB',
      team: 'Colorado Rockies',
      section: '143',
      row: '10',
      seats: '3-4',
      seatCount: 2,
      season: '2026',
      shareLinkSlug: 'mark-rockies',
      defaultPricePerTicket: 45.0,
      description:
        'Premium field-level seats on the third base side with unobstructed views of the diamond. Just 20 rows from the field — close enough to hear the crack of the bat.',
      perks: [
        'Aisle Access',
        'Field Level',
        '2 Seats Together',
        'Shaded by 4th Inning',
      ],
    },
  });
  console.log(`  Created package: ${pkg.team} (${pkg.shareLinkSlug})`);

  // Create 10 sample games
  const games = [
    { date: '2026-04-03', time: '18:10', opponent: 'Los Angeles Dodgers' },
    { date: '2026-04-10', time: '18:40', opponent: 'San Francisco Giants' },
    { date: '2026-04-17', time: '18:40', opponent: 'San Diego Padres' },
    { date: '2026-04-24', time: '18:40', opponent: 'Arizona Diamondbacks' },
    { date: '2026-05-01', time: '18:40', opponent: 'Chicago Cubs' },
    { date: '2026-05-08', time: '18:40', opponent: 'St. Louis Cardinals' },
    { date: '2026-05-15', time: '18:40', opponent: 'Atlanta Braves' },
    { date: '2026-05-22', time: '18:40', opponent: 'New York Mets' },
    { date: '2026-05-29', time: '18:40', opponent: 'New York Yankees' },
    { date: '2026-06-05', time: '18:40', opponent: 'Boston Red Sox' },
  ];

  for (const game of games) {
    const date = new Date(`${game.date}T${game.time}:00`);
    await prisma.game.upsert({
      where: { packageId_date: { packageId: pkg.id, date } },
      update: {},
      create: {
        packageId: pkg.id,
        date,
        time: game.time,
        opponent: game.opponent,
        pricePerTicket: 45.0,
        status: 'AVAILABLE',
      },
    });
  }
  console.log(`  Created ${games.length} sample games`);

  // Create one claim (Sarah claims the Dodgers game)
  const dodgersGame = await prisma.game.findFirst({
    where: { packageId: pkg.id, opponent: 'Los Angeles Dodgers' },
  });

  if (dodgersGame) {
    await prisma.claim.upsert({
      where: { gameId: dodgersGame.id },
      update: {},
      create: {
        gameId: dodgersGame.id,
        claimerUserId: claimer.id,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        transferStatus: 'NOT_STARTED',
      },
    });

    await prisma.game.update({
      where: { id: dodgersGame.id },
      data: { status: 'CLAIMED' },
    });

    console.log(`  Created claim: Sarah → Dodgers (Apr 3)`);
  }

  console.log('Seeding complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Seed error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
