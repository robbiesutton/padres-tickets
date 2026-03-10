let account = null;
let allGames = [];
let parsedGames = [];

// ==================== Init ====================

async function init() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = '/login';
      return;
    }
    const data = await res.json();
    account = data.account;
    setupPage();
    loadDashboardData();
  } catch {
    window.location.href = '/login';
  }
}

function setupPage() {
  const origin = window.location.origin;
  const shareUrl = `${origin}/u/${account.slug}`;
  document.getElementById('share-link-display').textContent = `${account.team_name} Tickets`;
  document.getElementById('share-url').textContent = shareUrl;
  document.getElementById('view-page-link').href = `/u/${account.slug}`;

  // Fill settings form
  document.getElementById('set-display-name').value = account.display_name || '';
  document.getElementById('set-slug').value = account.slug || '';
  document.getElementById('set-team-name').value = account.team_name || '';
  document.getElementById('set-venue-name').value = account.venue_name || '';
  document.getElementById('set-section').value = account.section || '';
  document.getElementById('set-season').value = account.season || '';
  document.getElementById('set-tickets').value = account.tickets_per_game || 2;
  document.getElementById('set-primary-color').value = account.primary_color || '#2F241D';
  document.getElementById('set-accent-color').value = account.accent_color || '#FFC425';
}

async function loadDashboardData() {
  const [gamesRes, claimsRes] = await Promise.all([
    fetch('/api/owner/games'),
    fetch('/api/owner/claims')
  ]);
  const gamesData = await gamesRes.json();
  const claimsData = await claimsRes.json();

  allGames = gamesData.games;
  renderStats(allGames);
  renderGamesTable(allGames);
  renderClaims(claimsData.claims);
}

// ==================== Tab Switching ====================

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('[id^="tab-"]').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ==================== Stats ====================

function renderStats(games) {
  const available = games.filter(g => g.status === 'available').length;
  const claimed = games.filter(g => g.status === 'claimed').length;
  const unavailable = games.filter(g => g.status === 'no').length;

  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="number">${games.length}</div><div class="label">Total Games</div></div>
    <div class="stat-card"><div class="number" style="color: var(--green)">${available}</div><div class="label">Available</div></div>
    <div class="stat-card"><div class="number" style="color: var(--blue)">${claimed}</div><div class="label">Claimed</div></div>
    <div class="stat-card"><div class="number" style="color: var(--gray)">${unavailable}</div><div class="label">Not Available</div></div>
  `;
}

// ==================== Games Table ====================

function renderGamesTable(games) {
  const tbody = document.getElementById('games-tbody');
  if (games.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999; padding:24px;">No games yet. Add your first game above!</td></tr>';
    return;
  }

  let html = '';
  for (const g of games) {
    const claimer = g.claimed_by ? `${esc(g.claimed_by)}${g.claimer_email ? ' (' + esc(g.claimer_email) + ')' : ''}` : '-';
    html += `<tr>
      <td>${esc(g.display_date)}</td>
      <td>${esc(g.opponent)}</td>
      <td>${esc(g.giveaway || '-')}</td>
      <td>
        <input type="number" class="admin-select" value="${g.price != null ? g.price : ''}"
          placeholder="$" step="1" min="0" style="width: 70px;"
          onchange="updateGame(${g.id}, 'price', this.value)">
      </td>
      <td>
        <select class="admin-select" onchange="updateGame(${g.id}, 'status', this.value)" ${g.status === 'claimed' ? 'disabled' : ''}>
          <option value="available" ${g.status === 'available' ? 'selected' : ''}>Available</option>
          <option value="no" ${g.status === 'no' ? 'selected' : ''}>Not Available</option>
          <option value="claimed" ${g.status === 'claimed' ? 'selected' : ''}>Claimed</option>
        </select>
      </td>
      <td>${claimer}</td>
      <td>
        ${g.status === 'claimed' ? `<button class="btn-small btn-danger" onclick="unclaim(${g.id})">Unclaim</button>` : ''}
        <button class="btn-small btn-danger" onclick="deleteGameRow(${g.id})" style="margin-left: 4px;">Delete</button>
      </td>
    </tr>`;
  }
  tbody.innerHTML = html;
}

async function updateGame(gameId, field, value) {
  const body = {};
  if (field === 'price') {
    body.price = value === '' ? null : parseFloat(value);
  } else {
    body[field] = value;
  }

  await fetch(`/api/owner/games/${gameId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  showToast('Updated');
  if (field === 'status') loadDashboardData();
}

async function unclaim(gameId) {
  if (!confirm('Remove this claim and make tickets available again?')) return;
  await fetch(`/api/owner/unclaim/${gameId}`, { method: 'POST' });
  showToast('Claim removed');
  loadDashboardData();
}

async function deleteGameRow(gameId) {
  if (!confirm('Delete this game permanently?')) return;
  await fetch(`/api/owner/games/${gameId}`, { method: 'DELETE' });
  showToast('Game deleted');
  loadDashboardData();
}

// ==================== Add Game Modal ====================

function openAddGameModal() {
  document.getElementById('add-game-modal').classList.remove('hidden');
  document.getElementById('ag-date').focus();
}

function closeAddGameModal() {
  document.getElementById('add-game-modal').classList.add('hidden');
  document.getElementById('add-game-form').reset();
}

document.getElementById('add-game-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    const res = await fetch('/api/owner/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: document.getElementById('ag-date').value,
        opponent: document.getElementById('ag-opponent').value,
        giveaway: document.getElementById('ag-giveaway').value || null,
        price: document.getElementById('ag-price').value || null
      })
    });
    const data = await res.json();
    if (data.success) {
      closeAddGameModal();
      showToast('Game added', 'success');
      loadDashboardData();
    } else {
      showToast(data.error, 'error');
    }
  } catch {
    showToast('Network error', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Game';
  }
});

