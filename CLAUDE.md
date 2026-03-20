# BenchBuddies — Season Ticket Sharing Platform

## What This Is

A multi-tenant platform for season ticket holders to share games with friends. Holders upload their schedule, friends browse and claim games via a share link, then tickets get transferred and payment collected.

Started as "Sutton Padres Tickets" (single-tenant), now evolving into **BenchBuddies** — a universal platform for any team/league/sport.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3, WAL mode, foreign keys ON)
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Auth:** bcrypt + session cookies (30-day expiry)
- **AI:** Anthropic Claude API for OCR of ticket schedule images
- **Payments:** Venmo deep links (web + app)
- **Automation:** Playwright for headless Ticketmaster transfers (Auto Mode)
- **Encryption:** AES-256-GCM for stored credentials

## Running

```bash
npm start          # node server.js (port 3000)
npm run dev        # node --watch server.js
```

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DATABASE_PATH` | `tickets.db` | SQLite database file |
| `ANTHROPIC_API_KEY` | — | Claude API for schedule OCR |
| `APP_URL` | `http://localhost:3000` | Base URL for email links |
| `EMAIL_PROVIDER` | — | `'resend'` to enable real emails |
| `RESEND_API_KEY` | — | Resend API key (if using Resend) |
| `ENCRYPTION_SECRET` | dev default | AES key derivation secret (change in prod) |

## Architecture

### V1 vs V2 Schema

The database has **two generations** of tables running side-by-side. V1 is the original single-tenant schema; V2 is the multi-tenant expansion. Both are active — the v1 routes still work for the existing Padres deployment.

**V1 tables** (single-tenant): `accounts`, `sessions`, `games`, `claims`
- One account = one person = one share link
- URL: `/u/{slug}` → public game list

**V2 tables** (multi-tenant): `users`, `sessions_v2`, `leagues`, `teams`, `ticketing_platforms`, `games_v2`, `ticket_packages`, `listings`, `package_access`, `claims_v2`, `activity_log`, `notification_log`, `notification_preferences`, `subscriptions`, `connected_accounts`
- Decouples identity from ticket ownership
- `ticket_packages` = the shareable unit (replaces `accounts`)
- `listings` = per-game availability within a package
- `claims_v2` has `payment_status` and `transfer_status` columns

### Core V2 Data Flow

1. **User** signs up → owns **ticket_packages** (per team/season/section)
2. **Package** has a slug for sharing → generates **listings** per game
3. **Visitor** browses `/u/{slug}` → sees available listings
4. **Visitor** claims a listing → creates **claim_v2** → triggers notifications
5. **Owner** transfers tickets (manual via app or auto via Playwright)
6. **Owner** marks transferred → claimer notified → claimer accepts

### Listing Statuses

`available` → `claimed` → `transferred` → `complete`

Also: `going_myself`, `sold_elsewhere`, `unavailable`

### Payment Statuses (on claims_v2)

`none` → `pending` → `requested` → `paid`

### Transfer Statuses (on claims_v2)

`pending` → `transferred` → `confirmed`

## File Structure

```
server.js              # Express app, all API routes
db.js                  # Schema + all query functions (single file)

lib/
  notifications.js     # Email orchestration, reminders, template rendering
  transfer.js          # Transfer instructions from ticketing_platforms table
  auto-transfer.js     # Playwright Ticketmaster automation + queue
  venmo.js             # Venmo deep link generator
  crypto.js            # AES-256-GCM encrypt/decrypt
  email-templates/     # HTML email templates with {{mustache}} syntax
    transfer-action.html      # Holder: "transfer tickets to X"
    claim-confirmation.html   # Claimer: "you claimed tickets"
    transfer-reminder.html    # Holder: gentle + urgent variants
    transfer-complete.html    # Claimer: "tickets are on the way"
    payment-request.html      # Claimer: standalone payment request

data/
  teams.js             # Seed data: 30 MLB teams + 3 ticketing platforms
  games.js             # 2026 Padres schedule (seed data)

public/
  index.html           # Landing page
  login.html           # Login form
  signup.html          # Signup form
  dashboard.html       # Owner dashboard (games, claims, upload, settings)
  tickets.html         # Public ticket page (calendar, game list, claim modal)
  css/style.css        # All styles (~860 lines, Padres brown/gold branding)
  js/
    app.js             # Landing page
    auth.js            # Login/signup logic
    dashboard.js       # Owner dashboard tabs + CRUD
    ticket-page.js     # Public browsing + claim flow

migrate-to-v2.js       # v1 → v2 migration (non-destructive)
migrate-padres.js       # Demo data seeder
```

