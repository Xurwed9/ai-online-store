const API_BASE = 'http://127.0.0.1:8000';

// ── Theme ──
function getTheme() {
  return localStorage.getItem('theme') || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

applyTheme(getTheme());

function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(token) {
  localStorage.setItem('access_token', token);
}

function clearToken() {
  localStorage.removeItem('access_token');
}

function isLoggedIn() {
  return !!getToken();
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.json) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.json);
  }
  delete options.json;
  options.headers = headers;

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '&#10003;' : '&#10007;'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.innerHTML = `<span>${type === 'error' ? '&#10007;' : '&#10003;'}</span> ${message}`;
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.className = 'alert';
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function updateNavbar() {
  const authLinks = document.getElementById('auth-links');
  if (!authLinks) return;
  const themeIcon = getTheme() === 'dark' ? '&#9788;' : '&#9790;';
  const toggleBtn = `<button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">${themeIcon}</button>`;
  if (isLoggedIn()) {
    authLinks.innerHTML = `
      <a href="/static/admin-dashboard.html" class="nav-link">Dashboard</a>
      <a href="#" class="nav-link btn-logout" onclick="handleLogout(event)">Logout</a>
      ${toggleBtn}
    `;
  } else {
    authLinks.innerHTML = `
      <a href="/static/login.html" class="nav-link">Login</a>
      <a href="/static/register.html" class="nav-link active">Register</a>
      ${toggleBtn}
    `;
  }
}

async function handleLogout(e) {
  e.preventDefault();
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (_) {}
  clearToken();
  showToast('Logged out successfully');
  setTimeout(() => { window.location.href = '/static/login.html'; }, 800);
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/static/login.html';
    return false;
  }
  return true;
}
