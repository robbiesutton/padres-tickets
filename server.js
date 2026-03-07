const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'padres2026';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Admin auth middleware
function adminAuth(req, res, next) {
  const password = req.headers.authorization?.replace('Bearer ', '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// === Public Routes ===

app.get('/api/games', (req, res) => {
  const section = req.query.section || 'all';
  const games = db.getGames(section);
  res.json({ games });
});

app.post('/api/claim', (req, res) => {
  const { gameId, email, name, notes } = req.body;

  if (!gameId || !email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    db.claimGame(gameId, email.trim(), name.trim(), notes?.trim());
    res.json({ success: true, message: 'Tickets claimed successfully!' });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.get('/api/my-games', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const claims = db.getClaimsByEmail(email.trim());
  res.json({ claims });
});

// === Admin Routes ===

app.get('/api/admin/claims', adminAuth, (req, res) => {
  const claims = db.getClaims();
  res.json({ claims });
});

app.get('/api/admin/games', adminAuth, (req, res) => {
  const games = db.getAdminGames();
  res.json({ games });
});

app.post('/api/admin/unclaim', adminAuth, (req, res) => {
  try {
    db.unclaimGame(req.body.gameId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/update-price', adminAuth, (req, res) => {
  try {
    const { gameId, price } = req.body;
    const numPrice = price === '' || price === null ? null : parseFloat(price);
    db.updateGamePrice(gameId, numPrice);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/update-status', adminAuth, (req, res) => {
  try {
    db.updateGameStatus(req.body.gameId, req.body.status);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Initialize DB and start
db.initialize();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Padres Ticket Manager running on port ${PORT}`);
  if (ADMIN_PASSWORD === 'padres2026') {
    console.log('⚠️  Using default admin password. Set ADMIN_PASSWORD env var for production.');
  }
});
