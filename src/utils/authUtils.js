// Auth utility functions

/**
 * Decode JWT token (client-side only - no verification)
 */
export function decodeJWT(token) {
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

/**
 * Get user role from id_token
 * Role can be stored in 'role' or 'custom:role' claim by Cognito
 */
export function getUserRole() {
  const idToken = localStorage.getItem('id_token');
  if (!idToken) return null;
  
  const payload = decodeJWT(idToken);
  if (!payload) return null;
  
  // Check for 'role' claim first, then fallback to 'custom:role'
  return payload.role || payload['custom:role'] || null;
}

/**
 * Get user ID (sub) from id_token
 */
export function getUserId() {
  const idToken = localStorage.getItem('id_token');
  if (!idToken) return null;
  
  const payload = decodeJWT(idToken);
  return payload?.sub || null;
}

/**
 * Get user email from id_token
 */
export function getUserEmail() {
  const idToken = localStorage.getItem('id_token');
  if (!idToken) return null;
  
  const payload = decodeJWT(idToken);
  return payload?.email || null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(role) {
  const userRole = getUserRole();
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles) {
  const userRole = getUserRole();
  return roles.includes(userRole);
}

/**
 * Get role-specific dashboard path
 */
export function getRoleDashboard(role) {
  const dashboards = {
    'ADMIN': '/admin/dashboard',
    'MANAGER': '/admin/dashboard',
    'TEACHER': '/teacher/dashboard',
    'STUDENT': '/student/dashboard'
  };
  
  return dashboards[role] || '/';
}

/**
 * Get user's default dashboard based on their role
 */
export function getMyDashboard() {
  const role = getUserRole();
  return getRoleDashboard(role);
}
