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

module.exports = {
  initialize,
  // Accounts
  createAccount, getAccountByEmail, getAccountBySlug, getAccountById, updateAccountSettings,
  // Sessions
  createSession, getSession, deleteSession, cleanExpiredSessions,
  // Games (owner)
  getGamesByAccount, getGameByIdAndAccount, addGame, updateGame, deleteGame, bulkAddGames,
  // Public (slug-scoped)
  getGamesBySlug, getAccountInfoBySlug, claimGameBySlug, getClaimsBySlugAndEmail,
  // Owner claims
  getClaimsByAccount, unclaimGame,
  // Raw db for migration
  db
};
