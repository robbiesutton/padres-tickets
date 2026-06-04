import { describe, it, expect } from 'vitest';
import { buildMagicLinkEmail } from '@/lib/emails/auth-email';
import { buildClaimConfirmationEmail } from '@/lib/emails/claim-confirmation';
import { buildTransferActionEmail } from '@/lib/emails/transfer-action';
import { buildClaimerWelcomeEmail } from '@/lib/emails/claimer-welcome';
import {
  buildClaimerGameDayEmail,
  buildHolderGameDayClaimedEmail,
  buildHolderGameDayAvailableEmail,
  buildHolderGameDayGoingEmail,
  buildClaimerUnclaimedEmail,
} from '@/lib/emails/game-day';

// LAUNCH_CHECKLIST: Claim confirmation + transfer action emails render correctly.
// These tests verify the templates produce valid HTML with no undefined interpolations.

describe('Email templates', () => {
  describe('auth-email — magic link', () => {
    it('renders without errors', () => {
      const result = buildMagicLinkEmail('Mark', 'https://example.com/magic?token=abc123');
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject contains expected text', () => {
      const result = buildMagicLinkEmail('Mark', 'https://example.com/magic?token=abc123');
      expect(result.subject).toMatch(/sign.?in|login|access/i);
    });

    it('body contains the magic link URL', () => {
      const url = 'https://example.com/magic?token=abc123';
      const result = buildMagicLinkEmail('Mark', url);
      expect(result.html).toContain(url);
    });

    it('body does not contain "undefined"', () => {
      const result = buildMagicLinkEmail('Mark', 'https://example.com/magic?token=abc');
      expect(result.html).not.toContain('undefined');
    });

    it('contains expiry notice', () => {
      const result = buildMagicLinkEmail('Mark', 'https://example.com/magic?token=abc');
      expect(result.html).toMatch(/15 minutes|expire/i);
    });
  });

  describe('claim-confirmation', () => {
    const baseData = {
      claimerName: 'Sarah Chen',
      holderName: 'Mark Thompson',
      team: 'Colorado Rockies',
      opponent: 'Los Angeles Dodgers',
      gameDate: 'Friday, July 10, 2026',
      section: '143',
      row: '10',
      seatCount: 2,
      pricePerTicket: 45 as number | null,
      venmoHandle: null as string | null,
      zelleInfo: null as string | null,
      myGamesUrl: 'https://benchbuddy.app/dashboard/my-games',
    };

    it('renders without errors', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject references team and opponent', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.subject).toMatch(/Rockies|Dodgers|claimed/i);
    });

    it('body contains claimer name', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.html).toContain('Sarah');
    });

    it('body contains holder name', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.html).toContain('Mark');
    });

    it('body contains My Games link', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.html).toContain('benchbuddy.app/dashboard/my-games');
    });

    it('body does not contain "undefined"', () => {
      const result = buildClaimConfirmationEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });

    it('renders correctly for free game (pricePerTicket = null)', () => {
      const result = buildClaimConfirmationEmail({ ...baseData, pricePerTicket: null });
      expect(result.html).toBeTruthy();
      expect(result.html).not.toContain('undefined');
    });

    it('renders correctly with null row', () => {
      const result = buildClaimConfirmationEmail({ ...baseData, row: null });
      expect(result.html).toBeTruthy();
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('transfer-action', () => {
    const baseData = {
      holderFirstName: 'Mark',
      claimerName: 'Sarah Chen',
      claimerEmail: 'sarah@example.com',
      team: 'Colorado Rockies',
      opponent: 'Los Angeles Dodgers',
      gameDate: 'Friday, July 10, 2026',
      section: '143',
      row: '10',
      seats: '3-4',
      seatCount: 2,
      pricePerTicket: 45 as number | null,
      platformName: 'MLB Ballpark',
      transferSteps: ['Open the MLB Ballpark app', 'Go to Tickets', 'Tap "Transfer"'],
      transferDeepLink: 'https://mlb.com/transfer',
      markTransferredUrl: 'https://benchbuddy.app/api/games/xyz/mark-transferred?token=abc',
    };

    it('renders without errors', () => {
      const result = buildTransferActionEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject references team and claimer', () => {
      const result = buildTransferActionEmail(baseData);
      expect(result.subject).toMatch(/Rockies|Dodgers|transfer|Sarah/i);
    });

    it('body contains mark-transferred URL', () => {
      const result = buildTransferActionEmail(baseData);
      expect(result.html).toContain('mark-transferred');
    });

    it('body contains platform name', () => {
      const result = buildTransferActionEmail(baseData);
      expect(result.html).toContain('MLB Ballpark');
    });

    it('body does not contain "undefined"', () => {
      const result = buildTransferActionEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });

    it('renders correctly for free game (pricePerTicket = null)', () => {
      const result = buildTransferActionEmail({ ...baseData, pricePerTicket: null });
      expect(result.html).toBeTruthy();
      expect(result.html).not.toContain('undefined');
    });

    it('renders correctly with null row', () => {
      const result = buildTransferActionEmail({ ...baseData, row: null });
      expect(result.html).toBeTruthy();
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('claimer-welcome', () => {
    const baseData = {
      claimerFirstName: 'Sarah',
      holderFirstName: 'Mark',
      team: 'Colorado Rockies',
      shareUrl: 'https://getbenchbuddy.com/share/mark-rockies-test',
      claimerEmail: 'sarah@example.com',
    };

    it('renders without errors', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions holder and team', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.subject).toMatch(/Mark|Rockies/i);
    });

    it('body contains claimer first name', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.html).toContain('Sarah');
    });

    it('body contains share URL', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.html).toContain('mark-rockies-test');
    });

    it('body contains claimer email', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.html).toContain('sarah@example.com');
    });

    it('body does not contain "undefined"', () => {
      const result = buildClaimerWelcomeEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('game-day — claimer reminder', () => {
    const baseData = {
      claimerFirstName: 'Sarah',
      opponent: 'Los Angeles Dodgers',
      gameDayStr: 'Friday, July 10',
      timeVenue: '6:40 PM · Coors Field',
      section: '143',
      row: '10' as string | null,
      seatNumbers: '3-4',
    };

    it('renders without errors', () => {
      const result = buildClaimerGameDayEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions opponent', () => {
      const result = buildClaimerGameDayEmail(baseData);
      expect(result.subject).toMatch(/Dodgers|today/i);
    });

    it('body contains seat info', () => {
      const result = buildClaimerGameDayEmail(baseData);
      expect(result.html).toContain('143');
    });

    it('body does not contain "undefined"', () => {
      const result = buildClaimerGameDayEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });

    it('renders without row (general admission)', () => {
      const result = buildClaimerGameDayEmail({ ...baseData, row: null, seatNumbers: undefined });
      expect(result.html).toBeTruthy();
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('game-day — holder game claimed', () => {
    const baseData = {
      holderFirstName: 'Mark',
      claimerName: 'Sarah Chen',
      opponent: 'Los Angeles Dodgers',
      gameDayStr: 'Friday, July 10',
      timeVenue: '6:40 PM · Coors Field',
      dashboardUrl: 'https://getbenchbuddy.com/dashboard',
    };

    it('renders without errors', () => {
      const result = buildHolderGameDayClaimedEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions claimer name', () => {
      const result = buildHolderGameDayClaimedEmail(baseData);
      expect(result.subject).toContain('Sarah');
    });

    it('body contains dashboard link', () => {
      const result = buildHolderGameDayClaimedEmail(baseData);
      expect(result.html).toContain('dashboard');
    });

    it('body does not contain "undefined"', () => {
      const result = buildHolderGameDayClaimedEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('game-day — holder game available', () => {
    const baseData = {
      holderFirstName: 'Mark',
      opponent: 'Los Angeles Dodgers',
      gameDayStr: 'Friday, July 10',
      timeVenue: '6:40 PM · Coors Field',
      dashboardUrl: 'https://getbenchbuddy.com/dashboard',
    };

    it('renders without errors', () => {
      const result = buildHolderGameDayAvailableEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions opponent and available', () => {
      const result = buildHolderGameDayAvailableEmail(baseData);
      expect(result.subject).toMatch(/Dodgers|available/i);
    });

    it('body does not contain "undefined"', () => {
      const result = buildHolderGameDayAvailableEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('game-day — holder going myself', () => {
    const baseData = {
      holderFirstName: 'Mark',
      opponent: 'Los Angeles Dodgers',
      gameDayStr: 'Friday, July 10',
      timeVenue: '6:40 PM · Coors Field',
    };

    it('renders without errors', () => {
      const result = buildHolderGameDayGoingEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions opponent', () => {
      const result = buildHolderGameDayGoingEmail(baseData);
      expect(result.subject).toMatch(/Dodgers/i);
    });

    it('body does not contain "undefined"', () => {
      const result = buildHolderGameDayGoingEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });
  });

  describe('game-day — claimer unclaimed notification', () => {
    const baseData = {
      claimerFirstName: 'Sarah',
      holderFirstName: 'Mark',
      opponent: 'Los Angeles Dodgers',
      gameDayStr: 'Friday, July 10',
      timeVenue: '6:40 PM · Coors Field',
      shareUrl: 'https://getbenchbuddy.com/share/mark-rockies-test',
    };

    it('renders without errors', () => {
      const result = buildClaimerUnclaimedEmail(baseData);
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    it('subject mentions opponent', () => {
      const result = buildClaimerUnclaimedEmail(baseData);
      expect(result.subject).toMatch(/Dodgers|no longer/i);
    });

    it('body mentions holder name', () => {
      const result = buildClaimerUnclaimedEmail(baseData);
      expect(result.html).toContain('Mark');
    });

    it('body contains share URL', () => {
      const result = buildClaimerUnclaimedEmail(baseData);
      expect(result.html).toContain('mark-rockies-test');
    });

    it('body does not contain "undefined"', () => {
      const result = buildClaimerUnclaimedEmail(baseData);
      expect(result.html).not.toContain('undefined');
    });
  });
});
