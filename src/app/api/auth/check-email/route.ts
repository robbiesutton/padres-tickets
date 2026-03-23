import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return jsonError('Email is required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return jsonSuccess({ exists: false, hasPassword: false });
  }

  return jsonSuccess({
    exists: true,
    hasPassword: !!user.passwordHash,
  });
}
