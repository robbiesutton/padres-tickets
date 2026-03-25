/**
 * In-memory store for design mode claims.
 * Persists across API calls within the same server process,
 * resets on server restart.
 */
import { mockMyClaims, mockGames, mockPackage, mockHolder, MOCK_USER_ID } from './mock-data';

export interface DesignClaim {
  id: string;
  gameId: string;
  status: string;
  paymentStatus: string;
  transferStatus: string;
  claimedAt: string;
  game: {
    id: string;
    opponent: string;
    date: string;
    time: string | null;
    pricePerTicket: number | null;
  };
}

// Initialize with existing mock claims
const initialClaims: DesignClaim[] = mockMyClaims.map((c) => ({
  id: c.id,
  gameId: c.game.id,
  status: c.status,
  paymentStatus: c.paymentStatus,
  transferStatus: c.transferStatus,
  claimedAt: c.claimedAt,
  game: {
    id: c.game.id,
    opponent: c.game.opponent,
    date: c.game.date,
    time: c.game.time,
    pricePerTicket: c.game.pricePerTicket,
  },
}));

const claims: DesignClaim[] = [...initialClaims];
let nextId = 100;

export function getDesignClaims(): DesignClaim[] {
  return [...claims];
}

export function addDesignClaim(gameId: string): { success: boolean; claim?: DesignClaim; error?: string } {
  if (claims.some((c) => c.gameId === gameId)) {
    return { success: false, error: 'Game already reserved' };
  }

  const game = mockGames.find((g) => g.id === gameId);
  if (!game) {
    return { success: false, error: 'Game not found in this package' };
  }

  const claim: DesignClaim = {
    id: `design-claim-${nextId++}`,
    gameId,
    status: 'CONFIRMED',
    paymentStatus: 'UNPAID',
    transferStatus: 'NOT_STARTED',
    claimedAt: new Date().toISOString(),
    game: {
      id: game.id,
      opponent: game.opponent,
      date: game.date,
      time: game.time,
      pricePerTicket: game.pricePerTicket,
    },
  };

  claims.push(claim);
  return { success: true, claim };
}

export function removeDesignClaim(claimId: string): { success: boolean; error?: string } {
  const idx = claims.findIndex((c) => c.id === claimId);
  if (idx === -1) {
    return { success: false, error: 'Claim not found' };
  }
  claims.splice(idx, 1);
  return { success: true };
}
