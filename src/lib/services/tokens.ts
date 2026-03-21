import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { TokenType } from '@/generated/prisma/client';

const TOKEN_EXPIRY: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 1 * 60 * 60 * 1000, // 1 hour
  MAGIC_LINK: 15 * 60 * 1000, // 15 minutes
};

export async function createToken(userId: string, type: TokenType) {
  // Invalidate existing tokens of this type for this user
  await prisma.token.deleteMany({
    where: { userId, type },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY[type]);

  return prisma.token.create({
    data: { userId, type, token, expiresAt },
  });
}

export async function verifyToken(token: string, type: TokenType) {
  const record = await prisma.token.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.type !== type) {
    return null;
  }

  if (record.expiresAt < new Date()) {
    await prisma.token.delete({ where: { id: record.id } });
    return null;
  }

  // Delete the token after use (one-time use)
  await prisma.token.delete({ where: { id: record.id } });

  return record.user;
}
