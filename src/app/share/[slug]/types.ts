export interface Game {
  id: string;
  date: string; // ISO string
  time: string | null;
  opponent: string;
  opponentLogo: string | null;
  status: string;
  pricePerTicket: number | null;
  notes: string | null;
  claim: {
    id: string;
    claimerUserId: string;
    status: string;
  } | null;
}

export interface PackageInfo {
  slug: string;
  holderName: string;
  holderEmail: string | null;
  holderPhone: string | null;
  team: string;
  section: string;
  row: string | null;
  seats: string;
  seatCount: number;
  season: string;
  defaultPricePerTicket: number | null;
  description: string | null;
  seatPhotoUrl: string | null;
  perks: string[];
}

export type ViewMode = 'calendar' | 'list';
export type ActiveTab = 'available' | 'my-games';

export type ReserveFlowStep =
  | { step: 'details' }
  | { step: 'email' }
  | { step: 'sending' }
  | { step: 'check-email'; email: string }
  | { step: 'confirmed' }
  | { step: 'error'; message: string };

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  label: string;
  startDayOfWeek: number; // 0=Sun
  daysInMonth: number;
}

export interface CalendarCell {
  day: number;
  game: Game | null;
}

export interface MyGameClaim {
  id: string;
  gameId: string;
  status: string;
  paymentStatus: string;
  transferStatus: string;
  claimedAt: string;
  game: {
    opponent: string;
    date: string;
    time: string | null;
    pricePerTicket: number | null;
  };
}
