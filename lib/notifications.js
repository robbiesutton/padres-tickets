// Notification orchestration for ticket transfers
const fs = require('fs');
const path = require('path');
const db = require('../db');
const venmo = require('./venmo');
const transfer = require('./transfer');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Simple template engine — replaces {{var}} and handles {{#if}}/{{#each}} blocks
function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, 'email-templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');

  // Handle {{#if var}}...{{/if}}
  html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return data[key] ? content : '';
  });

  // Handle {{#each var}}...{{/each}}
  html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, content) => {
    const arr = data[key];
    if (!Array.isArray(arr)) return '';
    return arr.map(item => content.replace(/\{\{this\}\}/g, item)).join('');
  });

  // Handle {{var}}
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
  });

  return html;
}

// Log a sent notification
function logNotification(userId, claimId, type, channel, metadata) {
  db.db.prepare(`
    INSERT INTO notification_log (user_id, claim_id, type, channel, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, claimId || null, type, channel, metadata ? JSON.stringify(metadata) : null);
}

// Check if a notification of this type was already sent for this claim
function wasNotificationSent(claimId, type) {
  return db.db.prepare(
    'SELECT id FROM notification_log WHERE claim_id = ? AND type = ?'
  ).get(claimId, type);
}

// Build common template data from a claim context
function buildTemplateData(listing, claim, holder, claimer, pkg, game, teamId) {
  const transferInfo = transfer.getTransferInstructions(teamId);
  const acceptInfo = transfer.getAcceptInstructions(teamId);

  const numTickets = claim.num_tickets || pkg.tickets_per_game || 2;
  const pricePerTicket = listing.price != null ? listing.price : (pkg.default_price || 0);
  const totalAmount = pricePerTicket > 0 ? (pricePerTicket * numTickets).toFixed(2) : null;

  let venmoUrls = null;
  if (totalAmount && holder.venmo_handle) {
    const note = venmo.buildPaymentNote(
      pkg.team_name || pkg.display_name,
      game.opponent,
      game.game_date,
      pkg.section
    );
    venmoUrls = venmo.generateRequestUrl(holder.venmo_handle, totalAmount, note);
  }

  return {
    // Holder
    holderFirstName: holder.first_name,
    holderName: `${holder.first_name} ${holder.last_name}`,
    // Claimer
    claimerFirstName: claimer.first_name,
    claimerName: `${claimer.first_name} ${claimer.last_name}`,
    claimerEmail: claimer.email,
    // Game
    teamName: pkg.team_name || pkg.display_name,
    opponent: game.opponent,
    gameDate: game.game_date,
    venueName: pkg.venue_name,
    // Seats
    section: pkg.section || '—',
    row: pkg.row || '—',
    seats: pkg.seats || '—',
    // Price
    numTickets,
    pricePerTicket: pricePerTicket > 0 ? pricePerTicket.toFixed(2) : null,
    totalAmount,
    // Venmo
    venmoUrl: venmoUrls?.web,
    venmoWebUrl: venmoUrls?.web,
    venmoAppUrl: venmoUrls?.app,
    // Transfer
    transferSteps: transferInfo?.steps || [],
    transferDeepLink: transferInfo?.deepLink,
    platformName: transferInfo?.platformName || 'your ticketing app',
    acceptSteps: acceptInfo?.steps || [],
    // Actions
    markTransferredUrl: `${APP_URL}/api/transfers/${listing.id}/mark-transferred`,
    // Branding
    primaryColor: pkg.primary_color || pkg.team_primary_color || '#2F241D',
  };
}

// === Notification Functions ===

// Orchestrate all post-claim notifications
function onGameClaimed(listing, claim, holder, claimer, pkg, game, teamId) {
  const data = buildTemplateData(listing, claim, holder, claimer, pkg, game, teamId);

  // Send transfer action email to holder
  const holderHtml = renderTemplate('transfer-action', data);
  const holderSubject = `Transfer ${data.teamName} vs ${data.opponent} tickets to ${data.claimerName}`;
  sendEmail(holder.email, holderSubject, holderHtml);
  logNotification(holder.id, claim.id, 'transfer_action', 'email', { listingId: listing.id });

  // Send claim confirmation to claimer
  const claimerHtml = renderTemplate('claim-confirmation', data);
  const claimerSubject = `You're going to ${data.teamName} vs ${data.opponent}!`;
  sendEmail(claimer.email, claimerSubject, claimerHtml);
  logNotification(claimer.id, claim.id, 'claim_confirmation', 'email', { listingId: listing.id });

  // Schedule reminders
  scheduleReminders(claim.id, listing, holder, claimer, pkg, game, teamId);

  // Log activity
  db.db.prepare(`
    INSERT INTO activity_log (user_id, package_id, listing_id, event_type, actor_id, metadata)
    VALUES (?, ?, ?, 'claim', ?, ?)
  `).run(holder.id, pkg.id, listing.id, claimer.id, JSON.stringify({
    claimer_name: data.claimerName,
    opponent: game.opponent,
    game_date: game.game_date,
  }));
}

// Send transfer reminder to holder
function sendTransferReminder(listing, claim, holder, claimer, pkg, game, teamId, isUrgent) {
  const type = isUrgent ? 'reminder_urgent' : 'reminder_gentle';
  if (wasNotificationSent(claim.id, type)) return;

  const data = buildTemplateData(listing, claim, holder, claimer, pkg, game, teamId);

  const now = new Date();
  const gameDate = new Date(game.game_date + 'T00:00:00');
  const daysUntil = Math.ceil((gameDate - now) / (1000 * 60 * 60 * 24));
  data.isUrgent = isUrgent;
  data.daysUntilGame = daysUntil <= 1 ? 'tomorrow' : `in ${daysUntil} days`;

  const html = renderTemplate('transfer-reminder', data);
  const subject = isUrgent
    ? `Urgent: Transfer ${data.teamName} tickets to ${data.claimerName} — game is ${data.daysUntilGame}`
    : `Reminder: Transfer ${data.teamName} vs ${data.opponent} tickets to ${data.claimerName}`;

  sendEmail(holder.email, subject, html);
  logNotification(holder.id, claim.id, type, 'email', { listingId: listing.id });
}

// Notify claimer that tickets have been transferred
function sendTransferComplete(listing, claim, holder, claimer, pkg, game, teamId) {
  if (wasNotificationSent(claim.id, 'transfer_complete')) return;

  const data = buildTemplateData(listing, claim, holder, claimer, pkg, game, teamId);
  const html = renderTemplate('transfer-complete', data);
  const subject = `Your ${data.teamName} vs ${data.opponent} tickets are ready!`;

  sendEmail(claimer.email, subject, html);
  logNotification(claimer.id, claim.id, 'transfer_complete', 'email', { listingId: listing.id });

  // Log activity
  db.db.prepare(`
    INSERT INTO activity_log (user_id, package_id, listing_id, event_type, actor_id, metadata)
    VALUES (?, ?, ?, 'transfer', ?, ?)
  `).run(holder.id, pkg.id, listing.id, holder.id, JSON.stringify({
    claimer_name: `${claimer.first_name} ${claimer.last_name}`,
    opponent: game.opponent,
  }));
}

// Schedule reminder notifications
function scheduleReminders(claimId, listing, holder, claimer, pkg, game, teamId) {
  const now = Date.now();
  const gameDate = new Date(game.game_date + 'T00:00:00').getTime();
  const gentleTime = now + 24 * 60 * 60 * 1000;       // +24h from claim
  const urgentTime = gameDate - 48 * 60 * 60 * 1000;   // game - 48h

  // Store reminder schedule in notification_log metadata
  db.db.prepare(`
    INSERT INTO notification_log (user_id, claim_id, type, channel, metadata)
    VALUES (?, ?, 'reminder_scheduled', 'system', ?)
  `).run(holder.id, claimId, JSON.stringify({
    listingId: listing.id,
    gentleAt: new Date(gentleTime).toISOString(),
    urgentAt: new Date(urgentTime).toISOString(),
    teamId,
  }));
}

// Process pending reminders (call this on a cron/interval)
function processPendingReminders() {
  const now = new Date().toISOString();

  // Find scheduled reminders
  const scheduled = db.db.prepare(`
    SELECT nl.*, c.transfer_status, c.listing_id as claim_listing_id
    FROM notification_log nl
    JOIN claims_v2 c ON c.id = nl.claim_id
    WHERE nl.type = 'reminder_scheduled'
      AND c.transfer_status = 'pending'
      AND c.released_at IS NULL
  `).all();

  for (const entry of scheduled) {
    const meta = JSON.parse(entry.metadata || '{}');
    if (!meta.gentleAt || !meta.urgentAt) continue;

    const claim = db.db.prepare('SELECT * FROM claims_v2 WHERE id = ?').get(entry.claim_id);
    if (!claim || claim.transfer_status !== 'pending') continue;

    const listing = db.db.prepare('SELECT * FROM listings WHERE id = ?').get(claim.listing_id);
    if (!listing) continue;

    const pkg = db.db.prepare(`
      SELECT tp.*, t.name as team_name, t.full_name as team_full_name, t.venue_name,
             t.primary_color as team_primary_color, t.accent_color as team_accent_color
      FROM ticket_packages tp
      JOIN teams t ON t.id = tp.team_id
      WHERE tp.id = ?
    `).get(listing.package_id);
    if (!pkg) continue;

    const game = db.db.prepare('SELECT * FROM games_v2 WHERE id = ?').get(listing.game_id);
    if (!game) continue;

    const holder = db.db.prepare('SELECT * FROM users WHERE id = ?').get(pkg.owner_id);
    const claimer = db.db.prepare('SELECT * FROM users WHERE id = ?').get(claim.claimer_id);
    if (!holder || !claimer) continue;

    // Send gentle reminder if time has passed
    if (now >= meta.gentleAt && !wasNotificationSent(claim.id, 'reminder_gentle')) {
      sendTransferReminder(listing, claim, holder, claimer, pkg, game, meta.teamId, false);
    }

    // Send urgent reminder if time has passed
    if (now >= meta.urgentAt && !wasNotificationSent(claim.id, 'reminder_urgent')) {
      sendTransferReminder(listing, claim, holder, claimer, pkg, game, meta.teamId, true);
    }
  }
}

// Email sending — stub that logs to console until an email provider is configured
function sendEmail(to, subject, html) {
  const provider = process.env.EMAIL_PROVIDER; // 'resend' or 'sendgrid'

  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    // Resend integration
    const Resend = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: process.env.EMAIL_FROM || 'BenchBuddies <noreply@benchbuddies.com>',
      to,
      subject,
      html,
    }).catch(err => console.error('Resend error:', err));
  }

  // Dev mode: log to console
  console.log(`\n📧 EMAIL TO: ${to}`);
  console.log(`   SUBJECT: ${subject}`);
  console.log(`   (${html.length} chars of HTML)\n`);
}

module.exports = {
  onGameClaimed,
  sendTransferReminder,
  sendTransferComplete,
  scheduleReminders,
  processPendingReminders,
  renderTemplate,
  logNotification,
  sendEmail,
};
