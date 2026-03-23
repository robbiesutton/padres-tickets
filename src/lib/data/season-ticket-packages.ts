export interface SeasonPackage {
  id: string;
  name: string;
  tier?: string;
  gameCount: number;
  description: string;
  gameSelection: 'all' | 'day_of_week' | 'curated' | 'flexible' | 'opponents';
  gameFilter?: {
    all?: boolean;
    weekendsOnly?: boolean;
    fridays?: boolean;
    saturdays?: boolean;
    sundays?: boolean;
    dayOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  };
}

// ─── Helper factories ──────────────────────────────────

function fullSeason(teamAbbr: string): SeasonPackage {
  return {
    id: `${teamAbbr.toLowerCase()}-full`,
    name: 'Full Season',
    tier: 'Full',
    gameCount: 81,
    description: 'All 81 home games',
    gameSelection: 'all',
    gameFilter: { all: true },
  };
}

function halfSeason(teamAbbr: string, count = 40): SeasonPackage {
  return {
    id: `${teamAbbr.toLowerCase()}-half`,
    name: 'Half Season',
    tier: 'Half',
    gameCount: count,
    description: `${count} select home games`,
    gameSelection: 'curated',
  };
}

function weekend(teamAbbr: string, count = 28): SeasonPackage {
  return {
    id: `${teamAbbr.toLowerCase()}-weekend`,
    name: 'Weekend Plan',
    gameCount: count,
    description: 'Friday, Saturday & Sunday home games',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  };
}

function miniPlan(
  teamAbbr: string,
  count = 20,
  name = 'Mini Plan',
  selection: SeasonPackage['gameSelection'] = 'curated',
): SeasonPackage {
  return {
    id: `${teamAbbr.toLowerCase()}-mini-${count}`,
    name,
    gameCount: count,
    description: `${count} select home games`,
    gameSelection: selection,
  };
}

// ─── AL East ───────────────────────────────────────────

/** Baltimore Orioles — Birdland Memberships (overhauled for 2026) */
const balPackages: SeasonPackage[] = [
  {
    ...fullSeason('BAL'),
    name: 'Full Season Membership',
    tier: 'Birdland Full',
    description: 'All 81 home games with full Birdland Member benefits',
  },
  {
    ...halfSeason('BAL', 40),
    name: 'Half Season Membership',
    tier: 'Birdland Half',
    description: '40 pre-selected home games',
  },
  {
    id: 'bal-40',
    name: '40-Game Membership',
    tier: 'Birdland 40',
    gameCount: 40,
    description: '40 curated home games (replaced former 29-game plan)',
    gameSelection: 'curated',
  },
  {
    id: 'bal-20',
    name: '20-Game Membership',
    tier: 'Birdland 20',
    gameCount: 20,
    description: '20 curated home games (replaced former 13-game plan)',
    gameSelection: 'curated',
  },
  {
    id: 'bal-10',
    name: '10-Game Pack',
    gameCount: 10,
    description: '10-game pack at discounted price (no full member benefits)',
    gameSelection: 'curated',
  },
];

/** Boston Red Sox */
const bosPackages: SeasonPackage[] = [
  {
    ...fullSeason('BOS'),
    name: 'Full Season Plan',
    description: 'All 81 home games at Fenway Park',
  },
  {
    ...halfSeason('BOS', 41),
    name: 'Half Season Plan',
    description: '41 pre-selected home games',
  },
  {
    id: 'bos-20a',
    name: 'Twenty Game Winner Plan A',
    gameCount: 20,
    description: '20 curated home games — Option A schedule',
    gameSelection: 'curated',
  },
  {
    id: 'bos-20b',
    name: 'Twenty Game Winner Plan B',
    gameCount: 20,
    description: '20 curated home games — Option B schedule',
    gameSelection: 'curated',
  },
  {
    id: 'bos-20c',
    name: 'Twenty Game Winner Plan C',
    gameCount: 20,
    description: '20 curated home games — Option C schedule',
    gameSelection: 'curated',
  },
  {
    id: 'bos-20d',
    name: 'Twenty Game Winner Plan D',
    gameCount: 20,
    description: '20 curated home games — Option D schedule',
    gameSelection: 'curated',
  },
];

