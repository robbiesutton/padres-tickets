// Auto-generate slug from display name
const nameInput = document.getElementById('displayName');
const slugInput = document.getElementById('slug');

if (nameInput && slugInput) {
  let slugManuallyEdited = false;
  slugInput.addEventListener('input', () => { slugManuallyEdited = true; });

  nameInput.addEventListener('input', () => {
    if (!slugManuallyEdited) {
      slugInput.value = nameInput.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40);
    }
  });
}

// Signup form
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    hideError();

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          displayName: document.getElementById('displayName').value,
          slug: document.getElementById('slug').value,
          teamName: document.getElementById('teamName').value,
          venueName: document.getElementById('venueName').value,
          section: document.getElementById('section').value,
          season: document.getElementById('season').value
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        showError(data.error);
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// Login form
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    hideError();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        showError(data.error);
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-msg').classList.add('hidden');
}
