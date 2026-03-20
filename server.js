const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('./db');

const notifications = require('./lib/notifications');
const venmoLib = require('./lib/venmo');
const transferLib = require('./lib/transfer');
const autoTransfer = require('./lib/auto-transfer');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// === Auth Middleware ===

function ownerAuth(req, res, next) {
  const sessionId = req.cookies?.session;
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

  const session = db.getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Session expired' });

  const account = db.getAccountById(session.account_id);
  if (!account) return res.status(401).json({ error: 'Account not found' });

  req.account = account;
  next();
}

// === Helper ===

function generateDisplayDate(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

// === Auth Routes ===

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, displayName, slug, teamName, venueName, section, season } = req.body;

  if (!email || !password || !displayName || !slug || !teamName) {
    return res.status(400).json({ error: 'Email, password, name, URL slug, and team name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'URL slug must be lowercase letters, numbers, and hyphens only' });
  }
  if (slug.length < 3 || slug.length > 40) {
    return res.status(400).json({ error: 'URL slug must be 3-40 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (db.getAccountByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  if (db.getAccountBySlug(slug)) {
    return res.status(409).json({ error: 'This URL slug is already taken' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.createAccount({
      email: email.trim(),
      passwordHash,
      displayName: displayName.trim(),
      slug: slug.trim(),
      teamName: teamName.trim(),
      venueName: venueName?.trim() || null,
      section: section?.trim() || null,
      season: season?.trim() || null
    });

    const session = db.createSession(result.lastInsertRowid);
    res.cookie('session', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ success: true, slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const account = db.getAccountByEmail(email.trim());
  if (!account) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, account.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const session = db.createSession(account.id);
  res.cookie('session', session.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  res.json({ success: true, slug: account.slug });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies?.session;
  if (sessionId) db.deleteSession(sessionId);
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/me', ownerAuth, (req, res) => {
  const { password_hash, ...account } = req.account;
  res.json({ account });
});

// === Owner Routes ===

app.get('/api/owner/games', ownerAuth, (req, res) => {
  const games = db.getGamesByAccount(req.account.id);
  res.json({ games });
});

app.post('/api/owner/games', ownerAuth, (req, res) => {
  const { date, opponent, giveaway, price } = req.body;
  if (!date || !opponent) {
    return res.status(400).json({ error: 'Date and opponent are required' });
  }

  try {
    const displayDate = generateDisplayDate(date);
    db.addGame(req.account.id, { date, displayDate, opponent: opponent.trim(), giveaway: giveaway?.trim() || null, price: price != null ? parseFloat(price) : null });
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A game on this date already exists' });
    }
    res.status(500).json({ error: 'Failed to add game' });
  }
});

app.put('/api/owner/games/:id', ownerAuth, (req, res) => {
  const gameId = parseInt(req.params.id);
  const game = db.getGameByIdAndAccount(gameId, req.account.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const updates = {};
  if (req.body.date !== undefined) {
    updates.date = req.body.date;
    updates.display_date = generateDisplayDate(req.body.date);
  }
  if (req.body.opponent !== undefined) updates.opponent = req.body.opponent.trim();
  if (req.body.giveaway !== undefined) updates.giveaway = req.body.giveaway?.trim() || null;
  if (req.body.price !== undefined) updates.price = req.body.price === '' || req.body.price === null ? null : parseFloat(req.body.price);
  if (req.body.status !== undefined) {
    const valid = ['available', 'no', 'claimed'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    updates.status = req.body.status;
  }

  db.updateGame(gameId, req.account.id, updates);
  res.json({ success: true });
});

app.delete('/api/owner/games/:id', ownerAuth, (req, res) => {
  const gameId = parseInt(req.params.id);
  const result = db.deleteGame(gameId, req.account.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Game not found' });
  res.json({ success: true });
});

app.post('/api/owner/games/bulk', ownerAuth, (req, res) => {
  const { games } = req.body;
  if (!Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ error: 'Games array is required' });
  }

  // Validate and generate display dates
  const prepared = games.map(g => {
    if (!g.date || !g.opponent) throw new Error('Each game needs a date and opponent');
    return {
      date: g.date,
      displayDate: g.displayDate || generateDisplayDate(g.date),
      opponent: g.opponent.trim(),
      giveaway: g.giveaway?.trim() || null,
      price: g.price != null ? parseFloat(g.price) : null
    };
  });

  try {
    const added = db.bulkAddGames(req.account.id, prepared);
    res.json({ success: true, added, total: games.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/owner/games/parse-image', ownerAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: 'Image parsing is not configured. Set ANTHROPIC_API_KEY to enable.' });
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const base64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype || 'image/jpeg';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Extract the game schedule from this image. Return a JSON array of objects with these fields:
- date: YYYY-MM-DD format
- opponent: team name (just the team name, not city)
- giveaway: promotional item if listed, otherwise null
- price: ticket price if shown, otherwise null

Return ONLY valid JSON, no other text. Example:
[{"date": "2026-03-26", "opponent": "Tigers", "giveaway": null, "price": null}]` }
        ]
      }]
    });

    const text = response.content[0].text.trim();
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Could not parse games from image' });
    }

    const games = JSON.parse(jsonMatch[0]);
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse image: ' + err.message });
  }
});

app.get('/api/owner/claims', ownerAuth, (req, res) => {
  const claims = db.getClaimsByAccount(req.account.id);
  res.json({ claims });
});

app.post('/api/owner/unclaim/:gameId', ownerAuth, (req, res) => {
  try {
    db.unclaimGame(parseInt(req.params.gameId), req.account.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/owner/settings', ownerAuth, (req, res) => {
  const { password_hash, ...account } = req.account;
  res.json({ account });
});

app.put('/api/owner/settings', ownerAuth, (req, res) => {
  const settings = {};
  const fields = ['display_name', 'team_name', 'venue_name', 'section', 'season', 'tickets_per_game', 'primary_color', 'accent_color', 'slug'];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  }

  // Validate slug if changing
  if (settings.slug) {
    if (!/^[a-z0-9-]+$/.test(settings.slug)) {
      return res.status(400).json({ error: 'URL slug must be lowercase letters, numbers, and hyphens only' });
    }
    const existing = db.getAccountBySlug(settings.slug);
    if (existing && existing.id !== req.account.id) {
      return res.status(409).json({ error: 'This URL slug is already taken' });
    }
  }

  db.updateAccountSettings(req.account.id, settings);
  res.json({ success: true });
});

// === Public Routes (per-account via slug) ===

app.get('/api/u/:slug/info', (req, res) => {
  const info = db.getAccountInfoBySlug(req.params.slug);
  if (!info) return res.status(404).json({ error: 'Account not found' });
  res.json(info);
});

app.get('/api/u/:slug/games', (req, res) => {
  const info = db.getAccountInfoBySlug(req.params.slug);
  if (!info) return res.status(404).json({ error: 'Account not found' });

  const games = db.getGamesBySlug(req.params.slug);
  res.json({ games });
});

app.post('/api/u/:slug/claim', (req, res) => {
  const { gameId, email, name, notes } = req.body;

  if (!gameId || !email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    db.claimGameBySlug(req.params.slug, gameId, email.trim(), name.trim(), notes?.trim());
    res.json({ success: true, message: 'Tickets claimed successfully!' });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.get('/api/u/:slug/my-games', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const info = db.getAccountInfoBySlug(req.params.slug);
  if (!info) return res.status(404).json({ error: 'Account not found' });

  const claims = db.getClaimsBySlugAndEmail(req.params.slug, email.trim());
  res.json({ claims });
});

// === Transfer Routes ===

// Mark a listing as transferred (called from email link or dashboard)
app.post('/api/transfers/:listingId/mark-transferred', ownerAuth, (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const listing = db.getListingWithContext(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.owner_id !== req.account.id) return res.status(403).json({ error: 'Not authorized' });

    const claim = db.markTransferred(listingId, req.account.id);

    // Notify claimer that tickets are on the way
    const holder = db.getUserById(listing.owner_id);
    const claimer = db.getUserById(claim.claimer_id);
    if (holder && claimer) {
      notifications.sendTransferComplete(listing, claim, holder, claimer, listing, { opponent: listing.opponent, game_date: listing.game_date }, listing.team_id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET handler for mark-transferred (for email link clicks)
app.get('/api/transfers/:listingId/mark-transferred', ownerAuth, (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const listing = db.getListingWithContext(listingId);
    if (!listing) return res.status(404).send('Listing not found');
    if (listing.owner_id !== req.account.id) return res.status(403).send('Not authorized');

    const claim = db.markTransferred(listingId, req.account.id);

    const holder = db.getUserById(listing.owner_id);
    const claimer = db.getUserById(claim.claimer_id);
    if (holder && claimer) {
      notifications.sendTransferComplete(listing, claim, holder, claimer, listing, { opponent: listing.opponent, game_date: listing.game_date }, listing.team_id);
    }

    // Redirect to dashboard with success message
    res.redirect('/dashboard?transferred=1');
  } catch (err) {
    res.redirect('/dashboard?error=' + encodeURIComponent(err.message));
  }
});

// Get pending transfers for the logged-in holder
app.get('/api/transfers/pending', ownerAuth, (req, res) => {
  const pending = db.getPendingTransfers(req.account.id);
  res.json({ transfers: pending });
});

// Update payment status on a claim
app.put('/api/transfers/:claimId/payment', ownerAuth, (req, res) => {
  try {
    const { status } = req.body;
    db.updatePaymentStatus(parseInt(req.params.claimId), status);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate Venmo payment link
app.get('/api/venmo/link', (req, res) => {
  const { handle, amount, note } = req.query;
  if (!handle || !amount) return res.status(400).json({ error: 'handle and amount required' });
  const urls = venmoLib.generateRequestUrl(handle, parseFloat(amount), note || '');
  if (!urls) return res.status(400).json({ error: 'Invalid handle' });
  res.json(urls);
});

// Get transfer instructions for a team
app.get('/api/transfer-instructions/:teamId', (req, res) => {
  const info = transferLib.getTransferInstructions(parseInt(req.params.teamId));
  if (!info) return res.status(404).json({ error: 'Team not found' });
  res.json(info);
});

// === Connected Accounts (Auto Mode) ===

app.post('/api/connected-accounts/connect', ownerAuth, (req, res) => {
  const { email, password, platform } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = autoTransfer.connectAccount(req.account.id, email, password, platform || 'ticketmaster');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect account: ' + err.message });
  }
});

app.post('/api/connected-accounts/disconnect', ownerAuth, (req, res) => {
  const { platform } = req.body;
  const result = autoTransfer.disconnectAccount(req.account.id, platform || 'ticketmaster');
  res.json(result);
});

app.get('/api/connected-accounts/status', ownerAuth, (req, res) => {
  const platform = req.query.platform || 'ticketmaster';
  const status = autoTransfer.getConnectionStatus(req.account.id, platform);
  res.json(status);
});

app.post('/api/connected-accounts/sync', ownerAuth, async (req, res) => {
  try {
    const result = await autoTransfer.syncInventory(req.account.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Page Routes ===

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/u/:slug', (req, res) => {
  const info = db.getAccountInfoBySlug(req.params.slug);
  if (!info) return res.status(404).send('Account not found');
  res.sendFile(path.join(__dirname, 'public', 'tickets.html'));
});

// Initialize DB and start
db.initialize();

// Clean expired sessions on startup
db.cleanExpiredSessions();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Season Ticket Manager running on port ${PORT}`);
});
