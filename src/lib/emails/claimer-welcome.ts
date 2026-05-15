import { emailChrome, ctaButton } from './template';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

interface ClaimerWelcomeEmailData {
  claimerFirstName: string;
  holderFirstName: string;
  team: string;
  shareUrl: string;
  claimerEmail: string;
}

export function buildClaimerWelcomeEmail(data: ClaimerWelcomeEmailData) {
  const body = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:16px;font-weight:700;color:#1B1716;padding-bottom:4px;font-family:${FONT};">Hi ${data.claimerFirstName},</td></tr>
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;padding-bottom:16px;font-family:${FONT};">You&rsquo;re all set! ${data.holderFirstName} shared their ${data.team} season tickets with you through BenchBuddy.</td></tr>
  <tr><td style="font-size:14px;color:#8E8985;padding-bottom:2px;font-family:${FONT};">Here&rsquo;s what you used to sign in:</td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 16px;">
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Email</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">${data.claimerEmail}</td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;font-family:${FONT};">You can browse their available games and claim the ones you want.</td></tr>
</table>

${ctaButton(data.shareUrl, 'See available games')}
`;

  return {
    subject: `${data.holderFirstName} shared ${data.team} tickets with you`,
    html: emailChrome(
      body,
      `BenchBuddy &middot; You&rsquo;re receiving this because you joined BenchBuddy through ${data.holderFirstName}&rsquo;s share link. If you didn&rsquo;t create this account, you can ignore this email.`,
    ),
  };
}