## API Routes

### Auth — `/api/auth`
- `POST /signup` — create account + session
- `POST /login` — authenticate
- `POST /logout` — clear session
- `GET /me` — current user (protected)

### Owner — `/api/owner` (requires auth)
- `GET|POST /games` — list or add games
- `PUT|DELETE /games/:id` — update or delete
- `POST /games/bulk` — bulk add from array
- `POST /games/parse-image` — OCR via Claude
- `GET /claims` — all claims on owner's games
- `POST /unclaim/:gameId` — release a claim
- `GET|PUT /settings` — account settings

### Public — `/api/u/:slug` (no auth)
- `GET /info` — account display info
- `GET /games` — available games
- `POST /claim` — claim a ticket
- `GET /my-games?email=` — lookup by email

### Transfers — `/api/transfers` (requires auth)
- `POST|GET /:listingId/mark-transferred` — mark tickets sent
- `GET /pending` — owner's pending transfers
- `PUT /:claimId/payment` — update payment status

### Utility
- `GET /api/venmo/link?handle=&amount=&note=` — generate Venmo URL
- `GET /api/transfer-instructions/:teamId` — platform-specific steps

### Connected Accounts (Auto Mode) — `/api/connected-accounts`
- `POST /connect` — store encrypted TM credentials
- `POST /disconnect` — delete credentials
- `GET /status` — connection check
- `POST /sync` — trigger inventory sync (placeholder)

## Transfer System

### Manual Mode (default)
Holder gets an email with: claimer's email, step-by-step Ballpark app instructions, deep link to ticketing platform, "Mark as Transferred" button. They do the transfer themselves.

### Auto Mode (experimental)
Holder connects Ticketmaster credentials → BenchBuddies uses Playwright to navigate TM and transfer programmatically. Falls back to manual on any failure.

### Notification Flow
1. Claim → holder gets `transfer-action` email + claimer gets `claim-confirmation` email
2. +24h → holder gets gentle reminder (if not transferred)
3. Game-48h → holder gets urgent reminder (if not transferred)
4. Owner marks transferred → claimer gets `transfer-complete` email
5. All notifications logged to `notification_log` (no duplicates)

Email sending is **console-only in dev**. Set `EMAIL_PROVIDER=resend` for production.

## Conventions

- **DB tables:** snake_case
- **JS:** camelCase functions, PascalCase constructors
- **CSS:** kebab-case classes
- **Slugs:** lowercase letters, numbers, hyphens (3-40 chars)
- **Timestamps:** ISO 8601 strings via `datetime('now')`
- **Soft deletes:** `released_at` field (not row deletion)
- **Errors:** 400/401/403/404/409/500 with `{ error: "message" }`
- **Auth middleware:** `ownerAuth` checks session cookie → attaches `req.account`

## Seed Data

- All 30 MLB teams with colors, venues, timezones, ticketing platforms
- 3 ticketing platforms (Ticketmaster, AXS, SeatGeek) with transfer instructions
- Padres team has `transfer_app: 'ballpark'` and `account_manager_slug: 'padres'`

## Not Yet Implemented

- Subscriptions/billing (table exists, no routes)
- SMS notifications (fields in `notification_preferences`, no Twilio integration)
- Password reset flow (table exists, no routes)
- Google/Apple SSO (fields on `users`, no OAuth)
- V2 frontend (dashboard + public pages still use v1 API routes)
- Inventory sync from Ticketmaster (placeholder in auto-transfer)
- Claimer-side "confirm received" UI
