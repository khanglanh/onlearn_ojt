// Auth Service

// Helper function to decode JWT (without verification - only for reading claims)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export async function refreshTokens() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  // Get email from id_token
  const idToken = localStorage.getItem('id_token');
  if (!idToken) throw new Error('No id token available');
  const payload = decodeJWT(idToken);
  const email = payload?.email;
  if (!email) throw new Error('No email in id token');

  // Call backend refresh
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, refreshToken })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Refresh token failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  if (!data.success) throw new Error('Refresh failed');

  const tokens = {
    id_token: data.data.idToken,
    access_token: data.data.accessToken,
    refresh_token: data.data.refreshToken
  };
  setSession(tokens);
  return tokens;
}

export function setSession(tokens) {
  if (tokens.id_token) {
    localStorage.setItem("id_token", tokens.id_token);
  }
  if (tokens.access_token) localStorage.setItem("access_token", tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem("refresh_token", tokens.refresh_token);
  // if the tokens object came from the Cognito popup flow we keep a light marker that
  // the user used a federated provider (Google). The LoginPage will set 'auth_provider'
  // explicitly when it knows which flow was used. Default remains unset.
}

export function getSession() {
  return {
    id_token: localStorage.getItem("id_token"),
    access_token: localStorage.getItem("access_token"),
    refresh_token: localStorage.getItem("refresh_token"),
  };
}

export async function logout() {
  // Call backend logout API first
  try {
    const session = getSession();

    if (session.access_token) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/identity/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          accessToken: session.access_token,
        })
      });

      if (response.ok) {
        console.log('[Auth] Backend logout successful');
      } else {
        console.warn('[Auth] Backend logout failed:', response.status);
      }
    }
  } catch (error) {
    console.error('[Auth] Backend logout failed:', error);
    // Continue with logout even if backend fails
  }

  // Clear local storage
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("session_id");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("auth_provider");

  // Redirect to Cognito logout endpoint to clear Cognito session
  const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
  const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const LOGOUT_URI = `${window.location.origin}/login`;

  const cognitoLogoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;

  console.log('[Auth] Redirecting to Cognito logout:', cognitoLogoutUrl);
  window.location.href = cognitoLogoutUrl;
}

export function isLoggedIn() {
  const token = localStorage.getItem("id_token");
  const fake = localStorage.getItem("isLoggedIn") === "true";
  return !!token || fake;
}

// Keep fake login for dev/testing if needed, but warn
export function loginFake() {
  console.warn("Using fake login");
  localStorage.setItem("isLoggedIn", "true");
}
