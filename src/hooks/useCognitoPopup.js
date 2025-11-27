import { generateCodeVerifier, generateCodeChallenge, generateState } from "../utils/pkce";

// openCognitoPopup opens a popup to Cognito Hosted UI for Google signin and
// exchanges the returned code for tokens using PKCE. It resolves with tokens
// or rejects on error. The caller should provide cognitoDomain (full https://...)
// clientId and redirectUri.
export async function openCognitoPopup({
  cognitoDomain,
  clientId,
  redirectUri,
  scope = "openid profile email",
  onSuccess,
  onError,
  popupOptions = "width=500,height=600"
}) {
  if (!cognitoDomain || !clientId || !redirectUri) {
    const err = new Error("Missing cognitoDomain, clientId or redirectUri");
    if (onError) onError(err);
    throw err;
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // store verifier and state keyed by state in sessionStorage
  try {
    sessionStorage.setItem(`pkce_code_verifier_${state}`, codeVerifier);
  } catch (e) {
    // sessionStorage might be blocked
    console.error("sessionStorage write failed", e);
  }

  const authorizeUrl = `${cognitoDomain.replace(/\/$/, "")}/oauth2/authorize` +
    `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&code_challenge_method=S256&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&state=${encodeURIComponent(state)}` +
    `&identity_provider=Google`;

  console.debug('[useCognitoPopup] authorizeUrl =', authorizeUrl);
  const popup = window.open(authorizeUrl, "cognito_popup", popupOptions);
  if (!popup) {
    const err = new Error("Unable to open popup window");
    if (onError) onError(err);
    throw err;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      const err = new Error("Timeout waiting for authentication");
      if (onError) onError(err);
      reject(err);
    }, 5 * 60 * 1000); // 5 minutes timeout

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('message', messageHandler);
      try { sessionStorage.removeItem(`pkce_code_verifier_${state}`); } catch { /* ignore */ }
      try { if (popup) popup.close(); } catch { /* ignore */ }

    }

    async function messageHandler(e) {
      // For security validate origin if you know the exact origin
      // if (e.origin !== window.location.origin) return;
      const msg = e.data || {};
      if (msg.type !== 'cognito_callback') return;

      const { code, state: returnedState, error, error_description } = msg;
      if (returnedState !== state) {
        // Message not for this request instance; ignore it.
        return;
      }
      if (error) {
        const errText = `${error}${error_description ? ' - ' + error_description : ''}`;
        const err = new Error(errText);
        cleanup();
        if (onError) onError(err);
        return reject(err);
      }

      // Exchange code for tokens
      const verifier = sessionStorage.getItem(`pkce_code_verifier_${state}`);
      if (!verifier) {
        const err = new Error('Code verifier missing');
        cleanup();
        if (onError) onError(err);
        return reject(err);
      }

      try {
        const tokenUrl = `${cognitoDomain.replace(/\/$/, "")}/oauth2/token`;
        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', clientId);
        body.set('code', code);
        body.set('redirect_uri', redirectUri);
        body.set('code_verifier', verifier);

        const resp = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Token endpoint error: ${resp.status} ${text}`);
        }

        const tokens = await resp.json();
        cleanup();
        try { localStorage.setItem('cognito_tokens', JSON.stringify(tokens)); } catch { /* ignore */ }
        if (onSuccess) onSuccess(tokens);
        resolve(tokens);
      } catch (err) {
        cleanup();
        if (onError) onError(err);
        reject(err);
      }
    }

    window.addEventListener('message', messageHandler);
  });
}
