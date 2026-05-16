import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createToken } from '@/lib/services/tokens';
import { sendEmail } from '@/lib/services/email';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { buildMagicLinkEmail } from '@/lib/emails/auth-email';
import { buildClaimerWelcomeEmail } from '@/lib/emails/claimer-welcome';
import { DESIGN_MODE } from '@/lib/mock-data';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  if (DESIGN_MODE) {
    return jsonSuccess({ message: 'Magic link sent' });
  }
  const ip = getClientIp(request);
  const { success } = rateLimit(`magic-link:${ip}`, 3, 60_000);
  if (!success) return rateLimitResponse();

  const { email, firstName, lastName, packageSlug } = await request.json();

  if (!email) {
    return jsonError('Email is required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const isNewUser = !user;

  if (!user) {
    if (!firstName || !lastName) {
      return jsonError(
        'First name and last name are required for new accounts',
        400
      );
    }
    user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        emailVerified: new Date(),
      },
    });
  }

  const tokenRecord = await createToken(user.id, 'MAGIC_LINK');
  const magicUrl = `${BASE_URL}/api/auth/magic-link/verify?token=${tokenRecord.token}`;
  const magicEmail = buildMagicLinkEmail(user.firstName, magicUrl);

  await sendEmail({
    to: user.email,
    subject: magicEmail.subject,
    html: magicEmail.html,
  });

  // Send claimer welcome email for first-time users arriving via a share link
  if (isNewUser && packageSlug) {
    try {
      const pkg = await prisma.package.findUnique({
        where: { shareLinkSlug: packageSlug },
        include: { user: { select: { firstName: true } } },
      });
      if (pkg) {
        const welcome = buildClaimerWelcomeEmail({
          claimerFirstName: user.firstName,
          holderFirstName: pkg.user.firstName,
          team: pkg.team,
          shareUrl: `${BASE_URL}/share/${pkg.shareLinkSlug}`,
          claimerEmail: user.email,
        });
        await sendEmail({
          to: user.email,
          subject: welcome.subject,
          html: welcome.html,
        });
      }
    } catch (err) {
      console.error('Failed to send claimer welcome email:', err);
    }
  }

  return jsonSuccess({
    message: 'Magic link sent. Check your email.',
    isNewUser: !user.passwordHash,
  });
}
