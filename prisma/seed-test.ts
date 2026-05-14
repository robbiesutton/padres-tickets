import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Test seed — uses deterministic data and Mailosaur addresses for email capture.
// TEST_EMAIL_DOMAIN is set to the Mailosaur server domain in CI; falls back to
// test.com for local runs (magic-link tests will skip without MAILOSAUR_API_KEY).
const emailDomain = process.env.TEST_EMAIL_DOMAIN || 'test.com';
const HOLDER_EMAIL = process.env.TEST_HOLDER_EMAIL || `holder@${emailDomain}`;
const CLAIMER_EMAIL = process.env.TEST_CLAIMER_EMAIL || `claimer@${emailDomain}`;
const HOLDER_PASSWORD = process.env.TEST_HOLDER_PASSWORD || 'password123';
const SHARE_SLUG = 'mark-rockies-test';

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: seed-test.ts must not run in production.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding test database...');
  console.log(`  Holder: ${HOLDER_EMAIL}`);
  console.log(`  Claimer: ${CLAIMER_EMAIL}`);

  const passwordHash = await bcrypt.hash(HOLDER_PASSWORD, 10);

  const holder = await prisma.user.upsert({
    where: { email: HOLDER_EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      firstName: 'Mark',
      lastName: 'Thompson',
      email: HOLDER_EMAIL,
      passwordHash,
      venmoHandle: '@mark-thompson',
      emailVerified: new Date(),
    },
  });

  const claimer = await prisma.user.upsert({
    where: { email: CLAIMER_EMAIL },
    update: { emailVerified: new Date() },
    create: {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: CLAIMER_EMAIL,
      emailVerified: new Date(),
    },
  });

  const pkg = await prisma.package.upsert({
    where: { shareLinkSlug: SHARE_SLUG },
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
      shareLinkSlug: SHARE_SLUG,
      defaultPricePerTicket: 45.0,
      description: 'Premium field-level seats on the third base side.',
      perks: ['Field Level', 'Aisle Access'],
    },
  });

  // 5 deterministic future games
  const games = [
    { date: '2026-07-10', time: '18:10', opponent: 'Los Angeles Dodgers' },
    { date: '2026-07-17', time: '18:40', opponent: 'San Francisco Giants' },
    { date: '2026-07-24', time: '18:40', opponent: 'San Diego Padres' },
    { date: '2026-07-31', time: '18:40', opponent: 'Arizona Diamondbacks' },
    { date: '2026-08-07', time: '18:40', opponent: 'Chicago Cubs' },
  ];

  for (const g of games) {
    const date = new Date(`${g.date}T${g.time}:00`);
    await prisma.game.upsert({
      where: { packageId_date: { packageId: pkg.id, date } },
      update: {},
      create: {
        packageId: pkg.id,
        date,
        time: g.time,
        opponent: g.opponent,
        pricePerTicket: 45.0,
        status: 'AVAILABLE',
      },
    });
  }

  console.log(`  Created ${games.length} test games for package ${SHARE_SLUG}`);
  console.log('Test seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Seed error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
