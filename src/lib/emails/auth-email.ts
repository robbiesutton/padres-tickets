const LOGO_URL = 'https://getbenchbuddy.com/benchbuddy-mark-white.svg';

interface AuthEmailData {
  firstName: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footnote?: string;
}

export function buildAuthEmail(data: AuthEmailData): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:0;background:#ffffff">
      <!-- Header -->
      <div style="background:#2c2a2b;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
        <img src="${LOGO_URL}" alt="BenchBuddy" width="36" height="36" style="display:inline-block;vertical-align:middle;margin-right:10px" />
        <span style="color:#ffffff;font-size:20px;font-weight:700;vertical-align:middle;letter-spacing:-0.3px">BenchBuddy</span>
      </div>

      <!-- Body -->
      <div style="padding:32px;border:1px solid #eceae5;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2c2a2b">${data.heading}</h2>
        <p style="color:#666;margin:0 0 24px;font-size:15px;line-height:1.5">Hi ${data.firstName},</p>
        <p style="color:#444;margin:0 0 28px;font-size:15px;line-height:1.6">${data.body}</p>

        <!-- CTA Button -->
        <div style="text-align:center;margin:0 0 28px">
          <a href="${data.ctaUrl}" style="display:inline-block;background:#2c2a2b;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${data.ctaLabel}</a>
        </div>

        <!-- Link fallback -->
        <p style="color:#999;font-size:12px;line-height:1.5;margin:0 0 16px">If the button doesn&rsquo;t work, copy and paste this link into your browser:</p>
        <p style="color:#2563eb;font-size:12px;word-break:break-all;margin:0 0 24px"><a href="${data.ctaUrl}" style="color:#2563eb">${data.ctaUrl}</a></p>

        ${data.footnote ? `<p style="color:#999;font-size:12px;margin:0">${data.footnote}</p>` : ''}
      </div>
    </div>
  `;
}

export function buildVerifyEmail(firstName: string, verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your BenchBuddy email',
    html: buildAuthEmail({
      firstName,
      heading: 'Verify your email',
      body: 'Thanks for signing up for BenchBuddy! Please verify your email address to get started. Click the button below to confirm your account.',
      ctaLabel: 'Verify Email',
      ctaUrl: verifyUrl,
      footnote: 'This link expires in 24 hours. If you didn&rsquo;t create a BenchBuddy account, you can safely ignore this email.',
    }),
  };
}

export function buildMagicLinkEmail(firstName: string, magicUrl: string): { subject: string; html: string } {
  return {
    subject: 'Your BenchBuddy sign-in link',
    html: buildAuthEmail({
      firstName,
      heading: 'Sign in to BenchBuddy',
      body: 'Click the button below to securely sign in to your BenchBuddy account. No password needed.',
      ctaLabel: 'Sign In',
      ctaUrl: magicUrl,
      footnote: 'This link expires in 15 minutes and can only be used once. If you didn&rsquo;t request this, you can safely ignore this email.',
    }),
  };
}

export function buildPasswordResetEmail(firstName: string, resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reset your BenchBuddy password',
    html: buildAuthEmail({
      firstName,
      heading: 'Reset your password',
      body: 'We received a request to reset your password. Click the button below to choose a new one.',
      ctaLabel: 'Reset Password',
      ctaUrl: resetUrl,
      footnote: 'This link expires in 1 hour. If you didn&rsquo;t request a password reset, you can safely ignore this email.',
    }),
  };
}

export function buildReserveMagicLinkEmail(
  firstName: string,
  magicUrl: string,
  team: string,
  opponent: string,
): { subject: string; html: string } {
  return {
    subject: `Confirm your reservation — ${team} vs ${opponent}`,
    html: buildAuthEmail({
      firstName,
      heading: 'Confirm your reservation',
      body: `You&rsquo;re one click away from claiming <strong>${team} vs. ${opponent}</strong> tickets! Click the button below to confirm your email and lock in your seats.`,
      ctaLabel: 'Confirm Reservation',
      ctaUrl: magicUrl,
      footnote: 'This link expires in 15 minutes. If you didn&rsquo;t request this, you can safely ignore this email.',
    }),
  };
}
