// PKCE helper utilities for SPA
// generateCodeVerifier(): returns a high-entropy random string
// generateCodeChallenge(verifier): returns base64url(SHA256(verifier))
// generateState(): random state string

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(length = 128) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // convert to base64url to reduce character set issues
  return base64UrlEncode(array.buffer).slice(0, length);
}

export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export function generateState(length = 24) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => ('0' + b.toString(16)).slice(-2)).join('');
}
