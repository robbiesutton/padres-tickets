import { prisma } from '@/lib/db';
import { PackageRole } from '@/generated/prisma/client';

export async function getPackageMembership(packageId: string, userId: string) {
  return prisma.packageMember.findUnique({
    where: { packageId_userId: { packageId, userId } },
  });
}

export async function requirePackageOwner(packageId: string, userId: string) {
  const m = await getPackageMembership(packageId, userId);
  if (!m || m.revokedAt || !isOwnerRole(m.role)) return null;
  return m;
}

export async function requirePackageAccess(packageId: string, userId: string) {
  const m = await getPackageMembership(packageId, userId);
  if (!m || m.revokedAt) return null;
  return m;
}

export function isOwnerRole(role: PackageRole) {
  return role === 'OWNER' || role === 'CO_OWNER';
}

export async function getUserPackagesWithRole(userId: string) {
  const memberships = await prisma.packageMember.findMany({
    where: { userId, revokedAt: null },
    include: {
      package: {
        include: {
          _count: { select: { games: true, members: true } },
          members: {
            where: { role: 'OWNER' },
            include: { user: { select: { firstName: true, lastName: true, venmoHandle: true, zelleInfo: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { invitedAt: 'desc' },
  });

  return memberships
    .filter((m) => m.package.status === 'ACTIVE')
    .map((m) => ({
      id: m.package.id,
      shareLinkSlug: m.package.shareLinkSlug,
      team: m.package.team,
      section: m.package.section,
      row: m.package.row,
      seats: m.package.seats,
      seatCount: m.package.seatCount,
      season: m.package.season,
      seatPhotoUrl: m.package.seatPhotoUrl,
      description: m.package.description,
      defaultPricePerTicket: m.package.defaultPricePerTicket,
      perks: m.package.perks,
      _count: m.package._count,
      role: m.role,
      holderName: isOwnerRole(m.role)
        ? undefined
        : `${m.package.members[0]?.user.firstName} ${m.package.members[0]?.user.lastName}`,
      venmoHandle: m.package.members[0]?.user.venmoHandle ?? null,
      zelleInfo: m.package.members[0]?.user.zelleInfo ?? null,
      invitedAt: m.invitedAt.toISOString(),
    }));
}
