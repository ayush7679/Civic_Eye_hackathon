/**
 * Auth helpers — JWT stored in localStorage.
 * Token payload: { user_id, role, exp }
 */

export function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode payload (no signature check — backend verifies)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function isAdmin() {
  const user = getStoredUser();
  return user?.role === 'admin';
}

export function getCurrentUser() {
  return getStoredUser();
}
