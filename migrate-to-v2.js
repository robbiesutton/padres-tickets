#!/usr/bin/env node
// Migration script: migrates existing v1 data (accounts, games, claims) to v2 schema
//
// This is NON-DESTRUCTIVE: old tables are left untouched.
// New v2 tables are created alongside existing ones.
//
// Usage: node migrate-to-v2.js
//   Optionally set DATABASE_PATH env var to target a specific database file.

const db = require('./db');
const { leagues, teams, ticketingPlatforms } = require('./data/teams');

// Standalone v2 table creation for databases with older schemas
// (where db.initialize() would fail on v1 table creation)
function createV2Tables(raw) {
  raw.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      phone           TEXT,
      slug            TEXT UNIQUE,
      avatar_url      TEXT,
      venmo_handle    TEXT,
      zelle_info      TEXT,
      google_id       TEXT UNIQUE,
      apple_id        TEXT UNIQUE,
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

    CREATE TABLE IF NOT EXISTS leagues (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      name    TEXT NOT NULL UNIQUE,
      sport   TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'US'
    );

    CREATE TABLE IF NOT EXISTS ticketing_platforms (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      name                    TEXT NOT NULL UNIQUE,
      transfer_method         TEXT,
      transfer_url_template   TEXT,
      transfer_instructions   TEXT,
      accept_instructions     TEXT
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
      game_number      INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(team_id, season, game_date, game_number)
    );

    CREATE TABLE IF NOT EXISTS ticket_packages (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id           INTEGER NOT NULL REFERENCES users(id),
      team_id            INTEGER NOT NULL REFERENCES teams(id),
      season             TEXT NOT NULL,
      section            TEXT,
      row                TEXT,
      seats              TEXT,
      tickets_per_game   INTEGER NOT NULL DEFAULT 2,
      slug               TEXT NOT NULL UNIQUE,
      display_name       TEXT,
      primary_color      TEXT,
      accent_color       TEXT,
      default_price      REAL,
      default_split_rule TEXT NOT NULL DEFAULT 'all',
      package_type       TEXT,
      link_active        INTEGER NOT NULL DEFAULT 1,
      is_active          INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id  INTEGER NOT NULL REFERENCES ticket_packages(id),
      game_id     INTEGER NOT NULL REFERENCES games_v2(id),
      status      TEXT NOT NULL DEFAULT 'available',
      price       REAL,
      num_tickets INTEGER,
      split_rule  TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(package_id, game_id)
    );

    CREATE TABLE IF NOT EXISTS package_access (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id      INTEGER NOT NULL REFERENCES ticket_packages(id),
      user_id         INTEGER NOT NULL REFERENCES users(id),
      invited_email   TEXT,
      invited_by      INTEGER REFERENCES users(id),
      access_type     TEXT NOT NULL DEFAULT 'link',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(package_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS claims_v2 (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id      INTEGER NOT NULL REFERENCES listings(id),
      claimer_id      INTEGER NOT NULL REFERENCES users(id),
      num_tickets     INTEGER,
      notes           TEXT,
      payment_status  TEXT NOT NULL DEFAULT 'none',
      transfer_status TEXT NOT NULL DEFAULT 'pending',
      claimed_at      TEXT NOT NULL DEFAULT (datetime('now')),
      released_at     TEXT,
      UNIQUE(listing_id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      package_id  INTEGER REFERENCES ticket_packages(id),
      listing_id  INTEGER REFERENCES listings(id),
      event_type  TEXT NOT NULL,
      actor_id    INTEGER REFERENCES users(id),
      metadata    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS subscriptions (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL REFERENCES users(id),
      stripe_customer_id TEXT UNIQUE,
      stripe_sub_id      TEXT UNIQUE,
      plan               TEXT NOT NULL DEFAULT 'monthly',
      status             TEXT NOT NULL DEFAULT 'trial',
      trial_ends_at      TEXT,
      current_period_end TEXT,
      packages_limit     INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

// Helper: split "First Last" into [first, last]
function splitName(displayName) {
  const parts = (displayName || '').trim().split(/\s+/);
  if (parts.length === 0) return ['Unknown', ''];
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function migrate() {
  const raw = db.db;

  // Step 1: Create v2 tables
  const hasAccountIdOnGames = raw.prepare(`
    SELECT COUNT(*) as c FROM pragma_table_info('games') WHERE name = 'account_id'
  `).get().c > 0;

  const hasAccountsTable = raw.prepare(`
    SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='accounts'
  `).get().c > 0;

  if (hasAccountIdOnGames && hasAccountsTable) {
    db.initialize();
  } else {
    createV2Tables(raw);
  }

  // Step 2: Seed ticketing platforms
  console.log('Seeding ticketing platforms...');
  const insertPlatform = raw.prepare(`
    INSERT OR IGNORE INTO ticketing_platforms (name, transfer_method, transfer_url_template, transfer_instructions, accept_instructions)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const p of ticketingPlatforms) {
    insertPlatform.run(p.name, p.transfer_method, p.transfer_url_template, p.transfer_instructions, p.accept_instructions);
  }
  const platformCount = raw.prepare('SELECT COUNT(*) as c FROM ticketing_platforms').get().c;
  console.log(`  ${platformCount} ticketing platform(s) in database`);

  // Step 3: Seed leagues
  console.log('Seeding leagues...');
  const insertLeague = raw.prepare('INSERT OR IGNORE INTO leagues (name, sport, country) VALUES (?, ?, ?)');
  for (const league of leagues) {
    insertLeague.run(league.name, league.sport, league.country);
  }
  const leagueCount = raw.prepare('SELECT COUNT(*) as c FROM leagues').get().c;
  console.log(`  ${leagueCount} league(s) in database`);

  // Step 4: Seed teams (with ticketing platform FK)
  console.log('Seeding teams...');
  const insertTeam = raw.prepare(`
    INSERT OR IGNORE INTO teams (league_id, name, city, full_name, abbreviation, venue_name, primary_color, accent_color, time_zone, ticketing_platform_id)
    VALUES (
      (SELECT id FROM leagues WHERE name = ?),
      ?, ?, ?, ?, ?, ?, ?, ?,
      (SELECT id FROM ticketing_platforms WHERE name = ?)
    )
  `);
  for (const team of teams) {
    insertTeam.run(team.league, team.name, team.city, team.full_name, team.abbreviation, team.venue_name, team.primary_color, team.accent_color, team.time_zone, team.platform || null);
  }
  const teamCount = raw.prepare('SELECT COUNT(*) as c FROM teams').get().c;
  console.log(`  ${teamCount} team(s) in database`);

  // Step 5: Migrate accounts → users + ticket_packages
  console.log('\nMigrating accounts...');
  const existingAccounts = hasAccountsTable
    ? raw.prepare('SELECT * FROM accounts').all()
    : [];

  const padresTeam = raw.prepare("SELECT id FROM teams WHERE name = 'Padres'").get();
  if (!padresTeam) {
    console.error('ERROR: Padres team not found. Seed data may be missing.');
    process.exit(1);
  }

  // Check for orphaned games
  const hasGamesTable = raw.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='games'").get().c > 0;
  const gameCount = hasGamesTable ? raw.prepare('SELECT COUNT(*) as c FROM games').get().c : 0;
  const hasSectionColumn = hasGamesTable && raw.prepare("SELECT COUNT(*) as c FROM pragma_table_info('games') WHERE name = 'section'").get().c > 0;

  if (existingAccounts.length === 0 && gameCount === 0) {
    console.log('  No accounts or games to migrate.');
    printSummary(raw);
    return;
  }

  // If games exist but no accounts (pre-multi-tenant schema), create synthetic users/packages
  if (existingAccounts.length === 0 && gameCount > 0 && hasSectionColumn) {
    console.log('  No accounts found, but found orphaned games. Creating synthetic packages...');
    const sections = raw.prepare('SELECT DISTINCT section FROM games ORDER BY section').all().map(r => r.section);

    for (const section of sections) {
      const email = section === '309' ? 'robbiecsutton@gmail.com' : `robbiecsutton+${section}@gmail.com`;
      const slug = section === '309' ? 'robbiesutton' : `robbiesutton-${section}`;

      raw.prepare('INSERT OR IGNORE INTO users (email, first_name, last_name) VALUES (?, ?, ?)').run(email, 'Robbie', 'Sutton');
      const user = raw.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);

      raw.prepare(`INSERT OR IGNORE INTO ticket_packages (owner_id, team_id, season, section, tickets_per_game, slug, display_name, primary_color, accent_color, default_price, package_type)
        VALUES (?, ?, '2026', ?, 2, ?, ?, '#2F241D', '#FFC425', 99, 'full')`).run(
        user.id, padresTeam.id, section, slug, `Padres Section ${section}`
      );
      console.log(`  Created user + package for section ${section} (slug: ${slug})`);
    }

    // Migrate games and claims for orphaned schema
    const allPkgs = raw.prepare('SELECT * FROM ticket_packages').all();
    const pkgBySection = new Map();
    for (const pkg of allPkgs) pkgBySection.set(pkg.section, pkg);

    const existingGames = raw.prepare('SELECT * FROM games ORDER BY section, date').all();
    const insertGameV2 = raw.prepare('INSERT OR IGNORE INTO games_v2 (team_id, season, game_date, opponent, giveaway) VALUES (?, ?, ?, ?, ?)');
    const insertListing = raw.prepare('INSERT OR IGNORE INTO listings (package_id, game_id, status, price) VALUES (?, ?, ?, ?)');
    const listingByOldGameId = new Map();
    let listingsCreated = 0;

    for (const game of existingGames) {
      insertGameV2.run(padresTeam.id, '2026', game.date, game.opponent, game.giveaway || null);
      const gameV2 = raw.prepare('SELECT id FROM games_v2 WHERE team_id = ? AND season = ? AND game_date = ?').get(padresTeam.id, '2026', game.date);
      if (!gameV2) { console.error(`  ERROR: Could not create game for ${game.date}`); continue; }

      const pkg = pkgBySection.get(game.section);
      if (!pkg) { console.error(`  WARNING: No package for section ${game.section}`); continue; }

      let status = game.status;
      if (status === 'no') status = 'unavailable';
      const result = insertListing.run(pkg.id, gameV2.id, status, game.price);
      if (result.changes > 0) listingsCreated++;
      const listing = raw.prepare('SELECT id FROM listings WHERE package_id = ? AND game_id = ?').get(pkg.id, gameV2.id);
      if (listing) listingByOldGameId.set(game.id, listing.id);
    }
    console.log(`  ${raw.prepare('SELECT COUNT(*) as c FROM games_v2').get().c} canonical games, ${listingsCreated} listings`);

    // Migrate claims
    migrateClaims(raw, listingByOldGameId);

    printSummary(raw);
    verifyOrphanedMigration(raw, sections.length, existingGames.length);
    return;
  }

  // Standard multi-tenant migration: accounts → users + packages
  const insertUser = raw.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertPackage = raw.prepare(`
    INSERT OR IGNORE INTO ticket_packages (owner_id, team_id, season, section, tickets_per_game, slug, display_name, primary_color, accent_color, default_price, package_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'full', ?)
  `);

  const userIdByEmail = new Map();

  for (const account of existingAccounts) {
    if (!userIdByEmail.has(account.email.toLowerCase())) {
      const [firstName, lastName] = splitName(account.display_name);
      insertUser.run(account.email, account.password_hash, firstName, lastName, account.created_at);
      const user = raw.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(account.email);
      userIdByEmail.set(account.email.toLowerCase(), user.id);
    }
    const userId = userIdByEmail.get(account.email.toLowerCase());

    let teamId = padresTeam.id;
    if (account.team_name) {
      const matchedTeam = raw.prepare('SELECT id FROM teams WHERE name = ?').get(account.team_name);
      if (matchedTeam) teamId = matchedTeam.id;
    }

    const packageDisplayName = account.section
      ? `${account.team_name || 'Padres'} Section ${account.section}`
      : account.display_name;

    insertPackage.run(
      userId, teamId, account.season || '2026',
      account.section || null, account.tickets_per_game || 2,
      account.slug, packageDisplayName,
      account.primary_color || null, account.accent_color || null,
      null, // default_price — will inherit from listings
      account.created_at
    );

    console.log(`  Account "${account.slug}" → user #${userId} + package "${packageDisplayName}"`);
  }

  // Step 6: Migrate games → games_v2 + listings
  console.log('\nMigrating games...');

  const insertGameV2 = raw.prepare('INSERT OR IGNORE INTO games_v2 (team_id, season, game_date, opponent, giveaway) VALUES (?, ?, ?, ?, ?)');
  const insertListing = raw.prepare('INSERT OR IGNORE INTO listings (package_id, game_id, status, price) VALUES (?, ?, ?, ?)');

  const packageBySlug = new Map();
  const allPackages = raw.prepare('SELECT * FROM ticket_packages').all();
  for (const pkg of allPackages) packageBySlug.set(pkg.slug, pkg);

  const listingByOldGameId = new Map();
  let listingsCreated = 0;

  if (hasAccountIdOnGames) {
    const existingGames = raw.prepare('SELECT * FROM games ORDER BY account_id, date').all();
    const accountSlugById = new Map();
    const accountTeamById = new Map();
    for (const account of existingAccounts) {
      accountSlugById.set(account.id, account.slug);
      let teamId = padresTeam.id;
      if (account.team_name) {
        const matchedTeam = raw.prepare('SELECT id FROM teams WHERE name = ?').get(account.team_name);
        if (matchedTeam) teamId = matchedTeam.id;
      }
      accountTeamById.set(account.id, teamId);
    }

    for (const game of existingGames) {
      const teamId = accountTeamById.get(game.account_id);
      const season = existingAccounts.find(a => a.id === game.account_id)?.season || '2026';

      insertGameV2.run(teamId, season, game.date, game.opponent, game.giveaway || null);
      const gameV2 = raw.prepare('SELECT id FROM games_v2 WHERE team_id = ? AND season = ? AND game_date = ?').get(teamId, season, game.date);
      if (!gameV2) { console.error(`  ERROR: Could not find/create game for ${game.date} ${game.opponent}`); continue; }

      let listingStatus = game.status;
      if (listingStatus === 'no') listingStatus = 'unavailable';

      const slug = accountSlugById.get(game.account_id);
      const pkg = packageBySlug.get(slug);
      if (!pkg) { console.error(`  ERROR: No package found for slug "${slug}"`); continue; }

      const result = insertListing.run(pkg.id, gameV2.id, listingStatus, game.price);
      if (result.changes > 0) listingsCreated++;

      const listing = raw.prepare('SELECT id FROM listings WHERE package_id = ? AND game_id = ?').get(pkg.id, gameV2.id);
      if (listing) listingByOldGameId.set(game.id, listing.id);
    }
    console.log(`  Processed ${existingGames.length} v1 game rows`);
  } else {
    const existingGames = raw.prepare('SELECT * FROM games ORDER BY section, date').all();
    for (const game of existingGames) {
      insertGameV2.run(padresTeam.id, '2026', game.date, game.opponent, game.giveaway || null);
      const gameV2 = raw.prepare('SELECT id FROM games_v2 WHERE team_id = ? AND season = ? AND game_date = ?').get(padresTeam.id, '2026', game.date);
      if (!gameV2) { console.error(`  ERROR: Could not find/create game for ${game.date}`); continue; }

      let matchedPkg = null;
      for (const pkg of allPackages) {
        if (pkg.section === game.section) { matchedPkg = pkg; break; }
      }
      if (!matchedPkg) { console.error(`  WARNING: No package for section "${game.section}"`); continue; }

      let listingStatus = game.status;
      if (listingStatus === 'no') listingStatus = 'unavailable';

      const result = insertListing.run(matchedPkg.id, gameV2.id, listingStatus, game.price);
      if (result.changes > 0) listingsCreated++;

      const listing = raw.prepare('SELECT id FROM listings WHERE package_id = ? AND game_id = ?').get(matchedPkg.id, gameV2.id);
      if (listing) listingByOldGameId.set(game.id, listing.id);
    }
    console.log(`  Processed ${existingGames.length} v1 game rows (section-based schema)`);
  }

  const gameV2Count = raw.prepare('SELECT COUNT(*) as c FROM games_v2').get().c;
  console.log(`  ${gameV2Count} canonical game(s) in games_v2`);
  console.log(`  ${listingsCreated} listing(s) created`);

  // Step 7: Migrate claims
  migrateClaims(raw, listingByOldGameId);

  // Step 8: Create package_access for claimers
  createPackageAccessFromClaims(raw);

  // Step 9: Verify
  printSummary(raw);
  verify(raw, hasAccountIdOnGames);
}

function migrateClaims(raw, listingByOldGameId) {
  console.log('\nMigrating claims...');
  const existingClaims = raw.prepare('SELECT * FROM claims').all();

  const insertClaimV2 = raw.prepare(`
    INSERT OR IGNORE INTO claims_v2 (listing_id, claimer_id, num_tickets, notes, payment_status, transfer_status, claimed_at)
    VALUES (?, ?, NULL, ?, 'none', 'pending', ?)
  `);

  let claimsMigrated = 0;
  for (const claim of existingClaims) {
    const listingId = listingByOldGameId.get(claim.game_id);
    if (!listingId) { console.error(`  WARNING: No listing for game_id ${claim.game_id}`); continue; }

    let claimerUser = raw.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(claim.email);
    if (!claimerUser) {
      const [firstName, lastName] = splitName(claim.name);
      raw.prepare('INSERT INTO users (email, first_name, last_name) VALUES (?, ?, ?)').run(claim.email, firstName, lastName);
      claimerUser = raw.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(claim.email);
    }

    insertClaimV2.run(listingId, claimerUser.id, claim.notes || null, claim.claimed_at);
    claimsMigrated++;
  }
  console.log(`  ${claimsMigrated} claim(s) migrated`);
}

function splitName(displayName) {
  const parts = (displayName || '').trim().split(/\s+/);
  if (parts.length === 0) return ['Unknown', ''];
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
}

// Auto-create package_access entries for users who have claimed games
function createPackageAccessFromClaims(raw) {
  console.log('\nCreating package_access entries from claims...');
  const result = raw.prepare(`
    INSERT OR IGNORE INTO package_access (package_id, user_id, access_type)
    SELECT DISTINCT l.package_id, cv.claimer_id, 'link'
    FROM claims_v2 cv
    JOIN listings l ON l.id = cv.listing_id
  `).run();
  console.log(`  ${result.changes} package_access entries created`);
}

function printSummary(raw) {
  console.log('\n=== Migration Summary ===');
  const tables = [
    'users', 'leagues', 'ticketing_platforms', 'teams', 'games_v2',
    'ticket_packages', 'listings', 'package_access', 'claims_v2',
    'activity_log', 'notification_preferences', 'subscriptions',
  ];
  for (const table of tables) {
    const count = raw.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
    console.log(`  ${table}: ${count} rows`);
  }

  console.log('\n=== V1 Counts (unchanged) ===');
  const v1Tables = ['accounts', 'games', 'claims', 'sessions'];
  for (const table of v1Tables) {
    try {
      const count = raw.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
      console.log(`  ${table}: ${count} rows`);
    } catch {
      console.log(`  ${table}: (table not found)`);
    }
  }
}

function verify(raw, hasAccountIdOnGames) {
  console.log('\n=== Verification ===');

  const accounts = raw.prepare('SELECT * FROM accounts').all();

  // 1. Slug preservation
  let slugsOk = true;
  for (const account of accounts) {
    const pkg = raw.prepare('SELECT * FROM ticket_packages WHERE slug = ?').get(account.slug);
    if (!pkg) { console.error(`  FAIL: No package for slug "${account.slug}"`); slugsOk = false; }
  }
  console.log(`  Slug preservation: ${slugsOk ? 'PASS' : 'FAIL'}`);

  // 2. Listing counts match
  let listingCountsOk = true;
  for (const account of accounts) {
    const pkg = raw.prepare('SELECT id FROM ticket_packages WHERE slug = ?').get(account.slug);
    if (pkg) {
      let v1Count;
      if (hasAccountIdOnGames) {
        v1Count = raw.prepare('SELECT COUNT(*) as c FROM games WHERE account_id = ?').get(account.id).c;
      } else {
        v1Count = raw.prepare('SELECT COUNT(*) as c FROM games WHERE section = ?').get(account.section).c;
      }
      const v2Count = raw.prepare('SELECT COUNT(*) as c FROM listings WHERE package_id = ?').get(pkg.id).c;
      if (v1Count !== v2Count) {
        console.error(`  FAIL: "${account.slug}" has ${v1Count} v1 games but ${v2Count} v2 listings`);
        listingCountsOk = false;
      }
    }
  }
  console.log(`  Listing counts match: ${listingCountsOk ? 'PASS' : 'FAIL'}`);

  // 3. Claims count
  const v1Claims = raw.prepare('SELECT COUNT(*) as c FROM claims').get().c;
  const v2Claims = raw.prepare('SELECT COUNT(*) as c FROM claims_v2').get().c;
  console.log(`  Claims count: ${v1Claims === v2Claims ? 'PASS' : 'FAIL'} (v1: ${v1Claims}, v2: ${v2Claims})`);

  // 4. Users have first_name and last_name
  const usersWithoutName = raw.prepare("SELECT COUNT(*) as c FROM users WHERE first_name = '' OR first_name IS NULL").get().c;
  console.log(`  Users with names: ${usersWithoutName === 0 ? 'PASS' : 'FAIL'} (${usersWithoutName} missing)`);

  // 5. Ticketing platforms linked
  const teamsWithPlatform = raw.prepare('SELECT COUNT(*) as c FROM teams WHERE ticketing_platform_id IS NOT NULL').get().c;
  const totalTeams = raw.prepare('SELECT COUNT(*) as c FROM teams').get().c;
  console.log(`  Teams with ticketing platform: ${teamsWithPlatform}/${totalTeams}`);

  // 6. Unified receiver feed query (via package_access)
  try {
    raw.prepare(`
      SELECT l.id as listing_id, l.status, l.price,
             g.game_date, g.opponent,
             t.name as team_name,
             tp.section, tp.slug,
             u.first_name || ' ' || u.last_name as owner_name
      FROM package_access pa
      JOIN ticket_packages tp ON tp.id = pa.package_id AND tp.is_active = 1
      JOIN listings l ON l.package_id = tp.id AND l.status = 'available'
      JOIN games_v2 g ON g.id = l.game_id
      JOIN teams t ON t.id = g.team_id
      JOIN users u ON u.id = tp.owner_id
      WHERE pa.user_id = 0
        AND g.game_date >= date('now')
      ORDER BY g.game_date
    `).all();
    console.log('  Unified receiver feed query: PASS');
  } catch (err) {
    console.error(`  Unified receiver feed query: FAIL (${err.message})`);
  }

  // 7. Package stats query
  if (accounts.length > 0) {
    const testSlug = accounts[0].slug;
    const pkg = raw.prepare('SELECT id FROM ticket_packages WHERE slug = ?').get(testSlug);
    if (pkg) {
      try {
        const stats = raw.prepare(`
          SELECT COUNT(*) as total_games,
                 SUM(CASE WHEN l.status = 'available' THEN 1 ELSE 0 END) as available,
                 SUM(CASE WHEN l.status IN ('claimed', 'transferred', 'complete') THEN 1 ELSE 0 END) as claimed
          FROM listings l WHERE l.package_id = ?
        `).get(pkg.id);
        console.log(`  Package stats for "${testSlug}": PASS (${stats.total_games} games, ${stats.available} available, ${stats.claimed} claimed)`);
      } catch (err) {
        console.error(`  Package stats: FAIL (${err.message})`);
      }
    }
  }

  // 8. Package-by-slug with transfer info
  if (accounts.length > 0) {
    const testSlug = accounts[0].slug;
    const pkg = raw.prepare(`
      SELECT tp.slug, tp.default_price, tp.default_split_rule, tp.link_active,
             t.name as team_name,
             u.first_name || ' ' || u.last_name as owner_name,
             plt.name as platform_name, plt.transfer_method
      FROM ticket_packages tp
      JOIN teams t ON t.id = tp.team_id
      JOIN users u ON u.id = tp.owner_id
      LEFT JOIN ticketing_platforms plt ON plt.id = t.ticketing_platform_id
      WHERE tp.slug = ?
    `).get(testSlug);
    if (pkg) {
      console.log(`  Package lookup "${testSlug}": PASS (owner: ${pkg.owner_name}, team: ${pkg.team_name}, platform: ${pkg.platform_name || 'none'})`);
    } else {
      console.error(`  Package lookup "${testSlug}": FAIL`);
    }
  }

  // 9. Claims have payment/transfer status
  const claimsWithStatus = raw.prepare("SELECT COUNT(*) as c FROM claims_v2 WHERE payment_status IS NOT NULL AND transfer_status IS NOT NULL").get().c;
  console.log(`  Claims with payment/transfer status: ${claimsWithStatus === v2Claims ? 'PASS' : 'FAIL'}`);

  console.log('\nMigration complete!');
}

function verifyOrphanedMigration(raw, sectionCount, v1GameCount) {
  console.log('\n=== Verification (orphaned games migration) ===');

  const pkgCount = raw.prepare('SELECT COUNT(*) as c FROM ticket_packages').get().c;
  console.log(`  Packages: ${pkgCount} (expected: ${sectionCount}) — ${pkgCount === sectionCount ? 'PASS' : 'FAIL'}`);

  const listingCount = raw.prepare('SELECT COUNT(*) as c FROM listings').get().c;
  console.log(`  Listings: ${listingCount} (expected: ${v1GameCount}) — ${listingCount === v1GameCount ? 'PASS' : 'FAIL'}`);

  const v1Claims = raw.prepare('SELECT COUNT(*) as c FROM claims').get().c;
  const v2Claims = raw.prepare('SELECT COUNT(*) as c FROM claims_v2').get().c;
  console.log(`  Claims: ${v2Claims} (expected: ${v1Claims}) — ${v1Claims === v2Claims ? 'PASS' : 'FAIL'}`);

  // Package lookup
  const pkg = raw.prepare(`
    SELECT tp.*, t.name as team_name, u.first_name || ' ' || u.last_name as owner_name,
           plt.name as platform_name
    FROM ticket_packages tp
    JOIN teams t ON t.id = tp.team_id
    JOIN users u ON u.id = tp.owner_id
    LEFT JOIN ticketing_platforms plt ON plt.id = t.ticketing_platform_id
    WHERE tp.slug = 'robbiesutton'
  `).get();
  if (pkg) {
    console.log(`  Package "robbiesutton": PASS (owner: ${pkg.owner_name}, team: ${pkg.team_name}, platform: ${pkg.platform_name})`);
  } else {
    console.error('  Package "robbiesutton": FAIL');
  }

  // Listings count
  const listings = raw.prepare(`
    SELECT COUNT(*) as c FROM listings l
    JOIN ticket_packages tp ON tp.id = l.package_id
    WHERE tp.slug = 'robbiesutton'
  `).get().c;
  console.log(`  Listings for "robbiesutton": ${listings} games`);

  console.log('\nMigration complete!');
}

migrate();
