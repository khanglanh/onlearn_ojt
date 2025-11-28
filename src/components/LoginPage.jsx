import React, { useEffect, useState } from "react";
import "./LoginPage.css";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";

import { useNavigate, Link } from "react-router-dom";
import { loginFake, setSession, isLoggedIn } from "../api/auth.js";
import { api } from "../api/client.js";
import parseApiError from "../api/parseApiError.js";
import mapError from "../api/errorMap.js";
import Message from "./Message";
import { openCognitoPopup } from "../hooks/useCognitoPopup";

function LoginPage() {
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Auto-retry Google login sau khi logout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const retryGoogle = params.get('retry_google');
    
    if (retryGoogle === '1') {
      // Clear URL param
      window.history.replaceState({}, '', '/login');
      
      // Clear any lingering error flags
      try {
        sessionStorage.removeItem('cognito_login_error');
        sessionStorage.removeItem('cognito_login_failed_auth');
      } catch (e) {
        console.warn('Could not clear flags', e);
      }
      
      // Auto-trigger Google login sau một chút delay
      console.log('[LoginPage] Auto-retrying Google login after logout');
      const timer = setTimeout(() => {
        handleGoogleSignIn();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFakeLogin = () => {
    loginFake(); // Lưu trạng thái đăng nhập giả
    navigate("/dashboard"); // Chuyển trang
  };

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [info, setInfo] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleLoginFailed, setGoogleLoginFailed] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setFormErrors({ ...formErrors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Field validation
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { email: form.email, password: form.password });
      console.log('[Login] resp', resp.data);
      const payload = resp.data?.data;
      const token = payload?.token;
      if (token) {
        const tokensForSession = {
          id_token: token.idToken,
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
        };
        setSession(tokensForSession);
        // mark provider as local for email/password login
        try { localStorage.setItem('auth_provider', 'local'); } catch(e) { /* ignore storage error */ }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('[Login] error', err);
      const parsed = parseApiError(err);
      const rawMsg = parsed.message || 'Login failed';
      // Map known errors to codes/messages
      const mapped = mapError(rawMsg);
      if (mapped) {
        setError(mapped.message);
        // show possible CTA when helpful
        if (mapped.code === 'USER_NOT_CONFIRMED') setShowResend(true);
      } else {
        setError(rawMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndRetry = () => {
    // Clear error states
    setGoogleLoginFailed(false);
    setError('');
    
    // Clear session storage flags
    try {
      sessionStorage.removeItem('cognito_login_error');
      sessionStorage.removeItem('cognito_login_failed_auth');
    } catch (e) {
      console.warn('Could not clear session flags', e);
    }
    
    // Redirect to Cognito logout endpoint to clear any cached sessions
    // Then auto-trigger login again via retry_google param
    const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
    const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const LOGOUT_URI = `${window.location.origin}/login?retry_google=1`;
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
    
    console.log('[LoginPage] Redirecting to logout then retry:', logoutUrl);
    window.location.href = logoutUrl;
  };

  const handleGoogleSignIn = async () => {
    const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN; // default dev domain
    const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID; // replace
    // Use explicit redirect URI from env to match Cognito App client callback URL(s)
    // Cognito currently allows:
    //  - http://localhost:5173/api/auth/callback/cognito
    //  - https://app.tcm.vn/api/auth/callback/cognito
    // Set VITE_COGNITO_REDIRECT_URI in .env to one of the allowed values (recommended).
    // Prefer environment override; otherwise default to the callback URI already registered
    // in your Cognito App client for dev: /api/auth/callback/cognito
    const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;

    // debug: show which values are actually used so you can confirm the redirect matches Cognito settings
    console.log('[LoginPage] handleGoogleSignIn env', { COGNITO_DOMAIN, CLIENT_ID, REDIRECT_URI });

    try {
      await openCognitoPopup({
        cognitoDomain: COGNITO_DOMAIN,
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        // Force the Google account chooser so the user can select a desktop/mobile account
        // if they have multiple Google accounts logged in in the browser.
        prompt: 'select_account',
        onSuccess: (tokens) => {
          // tokens contains id_token, access_token, refresh_token (if enabled), expires_in
          setSession(tokens);
          // This flow is explicitly Google sign-in via the hosted UI popup
          try { localStorage.setItem('auth_provider', 'google'); } catch(e) { /* ignore */ }
          navigate('/dashboard');
        },
        onError: (err) => {
          console.error('Cognito popup error', err);
          let msg = err?.message || err || 'Login failed';

          // Provide friendly guidance for known problems
          // Map known errors when returned by the popup
          const mapped = mapError(msg);
          if (mapped && (mapped.code === 'USER_NOT_CONFIRMED' || mapped.code === 'ALREADY_CONFIRMED')) {
            setError(mapped.message || 'Your account is not verified.');
            setShowResend(true);
            return;
          }

          if (msg.includes('Attribute cannot be updated')) {
            msg += '\n\n[Dev Hint] This error usually means the Cognito User Pool has the "email" attribute set to Immutable, but the Google Identity Provider is trying to map/update it. You must recreate the User Pool with "email" set to Mutable: true.';
          }

          // Check nếu là PreTokenGeneration error - user không có trong system
          if (msg.includes('PreTokenGeneration') || msg.includes('Access denied') || msg.includes('not registered')) {
            setGoogleLoginFailed(true);
            setError('This Google account is not registered in the system. Please contact your administrator or try another Google account.');
          } else {
            setError(msg);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // helper: send verification (resend) then open verify page and start the verify flow
  const startVerificationAndNavigate = async (emailToVerify) => {
    if (!emailToVerify) return setError('Please enter an email to verify');
    setError(''); setInfo(''); setResendLoading(true);
    try {
      await api.post('/identity/resend-verification', { email: emailToVerify });
      // Tell user we resent the code and then navigate to the verify page
      setInfo('Verification code resent. Redirecting to the verification screen...');
      setShowResend(false);
      setTimeout(() => {
        navigate(`/verify?email=${encodeURIComponent(emailToVerify)}&sent=1`);
      }, 700);
    } catch (err) {
      const parsedErr = parseApiError(err);
      const mappedErr = mapError(parsedErr.message || parsedErr || '');
      if (mappedErr && mappedErr.code === 'ALREADY_CONFIRMED') {
        setInfo(mappedErr.message || 'Account already verified. Please sign in.');
        setShowResend(false);
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError(parsedErr.message || 'Resend failed');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src={loginIllustration}
          alt="login illustration"
          className="login-image"
        />
      </div>

      <div className="login-right">
        <div className="login-box">
          <div className="login-logo">
            <img src={logo} alt="logo" />
            <h2 className="logo-text">Onlearn</h2>
          </div>

          <div className="welcome-signin">
            <h3>Welcome</h3>
          </div>

          <button className="google-btn" type="button" onClick={handleGoogleSignIn}>
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google logo"
            />
            Sign in with Google
          </button>
          
          {googleLoginFailed && (
            <button 
              className="google-btn" 
              type="button" 
              onClick={() => {
                setGoogleLoginFailed(false);
                setError('');
                // Force logout from Google by redirecting to Cognito logout first
                // Add retry_google=1 to trigger auto-login after logout
                const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
                const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
                const LOGOUT_URI = `${window.location.origin}/login?retry_google=1`;
                const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
                window.location.href = logoutUrl;
              }}
              style={{ 
                marginTop: '10px', 
                backgroundColor: '#f44336',
                borderColor: '#f44336'
              }}
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google logo"
              />
              Try Another Google Account
            </button>
          )}

          <div className="divider">OR</div>

          {/* Email/password login */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Message type="error">
                {error}

                {showResend && form.email && (
                  <div className="error-actions">
                    {/* Only show the single 'Verify here' inline link per UX request */}
                    <button type="button" className="link-as-button" disabled={resendLoading} onClick={async () => {
                      await startVerificationAndNavigate(form.email);
                    }}>Verify here</button>
                  </div>
                )}

              </Message>
            )}
            {info && <Message type="info">{info}</Message>}

            <label htmlFor="login-email">Email Address</label>
            <input id="login-email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} aria-invalid={!!formErrors.email} aria-describedby={formErrors.email ? 'login-email-error' : undefined} />
            {formErrors.email && <div id="login-email-error" className="field-error" role="alert">{formErrors.email}</div>}

            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} aria-invalid={!!formErrors.password} aria-describedby={formErrors.password ? 'login-password-error' : undefined} />
            {formErrors.password && <div id="login-password-error" className="field-error" role="alert">{formErrors.password}</div>}

            <div className="options">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="create-account">
            Don't have an account? <Link to="/register" style={{ color: "#05386D", textDecoration: "none", fontWeight: "600" }}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
