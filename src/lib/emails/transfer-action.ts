import { emailChrome, greeting, gameDetailBlock, ctaButton, bodyText } from './template';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

interface GameClaimedEmailData {
  holderFirstName: string;
  claimerName: string;
  team: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  claimedCount: number;
  totalCount: number;
  availableCount: number;
  dashboardUrl: string;
}

export function buildGameClaimedEmail(data: GameClaimedEmailData) {
  const body = `
${greeting(data.holderFirstName, `${data.claimerName} just claimed a game from your ${data.team} season.`)}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
${bodyText(`That&rsquo;s ${data.claimedCount} of ${data.totalCount} games claimed so far, with ${data.availableCount} still available.`)}
${ctaButton(data.dashboardUrl, 'View my season')}
`;
  return {
    subject: `${data.claimerName} claimed ${data.team} vs. ${data.opponent}`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because someone claimed a game from your season.'),
  };
}

interface TransferActionEmailData {
  holderFirstName: string;
  claimerName: string;
  claimerEmail: string;
  team: string;
  opponent: string;
  gameDate: string;
  section: string;
  row: string | null;
  seats: string;
  seatCount: number;
  pricePerTicket: number | null;
  platformName: string;
  transferSteps: string[];
  transferDeepLink: string;
  markTransferredUrl: string;
}

export function buildTransferActionEmail(data: TransferActionEmailData) {
  const totalCost =
    data.pricePerTicket && data.pricePerTicket > 0
      ? `$${(data.pricePerTicket * data.seatCount).toFixed(2)}`
      : null;

  const stepsHtml = data.transferSteps
    .map((step, i) => `<tr><td style="font-size:14px;color:#444;font-family:${FONT};padding-bottom:4px;">${i + 1}. ${step}</td></tr>`)
    .join('');

  const paymentHtml = totalCost
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
        <tr><td bgcolor="#FFF8E1" style="background-color:#FFF8E1;border-radius:8px;padding:14px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">Payment: ${totalCost}</td></tr>
            <tr><td style="font-size:13px;color:#8E8985;padding-top:2px;font-family:${FONT};">Collect from ${data.claimerName} via your preferred method.</td></tr>
          </table>
        </td></tr>
      </table>`
    : '';

  const body = `
${greeting(data.holderFirstName, `${data.claimerName} wants to go to the game. Transfer the tickets to complete the claim.`)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Transfer to</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">${data.claimerName} &lt;${data.claimerEmail}&gt;</td></tr>
</table>

${paymentHtml}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;">
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};padding-bottom:8px;">How to transfer (${data.platformName}):</td></tr>
  ${stepsHtml}
</table>

${ctaButton(data.transferDeepLink, 'Transfer Tickets Now')}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;">
  <tr><td align="center"><a href="${data.markTransferredUrl}" style="font-size:13px;color:#8E8985;font-family:${FONT};">Already transferred? Mark as done</a></td></tr>
</table>
`;

  return {
    subject: `Action needed: Transfer ${data.team} vs. ${data.opponent} tickets to ${data.claimerName}`,
    html: emailChrome(body, `BenchBuddy &middot; You received this because ${data.claimerName} claimed your tickets.`),
  };
}
