import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export async function resetTestData() {
  // Delete in dependency order; seed-test.ts re-creates deterministic data
  await prisma.claim.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.game.deleteMany();
  await prisma.package.deleteMany();
  await prisma.token.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.stripeEvent.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: 'mailosaur.net' } } });
  await prisma.user.deleteMany({ where: { email: { in: ['holder@test.com', 'claimer@test.com'] } } });
}
