import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/services/tokens';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return jsonError('Token and password are required', 400);
  }

  if (password.length < 8) {
    return jsonError('Password must be at least 8 characters', 400);
  }

  const user = await verifyToken(token, 'PASSWORD_RESET');

  if (!user) {
    return jsonError('Invalid or expired reset link', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return jsonSuccess({ message: 'Password has been reset successfully.' });
}