// ==================== Claims ====================

function renderClaims(claims) {
  const section = document.getElementById('claims-section');
  if (claims.length === 0) {
    section.innerHTML = '<p style="color:#999; margin-bottom: 16px;">No claims yet.</p>';
    return;
  }

  let html = '<table class="admin-table"><thead><tr><th>Date</th><th>Opponent</th><th>Name</th><th>Email</th><th>Notes</th><th>Claimed At</th><th></th></tr></thead><tbody>';
  for (const c of claims) {
    html += `<tr>
      <td>${esc(c.display_date)}</td>
      <td>${esc(c.opponent)}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.notes || '')}</td>
      <td>${new Date(c.claimed_at + 'Z').toLocaleDateString()}</td>
      <td><button class="btn-small btn-danger" onclick="unclaim(${c.game_id})">Unclaim</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  section.innerHTML = html;
}

// ==================== CSV Upload ====================

function handleCsvUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      showToast('CSV must have a header row and at least one data row', 'error');
      return;
    }

    // Parse header
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const dateIdx = header.indexOf('date');
    const oppIdx = header.indexOf('opponent');
    const giveIdx = header.indexOf('giveaway');
    const priceIdx = header.indexOf('price');

    if (dateIdx === -1 || oppIdx === -1) {
      showToast('CSV must have "date" and "opponent" columns', 'error');
      return;
    }

    parsedGames = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (!cols[dateIdx] || !cols[oppIdx]) continue;
      parsedGames.push({
        date: cols[dateIdx],
        opponent: cols[oppIdx],
        giveaway: giveIdx !== -1 ? cols[giveIdx] || null : null,
        price: priceIdx !== -1 && cols[priceIdx] ? parseFloat(cols[priceIdx]) : null,
        selected: true
      });
    }

    showPreview(`Found ${parsedGames.length} games in CSV`);
  };
  reader.readAsText(file);
}

// ==================== Photo OCR Upload ====================

async function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  showToast('Parsing image...', '');

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/owner/games/parse-image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.error) {
      showToast(data.error, 'error');
      return;
    }

    parsedGames = data.games.map(g => ({ ...g, selected: true }));
    showPreview(`Parsed ${parsedGames.length} games from image`);
  } catch {
    showToast('Failed to parse image', 'error');
  }
}

// ==================== Upload Preview ====================

function showPreview(msg) {
  document.getElementById('upload-preview').classList.remove('hidden');
  document.getElementById('upload-preview-msg').textContent = msg;

  const tbody = document.getElementById('preview-tbody');
  let html = '';
  for (let i = 0; i < parsedGames.length; i++) {
    const g = parsedGames[i];
    html += `<tr>
      <td><input type="checkbox" ${g.selected ? 'checked' : ''} onchange="parsedGames[${i}].selected = this.checked"></td>
      <td><input type="date" value="${g.date}" onchange="parsedGames[${i}].date = this.value" class="admin-select"></td>
      <td><input type="text" value="${esc(g.opponent || '')}" onchange="parsedGames[${i}].opponent = this.value" class="admin-select"></td>
      <td><input type="text" value="${esc(g.giveaway || '')}" onchange="parsedGames[${i}].giveaway = this.value || null" class="admin-select"></td>
      <td><input type="number" value="${g.price != null ? g.price : ''}" onchange="parsedGames[${i}].price = this.value ? parseFloat(this.value) : null" class="admin-select" style="width:70px;"></td>
    </tr>`;
  }
  tbody.innerHTML = html;
}

function cancelPreview() {
  document.getElementById('upload-preview').classList.add('hidden');
  parsedGames = [];
  document.getElementById('csv-file').value = '';
  document.getElementById('photo-file').value = '';
}

async function confirmBulkUpload() {
  const selected = parsedGames.filter(g => g.selected);
  if (selected.length === 0) {
    showToast('No games selected', 'error');
    return;
  }

  try {
    const res = await fetch('/api/owner/games/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ games: selected })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Added ${data.added} of ${data.total} games`, 'success');
      cancelPreview();
      loadDashboardData();
      // Switch to games tab
      document.querySelector('.nav-btn[data-tab="games"]').click();
    } else {
      showToast(data.error, 'error');
    }
  } catch {
    showToast('Upload failed', 'error');
  }
}

// ==================== Settings ====================

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const res = await fetch('/api/owner/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: document.getElementById('set-display-name').value,
        slug: document.getElementById('set-slug').value,
        team_name: document.getElementById('set-team-name').value,
        venue_name: document.getElementById('set-venue-name').value || null,
        section: document.getElementById('set-section').value || null,
        season: document.getElementById('set-season').value || null,
        tickets_per_game: parseInt(document.getElementById('set-tickets').value) || 2,
        primary_color: document.getElementById('set-primary-color').value,
        accent_color: document.getElementById('set-accent-color').value
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Settings saved', 'success');
      // Reload account data
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      account = meData.account;
      setupPage();
    } else {
      showToast(data.error, 'error');
    }
  } catch {
    showToast('Failed to save', 'error');
  } finally {
    btn.disabled = false;
  }
});

// ==================== Share Link ====================

function copyShareLink() {
  const url = `${window.location.origin}/u/${account.slug}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied!', 'success');
  }).catch(() => {
    // Fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link copied!', 'success');
  });
}

// ==================== Logout ====================

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

// ==================== Utilities ====================

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAddGameModal();
});

// ==================== Start ====================
init();