/** New York Yankees — Legacy Club memberships */
const nyyPackages: SeasonPackage[] = [
  {
    ...fullSeason('NYY'),
    name: 'Full Season Plan',
    tier: 'Legacy Club',
    description: 'All 81 home games with Legacy Club membership',
  },
  {
    ...halfSeason('NYY', 41),
    name: '41-Game Plan',
    description: '41 pre-selected home games',
  },
  {
    id: 'nyy-20a',
    name: '20-Game Plan A',
    gameCount: 20,
    description: '20 curated home games — same seat for all games',
    gameSelection: 'curated',
  },
  {
    id: 'nyy-20b',
    name: '20-Game Plan B',
    gameCount: 20,
    description: '20 curated home games — same seat for all games',
    gameSelection: 'curated',
  },
  {
    id: 'nyy-20c',
    name: '20-Game Plan C',
    gameCount: 20,
    description: '20 curated home games — same seat for all games',
    gameSelection: 'curated',
  },
  {
    id: 'nyy-20d',
    name: '20-Game Plan D',
    gameCount: 20,
    description: '20 curated home games — same seat for all games',
    gameSelection: 'curated',
  },
  {
    id: 'nyy-flex',
    name: 'Flex Plan',
    gameCount: 10,
    description: 'Build your own plan — mix of Bronze, Silver, and Gold tier games',
    gameSelection: 'flexible',
  },
];

/** Tampa Bay Rays — 2026 at Tropicana Field */
const tbPackages: SeasonPackage[] = [
  {
    ...fullSeason('TB'),
    name: 'Full Season Membership',
    description: 'All 81 home games at Tropicana Field',
  },
  {
    id: 'tb-20a',
    name: '20-Game Plan A',
    gameCount: 20,
    description: '9 weekday, 5 Saturday, 6 Sunday pre-selected games',
    gameSelection: 'curated',
  },
  {
    id: 'tb-20b',
    name: '20-Game Plan B',
    gameCount: 20,
    description: '11 weekday, 3 Friday, 3 Saturday, 3 Sunday pre-selected games',
    gameSelection: 'curated',
  },
  {
    id: 'tb-fans-choice',
    name: "Fan's Choice Plan",
    gameCount: 20,
    description: 'Pick 20+ games across three tiers — you choose the games',
    gameSelection: 'flexible',
  },
];

/** Toronto Blue Jays */
const torPackages: SeasonPackage[] = [
  {
    ...fullSeason('TOR'),
    name: 'Full Season Membership',
    description: 'All 81 home games at Rogers Centre',
  },
  {
    id: 'tor-quarter',
    name: 'Quarter Season Membership',
    gameCount: 20,
    description: '~20 pre-selected home games with member benefits',
    gameSelection: 'curated',
  },
  {
    id: 'tor-flex',
    name: '10-Game Flex Pack',
    gameCount: 10,
    description: 'Choose 10-19 games, change seat location per game',
    gameSelection: 'flexible',
  },
];

// ─── AL Central ────────────────────────────────────────

/** Chicago White Sox */
const cwsPackages: SeasonPackage[] = [
  {
    ...fullSeason('CWS'),
    name: 'Full Season Plan',
    description: 'All 81 home games',
  },
  {
    ...halfSeason('CWS', 40),
    name: 'Half Season Plan',
    description: '~40 games, split between weekend-heavy and weekday-heavy options',
  },
  {
    id: 'cws-20',
    name: '20-Game Plan',
    gameCount: 20,
    description: '20 curated games targeting premium opponents',
    gameSelection: 'curated',
  },
  {
    id: 'cws-flex-10',
    name: '10-Ticket Flex Pack',
    gameCount: 10,
    description: '10 tickets to use across any available games',
    gameSelection: 'flexible',
  },
];

/** Cleveland Guardians */
const clePackages: SeasonPackage[] = [
  {
    ...fullSeason('CLE'),
    name: 'Full Season Tickets',
    description: 'All 81 home games at Progressive Field',
  },
  {
    id: 'cle-flex-40',
    name: '40-Voucher Flex Plan',
    gameCount: 40,
    description: '40 vouchers redeemable for any games through the season',
    gameSelection: 'flexible',
  },
  {
    id: 'cle-flex-20',
    name: '20-Voucher Flex Plan',
    gameCount: 20,
    description: '20 vouchers redeemable for any games through the season',
    gameSelection: 'flexible',
  },
  {
    id: 'cle-six',
    name: 'Six Pack',
    gameCount: 6,
    description: '6 pre-selected games throughout the season',
    gameSelection: 'curated',
  },
];

/** Detroit Tigers */
const detPackages: SeasonPackage[] = [
  {
    id: 'det-full',
    name: '78-Game Plan',
    tier: 'Full',
    gameCount: 78,
    description: '78 home games (prorated full season membership)',
    gameSelection: 'all',
    gameFilter: { all: true },
  },
  {
    id: 'det-half',
    name: '39-Game Plan',
    tier: 'Half',
    gameCount: 39,
    description: '39 pre-selected home games (prorated half season)',
    gameSelection: 'curated',
  },
  {
    id: 'det-27',
    name: '27-Game Plan',
    gameCount: 27,
    description: '27 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'det-15',
    name: '15-Game Plan',
    gameCount: 15,
    description: '15 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'det-5',
    name: '125th Anniversary Five-Game Plan',
    gameCount: 5,
    description: '5 games with statue replica giveaway each game',
    gameSelection: 'curated',
  },
];

