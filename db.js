const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'tickets.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      team_name TEXT NOT NULL,
      venue_name TEXT,
      section TEXT,
      season TEXT,
      tickets_per_game INTEGER NOT NULL DEFAULT 2,
      primary_color TEXT DEFAULT '#2F241D',
      accent_color TEXT DEFAULT '#FFC425',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      date TEXT NOT NULL,
      display_date TEXT NOT NULL,
      opponent TEXT NOT NULL,
      giveaway TEXT,
      price REAL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(account_id, date)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id),
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      claimed_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      UNIQUE(game_id)
    );

    CREATE INDEX IF NOT EXISTS idx_games_account ON games(account_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);

  // === V2 Tables ===
  db.exec(`
    -- Identity layer
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT,                    -- NULL for light/magic-link accounts (AUTH-05)
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      phone           TEXT,
      slug            TEXT UNIQUE,
      avatar_url      TEXT,
      venmo_handle    TEXT,                    -- PAY-01
      zelle_info      TEXT,                    -- PAY-01: phone or email for Zelle
      google_id       TEXT UNIQUE,             -- AUTH-02: Google SSO
      apple_id        TEXT UNIQUE,             -- AUTH-03: Apple SSO
      email_verified  INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions_v2 (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      token       TEXT NOT NULL UNIQUE,
      expires_at  TEXT NOT NULL,
      used_at     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sports reference data
    CREATE TABLE IF NOT EXISTS leagues (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      name    TEXT NOT NULL UNIQUE,
      sport   TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'US'
    );

    CREATE TABLE IF NOT EXISTS ticketing_platforms (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      name                    TEXT NOT NULL UNIQUE,    -- 'Ticketmaster', 'AXS', 'SeatGeek'
      transfer_method         TEXT,                    -- 'email', 'in-app'
      transfer_url_template   TEXT,                    -- deep link template
      transfer_instructions   TEXT,                    -- step-by-step (markdown)
      accept_instructions     TEXT                     -- instructions for claimer to accept
    );

    CREATE TABLE IF NOT EXISTS teams (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id             INTEGER NOT NULL REFERENCES leagues(id),
      name                  TEXT NOT NULL,
      city                  TEXT NOT NULL,
      full_name             TEXT NOT NULL,
      abbreviation          TEXT,
      venue_name            TEXT,
      primary_color         TEXT,
      accent_color          TEXT,
      logo_url              TEXT,
      time_zone             TEXT NOT NULL DEFAULT 'America/Los_Angeles',
      ticketing_platform_id INTEGER REFERENCES ticketing_platforms(id)
    );

    -- Master game schedule
    CREATE TABLE IF NOT EXISTS games_v2 (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id          INTEGER NOT NULL REFERENCES teams(id),
      season           TEXT NOT NULL,
      game_date        TEXT NOT NULL,
      game_time        TEXT,
      opponent         TEXT NOT NULL,
      opponent_team_id INTEGER REFERENCES teams(id),
      giveaway         TEXT,
      is_home          INTEGER NOT NULL DEFAULT 1,
      game_number      INTEGER NOT NULL DEFAULT 1,   -- for doubleheaders
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(team_id, season, game_date, game_number)
    );

    -- Ticket packages (replaces accounts as ownership unit)
    CREATE TABLE IF NOT EXISTS ticket_packages (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id           INTEGER NOT NULL REFERENCES users(id),
      team_id            INTEGER NOT NULL REFERENCES teams(id),
      season             TEXT NOT NULL,
      section            TEXT,
      row                TEXT,
      seats              TEXT,                         -- '7,8' or freeform
      tickets_per_game   INTEGER NOT NULL DEFAULT 2,
      slug               TEXT NOT NULL UNIQUE,
      display_name       TEXT,
      primary_color      TEXT,
      accent_color       TEXT,
      default_price      REAL,                         -- PKG-04: default price per ticket
      default_split_rule TEXT NOT NULL DEFAULT 'all',  -- PKG-07: 'all' or 'individual'
      package_type       TEXT,                         -- 'full', 'half', 'partial', 'custom'
      transfer_mode      TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'auto'
      link_active        INTEGER NOT NULL DEFAULT 1,   -- SHR-06: can deactivate share link
      is_active          INTEGER NOT NULL DEFAULT 1,   -- archive/deactivate package
      created_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Per-game availability per package
    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id  INTEGER NOT NULL REFERENCES ticket_packages(id),
      game_id     INTEGER NOT NULL REFERENCES games_v2(id),
      status      TEXT NOT NULL DEFAULT 'available',
          -- available, going_myself, claimed, transferred, complete,
          -- sold_elsewhere, unavailable
      price       REAL,                  -- overrides package default_price
      num_tickets INTEGER,               -- override package tickets_per_game if splitting
      split_rule  TEXT,                   -- override package default_split_rule per game
      notes       TEXT,                   -- visible to claimers (PKG-08)
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(package_id, game_id)
    );

    -- Package access (tracks who has interacted with a package)
    CREATE TABLE IF NOT EXISTS package_access (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id      INTEGER NOT NULL REFERENCES ticket_packages(id),
      user_id         INTEGER NOT NULL REFERENCES users(id),
      invited_email   TEXT,                    -- original invite email (if via invitation)
      invited_by      INTEGER REFERENCES users(id),
      access_type     TEXT NOT NULL DEFAULT 'link',  -- 'link' (via share URL) or 'invite'
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(package_id, user_id)
    );

    -- Claims
    CREATE TABLE IF NOT EXISTS claims_v2 (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id      INTEGER NOT NULL REFERENCES listings(id),
      claimer_id      INTEGER NOT NULL REFERENCES users(id),
      num_tickets     INTEGER,                   -- how many seats claimed (for splitting)
      notes           TEXT,
      payment_status  TEXT NOT NULL DEFAULT 'none',    -- none, pending, requested, paid (PAY-04)
      transfer_status TEXT NOT NULL DEFAULT 'pending', -- pending, transferred, confirmed (TXF-03/05)
      claimed_at      TEXT NOT NULL DEFAULT (datetime('now')),
      released_at     TEXT,                       -- NULL until released (CLM-08)
      UNIQUE(listing_id)
    );

    -- Activity log (DAS-04)
    CREATE TABLE IF NOT EXISTS activity_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      package_id  INTEGER REFERENCES ticket_packages(id),
      listing_id  INTEGER REFERENCES listings(id),
      event_type  TEXT NOT NULL,
          -- claim, release, transfer, payment_requested, payment_received,
          -- listing_updated, package_created, package_shared
      actor_id    INTEGER REFERENCES users(id),  -- who performed the action
      metadata    TEXT,                           -- JSON blob with event-specific data
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Notification preferences (NOT-04)
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id           INTEGER PRIMARY KEY REFERENCES users(id),
      email_claims      INTEGER NOT NULL DEFAULT 1,
      email_transfers   INTEGER NOT NULL DEFAULT 1,
      email_payments    INTEGER NOT NULL DEFAULT 1,
      email_reminders   INTEGER NOT NULL DEFAULT 1,
      email_digest      INTEGER NOT NULL DEFAULT 1,
      sms_claims        INTEGER NOT NULL DEFAULT 0,
      sms_transfers     INTEGER NOT NULL DEFAULT 0,
      sms_reminders     INTEGER NOT NULL DEFAULT 0
    );

    -- Subscriptions (section 9)
    CREATE TABLE IF NOT EXISTS subscriptions (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL REFERENCES users(id),
      stripe_customer_id TEXT UNIQUE,
      stripe_sub_id      TEXT UNIQUE,
      plan               TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly', 'annual'
      status             TEXT NOT NULL DEFAULT 'trial',    -- 'trial', 'active', 'cancelled', 'expired'
      trial_ends_at      TEXT,
      current_period_end TEXT,
      packages_limit     INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Migrations: add transfer_mode to ticket_packages if not present
  `);

  // Safe column additions for existing databases
  const tpCols = db.prepare('PRAGMA table_info(ticket_packages)').all().map(c => c.name);
  if (!tpCols.includes('transfer_mode')) {
    db.exec("ALTER TABLE ticket_packages ADD COLUMN transfer_mode TEXT NOT NULL DEFAULT 'manual'");
  }

  db.exec(`
    -- Notification log (tracks sent notifications and scheduled reminders)
    CREATE TABLE IF NOT EXISTS notification_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      claim_id    INTEGER REFERENCES claims_v2(id),
      type        TEXT NOT NULL,
      channel     TEXT NOT NULL,
      sent_at     TEXT NOT NULL DEFAULT (datetime('now')),
      metadata    TEXT
    );

    -- Connected ticketing platform accounts (Auto Mode)
    CREATE TABLE IF NOT EXISTS connected_accounts (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             INTEGER NOT NULL REFERENCES users(id),
      platform            TEXT NOT NULL,
      encrypted_email     TEXT NOT NULL,
      encrypted_password  TEXT NOT NULL,
      encryption_iv       TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'active',
      last_sync_at        TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, platform)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_notification_log_claim ON notification_log(claim_id);
    CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(type);
    CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_v2_user ON sessions_v2(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_id);
    CREATE INDEX IF NOT EXISTS idx_games_v2_team ON games_v2(team_id);
    CREATE INDEX IF NOT EXISTS idx_games_v2_date ON games_v2(game_date);
    CREATE INDEX IF NOT EXISTS idx_ticket_packages_owner ON ticket_packages(owner_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_packages_team ON ticket_packages(team_id);
    CREATE INDEX IF NOT EXISTS idx_listings_package ON listings(package_id);
    CREATE INDEX IF NOT EXISTS idx_listings_game ON listings(game_id);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_package_access_package ON package_access(package_id);
    CREATE INDEX IF NOT EXISTS idx_package_access_user ON package_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_claims_v2_claimer ON claims_v2(claimer_id);
    CREATE INDEX IF NOT EXISTS idx_claims_v2_payment ON claims_v2(payment_status);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_package ON activity_log(package_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
  `);
}

