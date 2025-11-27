import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import parseApiError from "../api/parseApiError.js";
import mapError from "../api/errorMap.js";
import Message from "./Message";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";
import "./AuthShared.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");

    // validation
    if (!email) {
      setFormErrors({ email: 'Email is required' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email });
      // show friendly confirmation and navigate to reset page (prefill email)
      setInfo('If an account exists with this email, a reset code was sent.');
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}&sent=1`), 900);
    } catch (err) {
      console.error('[ForgotPassword] error', err);
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || '');
      setError(mapped ? mapped.message : parsed.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={loginIllustration} alt="Illustration" className="illustration" />
      </div>

      <div className="login-right">
        <div className="login-box">
          <img src={logo} alt="Logo" className="logo" />
          <h2 className="login-title">Forgot password</h2>
          <p className="login-subtitle">Enter the email associated with your account and we'll send reset instructions.</p>

          {error && <Message type="error">{error}</Message>}
          {info && <Message type="info">{info}</Message>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="forgot-email">Email</label>
              <input id="forgot-email" type="email" name="email" placeholder="you@domain.com" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors({ ...formErrors, email: null }); setError(''); }} aria-invalid={!!formErrors.email} aria-describedby={formErrors.email ? 'forgot-email-error' : undefined} />
              {formErrors.email && <div id="forgot-email-error" className="field-error" role="alert">{formErrors.email}</div>}
            </div>

            <button type="submit" className="login-button" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'}</button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#05386D', textDecoration: 'none', fontWeight: 600 }}>Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