/** Kansas City Royals */
const kcPackages: SeasonPackage[] = [
  {
    ...fullSeason('KC'),
    name: 'Full Season Membership',
    description: 'All 81 home games',
  },
  {
    id: 'kc-half-a',
    name: 'Half Plan A',
    tier: 'Half',
    gameCount: 41,
    description: '41 pre-selected home games — Plan A schedule',
    gameSelection: 'curated',
  },
  {
    id: 'kc-half-b',
    name: 'Half Plan B',
    tier: 'Half',
    gameCount: 41,
    description: '41 pre-selected home games — Plan B schedule',
    gameSelection: 'curated',
  },
  {
    id: 'kc-partial-1',
    name: 'Partial Plan 1',
    gameCount: 20,
    description: '20 pre-selected home games — schedule option 1',
    gameSelection: 'curated',
  },
  {
    id: 'kc-partial-2',
    name: 'Partial Plan 2',
    gameCount: 20,
    description: '20 pre-selected home games — schedule option 2',
    gameSelection: 'curated',
  },
  {
    id: 'kc-partial-3',
    name: 'Partial Plan 3',
    gameCount: 20,
    description: '20 pre-selected home games — schedule option 3',
    gameSelection: 'curated',
  },
  {
    id: 'kc-partial-4',
    name: 'Partial Plan 4',
    gameCount: 20,
    description: '20 pre-selected home games — schedule option 4',
    gameSelection: 'curated',
  },
  {
    id: 'kc-pick10',
    name: 'Pick 10 Pack',
    gameCount: 10,
    description: 'Choose any 10 home games including marquee matchups',
    gameSelection: 'flexible',
  },
  {
    id: 'kc-fountain',
    name: 'Fountain Pass',
    gameCount: 81,
    description: 'Standing-room access to all 81 home games (~$4/game)',
    gameSelection: 'all',
    gameFilter: { all: true },
  },
  {
    id: 'kc-opening-day-plus3',
    name: 'Opening Day +3 Pack',
    gameCount: 4,
    description: 'Opening Day plus 3 additional home games of your choice',
    gameSelection: 'flexible',
  },
];

/** Minnesota Twins — MyTwins Memberships */
const minPackages: SeasonPackage[] = [
  {
    ...fullSeason('MIN'),
    name: 'Full Season Membership',
    tier: 'MyTwins Full',
    description: 'All 81 home games at Target Field',
  },
  {
    ...halfSeason('MIN', 40),
    name: '40-Game Membership',
    tier: 'MyTwins 40',
    description: '40 curated home games',
  },
  {
    id: 'min-20',
    name: '20-Game Membership',
    tier: 'MyTwins 20',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'min-choice',
    name: 'Choice Plan',
    tier: 'MyTwins Choice',
    gameCount: 15,
    description: 'Custom game selection — you pick the games',
    gameSelection: 'flexible',
  },
  {
    id: 'min-twins-pass',
    name: 'Twins Pass',
    gameCount: 81,
    description: 'Standing-room ballpark access to every home game for $229/season or $49/month',
    gameSelection: 'all',
    gameFilter: { all: true },
  },
];

// ─── AL West ───────────────────────────────────────────

/** Houston Astros */
const houPackages: SeasonPackage[] = [
  {
    ...fullSeason('HOU'),
    name: 'Full Season Tickets',
    description: 'All 81 home games at Minute Maid Park',
  },
  {
    ...halfSeason('HOU', 40),
    name: 'Half Season Tickets',
    description: '~40 pre-selected home games',
  },
  {
    id: 'hou-quarter',
    name: 'Quarter Season Tickets',
    gameCount: 20,
    description: '~20 pre-selected home games',
    gameSelection: 'curated',
  },
  {
    id: 'hou-flex-15',
    name: 'Flex Plan 15+',
    gameCount: 15,
    description: 'Build your own plan with 15+ games',
    gameSelection: 'flexible',
  },
  {
    id: 'hou-flex-6',
    name: 'Flex Plan 6-14',
    gameCount: 6,
    description: 'Build your own plan with 6-14 games',
    gameSelection: 'flexible',
  },
  {
    id: 'hou-mini',
    name: 'Mini Plan 3-5',
    gameCount: 3,
    description: 'Pre-set mini plans of 3-5 games',
    gameSelection: 'curated',
  },
];

