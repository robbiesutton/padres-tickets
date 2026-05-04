/**
 * Mock data for design mode.
 * When NEXT_PUBLIC_DESIGN_MODE=true, this data is served
 * instead of querying the database, so every page renders
 * with realistic content for UI/UX iteration.
 */

export const DESIGN_MODE =
  process.env.NEXT_PUBLIC_DESIGN_MODE === 'true';

// ── Identifiers ──────────────────────────────────────────

export const MOCK_USER_ID = 'design-user-holder-001';
export const MOCK_CLAIMER_ID = 'design-user-claimer-001';
export const MOCK_PACKAGE_ID = 'design-pkg-001';
export const MOCK_SHARE_SLUG = 'padres-section203';

// ── Users ────────────────────────────────────────────────

export const mockHolder = {
  id: MOCK_USER_ID,
  firstName: 'Robbie',
  lastName: 'Sutton',
  email: 'robbie@benchbuddy.app',
  phone: '(619) 555-0142',
  isHolder: true,
  isClaimer: false,
  venmoHandle: '@robbie-sutton',
  zelleInfo: 'robbie@benchbuddy.app',
  emailVerified: new Date('2026-01-15').toISOString(),
  createdAt: new Date('2026-01-15').toISOString(),
};

export const mockClaimer = {
  id: MOCK_CLAIMER_ID,
  firstName: 'Margo',
  lastName: 'Coleman',
  email: 'margo@benchbuddy.app',
  isHolder: false,
  isClaimer: true,
};

// ── Package ──────────────────────────────────────────────

export const mockPackage = {
  id: MOCK_PACKAGE_ID,
  userId: MOCK_USER_ID,
  sport: 'MLB',
  team: 'San Diego Padres',
  section: '203',
  row: '5',
  seats: '1-2',
  seatCount: 2,
  season: '2026',
  shareLinkSlug: MOCK_SHARE_SLUG,
  status: 'ACTIVE',
  defaultPricePerTicket: 45,
  description: null,
  seatPhotoUrl: null,
  perks: [],
  createdAt: new Date('2026-02-01').toISOString(),
  updatedAt: new Date('2026-03-01').toISOString(),
  _count: { games: 20, invitations: 3 },
};

// ── Package info (for share page) ────────────────────────

export const mockPackageInfo = {
  slug: MOCK_SHARE_SLUG,
  holderName: `${mockHolder.firstName} ${mockHolder.lastName}`,
  holderEmail: mockHolder.email,
  holderPhone: mockHolder.phone,
  team: mockPackage.team,
  section: mockPackage.section,
  row: mockPackage.row,
  seats: mockPackage.seats,
  seatCount: mockPackage.seatCount,
  season: mockPackage.season,
  defaultPricePerTicket: mockPackage.defaultPricePerTicket,
  description: mockPackage.description,
  seatPhotoUrl: mockPackage.seatPhotoUrl,
  perks: mockPackage.perks,
};

// ── Games ────────────────────────────────────────────────

