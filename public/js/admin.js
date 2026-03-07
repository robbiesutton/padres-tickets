let adminPassword = '';

function authHeaders() {
  return { 'Authorization': `Bearer ${adminPassword}`, 'Content-Type': 'application/json' };
}

async function login() {
  adminPassword = document.getElementById('admin-password').value;
  const res = await fetch('/api/admin/claims', { headers: authHeaders() });
  if (res.ok) {
    sessionStorage.setItem('adminPw', adminPassword);
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
    loadAdminData();
  } else {
    alert('Incorrect password');
    adminPassword = '';
  }
}

async function loadAdminData() {
  const [claimsRes, gamesRes] = await Promise.all([
    fetch('/api/admin/claims', { headers: authHeaders() }),
    fetch('/api/admin/games', { headers: authHeaders() })
  ]);
  const claimsData = await claimsRes.json();
  const gamesData = await gamesRes.json();

  renderStats(gamesData.games);
  renderClaims(claimsData.claims);
  renderGamesTable(gamesData.games);
}

function renderStats(games) {
  const available = games.filter(g => g.status === 'available').length;
  const claimed = games.filter(g => g.status === 'claimed').length;
  const unavailable = games.filter(g => g.status === 'no').length;

  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="number">${games.length}</div><div class="label">Total Entries</div></div>
    <div class="stat-card"><div class="number" style="color: var(--green)">${available}</div><div class="label">Available</div></div>
    <div class="stat-card"><div class="number" style="color: var(--blue)">${claimed}</div><div class="label">Claimed</div></div>
    <div class="stat-card"><div class="number" style="color: var(--gray)">${unavailable}</div><div class="label">Not Available</div></div>
  `;
}

function renderClaims(claims) {
  if (claims.length === 0) {
    document.getElementById('claims-section').innerHTML = '<p style="color:#999; margin-bottom: 16px;">No claims yet.</p>';
    return;
  }

  let html = '<table class="admin-table"><thead><tr><th>Date</th><th>Opponent</th><th>Section</th><th>Name</th><th>Email</th><th>Notes</th><th>Claimed At</th><th></th></tr></thead><tbody>';
  for (const c of claims) {
    html += `<tr>
      <td>${esc(c.display_date)}</td>
      <td>${esc(c.opponent)}</td>
      <td>${c.section}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.notes || '')}</td>
      <td>${new Date(c.claimed_at + 'Z').toLocaleDateString()}</td>
      <td><button class="btn-small btn-danger" onclick="unclaim(${c.game_id})">Unclaim</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('claims-section').innerHTML = html;
}

function renderGamesTable(games) {
  const tbody = document.getElementById('games-tbody');
  let html = '';
  for (const g of games) {
    const claimer = g.claimer_name ? `${esc(g.claimer_name)} (${esc(g.claimer_email)})` : '-';
    html += `<tr>
      <td>${esc(g.display_date)}</td>
      <td>${esc(g.opponent)}</td>
      <td>${g.section}</td>
      <td>${esc(g.giveaway || '-')}</td>
      <td>
        <input type="number" class="admin-select" value="${g.price != null ? g.price : ''}"
          placeholder="$" step="1" min="0" style="width: 70px;"
          onchange="updatePrice(${g.id}, this.value)">
      </td>
      <td>
        <select class="admin-select" onchange="updateStatus(${g.id}, this.value)" ${g.status === 'claimed' ? 'disabled' : ''}>
          <option value="available" ${g.status === 'available' ? 'selected' : ''}>Available</option>
          <option value="no" ${g.status === 'no' ? 'selected' : ''}>Not Available</option>
          <option value="claimed" ${g.status === 'claimed' ? 'selected' : ''}>Claimed</option>
        </select>
      </td>
      <td>${claimer}</td>
      <td>${g.status === 'claimed' ? `<button class="btn-small btn-danger" onclick="unclaim(${g.id})">Unclaim</button>` : ''}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
}

async function unclaim(gameId) {
  if (!confirm('Remove this claim and make tickets available again?')) return;
  await fetch('/api/admin/unclaim', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ gameId })
  });
  showToast('Claim removed');
  loadAdminData();
}

async function updatePrice(gameId, price) {
  await fetch('/api/admin/update-price', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ gameId, price: price || null })
  });
  showToast('Price updated');
}

async function updateStatus(gameId, status) {
  await fetch('/api/admin/update-status', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ gameId, status })
  });
  showToast('Status updated');
  loadAdminData();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast';
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-login from session
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('adminPw');
  if (saved) {
    adminPassword = saved;
    document.getElementById('admin-password').value = saved;
    login();
  }
});