/** Los Angeles Angels */
const laaPackages: SeasonPackage[] = [
  {
    ...fullSeason('LAA'),
    name: 'Full Season Seats',
    description: 'All 81 home games at Angel Stadium',
  },
  {
    ...halfSeason('LAA', 40),
    name: 'Half Season Plan',
    description: '~40 pre-selected home games',
  },
  {
    id: 'laa-custom',
    name: 'Custom Ticket Plan',
    gameCount: 8,
    description: 'Choose 8+ games with flexible seating locations',
    gameSelection: 'flexible',
  },
  {
    id: 'laa-flex-15',
    name: 'Flex Plan',
    gameCount: 15,
    description: '15 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'laa-weekend-warrior',
    name: 'Weekend Warrior',
    gameCount: 10,
    description: '10 weekend home games',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'laa-marquee',
    name: 'Marquee Matches',
    gameCount: 6,
    description: '6 premium opponent matchups',
    gameSelection: 'opponents',
  },
  {
    id: 'laa-midweek',
    name: 'Midweek Magic',
    gameCount: 6,
    description: '6 midweek home games',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 2, 3, 4] },
  },
];

/** Athletics (Sacramento) */
const oakPackages: SeasonPackage[] = [
  {
    ...fullSeason('OAK'),
    name: 'Full Season Membership',
    description: 'All regular-season home games at Sutter Health Park',
  },
  {
    id: 'oak-saturdays',
    name: 'Sacramento Saturdays',
    gameCount: 13,
    description: 'All 13 Saturday home games',
    gameSelection: 'day_of_week',
    gameFilter: { saturdays: true, dayOfWeek: [6] },
  },
  {
    id: 'oak-sundays',
    name: 'Family Four Pack (Sundays)',
    gameCount: 13,
    description: 'All Sunday home games — includes 4 tickets, 4 drinks, 4 hot dogs',
    gameSelection: 'day_of_week',
    gameFilter: { sundays: true, dayOfWeek: [0] },
  },
];

/** Seattle Mariners */
const seaPackages: SeasonPackage[] = [
  {
    ...fullSeason('SEA'),
    name: 'Full Season Plan',
    tier: 'Reserved Full',
    description: 'All 81 home games at T-Mobile Park',
  },
  {
    ...halfSeason('SEA', 40),
    name: 'Half Season Plan',
    tier: 'Reserved Half',
    description: '~40 pre-selected home games',
  },
  {
    id: 'sea-20',
    name: '20-Game Plan',
    tier: 'Reserved 20',
    gameCount: 20,
    description: 'Curated mix of weekend, rivalry, and weeknight games',
    gameSelection: 'curated',
  },
  {
    id: 'sea-flex-pro',
    name: 'Pro Flex Membership',
    gameCount: 15,
    description: '$2,000 credit — 15% discount on single-game tickets, use on any games',
    gameSelection: 'flexible',
  },
  {
    id: 'sea-flex-rookie',
    name: 'Rookie Flex Membership',
    gameCount: 10,
    description: '$1,000 credit — 10% discount on single-game tickets, use on any games',
    gameSelection: 'flexible',
  },
];

/** Texas Rangers — Lone Star Members */
const texPackages: SeasonPackage[] = [
  {
    ...fullSeason('TEX'),
    name: 'Full Season Plan',
    tier: 'Lone Star Full',
    description: 'All 81 home games at Globe Life Field',
  },
  {
    ...halfSeason('TEX', 41),
    name: 'Half Season Plan',
    tier: 'Lone Star Half',
    description: '41 pre-selected home games',
  },
  {
    id: 'tex-20',
    name: '20-Game Plan',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'tex-flex-10',
    name: '10-Game Flex Plan',
    gameCount: 10,
    description: 'Build your own 10-game selection',
    gameSelection: 'flexible',
  },
];

// ─── NL East ───────────────────────────────────────────

/** Atlanta Braves — A-List Memberships */
const atlPackages: SeasonPackage[] = [
  {
    ...fullSeason('ATL'),
    name: 'A-List Full Season Membership',
    tier: 'A-List Full',
    description: 'All 81 home games at Truist Park',
  },
  {
    ...halfSeason('ATL', 41),
    name: 'A-List Half Season',
    tier: 'A-List Half',
    description: '41 pre-selected home games',
  },
  {
    id: 'atl-27',
    name: '27-Game Membership',
    tier: 'A-List 27',
    gameCount: 27,
    description: '27 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'atl-flex',
    name: 'Flex Plan',
    gameCount: 4,
    description: 'Choose 4+ games with up to 10% discount',
    gameSelection: 'flexible',
  },
];

