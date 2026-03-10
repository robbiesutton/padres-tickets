#!/usr/bin/env node
// Migration script: imports existing Padres season ticket data into multi-tenant schema
// Creates two accounts (Section 309 and Section 113) from data/games.js
//
// Usage: node migrate-padres.js <password>
// Example: node migrate-padres.js mypassword123

const bcrypt = require('bcrypt');
const db = require('./db');
const gamesData = require('./data/games');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node migrate-padres.js <password>');
  console.error('  password: the password for both migrated accounts');
  process.exit(1);
}

async function migrate() {
  db.initialize();

  const passwordHash = await bcrypt.hash(password, 10);

  // === Account 1: Section 309 ===
  console.log('Creating account: Robbie Sutton (Section 309)...');
  const result309 = db.createAccount({
    email: 'robbiecsutton@gmail.com',
    passwordHash,
    displayName: 'Robbie Sutton',
    slug: 'robbiesutton',
    teamName: 'Padres',
    venueName: 'Petco Park',
    section: '309',
    season: '2026',
    ticketsPerGame: 2
  });
  const accountId309 = result309.lastInsertRowid;

  // Add games for Section 309
  const games309 = gamesData.map(g => ({
    date: g.date,
    displayDate: g.displayDate,
    opponent: g.opponent,
    giveaway: g.giveaway,
    price: 99
  }));
  const added309 = db.bulkAddGames(accountId309, games309);
  console.log(`  Added ${added309} games`);

  // Migrate pre-claimed games for Section 309
  const claimedDates = gamesData
    .filter(g => g.section309 === 'claimed')
    .map(g => g.date);

  if (claimedDates.length > 0) {
    const allGames309 = db.getGamesByAccount(accountId309);
    for (const game of allGames309) {
      if (claimedDates.includes(game.date)) {
        // Mark as claimed by updating game and creating claim
        db.db.prepare("UPDATE games SET status = 'claimed' WHERE id = ?").run(game.id);
        db.db.prepare('INSERT INTO claims (game_id, email, name, notes) VALUES (?, ?, ?, ?)').run(
          game.id, 'robbiecsutton@gmail.com', 'Robbie Sutton', 'Pre-claimed (migrated)'
        );
      }
    }
    console.log(`  Migrated ${claimedDates.length} pre-claimed games`);
  }

  // === Account 2: Section 113 ===
  console.log('Creating account: Robbie Sutton - 113 (Section 113)...');
  const result113 = db.createAccount({
    email: 'robbiecsutton+113@gmail.com',
    passwordHash,
    displayName: 'Robbie Sutton',
    slug: 'robbiesutton-113',
    teamName: 'Padres',
    venueName: 'Petco Park',
    section: '113',
    season: '2026',
    ticketsPerGame: 2
  });
  const accountId113 = result113.lastInsertRowid;

  // Add games for Section 113 (all available)
  const games113 = gamesData.map(g => ({
    date: g.date,
    displayDate: g.displayDate,
    opponent: g.opponent,
    giveaway: g.giveaway,
    price: 99
  }));
  const added113 = db.bulkAddGames(accountId113, games113);
  console.log(`  Added ${added113} games`);

  console.log('\nMigration complete!');
  console.log(`  Section 309: /u/robbiesutton (${added309} games, ${claimedDates.length} pre-claimed)`);
  console.log(`  Section 113: /u/robbiesutton-113 (${added113} games, all available)`);
  console.log(`\nLogin with: robbiecsutton@gmail.com or robbiecsutton+113@gmail.com`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
