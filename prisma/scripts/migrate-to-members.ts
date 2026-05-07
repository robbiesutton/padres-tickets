import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create OWNER membership for every existing package
  const packages = await prisma.package.findMany({
    select: { id: true, userId: true, createdAt: true },
  });

  for (const pkg of packages) {
    await prisma.packageMember.upsert({
      where: { packageId_userId: { packageId: pkg.id, userId: pkg.userId } },
      create: {
        packageId: pkg.id,
        userId: pkg.userId,
        role: 'OWNER',
        invitedAt: pkg.createdAt,
      },
      update: {},
    });
  }
  console.log(`Created OWNER memberships for ${packages.length} packages`);

  // 2. Verification
  const ownerCount = await prisma.packageMember.count({ where: { role: 'OWNER' } });
  const totalClaimers = await prisma.packageMember.count({ where: { role: 'CLAIMER' } });

  console.log(`\nVerification:`);
  console.log(`  Packages: ${packages.length}, OWNER memberships: ${ownerCount} — should match`);
  console.log(`  CLAIMER memberships: ${totalClaimers}`);
  console.log(`\nNote: Invitation table has been removed. CLAIMER memberships were migrated in a prior run.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