/** Miami Marlins — Flex Membership */
const miaPackages: SeasonPackage[] = [
  {
    ...fullSeason('MIA'),
    name: 'Full Season Membership',
    description: 'All 81 home games at loanDepot Park',
  },
  {
    ...halfSeason('MIA', 40),
    name: 'Half Season Plan',
    description: '~40 pre-selected home games',
  },
  {
    id: 'mia-weekend',
    name: 'Weekend Plan',
    gameCount: 28,
    description: 'Weekend home games (Fri/Sat/Sun)',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'mia-20',
    name: '20-Game Plan',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'mia-10',
    name: '10-Game Plan',
    gameCount: 10,
    description: '10 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'mia-flex',
    name: 'Flex Membership',
    gameCount: 10,
    description: 'Spend credit on any games, bring any number of guests — 6 tiers from $750+',
    gameSelection: 'flexible',
  },
];

/** New York Mets */
const nymPackages: SeasonPackage[] = [
  {
    ...fullSeason('NYM'),
    name: 'Full Season Membership',
    description: 'All 81 home games at Citi Field',
  },
  {
    ...halfSeason('NYM', 41),
    name: 'Half Season Membership',
    description: '41 pre-selected home games',
  },
  {
    id: 'nym-quarter',
    name: 'Quarter Season Membership',
    gameCount: 20,
    description: '20-21 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'nym-weekend',
    name: 'Weekend Package',
    gameCount: 28,
    description: 'All Saturday and Sunday home games',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 6] },
  },
  {
    id: 'nym-weekday',
    name: 'Weekday Package',
    gameCount: 53,
    description: 'All weekday (Mon-Fri) home games',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    id: 'nym-division',
    name: 'Division Rival Package',
    gameCount: 13,
    description: 'Games against NL East division rivals',
    gameSelection: 'opponents',
  },
  {
    id: 'nym-flex',
    name: 'Mets Flex',
    gameCount: 10,
    description: 'Flexible ticket plan — choose your own games',
    gameSelection: 'flexible',
  },
];

/** Philadelphia Phillies */
const phiPackages: SeasonPackage[] = [
  {
    ...fullSeason('PHI'),
    name: 'Full Season Plan',
    description: 'All 81 home games at Citizens Bank Park (2-year commitment)',
  },
  {
    ...halfSeason('PHI', 40),
    name: 'Half Season Plan',
    description: '~40 pre-selected home games',
  },
  {
    id: 'phi-20',
    name: '20-Game Plan',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'phi-weekend-13',
    name: '13-Game Weekend Plan',
    gameCount: 13,
    description: '13 weekend home games',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'phi-sunday',
    name: 'Sunday Plan',
    gameCount: 12,
    description: 'All Sunday home games (sold out for 2026)',
    gameSelection: 'day_of_week',
    gameFilter: { sundays: true, dayOfWeek: [0] },
  },
];

/** Washington Nationals */
const wshPackages: SeasonPackage[] = [
  {
    ...fullSeason('WSH'),
    name: 'Full Season Plan',
    description: 'All 81 home games at Nationals Park — 30% savings on concessions/merch',
  },
  {
    id: 'wsh-quarter-fri',
    name: 'Quarter Season Premier (Friday)',
    tier: 'Premier',
    gameCount: 22,
    description: '22 games — Friday-heavy schedule with Opening Day access',
    gameSelection: 'day_of_week',
    gameFilter: { fridays: true, dayOfWeek: [5] },
  },
  {
    id: 'wsh-quarter-sat',
    name: 'Quarter Season Premier (Saturday)',
    tier: 'Premier',
    gameCount: 22,
    description: '22 games — Saturday-heavy schedule with Opening Day access',
    gameSelection: 'day_of_week',
    gameFilter: { saturdays: true, dayOfWeek: [6] },
  },
  {
    id: 'wsh-quarter-sun',
    name: 'Quarter Season Premier (Sunday)',
    tier: 'Premier',
    gameCount: 22,
    description: '22 games — Sunday-heavy schedule with Opening Day access',
    gameSelection: 'day_of_week',
    gameFilter: { sundays: true, dayOfWeek: [0] },
  },
  {
    id: 'wsh-quarter-midweek',
    name: 'Quarter Season Premier (Midweek)',
    tier: 'Premier',
    gameCount: 22,
    description: '22 games — midweek-heavy schedule with Opening Day access',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 2, 3, 4] },
  },
];

// ─── NL Central ────────────────────────────────────────

