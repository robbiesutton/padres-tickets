# BenchBuddy — Claude Code Instructions

## Branch
Always use `mm-automated` for new product features. E2E work gets named phase branches merged into `main`.

## E2E Testing Discipline

Every session that adds or changes app code must follow these rules:

### Adding a new component or interactive element
- Add `data-testid="descriptive-name"` to every button, form field, nav item, status indicator, or key UI region
- Tests query by testid — without it, tests are brittle and break on text/style changes
- Naming convention: `kebab-case`, descriptive of the element's purpose (e.g. `game-card-claim`, `dashboard-nav`, `login-submit`)

### Adding a new page or route
Before closing out the task, check:
1. Does this page need a functional test? Add it to the appropriate spec file:
   - Public/unauthenticated page → `e2e/specs/auth-access-control.spec.ts` or `e2e/specs/legal-content.spec.ts`
   - Holder flow → `e2e/specs/holder-journey.spec.ts`
   - Claimer flow → `e2e/specs/claimer-journey.spec.ts`
   - Email → `e2e/specs/emails.spec.ts` (Vitest render test in `tests/emails/`)
2. Does this page have a stable layout worth protecting? Add a `toHaveScreenshot()` entry in `e2e/specs/visual.spec.ts`
3. Does the test need specific DB state? Add it to `prisma/seed-test.ts`

### Changing existing UI intentionally
- If you move, rename, or remove a `data-testid`: grep for it (`grep -r "the-testid" e2e/`) and update all references
- If you change visual design: remind Robbie to run `npx playwright test e2e/specs/visual.spec.ts --update-snapshots` and commit the new baseline PNGs before merging

### Never
- Delete a failing test to make CI pass — add `test.skip()` with a comment and open a Notion task instead
- Merge a PR that removes testids without updating the specs that reference them

## Test Infrastructure Quick Reference

| File | Purpose |
|------|---------|
| `e2e/specs/visual.spec.ts` | Screenshot regression — 10 key pages |
| `e2e/specs/holder-journey.spec.ts` | Holder auth + dashboard + game management |
| `e2e/specs/claimer-journey.spec.ts` | Claimer signup + share page + claim/release |
| `e2e/specs/auth-access-control.spec.ts` | Middleware redirects, route protection |
| `e2e/specs/emails.spec.ts` | Mailosaur delivery + magic link |
| `e2e/specs/legal-content.spec.ts` | Legal pages render correctly |
| `prisma/seed-test.ts` | Test DB state — holder@test.com, mark-rockies-test slug |
| `e2e/fixtures/auth.ts` | globalSetup — creates holder account + saves session |

## Notion Task DB
When creating tasks: DB ID `245209b30ee941ec9356a1c2b1750281`

## Key Secrets (all in GitHub Actions + Vercel)
`VERCEL_BYPASS_SECRET`, `NOTION_API_TOKEN`, `NOTION_VERIFICATION_DB_ID`, `NOTION_TASKS_DB_ID`, `MAILOSAUR_API_KEY`, `MAILOSAUR_SERVER_ID`, `NEON_PREVIEW_DATABASE_URL`, `VERCEL_BLOB_RW_TOKEN`
