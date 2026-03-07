let allGames = [];
let availableOnly = false;

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['', 'Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ==================== Data Loading ====================

async function loadGames() {
  const res = await fetch('/api/games');
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

// Handle hash on load
window.addEventListener('load', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'mygames') showView('mygames');
});

// ==================== Calendar ====================

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  const byDate = groupByDate(allGames);

  // Group dates by month
  const monthDates = {};
  for (const [date, games] of Object.entries(byDate)) {
    const month = parseInt(date.split('-')[1]);
    if (!monthDates[month]) monthDates[month] = [];
    const hasAvailable = games.some(g => g.status === 'available');
    const d = new Date(date + 'T12:00:00');
    const dayName = DAYS[d.getDay()];
    const dayNum = d.getDate();
    monthDates[month].push({ date, dayName, dayNum, hasAvailable });
  }

  let html = '<div class="calendar-grid">';
  for (const [month, dates] of Object.entries(monthDates)) {
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
  // Make sure we're on the available view
  showView('available');
  const el = document.getElementById(`game-${date}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 1500);
  }
}

// ==================== Game List ====================

function groupByDate(games) {
  const groups = {};
  for (const game of games) {
    if (!groups[game.date]) groups[game.date] = [];
    groups[game.date].push(game);
  }
  return groups;
}

function groupByMonth(dateGroups) {
  const months = {};
  for (const [date, games] of Object.entries(dateGroups)) {
    const month = parseInt(date.split('-')[1]);
    const year = date.split('-')[0];
    const key = `${MONTHS[month]} ${year}`;
    if (!months[key]) months[key] = [];
    months[key].push(games);
  }
  return months;
}

function renderGames() {
  const container = document.getElementById('games-container');
  const byDate = groupByDate(allGames);

  let dateGroups = byDate;
  if (availableOnly) {
    const filtered = {};
    for (const [date, games] of Object.entries(byDate)) {
      if (games.some(g => g.status === 'available')) {
        filtered[date] = games;
      }
    }
    dateGroups = filtered;
  }

  if (Object.keys(dateGroups).length === 0) {
    container.innerHTML = '<div class="empty-state">No games match your filters.</div>';
    return;
  }

  const grouped = groupByMonth(dateGroups);
  let html = '';

  for (const [month, dateGamesList] of Object.entries(grouped)) {
    html += `<h2 class="month-header">${month}</h2>`;
    for (const games of dateGamesList) {
      html += renderMergedCard(games);
    }
  }

  container.innerHTML = html;
}

function renderMergedCard(games) {
  const first = games[0];
  const giveawayHtml = first.giveaway
    ? `<span class="giveaway-badge">${escapeHtml(first.giveaway)}</span>`
    : '';

  const sorted = games.sort((a, b) => a.section.localeCompare(b.section));
  let buttonsHtml = '';
  for (const game of sorted) {
    const label = `Section ${game.section}`;
    if (game.status === 'available') {
      buttonsHtml += `<button class="btn-section btn-section-available" onclick="openClaimModal(${game.id}, '${escapeAttr(game.display_date)}', '${escapeAttr(game.opponent)}', '${game.section}', '${escapeAttr(game.giveaway || '')}')">Claim ${label}</button>`;
    } else {
      buttonsHtml += `<button class="btn-section btn-section-unavailable" disabled>${label} Unavailable</button>`;
    }
  }

  return `
    <div class="game-card" id="game-${first.date}">
      <div class="game-info">
        <div class="game-date">${escapeHtml(first.display_date)}</div>
        <div class="game-opponent">vs ${escapeHtml(first.opponent)}</div>
        <div class="game-meta">
          ${giveawayHtml}
          <span>2 tickets per section</span>
        </div>
      </div>
      <div class="game-actions">${buttonsHtml}</div>
    </div>
  `;
}

// ==================== Claim Modal ====================

function openClaimModal(gameId, date, opponent, section, giveaway) {
  const sectionLabel = `Section ${section}`;
  const giveawayLine = giveaway ? `<br>Giveaway: <strong>${escapeHtml(giveaway)}</strong>` : '';

  document.getElementById('modal-game-details').innerHTML = `
    <strong>${escapeHtml(date)}</strong> vs <strong>${escapeHtml(opponent)}</strong><br>
    ${sectionLabel} &mdash; 2 tickets${giveawayLine}
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
    const res = await fetch('/api/claim', {
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
      showToast('Tickets claimed! Robbie will be in touch.', 'success');
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
    const res = await fetch(`/api/my-games?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.claims.length === 0) {
      resultsDiv.innerHTML = '<div class="empty-state">No claimed games found for this email.</div>';
      return;
    }

    let html = `<h3 class="mygames-count">${data.claims.length} game${data.claims.length > 1 ? 's' : ''} claimed</h3>`;
    for (const c of data.claims) {
      const giveawayHtml = c.giveaway ? `<span class="giveaway-badge">${escapeHtml(c.giveaway)}</span>` : '';
      html += `
        <div class="game-card">
          <div class="game-info">
            <div class="game-date">${escapeHtml(c.display_date)}</div>
            <div class="game-opponent">vs ${escapeHtml(c.opponent)}</div>
            <div class="game-meta">
              <span class="section-badge">Section ${c.section}</span>
              ${giveawayHtml}
              <span>2 tickets</span>
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

// ==================== Init ====================
loadGames();
