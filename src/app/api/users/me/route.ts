import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET() {
  const sessionUser = await requireAuth();
  if (!sessionUser) {
    return jsonError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      venmoHandle: true,
      zelleInfo: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return jsonError('User not found', 404);
  }

  return jsonSuccess(user);
}

export async function PUT(request: NextRequest) {
  const sessionUser = await requireAuth();
  if (!sessionUser) {
    return jsonError('Unauthorized', 401);
  }

  const body = await request.json();
  const { firstName, lastName, phone, venmoHandle, zelleInfo } = body;

  const updateData: Record<string, string | null> = {};
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (phone !== undefined) updateData.phone = phone?.trim() || null;
  if (venmoHandle !== undefined)
    updateData.venmoHandle = venmoHandle?.trim() || null;
  if (zelleInfo !== undefined) updateData.zelleInfo = zelleInfo?.trim() || null;

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      venmoHandle: true,
      zelleInfo: true,
    },
  });

  return jsonSuccess(user);
}
