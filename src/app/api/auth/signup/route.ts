import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { DESIGN_MODE } from '@/lib/mock-data';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  if (DESIGN_MODE) {
    return jsonSuccess({ message: 'Check your email to verify your account' });
  }
  const ip = getClientIp(request);
  const { success } = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!success) return rateLimitResponse();

  const body = await request.json();
  const { firstName, lastName, email, password, role, agreedToTerms, marketingOptIn } = body;

  if (!agreedToTerms) {
    return jsonError('You must agree to the Terms of Service and Privacy Policy', 400);
  }

  if (!firstName || !lastName || !email || !password) {
    return jsonError(
      'First name, last name, email, and password are required',
      400
    );
  }

  if (password.length < 8) {
    return jsonError('Password must be at least 8 characters', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return jsonError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'HOLDER' ? 'HOLDER' : 'CLAIMER',
      emailVerified: new Date(),
      notificationPrefs: { marketingOptIn: !!marketingOptIn },
    },
  });

  // Create session token to auto-sign in
  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      sub: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  });

  return jsonSuccess(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      sessionToken,
    },
    201
  );
}
