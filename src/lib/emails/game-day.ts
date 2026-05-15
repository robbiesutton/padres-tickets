import { emailChrome, greeting, gameDetailBlock, ctaButton, bodyText } from './template';

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

// email-5: Claimer game day reminder
interface ClaimerGameDayEmailData {
  claimerFirstName: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  section: string;
  row: string | null;
  seatNumbers?: string;
}

export function buildClaimerGameDayEmail(data: ClaimerGameDayEmailData) {
  const seatLabel = [`Section ${data.section}`, data.row ? `Row ${data.row}` : null, data.seatNumbers ? `Seats ${data.seatNumbers}` : null]
    .filter(Boolean)
    .join(', ');

  const body = `
${greeting(data.claimerFirstName, 'Your game is today.')}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
  <tr><td style="font-size:13px;color:#8E8985;font-family:${FONT};padding-bottom:2px;">Seats</td></tr>
  <tr><td style="font-size:14px;font-weight:600;color:#1B1716;font-family:${FONT};">${seatLabel}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;padding-top:16px;font-family:${FONT};">Enjoy the game.</td></tr>
</table>
`;
  return {
    subject: `Today: ${data.opponent} game`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you have a game today.'),
  };
}

// email-6a: Holder game day — claimed
interface HolderGameDayClaimedData {
  holderFirstName: string;
  claimerName: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  dashboardUrl: string;
}

export function buildHolderGameDayClaimedEmail(data: HolderGameDayClaimedData) {
  const body = `
${greeting(data.holderFirstName, `Tomorrow&rsquo;s game is all set &mdash; ${data.claimerName} has it.`)}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
${ctaButton(data.dashboardUrl, 'View my season')}
`;
  return {
    subject: `Tomorrow: ${data.claimerName} is going to vs. ${data.opponent}`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you have a game tomorrow.'),
  };
}

// email-6b: Holder game day — available
interface HolderGameDayAvailableData {
  holderFirstName: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  dashboardUrl: string;
}

export function buildHolderGameDayAvailableEmail(data: HolderGameDayAvailableData) {
  const body = `
${greeting(data.holderFirstName, 'Quick heads up &mdash; tomorrow&rsquo;s game is still available.')}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
${bodyText('If you&rsquo;d like someone to go, share your link. Otherwise you can update the status on My season.')}
${ctaButton(data.dashboardUrl, 'View my season')}
`;
  return {
    subject: `Tomorrow: vs. ${data.opponent} is still available`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you have a game tomorrow.'),
  };
}

// email-6c: Holder game day — going myself
interface HolderGameDayGoingData {
  holderFirstName: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
}

export function buildHolderGameDayGoingEmail(data: HolderGameDayGoingData) {
  const body = `
${greeting(data.holderFirstName, 'You&rsquo;ve got a game tomorrow.')}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="font-size:15px;color:#1B1716;line-height:1.55;font-family:${FONT};">Enjoy the game.</td></tr>
</table>
`;
  return {
    subject: `Tomorrow: vs. ${data.opponent}`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because you have a game tomorrow.'),
  };
}

// email-7: Claimer unclaimed notification
interface ClaimerUnclaimedEmailData {
  claimerFirstName: string;
  holderFirstName: string;
  opponent: string;
  gameDayStr: string;
  timeVenue: string;
  shareUrl: string;
}

export function buildClaimerUnclaimedEmail(data: ClaimerUnclaimedEmailData) {
  const body = `
${greeting(data.claimerFirstName, `${data.holderFirstName} made a change to their ${data.gameDayStr} game vs ${data.opponent}, and it&rsquo;s no longer assigned to you.`)}
${gameDetailBlock(data.gameDayStr, data.opponent, data.timeVenue)}
${bodyText(`If this is unexpected, reach out to ${data.holderFirstName} directly.`)}
${ctaButton(data.shareUrl, 'Browse available games')}
`;
  return {
    subject: `Heads up: vs. ${data.opponent} is no longer yours`,
    html: emailChrome(body, 'BenchBuddy &middot; You&rsquo;re receiving this because a game you claimed has been updated.'),
  };
}
