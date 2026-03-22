import { prisma } from '@/lib/db';
import { sendEmail } from './email';
import { Prisma } from '@/generated/prisma/client';

export type NotificationType =
  | 'CLAIM_CREATED'
  | 'CLAIM_RELEASED'
  | 'TRANSFER_ACTION'
  | 'TRANSFER_REMINDER'
  | 'TRANSFER_COMPLETE'
  | 'PAYMENT_REQUEST'
  | 'WELCOME'
  | 'PASSWORD_RESET';

// Default preferences — all enabled
const DEFAULT_PREFS: Record<NotificationType, boolean> = {
  CLAIM_CREATED: true,
  CLAIM_RELEASED: true,
  TRANSFER_ACTION: true,
  TRANSFER_REMINDER: true,
  TRANSFER_COMPLETE: true,
  PAYMENT_REQUEST: true,
  WELCOME: true,
  PASSWORD_RESET: true,
};

export async function sendNotification(
  userId: string,
  type: NotificationType,
  to: string,
  subject: string,
  html: string,
  metadata?: Record<string, unknown>
) {
  // Check user's notification preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });

  const prefs = {
    ...DEFAULT_PREFS,
    ...((user?.notificationPrefs as Record<string, boolean>) ?? {}),
  };

  // Always send auth-related emails regardless of preferences
  const alwaysSend: NotificationType[] = ['WELCOME', 'PASSWORD_RESET'];
  if (!alwaysSend.includes(type) && prefs[type] === false) {
    return; // User opted out
  }

  // Send the email
  await sendEmail({ to, subject, html });

  // Log the notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      subject,
      recipient: to,
      metadata: (metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}
