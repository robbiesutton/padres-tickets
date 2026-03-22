import { prisma } from '@/lib/db';
import { ActivityType, Prisma } from '@/generated/prisma/client';

export async function logActivity(
  packageId: string,
  type: ActivityType,
  description: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.activity.create({
    data: {
      packageId,
      type,
      description,
      metadata: metadata ?? Prisma.JsonNull,
    },
  });
}
