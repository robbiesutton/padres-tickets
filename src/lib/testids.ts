// Central source of truth for all data-testid values used by E2E tests.
//
// Both source components and E2E specs import from here. If a testid is
// removed or renamed, TypeScript compile errors surface in both places
// simultaneously — making it impossible to silently drop a selector during
// a component rewrite.
//
// Usage in source:  data-testid={TESTIDS.joinEmail}
// Usage in E2E:     page.getByTestId(TESTIDS.joinEmail)

export const TESTIDS = {
  // ── Join / Signup ────────────────────────────────────────────────────
  joinFirstName: 'join-first-name',
  joinLastName: 'join-last-name',
  joinEmail: 'join-email',
  joinPhone: 'join-phone',
  joinPassword: 'join-password',
  joinTermsCheckbox: 'join-terms-checkbox',
  joinSubmit: 'join-submit',
  joinError: 'join-error',

  // ── Dashboard ────────────────────────────────────────────────────────
  dashboardNav: 'dashboard-nav',
  accountAvatar: 'account-avatar',
  packageSwitcher: 'package-switcher',

  // ── Package wizard ───────────────────────────────────────────────────
  packageStep1Continue: 'package-step1-continue',
  packageStep2Continue: 'package-step2-continue',
  packageStep3Finish: 'package-step3-finish',

  // ── Share page ───────────────────────────────────────────────────────
  viewToggleCalendar: 'view-toggle-calendar',
  viewToggleList: 'view-toggle-list',
  gameList: 'game-list',
  gameCard: 'game-card',
  gameCardClaim: 'game-card-claim',
  gameStatusPill: 'game-status-pill',

  // ── Login ────────────────────────────────────────────────────────────
  loginEmail: 'login-email',
} as const;

export type TestId = (typeof TESTIDS)[keyof typeof TESTIDS];
