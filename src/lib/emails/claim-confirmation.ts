import { emailChrome, gameDetailBlock, ctaButton } from './template';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

interface ClaimConfirmationEmailData {
  claimerName: string;
  holderName: string;
  team: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  section: string;
  row: string | null;
  seatNumbers?: string;
  seatCount: number;
  pricePerTicket: number | null;
  myGamesUrl: string;
}

export function buildClaimConfirmationEmail(data: ClaimConfirmationEmailData) {
  const seatLabel = [
    `Section ${data.section}`,
    data.row ? `Row ${data.row}` : null,
    data.seatNumbers ? `Seats ${data.seatNumbers}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const priceLabel =
    data.pricePerTicket && data.pricePerTicket > 0
      ? `$${data.pricePerTicket.toFixed(0)}/ticket`
      : 'Free';

  const body = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:16px;font-weight:700;color:#1B1716;padding-bottom:4px;font-family:${FONT};">Hi ${data.claimerName},</td></tr>
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;padding-bottom:4px;font-family:${FONT};">You&rsquo;re going to the game.</td></tr>
</table>

${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Seats</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};padding-bottom:6px;">${seatLabel}</td></tr>
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Tickets</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};padding-bottom:6px;">${data.seatCount}</td></tr>
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Price</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">${priceLabel}</td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:14px;color:#8E8985;line-height:1.5;font-family:${FONT};">
    ${
      data.pricePerTicket && data.pricePerTicket > 0
        ? `If you need to coordinate payment, reach out to ${data.holderName} directly.`
        : `${data.holderName} will send ticket transfer details before the game.`
    }
  </td></tr>
</table>

${ctaButton(data.myGamesUrl, 'View my games')}
`;

  return {
    subject: `You claimed ${data.team} vs. ${data.opponent} tickets!`,
    html: emailChrome(
      body,
      'BenchBuddy &middot; You&rsquo;re receiving this because you claimed a game through BenchBuddy.'
    ),
  };
}
