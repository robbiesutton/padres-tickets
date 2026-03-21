export type TicketingPlatform =
  | 'TICKETMASTER'
  | 'AXS'
  | 'SEATGEEK'
  | 'MLB_BALLPARK';

export interface TeamTicketingInfo {
  teamId: number;
  teamName: string;
  platform: TicketingPlatform;
  platformDisplayName: string;
  transferMethod: string;
  transferDeepLink: string;
  acceptDeepLink: string;
  holderTransferSteps: string[];
  claimerAcceptSteps: string[];
  notes?: string;
}

// Most MLB teams use Ticketmaster / MLB Ballpark App for ticket management.
// A few use AXS or SeatGeek. This data should be verified before launch.

const TICKETMASTER_TRANSFER_STEPS: string[] = [
  'Open the MLB Ballpark app or go to mlb.com/tickets',
  'Navigate to "My Tickets" and find the game',
  'Tap "Transfer" on the tickets',
  "Enter the recipient's email address",
  'Confirm the transfer',
];

const TICKETMASTER_ACCEPT_STEPS: string[] = [
  'Check your email for a transfer notification from Ticketmaster',
  'Click "Accept Tickets" in the email',
  'Sign in to your Ticketmaster account (or create one)',
  'Tickets will appear in your MLB Ballpark app under "My Tickets"',
];

const AXS_TRANSFER_STEPS: string[] = [
  'Open the AXS app or go to axs.com',
  'Go to "My Events" and find the game',
  'Tap "Transfer" on the tickets',
  "Enter the recipient's email address",
  'Confirm the transfer',
];

const AXS_ACCEPT_STEPS: string[] = [
  'Check your email for a transfer notification from AXS',
  'Click "Accept Tickets" in the email',
  'Sign in to your AXS account (or create one)',
  'Tickets will appear in your AXS app under "My Events"',
];

const SEATGEEK_TRANSFER_STEPS: string[] = [
  'Open the SeatGeek app or go to seatgeek.com',
  'Go to "My Tickets" and find the game',
  'Tap "Transfer" on the tickets',
  "Enter the recipient's email address",
  'Confirm the transfer',
];

const SEATGEEK_ACCEPT_STEPS: string[] = [
  'Check your email for a transfer notification from SeatGeek',
  'Click "Accept Tickets" in the email',
  'Sign in to your SeatGeek account (or create one)',
  'Tickets will appear in your SeatGeek app under "My Tickets"',
];

function tmInfo(
  teamId: number,
  teamName: string,
  slug: string,
  notes?: string
): TeamTicketingInfo {
  return {
    teamId,
    teamName,
    platform: 'TICKETMASTER',
    platformDisplayName: 'MLB Ballpark / Ticketmaster',
    transferMethod: 'Ticketmaster Transfer',
    transferDeepLink: `https://www.mlb.com/${slug}/tickets/manage`,
    acceptDeepLink: 'https://am.ticketmaster.com/ballpark/',
    holderTransferSteps: TICKETMASTER_TRANSFER_STEPS,
    claimerAcceptSteps: TICKETMASTER_ACCEPT_STEPS,
    notes,
  };
}

function axsInfo(
  teamId: number,
  teamName: string,
  axsSlug: string,
  notes?: string
): TeamTicketingInfo {
  return {
    teamId,
    teamName,
    platform: 'AXS',
    platformDisplayName: 'AXS',
    transferMethod: 'AXS Transfer',
    transferDeepLink: `https://www.axs.com/events/${axsSlug}`,
    acceptDeepLink: 'https://www.axs.com/myevents',
    holderTransferSteps: AXS_TRANSFER_STEPS,
    claimerAcceptSteps: AXS_ACCEPT_STEPS,
    notes,
  };
}

function sgInfo(
  teamId: number,
  teamName: string,
  sgSlug: string,
  notes?: string
): TeamTicketingInfo {
  return {
    teamId,
    teamName,
    platform: 'SEATGEEK',
    platformDisplayName: 'SeatGeek',
    transferMethod: 'SeatGeek Transfer',
    transferDeepLink: `https://seatgeek.com/venues/${sgSlug}`,
    acceptDeepLink: 'https://seatgeek.com/my-tickets',
    holderTransferSteps: SEATGEEK_TRANSFER_STEPS,
    claimerAcceptSteps: SEATGEEK_ACCEPT_STEPS,
    notes,
  };
}

export const TEAM_TICKETING_INFO: TeamTicketingInfo[] = [
  // AL East
  tmInfo(110, 'Baltimore Orioles', 'orioles'),
  tmInfo(111, 'Boston Red Sox', 'redsox'),
  tmInfo(147, 'New York Yankees', 'yankees'),
  tmInfo(139, 'Tampa Bay Rays', 'rays'),
  tmInfo(141, 'Toronto Blue Jays', 'bluejays'),
  // AL Central
  tmInfo(145, 'Chicago White Sox', 'whitesox'),
  tmInfo(114, 'Cleveland Guardians', 'guardians'),
  tmInfo(116, 'Detroit Tigers', 'tigers'),
  tmInfo(118, 'Kansas City Royals', 'royals'),
  tmInfo(142, 'Minnesota Twins', 'twins'),
  // AL West
  tmInfo(117, 'Houston Astros', 'astros'),
  tmInfo(108, 'Los Angeles Angels', 'angels'),
  tmInfo(
    133,
    'Oakland Athletics',
    'athletics',
    'Relocated to Sacramento for 2025+'
  ),
  tmInfo(136, 'Seattle Mariners', 'mariners'),
  tmInfo(140, 'Texas Rangers', 'rangers'),
  // NL East
  tmInfo(144, 'Atlanta Braves', 'braves'),
  tmInfo(146, 'Miami Marlins', 'marlins'),
  sgInfo(
    121,
    'New York Mets',
    'citi-field',
    'Mets use SeatGeek as primary ticketing partner'
  ),
  tmInfo(143, 'Philadelphia Phillies', 'phillies'),
  tmInfo(120, 'Washington Nationals', 'nationals'),
  // NL Central
  tmInfo(112, 'Chicago Cubs', 'cubs'),
  tmInfo(113, 'Cincinnati Reds', 'reds'),
  tmInfo(158, 'Milwaukee Brewers', 'brewers'),
  tmInfo(134, 'Pittsburgh Pirates', 'pirates'),
  tmInfo(138, 'St. Louis Cardinals', 'cardinals'),
  // NL West
  tmInfo(109, 'Arizona Diamondbacks', 'dbacks'),
  tmInfo(115, 'Colorado Rockies', 'rockies'),
  tmInfo(119, 'Los Angeles Dodgers', 'dodgers'),
  tmInfo(135, 'San Diego Padres', 'padres'),
  axsInfo(
    137,
    'San Francisco Giants',
    'oracle-park',
    'Giants use AXS ticketing'
  ),
];

export function getTicketingInfo(
  teamId: number
): TeamTicketingInfo | undefined {
  return TEAM_TICKETING_INFO.find((t) => t.teamId === teamId);
}