export const mockGames = [
  // April games
  {
    id: 'game-001',
    date: '2026-04-02T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Los Angeles Dodgers',
    opponentLogo: null,
    status: 'GOING_MYSELF',
    pricePerTicket: 65,
    notes: 'Opening Day',
    claim: null,
  },
  {
    id: 'game-002',
    date: '2026-04-04T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Los Angeles Dodgers',
    opponentLogo: null,
    status: 'CLAIMED',
    pricePerTicket: 55,
    notes: null,
    claim: {
      id: 'claim-001',
      claimerUserId: MOCK_CLAIMER_ID,
      status: 'CONFIRMED',
    },
  },
  {
    id: 'game-003',
    date: '2026-04-05T00:40:00.000Z',
    time: '5:40 PM',
    opponent: 'Los Angeles Dodgers',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 55,
    notes: null,
    claim: null,
  },
  {
    id: 'game-004',
    date: '2026-04-08T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Colorado Rockies',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  {
    id: 'game-005',
    date: '2026-04-09T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Colorado Rockies',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  {
    id: 'game-006',
    date: '2026-04-12T00:40:00.000Z',
    time: '5:40 PM',
    opponent: 'San Francisco Giants',
    opponentLogo: null,
    status: 'CLAIMED',
    pricePerTicket: 50,
    notes: null,
    claim: {
      id: 'claim-002',
      claimerUserId: 'friend-user-002',
      status: 'PENDING',
    },
  },
  {
    id: 'game-007',
    date: '2026-04-15T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Arizona Diamondbacks',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  {
    id: 'game-008',
    date: '2026-04-19T00:40:00.000Z',
    time: '5:40 PM',
    opponent: 'Chicago Cubs',
    opponentLogo: null,
    status: 'TRANSFERRED',
    pricePerTicket: 55,
    notes: 'Saturday game',
    claim: {
      id: 'claim-003',
      claimerUserId: MOCK_CLAIMER_ID,
      status: 'CONFIRMED',
    },
  },
  {
    id: 'game-009',
    date: '2026-04-22T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Pittsburgh Pirates',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 40,
    notes: null,
    claim: null,
  },
  {
    id: 'game-010',
    date: '2026-04-26T00:10:00.000Z',
    time: '5:10 PM',
    opponent: 'Atlanta Braves',
    opponentLogo: null,
    status: 'GOING_MYSELF',
    pricePerTicket: 55,
    notes: 'Fireworks night',
    claim: null,
  },
  // May games
  {
    id: 'game-011',
    date: '2026-05-01T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'New York Mets',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 50,
    notes: null,
    claim: null,
  },
  {
    id: 'game-012',
    date: '2026-05-05T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Philadelphia Phillies',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 50,
    notes: null,
    claim: null,
  },
  {
    id: 'game-013',
    date: '2026-05-09T00:40:00.000Z',
    time: '5:40 PM',
    opponent: 'San Francisco Giants',
    opponentLogo: null,
    status: 'CLAIMED',
    pricePerTicket: 50,
    notes: 'Rivalry weekend',
    claim: {
      id: 'claim-004',
      claimerUserId: MOCK_CLAIMER_ID,
      status: 'CONFIRMED',
    },
  },
  {
    id: 'game-014',
    date: '2026-05-13T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Milwaukee Brewers',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  {
    id: 'game-015',
    date: '2026-05-17T00:10:00.000Z',
    time: '5:10 PM',
    opponent: 'Los Angeles Dodgers',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 65,
    notes: 'Bobblehead giveaway',
    claim: null,
  },
  {
    id: 'game-016',
    date: '2026-05-22T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Cincinnati Reds',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  // June games
  {
    id: 'game-017',
    date: '2026-06-02T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Arizona Diamondbacks',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 45,
    notes: null,
    claim: null,
  },
  {
    id: 'game-018',
    date: '2026-06-06T00:40:00.000Z',
    time: '5:40 PM',
    opponent: 'Texas Rangers',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 50,
    notes: 'Interleague play',
    claim: null,
  },
  {
    id: 'game-019',
    date: '2026-06-13T00:10:00.000Z',
    time: '5:10 PM',
    opponent: 'St. Louis Cardinals',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 50,
    notes: null,
    claim: null,
  },
  {
    id: 'game-020',
    date: '2026-06-20T02:10:00.000Z',
    time: '7:10 PM',
    opponent: 'Los Angeles Dodgers',
    opponentLogo: null,
    status: 'AVAILABLE',
    pricePerTicket: 65,
    notes: null,
    claim: null,
  },
];

// ── Games with full claim details (for dashboard API) ────

export const mockGamesWithClaims = mockGames.map((g) => ({
  ...g,
  packageId: MOCK_PACKAGE_ID,
  claim: g.claim
    ? {
        ...g.claim,
        paymentStatus: g.status === 'TRANSFERRED' ? 'PAID' : 'UNPAID',
        transferStatus: g.status === 'TRANSFERRED' ? 'ACCEPTED' : 'NOT_STARTED',
        claimedAt: new Date('2026-03-10').toISOString(),
        claimer:
          g.claim.claimerUserId === MOCK_CLAIMER_ID
            ? { firstName: mockClaimer.firstName, lastName: mockClaimer.lastName, email: mockClaimer.email }
            : { firstName: 'Jake', lastName: 'Thompson', email: 'jake@example.com' },
      }
    : null,
}));

// ── Dashboard summary ────────────────────────────────────

export const mockSummary = {
  totalGames: 20,
  gamesAvailable: 12,
  gamesClaimed: 3,
  gamesTransferred: 1,
  gamesComplete: 0,
  gamesGoingMyself: 2,
  gamesShared: 16,
  gamesUnused: 0,
  revenueCollected: 90,
  claimersCount: 3,
};

// ── Activity log ─────────────────────────────────────────

export const mockActivities = [
  {
    id: 'act-001',
    packageId: MOCK_PACKAGE_ID,
    type: 'CLAIM_CREATED',
    description: 'Margo Coleman claimed Padres vs Giants on May 9',
    metadata: null,
    createdAt: new Date('2026-03-20T14:30:00Z').toISOString(),
  },
  {
    id: 'act-002',
    packageId: MOCK_PACKAGE_ID,
    type: 'TRANSFER_UPDATED',
    description: 'Tickets transferred to Margo Coleman for Padres vs Cubs on Apr 19',
    metadata: null,
    createdAt: new Date('2026-03-18T10:15:00Z').toISOString(),
  },
  {
    id: 'act-003',
    packageId: MOCK_PACKAGE_ID,
    type: 'PAYMENT_UPDATED',
    description: 'Margo Coleman marked payment as sent for Padres vs Cubs on Apr 19',
    metadata: null,
    createdAt: new Date('2026-03-17T09:00:00Z').toISOString(),
  },
  {
    id: 'act-004',
    packageId: MOCK_PACKAGE_ID,
    type: 'CLAIM_CREATED',
    description: 'Jake Thompson claimed Padres vs Giants on Apr 12',
    metadata: null,
    createdAt: new Date('2026-03-15T16:45:00Z').toISOString(),
  },
  {
    id: 'act-005',
    packageId: MOCK_PACKAGE_ID,
    type: 'CLAIM_CREATED',
    description: 'Margo Coleman claimed Padres vs Dodgers on Apr 4',
    metadata: null,
    createdAt: new Date('2026-03-10T11:20:00Z').toISOString(),
  },
  {
    id: 'act-006',
    packageId: MOCK_PACKAGE_ID,
    type: 'GAME_ADDED',
    description: '20 games loaded from Padres 2026 home schedule',
    metadata: null,
    createdAt: new Date('2026-02-01T08:00:00Z').toISOString(),
  },
];

// ── My Games (claimer view) ──────────────────────────────

export const mockMyClaims = [
  {
    id: 'claim-001',
    status: 'CONFIRMED',
    claimedAt: new Date('2026-03-10').toISOString(),
    paymentStatus: 'PAID',
    transferStatus: 'NOT_STARTED',
    game: {
      id: 'game-002',
      date: '2026-04-04T02:10:00.000Z',
      time: '7:10 PM',
      opponent: 'Los Angeles Dodgers',
      pricePerTicket: 55,
      notes: null,
    },
    package: {
      team: 'San Diego Padres',
      section: '203',
      row: '5',
      seats: '1-2',
      seatCount: 2,
      season: '2026',
    },
    holder: { firstName: 'Robbie', lastName: 'Sutton' },
  },
  {
    id: 'claim-003',
    status: 'CONFIRMED',
    claimedAt: new Date('2026-03-12').toISOString(),
    paymentStatus: 'PAID',
    transferStatus: 'ACCEPTED',
    game: {
      id: 'game-008',
      date: '2026-04-19T00:40:00.000Z',
      time: '5:40 PM',
      opponent: 'Chicago Cubs',
      pricePerTicket: 55,
      notes: 'Saturday game',
    },
    package: {
      team: 'San Diego Padres',
      section: '203',
      row: '5',
      seats: '1-2',
      seatCount: 2,
      season: '2026',
    },
    holder: { firstName: 'Robbie', lastName: 'Sutton' },
  },
  {
    id: 'claim-004',
    status: 'CONFIRMED',
    claimedAt: new Date('2026-03-20').toISOString(),
    paymentStatus: 'UNPAID',
    transferStatus: 'NOT_STARTED',
    game: {
      id: 'game-013',
      date: '2026-05-09T00:40:00.000Z',
      time: '5:40 PM',
      opponent: 'San Francisco Giants',
      pricePerTicket: 50,
      notes: 'Rivalry weekend',
    },
    package: {
      team: 'San Diego Padres',
      section: '203',
      row: '5',
      seats: '1-2',
      seatCount: 2,
      season: '2026',
    },
    holder: { firstName: 'Robbie', lastName: 'Sutton' },
  },
];

// ── Opponents list (for share page filters) ──────────────

export const mockOpponents = [
  'Arizona Diamondbacks',
  'Atlanta Braves',
  'Chicago Cubs',
  'Cincinnati Reds',
  'Colorado Rockies',
  'Los Angeles Dodgers',
  'Milwaukee Brewers',
  'New York Mets',
  'Philadelphia Phillies',
  'Pittsburgh Pirates',
  'San Francisco Giants',
  'St. Louis Cardinals',
  'Texas Rangers',
];