// === Account Functions ===

function createAccount({ email, passwordHash, displayName, slug, teamName, venueName, section, season, ticketsPerGame }) {
  return db.prepare(`
    INSERT INTO accounts (email, password_hash, display_name, slug, team_name, venue_name, section, season, tickets_per_game)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(email, passwordHash, displayName, slug, teamName, venueName || null, section || null, season || null, ticketsPerGame || 2);
}

function getAccountByEmail(email) {
  return db.prepare('SELECT * FROM accounts WHERE LOWER(email) = LOWER(?)').get(email);
}

function getAccountBySlug(slug) {
  return db.prepare('SELECT * FROM accounts WHERE slug = ?').get(slug);
}

function getAccountById(id) {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

function updateAccountSettings(accountId, settings) {
  const fields = [];
  const values = [];
  const allowed = ['display_name', 'team_name', 'venue_name', 'section', 'season', 'tickets_per_game', 'primary_color', 'accent_color', 'slug'];
  for (const [key, value] of Object.entries(settings)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(accountId);
  db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// === Session Functions ===

function createSession(accountId) {
  const id = uuidv4();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, account_id, expires_at) VALUES (?, ?, ?)').run(id, accountId, expires);
  return { id, expires_at: expires };
}

function getSession(sessionId) {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (session && new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  return session;
}

function deleteSession(sessionId) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

function cleanExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

// === Game Functions ===

function getGamesByAccount(accountId) {
  return db.prepare(`
    SELECT g.*, c.name as claimed_by, c.email as claimer_email
    FROM games g
    LEFT JOIN claims c ON c.game_id = g.id
    WHERE g.account_id = ?
    ORDER BY g.date
  `).all(accountId);
}

function getGameByIdAndAccount(gameId, accountId) {
  return db.prepare('SELECT * FROM games WHERE id = ? AND account_id = ?').get(gameId, accountId);
}

function addGame(accountId, { date, displayDate, opponent, giveaway, price }) {
  return db.prepare(`
    INSERT INTO games (account_id, date, display_date, opponent, giveaway, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(accountId, date, displayDate, opponent, giveaway || null, price != null ? price : null);
}

function updateGame(gameId, accountId, updates) {
  const fields = [];
  const values = [];
  const allowed = ['date', 'display_date', 'opponent', 'giveaway', 'price', 'status'];
  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(gameId, accountId);
  db.prepare(`UPDATE games SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`).run(...values);
}

function deleteGame(gameId, accountId) {
  // Delete any claim first
  db.prepare('DELETE FROM claims WHERE game_id = ? AND game_id IN (SELECT id FROM games WHERE account_id = ?)').run(gameId, accountId);
  return db.prepare('DELETE FROM games WHERE id = ? AND account_id = ?').run(gameId, accountId);
}

const bulkAddGames = db.transaction((accountId, games) => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO games (account_id, date, display_date, opponent, giveaway, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let added = 0;
  for (const g of games) {
    const result = insert.run(accountId, g.date, g.displayDate, g.opponent, g.giveaway || null, g.price != null ? g.price : null);
    if (result.changes > 0) added++;
  }
  return added;
});

// === Claim Functions (public, slug-scoped) ===

function getGamesBySlug(slug) {
  return db.prepare(`
    SELECT g.id, g.date, g.display_date, g.opponent, g.giveaway, g.price, g.status, c.name as claimed_by
    FROM games g
    JOIN accounts a ON a.id = g.account_id
    LEFT JOIN claims c ON c.game_id = g.id
    WHERE a.slug = ?
    ORDER BY g.date
  `).all(slug);
}

function getAccountInfoBySlug(slug) {
  return db.prepare(`
    SELECT display_name, team_name, venue_name, section, season, tickets_per_game, primary_color, accent_color, slug
    FROM accounts WHERE slug = ?
  `).get(slug);
}

const claimGameBySlug = db.transaction((slug, gameId, email, name, notes) => {
  const game = db.prepare(`
    SELECT g.* FROM games g
    JOIN accounts a ON a.id = g.account_id
    WHERE g.id = ? AND a.slug = ?
  `).get(gameId, slug);
  if (!game) throw new Error('Game not found');
  if (game.status !== 'available') throw new Error('These tickets are no longer available');

  db.prepare('INSERT INTO claims (game_id, email, name, notes) VALUES (?, ?, ?, ?)').run(gameId, email, name, notes || null);
  db.prepare("UPDATE games SET status = 'claimed' WHERE id = ?").run(gameId);
  return { success: true, game };
});

function getClaimsBySlugAndEmail(slug, email) {
  return db.prepare(`
    SELECT c.*, g.date, g.display_date, g.opponent, g.giveaway, g.price
    FROM claims c
    JOIN games g ON g.id = c.game_id
    JOIN accounts a ON a.id = g.account_id
    WHERE a.slug = ? AND LOWER(c.email) = LOWER(?)
    ORDER BY g.date
  `).all(slug, email);
}

// === Owner Claim Functions ===

function getClaimsByAccount(accountId) {
  return db.prepare(`
    SELECT c.*, g.date, g.display_date, g.opponent, g.giveaway, g.price
    FROM claims c
    JOIN games g ON g.id = c.game_id
    WHERE g.account_id = ?
    ORDER BY g.date
  `).all(accountId);
}

const unclaimGame = db.transaction((gameId, accountId) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND account_id = ?').get(gameId, accountId);
  if (!game) throw new Error('Game not found');

  const claim = db.prepare('SELECT * FROM claims WHERE game_id = ?').get(gameId);
  if (!claim) throw new Error('No claim found for this game');

  db.prepare('DELETE FROM claims WHERE game_id = ?').run(gameId);
  db.prepare("UPDATE games SET status = 'available' WHERE id = ?").run(gameId);
});

// === V2 Query Functions ===

// -- Users --
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserBySlug(slug) {
  return db.prepare('SELECT * FROM users WHERE slug = ?').get(slug);
}

// -- Leagues & Teams --
function getLeagueByName(name) {
  return db.prepare('SELECT * FROM leagues WHERE name = ?').get(name);
}

function getTeamByName(name) {
  return db.prepare('SELECT * FROM teams WHERE name = ?').get(name);
}

function getAllTeams() {
  return db.prepare(`
    SELECT t.*, l.name as league_name, l.sport,
           tp.name as platform_name, tp.transfer_method
    FROM teams t
    JOIN leagues l ON l.id = t.league_id
    LEFT JOIN ticketing_platforms tp ON tp.id = t.ticketing_platform_id
    ORDER BY l.name, t.city
  `).all();
}

function getTeamsByLeague(leagueName) {
  return db.prepare(`
    SELECT t.*, l.name as league_name, l.sport
    FROM teams t
    JOIN leagues l ON l.id = t.league_id
    WHERE l.name = ?
    ORDER BY t.city
  `).all(leagueName);
}

// -- Games V2 --
function getGameV2(teamId, season, gameDate) {
  return db.prepare('SELECT * FROM games_v2 WHERE team_id = ? AND season = ? AND game_date = ?').get(teamId, season, gameDate);
}

function getGamesByTeamAndSeason(teamId, season) {
  return db.prepare('SELECT * FROM games_v2 WHERE team_id = ? AND season = ? ORDER BY game_date, game_number').all(teamId, season);
}

// -- Ticket Packages --
function getPackagesByOwner(ownerId) {
  return db.prepare(`
    SELECT tp.*, t.name as team_name, t.full_name as team_full_name, t.venue_name,
           t.primary_color as team_primary_color, t.accent_color as team_accent_color,
           t.logo_url as team_logo_url
    FROM ticket_packages tp
    JOIN teams t ON t.id = tp.team_id
    WHERE tp.owner_id = ? AND tp.is_active = 1
    ORDER BY tp.created_at
  `).all(ownerId);
}

function getPackageBySlug(slug) {
  return db.prepare(`
    SELECT tp.*, t.name as team_name, t.full_name as team_full_name, t.venue_name,
           t.primary_color as team_primary_color, t.accent_color as team_accent_color,
           t.logo_url as team_logo_url,
           u.first_name || ' ' || u.last_name as owner_name,
           u.venmo_handle as owner_venmo, u.zelle_info as owner_zelle,
           plt.name as platform_name, plt.transfer_method, plt.transfer_url_template,
           plt.transfer_instructions, plt.accept_instructions
    FROM ticket_packages tp
    JOIN teams t ON t.id = tp.team_id
    JOIN users u ON u.id = tp.owner_id
    LEFT JOIN ticketing_platforms plt ON plt.id = t.ticketing_platform_id
    WHERE tp.slug = ?
  `).get(slug);
}

// -- Listings --
function getListingsByPackage(packageId) {
  return db.prepare(`
    SELECT l.*,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           cv.claimer_id, cv.num_tickets as claimed_tickets,
           cv.payment_status, cv.transfer_status, cv.claimed_at,
           cu.first_name || ' ' || cu.last_name as claimer_name,
           cu.email as claimer_email, cu.phone as claimer_phone
    FROM listings l
    JOIN games_v2 g ON g.id = l.game_id
    LEFT JOIN claims_v2 cv ON cv.listing_id = l.id AND cv.released_at IS NULL
    LEFT JOIN users cu ON cu.id = cv.claimer_id
    WHERE l.package_id = ?
    ORDER BY g.game_date
  `).all(packageId);
}

function getListingsBySlug(slug) {
  return db.prepare(`
    SELECT l.id, l.status, l.price, l.num_tickets, l.split_rule, l.notes,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           tp.default_price, tp.tickets_per_game, tp.default_split_rule,
           cu.first_name || ' ' || cu.last_name as claimed_by
    FROM listings l
    JOIN ticket_packages tp ON tp.id = l.package_id
    JOIN games_v2 g ON g.id = l.game_id
    LEFT JOIN claims_v2 cv ON cv.listing_id = l.id AND cv.released_at IS NULL
    LEFT JOIN users cu ON cu.id = cv.claimer_id
    WHERE tp.slug = ? AND tp.link_active = 1
    ORDER BY g.game_date
  `).all(slug);
}

// -- Unified Receiver Feed --
// Shows all available listings from packages the user has access to
function getReceiverFeed(userId) {
  return db.prepare(`
    SELECT l.id as listing_id, l.status, l.price, l.num_tickets, l.split_rule, l.notes,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           t.name as team_name, t.full_name as team_full_name,
           t.primary_color, t.accent_color, t.venue_name, t.logo_url as team_logo_url,
           tp.section, tp.slug, tp.tickets_per_game, tp.display_name as package_name,
           tp.default_price, tp.default_split_rule,
           u.first_name || ' ' || u.last_name as owner_name
    FROM package_access pa
    JOIN ticket_packages tp ON tp.id = pa.package_id AND tp.is_active = 1
    JOIN listings l ON l.package_id = tp.id AND l.status = 'available'
    JOIN games_v2 g ON g.id = l.game_id
    JOIN teams t ON t.id = g.team_id
    JOIN users u ON u.id = tp.owner_id
    WHERE pa.user_id = ?
      AND g.game_date >= date('now')
    ORDER BY g.game_date
  `).all(userId);
}

// -- Claims V2 --
function getClaimsByUser(userId) {
  return db.prepare(`
    SELECT cv.*,
           l.price, l.num_tickets as listing_tickets,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           t.name as team_name, t.full_name as team_full_name, t.venue_name,
           t.logo_url as team_logo_url,
           tp.section, tp.row, tp.seats, tp.slug,
           u.first_name || ' ' || u.last_name as owner_name,
           u.venmo_handle as owner_venmo, u.zelle_info as owner_zelle
    FROM claims_v2 cv
    JOIN listings l ON l.id = cv.listing_id
    JOIN games_v2 g ON g.id = l.game_id
    JOIN ticket_packages tp ON tp.id = l.package_id
    JOIN teams t ON t.id = tp.team_id
    JOIN users u ON u.id = tp.owner_id
    WHERE cv.claimer_id = ? AND cv.released_at IS NULL
    ORDER BY g.game_date
  `).all(userId);
}

// -- Activity Log --
function getActivityByPackage(packageId, limit = 50) {
  return db.prepare(`
    SELECT al.*,
           u.first_name || ' ' || u.last_name as actor_name
    FROM activity_log al
    LEFT JOIN users u ON u.id = al.actor_id
    WHERE al.package_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(packageId, limit);
}

function getActivityByUser(userId, limit = 50) {
  return db.prepare(`
    SELECT al.*,
           u.first_name || ' ' || u.last_name as actor_name,
           tp.display_name as package_name, tp.slug as package_slug,
           t.name as team_name
    FROM activity_log al
    LEFT JOIN users u ON u.id = al.actor_id
    LEFT JOIN ticket_packages tp ON tp.id = al.package_id
    LEFT JOIN teams t ON t.id = tp.team_id
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

// -- Holder Stats (DAS-01) --
function getPackageStats(packageId) {
  return db.prepare(`
    SELECT
      COUNT(*) as total_games,
      SUM(CASE WHEN l.status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN l.status IN ('claimed', 'transferred', 'complete') THEN 1 ELSE 0 END) as claimed,
      SUM(CASE WHEN l.status = 'going_myself' THEN 1 ELSE 0 END) as going_myself,
      SUM(CASE WHEN l.status = 'sold_elsewhere' THEN 1 ELSE 0 END) as sold_elsewhere,
      SUM(CASE WHEN l.status = 'unavailable' THEN 1 ELSE 0 END) as unavailable,
      SUM(CASE WHEN cv.payment_status = 'paid' THEN COALESCE(l.price, 0) * COALESCE(cv.num_tickets, 1) ELSE 0 END) as revenue_collected,
      SUM(CASE WHEN l.status IN ('claimed', 'transferred', 'complete') THEN COALESCE(l.price, 0) * COALESCE(cv.num_tickets, 1) ELSE 0 END) as revenue_expected
    FROM listings l
    JOIN games_v2 g ON g.id = l.game_id
    LEFT JOIN claims_v2 cv ON cv.listing_id = l.id AND cv.released_at IS NULL
    WHERE l.package_id = ?
  `).get(packageId);
}

// -- Claimer Directory (DAS-05) --
function getClaimersByPackage(packageId) {
  return db.prepare(`
    SELECT
      cu.id, cu.first_name, cu.last_name, cu.email, cu.phone,
      COUNT(cv.id) as claim_count,
      SUM(CASE WHEN cv.payment_status = 'paid' THEN COALESCE(l.price, 0) * COALESCE(cv.num_tickets, 1) ELSE 0 END) as total_paid
    FROM claims_v2 cv
    JOIN listings l ON l.id = cv.listing_id
    JOIN users cu ON cu.id = cv.claimer_id
    WHERE l.package_id = ? AND cv.released_at IS NULL
    GROUP BY cu.id
    ORDER BY claim_count DESC
  `).all(packageId);
}

// -- Transfer Status --
function markTransferred(listingId, holderId) {
  const claim = db.prepare(
    "SELECT cv.* FROM claims_v2 cv WHERE cv.listing_id = ? AND cv.released_at IS NULL"
  ).get(listingId);
  if (!claim) throw new Error('No active claim for this listing');

  db.prepare("UPDATE claims_v2 SET transfer_status = 'transferred' WHERE id = ?").run(claim.id);
  db.prepare("UPDATE listings SET status = 'transferred' WHERE id = ?").run(listingId);

  db.prepare(`
    INSERT INTO activity_log (user_id, package_id, listing_id, event_type, actor_id, metadata)
    VALUES (?, (SELECT package_id FROM listings WHERE id = ?), ?, 'transfer', ?, ?)
  `).run(holderId, listingId, listingId, holderId, JSON.stringify({ transfer_status: 'transferred' }));

  return claim;
}

function confirmTransfer(listingId) {
  db.prepare(
    "UPDATE claims_v2 SET transfer_status = 'confirmed' WHERE listing_id = ? AND released_at IS NULL"
  ).run(listingId);
  db.prepare("UPDATE listings SET status = 'complete' WHERE id = ?").run(listingId);
}

function updatePaymentStatus(claimId, status) {
  const valid = ['none', 'pending', 'requested', 'paid'];
  if (!valid.includes(status)) throw new Error('Invalid payment status');
  db.prepare('UPDATE claims_v2 SET payment_status = ? WHERE id = ?').run(status, claimId);
}

// -- Claims with full context (for notifications) --
function getClaimWithContext(claimId) {
  return db.prepare(`
    SELECT cv.*,
           l.id as listing_id, l.price, l.num_tickets as listing_tickets, l.package_id, l.game_id,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           tp.owner_id, tp.section, tp.row, tp.seats, tp.tickets_per_game,
           tp.default_price, tp.display_name as package_name, tp.slug as package_slug,
           tp.transfer_mode, tp.primary_color, tp.accent_color,
           t.id as team_id, t.name as team_name, t.full_name as team_full_name,
           t.venue_name, t.primary_color as team_primary_color, t.accent_color as team_accent_color,
           holder.id as holder_id, holder.first_name as holder_first_name, holder.last_name as holder_last_name,
           holder.email as holder_email, holder.venmo_handle as holder_venmo,
           claimer.id as claimer_user_id, claimer.first_name as claimer_first_name, claimer.last_name as claimer_last_name,
           claimer.email as claimer_email
    FROM claims_v2 cv
    JOIN listings l ON l.id = cv.listing_id
    JOIN games_v2 g ON g.id = l.game_id
    JOIN ticket_packages tp ON tp.id = l.package_id
    JOIN teams t ON t.id = tp.team_id
    JOIN users holder ON holder.id = tp.owner_id
    JOIN users claimer ON claimer.id = cv.claimer_id
    WHERE cv.id = ?
  `).get(claimId);
}

function getListingWithContext(listingId) {
  return db.prepare(`
    SELECT l.*,
           g.game_date, g.opponent, g.giveaway, g.game_time,
           tp.owner_id, tp.section, tp.row, tp.seats, tp.tickets_per_game,
           tp.default_price, tp.display_name as package_name, tp.slug as package_slug,
           tp.transfer_mode, tp.primary_color, tp.accent_color,
           t.id as team_id, t.name as team_name, t.full_name as team_full_name,
           t.venue_name, t.primary_color as team_primary_color, t.accent_color as team_accent_color
    FROM listings l
    JOIN games_v2 g ON g.id = l.game_id
    JOIN ticket_packages tp ON tp.id = l.package_id
    JOIN teams t ON t.id = tp.team_id
    WHERE l.id = ?
  `).get(listingId);
}

// -- Pending transfers (for dashboard) --
function getPendingTransfers(ownerId) {
  return db.prepare(`
    SELECT cv.id as claim_id, cv.transfer_status, cv.payment_status, cv.claimed_at,
           l.id as listing_id, l.price,
           g.game_date, g.opponent, g.game_time,
           tp.section, tp.row, tp.seats, tp.tickets_per_game, tp.slug as package_slug,
           tp.display_name as package_name, tp.transfer_mode,
           t.name as team_name, t.full_name as team_full_name,
           cu.first_name || ' ' || cu.last_name as claimer_name, cu.email as claimer_email
    FROM claims_v2 cv
    JOIN listings l ON l.id = cv.listing_id
    JOIN ticket_packages tp ON tp.id = l.package_id
    JOIN games_v2 g ON g.id = l.game_id
    JOIN teams t ON t.id = tp.team_id
    JOIN users cu ON cu.id = cv.claimer_id
    WHERE tp.owner_id = ?
      AND cv.transfer_status = 'pending'
      AND cv.released_at IS NULL
    ORDER BY g.game_date
  `).all(ownerId);
}

module.exports = {
  initialize,
  // Accounts (v1)
  createAccount, getAccountByEmail, getAccountBySlug, getAccountById, updateAccountSettings,
  // Sessions (v1)
  createSession, getSession, deleteSession, cleanExpiredSessions,
  // Games (v1 owner)
  getGamesByAccount, getGameByIdAndAccount, addGame, updateGame, deleteGame, bulkAddGames,
  // Public (v1 slug-scoped)
  getGamesBySlug, getAccountInfoBySlug, claimGameBySlug, getClaimsBySlugAndEmail,
  // Owner claims (v1)
  getClaimsByAccount, unclaimGame,
  // V2 - Users
  getUserByEmail, getUserById, getUserBySlug,
  // V2 - Leagues & Teams
  getLeagueByName, getTeamByName, getAllTeams, getTeamsByLeague,
  // V2 - Games
  getGameV2, getGamesByTeamAndSeason,
  // V2 - Packages
  getPackagesByOwner, getPackageBySlug,
  // V2 - Listings
  getListingsByPackage, getListingsBySlug,
  // V2 - Receiver Feed
  getReceiverFeed,
  // V2 - Claims
  getClaimsByUser, getClaimWithContext,
  // V2 - Listings (extended)
  getListingWithContext,
  // V2 - Activity
  getActivityByPackage, getActivityByUser,
  // V2 - Stats
  getPackageStats, getClaimersByPackage,
  // V2 - Transfers
  markTransferred, confirmTransfer, updatePaymentStatus, getPendingTransfers,
  // Raw db for migration
  db
};