/** Chicago Cubs */
const chcPackages: SeasonPackage[] = [
  {
    ...fullSeason('CHC'),
    name: 'Full Season Plan',
    description: 'All 81 home games at Wrigley Field',
  },
  {
    ...halfSeason('CHC', 41),
    name: 'Half Season Plan',
    description: '~41 games — alternates between weekends and weekdays',
  },
  {
    id: 'chc-multi',
    name: 'Multi-Game Plan',
    gameCount: 20,
    description: '10-40 games focused on specific months, weekends, or premium opponents',
    gameSelection: 'curated',
  },
];

/** Cincinnati Reds */
const cinPackages: SeasonPackage[] = [
  {
    ...fullSeason('CIN'),
    name: 'Platinum Membership',
    tier: 'Platinum',
    description: 'All 81 home games at Great American Ball Park',
  },
  {
    id: 'cin-gold',
    name: 'Gold Membership',
    tier: 'Gold',
    gameCount: 40,
    description: '~40 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'cin-mini-20',
    name: '20-Game Mini Plan',
    gameCount: 20,
    description: '20 games targeting weekends or rivalries',
    gameSelection: 'curated',
  },
  {
    id: 'cin-mini-10',
    name: '10-Game Mini Plan',
    gameCount: 10,
    description: '10 games targeting weekends or rivalries',
    gameSelection: 'curated',
  },
  {
    id: 'cin-flexbook',
    name: 'Flexbook',
    gameCount: 10,
    description: 'Block of ticket credits to deploy on any regular-season games',
    gameSelection: 'flexible',
  },
  {
    id: 'cin-pick6',
    name: 'Pick-6 Plan',
    gameCount: 6,
    description: 'Choose 6 games from the schedule',
    gameSelection: 'flexible',
  },
];

/** Milwaukee Brewers */
const milPackages: SeasonPackage[] = [
  {
    ...fullSeason('MIL'),
    name: 'Full Season Membership',
    description: 'All 81 home games at American Family Field — includes starter jacket',
  },
  {
    id: 'mil-40',
    name: '40-Game Membership',
    tier: '40-Game',
    gameCount: 40,
    description: '40 curated home games — includes starter jacket',
    gameSelection: 'curated',
  },
  {
    id: 'mil-20',
    name: '20-Game Membership',
    tier: '20-Game',
    gameCount: 20,
    description: '20 curated home games — includes tailgate chair',
    gameSelection: 'curated',
  },
  {
    id: 'mil-12-weekend',
    name: '12-Pack Weekend Plan',
    gameCount: 12,
    description: '12 weekend games + free Opening Day — 20% off single-game prices',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'mil-12-friday',
    name: '12-Pack Friday Plan',
    gameCount: 12,
    description: '12 Friday games + free Opening Day — 20% off single-game prices',
    gameSelection: 'day_of_week',
    gameFilter: { fridays: true, dayOfWeek: [5] },
  },
  {
    id: 'mil-12-premier',
    name: '12-Pack Premier Plan',
    gameCount: 12,
    description: '12 premium matchup games + free Opening Day — 20% off single-game prices',
    gameSelection: 'opponents',
  },
  {
    id: 'mil-12-afternoon',
    name: '12-Pack Afternoon Plan',
    gameCount: 12,
    description: '12 afternoon/day games + free Opening Day — 20% off single-game prices',
    gameSelection: 'curated',
  },
  {
    id: 'mil-6-friday',
    name: '6-Pack Friday Plan',
    gameCount: 6,
    description: '6 Friday games',
    gameSelection: 'day_of_week',
    gameFilter: { fridays: true, dayOfWeek: [5] },
  },
  {
    id: 'mil-6-saturday',
    name: '6-Pack Saturday+ Plan',
    gameCount: 6,
    description: '6 Saturday games',
    gameSelection: 'day_of_week',
    gameFilter: { saturdays: true, dayOfWeek: [6] },
  },
  {
    id: 'mil-6-sunday',
    name: '6-Pack Sunday+ Plan',
    gameCount: 6,
    description: '6 Sunday games',
    gameSelection: 'day_of_week',
    gameFilter: { sundays: true, dayOfWeek: [0] },
  },
  {
    id: 'mil-byo-20',
    name: 'Build Your Own 20',
    gameCount: 20,
    description: 'Choose any 20 games — pick your own seats per game',
    gameSelection: 'flexible',
  },
  {
    id: 'mil-byo-12',
    name: 'Build Your Own 12',
    gameCount: 12,
    description: 'Choose any 12 games — pick your own seats per game',
    gameSelection: 'flexible',
  },
  {
    id: 'mil-byo-6',
    name: 'Build Your Own 6',
    gameCount: 6,
    description: 'Choose any 6 games — pick your own seats per game',
    gameSelection: 'flexible',
  },
];

