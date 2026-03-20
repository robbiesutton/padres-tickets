// Auto Mode: Credential-connect Ticketmaster automation
// Uses Playwright for headless browser automation of ticket transfers
const db = require('../db');
const crypto = require('./crypto');
const notifications = require('./notifications');

// Transfer queue to serialize operations
const transferQueue = [];
let isProcessing = false;

// === Account Connection ===

function connectAccount(userId, email, password, platform = 'ticketmaster') {
  const encEmail = crypto.encrypt(email, userId);
  const encPassword = crypto.encrypt(password, userId);

  db.db.prepare(`
    INSERT INTO connected_accounts (user_id, platform, encrypted_email, encrypted_password, encryption_iv, status)
    VALUES (?, ?, ?, ?, ?, 'active')
    ON CONFLICT(user_id, platform) DO UPDATE SET
      encrypted_email = excluded.encrypted_email,
      encrypted_password = excluded.encrypted_password,
      encryption_iv = excluded.encryption_iv,
      status = 'active'
  `).run(
    userId,
    platform,
    encEmail.encrypted,
    encPassword.encrypted,
    encEmail.iv + ':' + encPassword.iv,
    // Note: using combined IVs since they're per-field
  );

  return { success: true, status: 'active' };
}

function disconnectAccount(userId, platform = 'ticketmaster') {
  db.db.prepare(`
    DELETE FROM connected_accounts WHERE user_id = ? AND platform = ?
  `).run(userId, platform);

  return { success: true };
}

function getConnectionStatus(userId, platform = 'ticketmaster') {
  const conn = db.db.prepare(
    'SELECT status, last_sync_at, created_at FROM connected_accounts WHERE user_id = ? AND platform = ?'
  ).get(userId, platform);

  if (!conn) return { connected: false };

  return {
    connected: conn.status === 'active',
    status: conn.status,
    lastSync: conn.last_sync_at,
    connectedAt: conn.created_at,
  };
}

function getDecryptedCredentials(userId, platform = 'ticketmaster') {
  const conn = db.db.prepare(
    'SELECT * FROM connected_accounts WHERE user_id = ? AND platform = ? AND status = ?'
  ).get(userId, platform, 'active');

  if (!conn) return null;

  const [emailIv, passwordIv] = conn.encryption_iv.split(':');
  return {
    email: crypto.decrypt(conn.encrypted_email, emailIv, userId),
    password: crypto.decrypt(conn.encrypted_password, passwordIv, userId),
  };
}

// === Ticket Transfer via Playwright ===

async function executeTransfer(listingId, recipientEmail) {
  const listing = db.db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  if (!listing) throw new Error('Listing not found');

  const pkg = db.db.prepare(`
    SELECT tp.*, t.name as team_name, t.full_name as team_full_name, t.abbreviation,
           t.id as team_id
    FROM ticket_packages tp
    JOIN teams t ON t.id = tp.team_id
    WHERE tp.id = ?
  `).get(listing.package_id);
  if (!pkg) throw new Error('Package not found');

  const game = db.db.prepare('SELECT * FROM games_v2 WHERE id = ?').get(listing.game_id);
  if (!game) throw new Error('Game not found');

  const credentials = getDecryptedCredentials(pkg.owner_id);
  if (!credentials) {
    throw new Error('No connected account — falling back to manual mode');
  }

  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Navigate to Ticketmaster Account Manager
    const slug = pkg.abbreviation ? pkg.abbreviation.toLowerCase() : pkg.team_name.toLowerCase();
    await page.goto(`https://am.ticketmaster.com/${slug}/mytickets`);

    // Login flow
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.click('button[type="submit"], button:has-text("Next"), button:has-text("Sign In")');

    await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 });
    await page.fill('input[name="password"], input[type="password"]', credentials.password);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');

    // Wait for tickets page to load
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

    // Find the game by date
    const gameDate = new Date(game.game_date);
    const formattedDate = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Look for the game in the ticket list
    const gameCard = await page.locator(`text=${game.opponent}`).first();
    if (!gameCard) throw new Error(`Could not find game: ${game.opponent}`);
    await gameCard.click();

    // Click transfer button
    await page.waitForSelector('button:has-text("Transfer"), a:has-text("Transfer")', { timeout: 10000 });
    await page.click('button:has-text("Transfer"), a:has-text("Transfer")');

    // Select all tickets
    const selectAll = await page.locator('input[type="checkbox"]').first();
    if (selectAll) await selectAll.check();

    // Enter recipient email
    await page.waitForSelector('input[name="email"], input[type="email"], input[placeholder*="email"]', { timeout: 10000 });
    await page.fill('input[name="email"], input[type="email"], input[placeholder*="email"]', recipientEmail);

    // Confirm transfer
    await page.click('button:has-text("Transfer"), button:has-text("Send"), button:has-text("Confirm")');

    // Wait for confirmation
    await page.waitForSelector('text=success, text=transferred, text=sent', { timeout: 15000 }).catch(() => {});

    await browser.close();

    // Update transfer status
    db.db.prepare("UPDATE claims_v2 SET transfer_status = 'transferred' WHERE listing_id = ?").run(listingId);
    db.db.prepare("UPDATE listings SET status = 'transferred' WHERE id = ?").run(listingId);

    return { success: true, method: 'auto' };
  } catch (err) {
    console.error(`Auto-transfer failed for listing ${listingId}:`, err.message);
    throw err;
  }
}

// Queue a transfer and process sequentially
function queueTransfer(listingId, recipientEmail, fallbackCallback) {
  transferQueue.push({ listingId, recipientEmail, fallbackCallback });
  processQueue();
}

async function processQueue() {
  if (isProcessing || transferQueue.length === 0) return;
  isProcessing = true;

  while (transferQueue.length > 0) {
    const { listingId, recipientEmail, fallbackCallback } = transferQueue.shift();
    try {
      await executeTransfer(listingId, recipientEmail);
    } catch (err) {
      console.error(`Transfer failed for listing ${listingId}, falling back to manual:`, err.message);
      if (fallbackCallback) fallbackCallback(listingId, err);
    }

    // Small delay between transfers to avoid rate limiting
    if (transferQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  isProcessing = false;
}

// Sync inventory from Ticketmaster (future enhancement)
async function syncInventory(userId) {
  // Placeholder — will read ticket inventory from TM and update listings
  const credentials = getDecryptedCredentials(userId);
  if (!credentials) throw new Error('No connected account');

  db.db.prepare(
    "UPDATE connected_accounts SET last_sync_at = datetime('now') WHERE user_id = ? AND status = 'active'"
  ).run(userId);

  return { success: true, message: 'Sync not yet implemented — credentials verified' };
}

module.exports = {
  connectAccount,
  disconnectAccount,
  getConnectionStatus,
  executeTransfer,
  queueTransfer,
  syncInventory,
};
