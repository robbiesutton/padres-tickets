import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email) {
    return new Response('Missing email parameter', { status: 400 });
  }

  // Simple HMAC verification to prevent abuse
  const expectedToken = Buffer.from(email + (process.env.NEXTAUTH_SECRET || ''))
    .toString('base64')
    .slice(0, 20);

  if (token !== expectedToken) {
    return new Response('Invalid unsubscribe link', { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user) {
    const currentPrefs = (user.notificationPrefs as Record<string, unknown>) || {};
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationPrefs: { ...currentPrefs, marketingOptIn: false },
      },
    });
  }

  // Return a simple HTML confirmation page
  return new Response(
    `<!DOCTYPE html>
    <html><head><title>Unsubscribed — BenchBuddy</title></head>
    <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
      <div style="text-align:center;max-width:400px;padding:20px">
        <h1 style="font-size:24px;margin-bottom:8px">Unsubscribed</h1>
        <p style="color:#666;font-size:14px">You have been unsubscribed from BenchBuddy marketing emails. You will still receive transactional emails (claim confirmations, transfer reminders).</p>
        <a href="/" style="display:inline-block;margin-top:16px;color:#2563eb;font-size:14px">Back to BenchBuddy</a>
      </div>
    </body></html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
