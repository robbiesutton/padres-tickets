let allGames = [];
let accountInfo = null;
let availableOnly = false;

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get the slug from the URL path: /u/slug
const slug = window.location.pathname.split('/u/')[1]?.split('/')[0];

if (!slug) {
  document.body.innerHTML = '<div class="empty-state">Page not found.</div>';
}

// ==================== Init ====================

async function init() {
  // Load account info for theming
  try {
    const infoRes = await fetch(`/api/u/${slug}/info`);
    if (!infoRes.ok) {
      document.body.innerHTML = '<div class="empty-state">Account not found.</div>';
      return;
    }
    accountInfo = await infoRes.json();
    applyTheme();
    loadGames();
  } catch {
    document.body.innerHTML = '<div class="empty-state">Failed to load page.</div>';
  }
}

function applyTheme() {
  if (accountInfo.primary_color) {
    document.documentElement.style.setProperty('--brown', accountInfo.primary_color);
  }
  if (accountInfo.accent_color) {
    document.documentElement.style.setProperty('--gold', accountInfo.accent_color);
  }

  document.getElementById('page-title').textContent =
    `${accountInfo.display_name}'s ${accountInfo.team_name} Tickets`;

  const parts = [];
  if (accountInfo.section) parts.push(`Section ${accountInfo.section}`);
  if (accountInfo.venue_name) parts.push(accountInfo.venue_name);
  if (accountInfo.season) parts.push(`${accountInfo.season} Season`);
  document.getElementById('page-subtitle').textContent = parts.join(' \u00B7 ');

  document.title = `${accountInfo.display_name}'s ${accountInfo.team_name} Tickets`;

  // Update claim notes label
  document.getElementById('claim-notes-label').textContent =
    `Message for ${accountInfo.display_name} (optional)`;
}

// ==================== Data Loading ====================

async function loadGames() {
  const res = await fetch(`/api/u/${slug}/games`);
  const data = await res.json();
  allGames = data.games;
  renderCalendar();
  renderGames();
}

// ==================== View Switching ====================

function showView(viewName) {
  document.getElementById('view-available').classList.toggle('hidden', viewName !== 'available');
  document.getElementById('view-mygames').classList.toggle('hidden', viewName !== 'mygames');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  window.location.hash = viewName;
}

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

window.addEventListener('load', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'mygames') showView('mygames');
});

// ==================== Calendar ====================

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  const byMonth = {};

  for (const game of allGames) {
    const month = parseInt(game.date.split('-')[1]);
    if (!byMonth[month]) byMonth[month] = [];
    const d = new Date(game.date + 'T12:00:00');
    byMonth[month].push({
      date: game.date,
      dayName: DAYS[d.getDay()],
      dayNum: d.getDate(),
      hasAvailable: game.status === 'available'
    });
  }

  let html = '<div class="calendar-grid">';
  for (const [month, dates] of Object.entries(byMonth)) {
    html += `<div class="calendar-month">`;
    html += `<div class="calendar-month-name">${MONTHS[month]}</div>`;
    html += `<div class="calendar-dates">`;
    for (const d of dates) {
      const cls = d.hasAvailable ? 'cal-date cal-available' : 'cal-date cal-unavailable';
      html += `<a href="#game-${d.date}" class="${cls}" onclick="scrollToGame('${d.date}', event)">
        <span class="cal-day">${d.dayName}</span>
        <span class="cal-num">${d.dayNum}</span>
      </a>`;
    }
    html += `</div></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function scrollToGame(date, event) {
  event.preventDefault();
  showView('available');
  const el = document.getElementById(`game-${date}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 1500);
  }
}

// ==================== Game List ====================

function groupByMonth(games) {
  const months = {};
  for (const game of games) {
    const month = parseInt(game.date.split('-')[1]);
    const year = game.date.split('-')[0];
    const key = `${MONTHS[month]} ${year}`;
    if (!months[key]) months[key] = [];
    months[key].push(game);
  }
  return months;
}

