/**
 * Auth tokens are namespaced per area ("admin" vs "client") so that a
 * super admin session and a client session can stay logged in at the same
 * time in two different browser tabs of the same browser without one
 * session's token refresh silently overwriting the other's tokens in
 * localStorage (which used to log the *other* tab out mid-use).
 */

export function prefixForRole(role) {
  return role === 'superadmin' ? 'admin' : 'client';
}

// Used wherever we don't have a `role` handy (axios interceptors, initial
// page load) — infers the area from the current URL instead.
export function currentPrefix() {
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'client';
}

export function getTokens(prefix = currentPrefix()) {
  return {
    accessToken: localStorage.getItem(`accessToken_${prefix}`),
    refreshToken: localStorage.getItem(`refreshToken_${prefix}`),
  };
}

export function saveTokens(prefix, { accessToken, refreshToken }) {
  localStorage.setItem(`accessToken_${prefix}`, accessToken);
  localStorage.setItem(`refreshToken_${prefix}`, refreshToken);
}

export function clearTokens(prefix = currentPrefix()) {
  localStorage.removeItem(`accessToken_${prefix}`);
  localStorage.removeItem(`refreshToken_${prefix}`);
}