/** Pittsburgh Pirates */
const pitPackages: SeasonPackage[] = [
  {
    ...fullSeason('PIT'),
    name: 'Full Season Plan',
    description: 'All 81 home games at PNC Park — 50% off single-game prices',
  },
  {
    ...halfSeason('PIT', 41),
    name: 'Half Season Plan',
    description: '41 pre-selected home games — 40% off single-game prices',
  },
  {
    id: 'pit-21',
    name: '21-Game Plan',
    gameCount: 21,
    description: '21 curated home games — 30% off single-game prices',
    gameSelection: 'curated',
  },
  {
    id: 'pit-flex-6',
    name: '6-Game Flex Plan',
    gameCount: 6,
    description: '6 games — flexible redemption via vouchers',
    gameSelection: 'flexible',
  },
];

/** St. Louis Cardinals */
const stlPackages: SeasonPackage[] = [
  {
    ...fullSeason('STL'),
    name: 'Full Season Plan',
    description: 'All 81 home games at Busch Stadium',
  },
  {
    ...halfSeason('STL', 41),
    name: 'Half Season Plan',
    description: '~41 pre-selected home games',
  },
  {
    id: 'stl-20',
    name: '20-Game Plan',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'stl-weekend',
    name: 'Weekend Plan',
    gameCount: 28,
    description: 'Friday, Saturday & Sunday home games',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'stl-10',
    name: '10-Game Ticket Pack',
    gameCount: 10,
    description: '10 curated games — includes Opening Day, Cubs games, promos',
    gameSelection: 'curated',
  },
  {
    id: 'stl-6',
    name: '6-Game Ticket Pack',
    gameCount: 6,
    description: '6 curated games centered on high-demand matchups',
    gameSelection: 'curated',
  },
  {
    id: 'stl-5',
    name: '5-Game Ticket Pack',
    gameCount: 5,
    description: '5 curated games centered on high-demand matchups',
    gameSelection: 'curated',
  },
];

// ─── NL West ───────────────────────────────────────────

/** Arizona Diamondbacks — Advantage Memberships */
const azPackages: SeasonPackage[] = [
  {
    ...fullSeason('AZ'),
    name: 'Full Season Advantage Membership',
    tier: 'Advantage Full',
    description: 'All 81 home games at Chase Field',
  },
  {
    id: 'az-half-a',
    name: 'Half Season Plan A',
    tier: 'Advantage Half A',
    gameCount: 41,
    description: '41 pre-selected home games — Plan A schedule',
    gameSelection: 'curated',
  },
  {
    id: 'az-half-b',
    name: 'Half Season Plan B',
    tier: 'Advantage Half B',
    gameCount: 41,
    description: '41 pre-selected home games — Plan B schedule',
    gameSelection: 'curated',
  },
  {
    id: 'az-weekend',
    name: 'Weekend Plan',
    gameCount: 28,
    description: 'Weekend home games (Fri/Sat/Sun)',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'az-series',
    name: 'Series Plan',
    gameCount: 20,
    description: '~20 games organized by series matchups',
    gameSelection: 'opponents',
  },
  {
    id: 'az-ballpark-pass',
    name: 'D-backs Ballpark Pass',
    gameCount: 81,
    description: 'Standing-room access to all home games at budget price',
    gameSelection: 'all',
    gameFilter: { all: true },
  },
];

/** Colorado Rockies */
const colPackages: SeasonPackage[] = [
  {
    ...fullSeason('COL'),
    name: 'Full Season Tickets',
    description: 'All 81 home games at Coors Field — 30%+ savings',
  },
  {
    ...halfSeason('COL', 40),
    name: 'Half Season Plan',
    description: '~40 pre-selected home games',
  },
  {
    id: 'col-mini',
    name: 'Rockies Passport (Mini Plan)',
    gameCount: 20,
    description: '~20 curated home games via Passport credit system',
    gameSelection: 'curated',
  },
  {
    id: 'col-season-pass',
    name: 'Season Ballpark Pass',
    gameCount: 81,
    description: 'Standing-room access to all home games for $199/season',
    gameSelection: 'all',
    gameFilter: { all: true },
  },
  {
    id: 'col-monthly-pass',
    name: 'Monthly Ballpark Pass',
    gameCount: 15,
    description: 'Standing-room access for one month ($39.99-$49.99/month)',
    gameSelection: 'all',
  },
];