function renderGames() {
  const container = document.getElementById('games-container');
  let games = allGames;

  if (availableOnly) {
    games = games.filter(g => g.status === 'available');
  }

  if (games.length === 0) {
    container.innerHTML = '<div class="empty-state">No games match your filters.</div>';
    return;
  }

  const grouped = groupByMonth(games);
  const ticketsLabel = accountInfo?.tickets_per_game
    ? `${accountInfo.tickets_per_game} ticket${accountInfo.tickets_per_game > 1 ? 's' : ''}`
    : '2 tickets';

  let html = '';
  for (const [month, monthGames] of Object.entries(grouped)) {
    html += `<h2 class="month-header">${month}</h2>`;
    html += '<div class="games-grid">';
    for (const game of monthGames) {
      html += renderGameCard(game, ticketsLabel);
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderGameCard(game, ticketsLabel) {
  const giveawayHtml = game.giveaway
    ? `<span class="giveaway-badge">${escapeHtml(game.giveaway)}</span>`
    : '';

  let buttonHtml;
  if (game.status === 'available') {
    const priceText = game.price != null ? ` \u00B7 $${Math.round(game.price)}` : '';
    buttonHtml = `<button class="btn-section btn-section-available" onclick="openClaimModal(${game.id}, '${escapeAttr(game.display_date)}', '${escapeAttr(game.opponent)}', '${escapeAttr(game.giveaway || '')}')">${ticketsLabel}${priceText}</button>`;
  } else if (game.status === 'claimed' && game.claimed_by) {
    const firstName = escapeHtml(game.claimed_by.trim().split(' ')[0]);
    buttonHtml = `<button class="btn-section btn-section-unavailable" disabled>Claimed \u00B7 ${firstName}</button>`;
  } else {
    buttonHtml = `<button class="btn-section btn-section-unavailable" disabled>Not Available</button>`;
  }

  return `
    <div class="game-card" id="game-${game.date}">
      <div class="game-info">
        <div class="game-date">${escapeHtml(game.display_date)}</div>
        <div class="game-opponent">vs ${escapeHtml(game.opponent)}</div>
        <div class="game-meta">
          ${giveawayHtml}
        </div>
      </div>
      <div class="game-actions">${buttonHtml}</div>
    </div>
  `;
}

// ==================== Claim Modal ====================

function openClaimModal(gameId, date, opponent, giveaway) {
  const sectionText = accountInfo?.section ? `Section ${accountInfo.section}` : '';
  const ticketsLabel = accountInfo?.tickets_per_game
    ? `${accountInfo.tickets_per_game} ticket${accountInfo.tickets_per_game > 1 ? 's' : ''}`
    : '2 tickets';
  const giveawayLine = giveaway ? `<br>Giveaway: <strong>${escapeHtml(giveaway)}</strong>` : '';

  document.getElementById('modal-game-details').innerHTML = `
    <strong>${escapeHtml(date)}</strong> vs <strong>${escapeHtml(opponent)}</strong><br>
    ${sectionText} &mdash; ${ticketsLabel}${giveawayLine}
  `;
  document.getElementById('claim-game-id').value = gameId;
  document.getElementById('claim-modal').classList.remove('hidden');
  document.getElementById('claim-name').focus();
}

function closeModal() {
  document.getElementById('claim-modal').classList.add('hidden');
  document.getElementById('claim-form').reset();
}

document.getElementById('claim-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Claiming...';

  try {
    const res = await fetch(`/api/u/${slug}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: parseInt(document.getElementById('claim-game-id').value),
        name: document.getElementById('claim-name').value,
        email: document.getElementById('claim-email').value,
        notes: document.getElementById('claim-notes').value
      })
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      showToast(`Tickets claimed! ${accountInfo?.display_name || 'The owner'} will be in touch.`, 'success');
      loadGames();
    } else {
      showToast(data.error || 'Something went wrong', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Claim These Tickets';
  }
});

// ==================== My Games ====================

document.getElementById('mygames-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('mygames-email').value.trim();
  if (!email) return;

  const resultsDiv = document.getElementById('mygames-results');
  resultsDiv.innerHTML = '<div class="empty-state">Looking up...</div>';

  try {
    const res = await fetch(`/api/u/${slug}/my-games?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.claims.length === 0) {
      resultsDiv.innerHTML = '<div class="empty-state">No claimed games found for this email.</div>';
      return;
    }

    const ticketsLabel = accountInfo?.tickets_per_game
      ? `${accountInfo.tickets_per_game} ticket${accountInfo.tickets_per_game > 1 ? 's' : ''}`
      : '2 tickets';

    let html = `<h3 class="mygames-count">${data.claims.length} game${data.claims.length > 1 ? 's' : ''} claimed</h3>`;
    for (const c of data.claims) {
      const giveawayHtml = c.giveaway ? `<span class="giveaway-badge">${escapeHtml(c.giveaway)}</span>` : '';
      html += `
        <div class="game-card">
          <div class="game-info">
            <div class="game-date">${escapeHtml(c.display_date)}</div>
            <div class="game-opponent">vs ${escapeHtml(c.opponent)}</div>
            <div class="game-meta">
              ${giveawayHtml}
              <span>${ticketsLabel}</span>
            </div>
          </div>
        </div>
      `;
    }
    resultsDiv.innerHTML = html;
  } catch {
    resultsDiv.innerHTML = '<div class="empty-state">Something went wrong. Please try again.</div>';
  }
});

// ==================== Filters ====================

document.getElementById('available-only').addEventListener('change', (e) => {
  availableOnly = e.target.checked;
  renderGames();
});

// ==================== Utilities ====================

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ==================== Start ====================
init();
