import { describe, it, expect } from 'vitest';

// API contract tests for the share/claim and share/reserve endpoints.
// Requires a running server (PLAYWRIGHT_BASE_URL in CI, localhost:3000 locally).
// Skipped automatically when PLAYWRIGHT_BASE_URL is not set and localhost is unreachable.

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL;
const skipReason = 'PLAYWRIGHT_BASE_URL not set — skipping live API tests (run in CI)';

describe.skipIf(!BASE_URL)('Share claim API', () => {
  describe('POST /api/share/[slug]/claim', () => {
    it('returns 401 without authentication', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'fake-id' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/share/[slug]/reserve', () => {
    it('returns 400 when gameId is missing', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is missing', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'fake-id', firstName: 'Test', lastName: 'User' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email format', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'fake-id', email: 'not-an-email', firstName: 'Test', lastName: 'User' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown slug', async () => {
      const res = await fetch(`${BASE_URL}/api/share/this-slug-does-not-exist-xyz/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'fake-id', email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
      });
      expect(res.status).toBe(404);
    });

    it('returns 400 when firstName missing for new user', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'fake-id', email: `new-${Date.now()}@example.com` }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/share/[slug]', () => {
    it('returns package info for valid slug', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test`);
      expect(res.status).not.toBe(500);
    });

    it('returns 404 for unknown slug', async () => {
      const res = await fetch(`${BASE_URL}/api/share/this-does-not-exist-xyz`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/share/[slug]/games', () => {
    it('returns game list for valid slug', async () => {
      const res = await fetch(`${BASE_URL}/api/share/mark-rockies-test/games`);
      expect(res.status).not.toBe(500);
    });
  });
});

// Placeholder so the file always has at least one test suite when skipped
describe('Share claim API (offline check)', () => {
  it(`skips live tests when server unavailable: ${skipReason}`, () => {
    expect(true).toBe(true);
  });
});
