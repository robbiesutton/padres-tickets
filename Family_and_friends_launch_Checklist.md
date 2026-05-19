# Friends and Family Launch Checklist

Journey-shaped end-to-end verification for BenchBuddy's Friends and Family launch. Walk top to bottom in one sitting using clean, fresh accounts. For environment/infra/security setup, see `LAUNCH_CHECKLIST.md`.

## Pre-flight (do once, before anything else)
- [ ] Production env vars present in Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (= prod domain, not localhost), `RESEND_API_KEY`, `CRON_SECRET`, all four `STRIPE_*`, `AVFMS_API_KEY`
- [ ] `npx prisma migrate deploy` has run against the prod Neon DB; seed data removed
- [ ] Custom domain resolves over HTTPS; `NEXTAUTH_URL` matches it exactly (mismatches silently break magic links and Stripe redirects)
- [ ] Stripe is in **live mode** (not test); webhook endpoint in the Stripe dashboard points at prod `/api/stripe/webhook` with the matching signing secret
- [ ] Resend sending domain shows SPF/DKIM/DMARC all green; from-address matches
- [ ] `vercel.json` cron is enabled and `CRON_SECRET` matches the header the route checks

## Holder journey (fresh email, no shortcuts)
- [ ] **Signup** at `/signup` — progressive validation behaves; confirmation lands in inbox (not spam)
- [ ] **Stripe checkout** — annual plan; card charged; redirect back lands signed-in on dashboard; subscription visible in Stripe dashboard
- [ ] **Create package** at `/packages/new` — all 3 steps; team → stadium → section/row; schedule loads with real opponents and times (not placeholders)
- [ ] **Package detail** at `/dashboard/packages/[id]` — games list, activity log, summary all render; share slug is set
- [ ] **Share link** at `/share/[slug]` — opens unauthenticated in an incognito window; team colors correct; calendar + list views both work
- [ ] **Edit package** — change name / section / row; changes persist and reflect on share page
- [ ] **Transfer action** — when a claimer claims, holder gets the transfer-action email; "Mark as Transferred" one-click link works from email
- [ ] **Profile** at `/dashboard/profile` — name/email/password edits save; Stripe portal link opens
- [ ] **Cancel + resubscribe** — `/api/stripe/cancel` → state shows canceled; `/api/stripe/resubscribe` restores access

## Claimer journey (different fresh email, incognito)
- [ ] Open holder's `/share/[slug]` cold — no auth wall on browsing
- [ ] Browse games — calendar grid, list view, game expansion panel, "also plays in" bar, sold-out bar, seat info all render
- [ ] **Free-game claim** ($0) — magic-link signup → claim succeeds → no payment prompt → game appears in My Games tab
- [ ] **Paid-game claim** — payment info collected → claim succeeds → email confirmation arrives
- [ ] **Magic-link login** — fresh link from the share page; expires after 15 min as expected
- [ ] **My Games tab** — claimed game shows with correct date/opponent/section
- [ ] **Release** — release a claim → game returns to available on share page → holder notified by email
- [ ] **Unsubscribe** — `/api/email/unsubscribe` link in a marketing/transactional email actually unsubscribes

## Auth + access control (probe these explicitly)
- [ ] Hitting `/dashboard/*` while signed out redirects to login
- [ ] `/api/packages/[id]` and `/api/claims/[id]` return 403 for a non-owner / non-claimer
- [ ] Password reset: forgot → email → reset link → new password works → old password rejected
- [ ] Magic-link tokens single-use (clicking twice doesn't re-auth)
- [ ] JWT session persists across reload; signing out clears it

## Email rendering (visual check, both clients)
- [ ] Transfer-action, claim confirmation, transfer reminder, password reset, magic link — all render in **Gmail web + iOS Apple Mail** with no broken images / blown-out widths
- [ ] Reminder cron: manually hit the cron endpoint with `CRON_SECRET` for a game inside 48h and confirm the reminder fires once, not on repeated calls

## Cross-device
- [ ] iOS Safari at 375px and 428px — share page, signup, package builder, dashboard
- [ ] Android Chrome — same set
- [ ] Safari desktop + Chrome desktop — full holder + claimer pass

## Legal + content surfaces (often forgotten)
- [ ] `/privacy`, `/terms`, `/cookies`, `/acceptable-use`, `/community-guidelines`, `/do-not-sell` all render and are linked from the footer
- [ ] `/about`, `/contact`, `/faq` render; contact form (if it submits) goes somewhere real
- [ ] `not-found.tsx` and `error.tsx` both render gracefully (test by visiting a bogus `/share/xxx`)

## Observability before opening the door
- [ ] Vercel Analytics receiving pageviews from prod
- [ ] `lib/analytics.ts` — `trackEvent` is still a console.log stub; decide if that's OK for F&F or wire PostHog now
- [ ] Resend dashboard shows delivered, not bounced/spam
- [ ] Neon: connection pool + storage alert thresholds set
- [ ] A real error path (e.g. force a 500) actually surfaces in Vercel logs

## Day-of cleanup
- [ ] Delete all test accounts and test packages from prod DB
- [ ] At least one real holder + claimer account teed up for the launch announcement
- [ ] Rollback plan: know which Vercel deployment to promote back to if something goes sideways
