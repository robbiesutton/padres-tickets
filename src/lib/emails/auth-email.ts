import { emailChrome, greeting, ctaButton } from './template';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

interface AuthEmailData {
  firstName: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footnote?: string;
}

export function buildAuthEmail(data: AuthEmailData): string {
  const body = `
${greeting(data.firstName, data.body)}
${ctaButton(data.ctaUrl, data.ctaLabel)}
${data.footnote ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;"><tr><td style="font-size:12px;color:#8E8985;line-height:1.5;font-family:${FONT};">${data.footnote}</td></tr></table>` : ''}
`;
  return emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you requested access to your account.');
}

export function buildVerifyEmail(firstName: string, verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your BenchBuddy email',
    html: buildAuthEmail({
      firstName,
      heading: 'Verify your email',
      body: 'Thanks for signing up for BenchBuddy! Please verify your email address to get started.',
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

export function buildHolderWelcomeEmail(firstName: string, email: string): { subject: string; html: string } {
  const body = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:16px;font-weight:700;color:#1B1716;padding-bottom:4px;font-family:${FONT};">Hi ${firstName},</td></tr>
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;padding-bottom:16px;font-family:${FONT};">Welcome to BenchBuddy &mdash; you&rsquo;re one step away from sharing your season.</td></tr>
  <tr><td style="font-size:14px;color:#8E8985;padding-bottom:2px;font-family:${FONT};">Here&rsquo;s what you used to sign in:</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 16px;">
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Email</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">${email}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;font-family:${FONT};">When you&rsquo;re ready, set up your tickets and share a link. They claim the games they want, and you always know where your tickets are going.</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
  <tr><td align="center" bgcolor="#2C2A2B" style="background-color:#2C2A2B;border-radius:8px;">
    <!--[if !mso]><!--><a href="https://getbenchbuddy.com/packages/new" style="display:inline-block;background-color:#2C2A2B;color:#FFFFFF;font-family:${FONT};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Set up my tickets</a><!--<![endif]-->
  </td></tr>
</table>
`;
  return {
    subject: 'Welcome to BenchBuddy',
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you created a BenchBuddy account. If you didn&rsquo;t create this account, you can ignore this email.'),
  };
}