/** Los Angeles Dodgers — My Dodgers Membership */
const ladPackages: SeasonPackage[] = [
  {
    ...fullSeason('LAD'),
    name: 'Full Season Membership',
    tier: 'My Dodgers Full',
    description: 'All 81 regular-season + exhibition games at Dodger Stadium',
  },
  {
    id: 'lad-half-blue',
    name: 'Half Season — Blue Plan',
    tier: 'My Dodgers Half',
    gameCount: 40,
    description: '40 regular-season + 1 exhibition game — Blue schedule',
    gameSelection: 'curated',
  },
  {
    id: 'lad-half-white',
    name: 'Half Season — White Plan',
    tier: 'My Dodgers Half',
    gameCount: 40,
    description: '40 regular-season + 1 exhibition game — White schedule',
    gameSelection: 'curated',
  },
  {
    id: 'lad-quarter',
    name: 'Quarter Season Membership',
    tier: 'My Dodgers Quarter',
    gameCount: 20,
    description: '20 regular-season games',
    gameSelection: 'curated',
  },
];

/** San Diego Padres — Membership tiers */
const sdPackages: SeasonPackage[] = [
  {
    ...fullSeason('SD'),
    name: 'Platinum Membership',
    tier: 'Platinum',
    description: 'All 81 home games at Petco Park',
  },
  {
    id: 'sd-gold-a',
    name: 'Gold A Membership',
    tier: 'Gold',
    gameCount: 41,
    description: '~41 home games on Mon/Wed/Fri/Sun',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [0, 1, 3, 5] },
  },
  {
    id: 'sd-gold-b',
    name: 'Gold B Membership',
    tier: 'Gold',
    gameCount: 41,
    description: '~41 home games on Mon/Tue/Thu/Sat',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 2, 4, 6] },
  },
  {
    id: 'sd-blue-w',
    name: 'Blue W Membership',
    tier: 'Blue',
    gameCount: 20,
    description: '~20 home games on Wed/Sun',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [0, 3] },
  },
  {
    id: 'sd-blue-x',
    name: 'Blue X Membership',
    tier: 'Blue',
    gameCount: 20,
    description: '~20 home games on Mon/Wed/Fri',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 3, 5] },
  },
  {
    id: 'sd-blue-y',
    name: 'Blue Y Membership',
    tier: 'Blue',
    gameCount: 20,
    description: '~20 home games on Sat/Tue',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [2, 6] },
  },
  {
    id: 'sd-blue-z',
    name: 'Blue Z Membership',
    tier: 'Blue',
    gameCount: 20,
    description: '~20 home games on Mon/Sat/Thu',
    gameSelection: 'day_of_week',
    gameFilter: { dayOfWeek: [1, 4, 6] },
  },
];

/** San Francisco Giants */
const sfPackages: SeasonPackage[] = [
  {
    ...fullSeason('SF'),
    name: 'Full Season Membership',
    description: 'All 81 home games at Oracle Park',
  },
  {
    ...halfSeason('SF', 40),
    name: 'Half Season Plan',
    description: '40 curated home games',
  },
  {
    id: 'sf-quarter',
    name: 'Quarter Season Plan',
    gameCount: 20,
    description: '20 curated home games',
    gameSelection: 'curated',
  },
  {
    id: 'sf-weekend',
    name: 'Weekend-Only Plan',
    gameCount: 28,
    description: 'Weekend home games (Fri/Sat/Sun)',
    gameSelection: 'day_of_week',
    gameFilter: { weekendsOnly: true, dayOfWeek: [0, 5, 6] },
  },
  {
    id: 'sf-rival',
    name: 'Rival-Series Package',
    gameCount: 13,
    description: 'Games against NL West divisional rivals (Dodgers, Padres, etc.)',
    gameSelection: 'opponents',
  },
  {
    id: 'sf-theme',
    name: 'Themed Package',
    gameCount: 10,
    description: 'Giveaway nights, fireworks games, and promotional events',
    gameSelection: 'curated',
  },
];

// ─── Export ──────────────────────────────────────────────

export const SEASON_PACKAGES: Record<string, SeasonPackage[]> = {
  // AL East
  BAL: balPackages,
  BOS: bosPackages,
  NYY: nyyPackages,
  TB: tbPackages,
  TOR: torPackages,
  // AL Central
  CWS: cwsPackages,
  CLE: clePackages,
  DET: detPackages,
  KC: kcPackages,
  MIN: minPackages,
  // AL West
  HOU: houPackages,
  LAA: laaPackages,
  OAK: oakPackages,
  SEA: seaPackages,
  TEX: texPackages,
  // NL East
  ATL: atlPackages,
  MIA: miaPackages,
  NYM: nymPackages,
  PHI: phiPackages,
  WSH: wshPackages,
  // NL Central
  CHC: chcPackages,
  CIN: cinPackages,
  MIL: milPackages,
  PIT: pitPackages,
  STL: stlPackages,
  // NL West
  AZ: azPackages,
  COL: colPackages,
  LAD: ladPackages,
  SD: sdPackages,
  SF: sfPackages,
};
