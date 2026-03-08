const Database = require('better-sqlite3');
const path = require('path');
const gamesData = require('./data/games');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'padres.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      display_date TEXT NOT NULL,
      opponent TEXT NOT NULL,
      giveaway TEXT,
      section TEXT NOT NULL,
      price REAL,
      status TEXT NOT NULL DEFAULT 'available',
      UNIQUE(date, section)
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
  `);

  // Seed games if table is empty
  const count = db.prepare('SELECT COUNT(*) as c FROM games').get().c;
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO games (date, display_date, opponent, giveaway, section, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const seedAll = db.transaction(() => {
      for (const game of gamesData) {
        insert.run(game.date, game.displayDate, game.opponent, game.giveaway, '113', 99, game.section113);
        insert.run(game.date, game.displayDate, game.opponent, game.giveaway, '309', 99, game.section309);
      }

      // Seed claims for pre-claimed games
      const claimedGames = db.prepare("SELECT id FROM games WHERE status = 'claimed'").all();
      const insertClaim = db.prepare(
        'INSERT INTO claims (game_id, email, name, notes) VALUES (?, ?, ?, ?)'
      );
      for (const g of claimedGames) {
        insertClaim.run(g.id, 'robbiecsutton@gmail.com', 'Robbie Sutton', 'Pre-claimed');
      }
    });
    seedAll();
    console.log(`Seeded ${gamesData.length * 2} game entries (${gamesData.length} dates x 2 sections)`);
  }
}

function getGames(section) {
  let query = 'SELECT g.id, g.date, g.display_date, g.opponent, g.giveaway, g.section, g.price, g.status, c.name as claimed_by FROM games g LEFT JOIN claims c ON c.game_id = g.id';
  const params = [];
  if (section && section !== 'all') {
    query += ' WHERE g.section = ?';
    params.push(section);
  }
  query += ' ORDER BY g.date, g.section';
  return db.prepare(query).all(params);
}

function getAdminGames() {
  return db.prepare(
    'SELECT g.*, c.name as claimer_name, c.email as claimer_email, c.claimed_at, c.notes as claim_notes FROM games g LEFT JOIN claims c ON c.game_id = g.id ORDER BY g.date, g.section'
  ).all();
}

const claimGame = db.transaction((gameId, email, name, notes) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.status !== 'available') throw new Error('These tickets are no longer available');

  db.prepare('INSERT INTO claims (game_id, email, name, notes) VALUES (?, ?, ?, ?)').run(gameId, email, name, notes || null);
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run('claimed', gameId);

  return { success: true, game };
});

function getClaims() {
  return db.prepare(`
    SELECT c.*, g.date, g.display_date, g.opponent, g.giveaway, g.section, g.price
    FROM claims c
    JOIN games g ON g.id = c.game_id
    ORDER BY g.date, g.section
  `).all();
}

const unclaimGame = db.transaction((gameId) => {
  const claim = db.prepare('SELECT * FROM claims WHERE game_id = ?').get(gameId);
  if (!claim) throw new Error('No claim found for this game');

  db.prepare('DELETE FROM claims WHERE game_id = ?').run(gameId);
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run('available', gameId);
});

function updateGameStatus(gameId, status) {
  const valid = ['available', 'no', 'claimed'];
  if (!valid.includes(status)) throw new Error('Invalid status');
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run(status, gameId);
}

function updateGamePrice(gameId, price) {
  db.prepare('UPDATE games SET price = ? WHERE id = ?').run(price, gameId);
}

function getClaimsByEmail(email) {
  return db.prepare(`
    SELECT c.*, g.date, g.display_date, g.opponent, g.giveaway, g.section
    FROM claims c
    JOIN games g ON g.id = c.game_id
    WHERE LOWER(c.email) = LOWER(?)
    ORDER BY g.date, g.section
  `).all(email);
}

module.exports = { initialize, getGames, getAdminGames, claimGame, getClaims, unclaimGame, updateGameStatus, updateGamePrice, getClaimsByEmail };
