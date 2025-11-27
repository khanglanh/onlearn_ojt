import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/client.js";
import parseApiError from "../api/parseApiError.js";
import mapError from "../api/errorMap.js";
import Message from "./Message";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";
import "./AuthShared.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const preEmail = query.get('email') || '';

  const [email, setEmail] = useState(preEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { if (preEmail) setEmail(preEmail); }, [preEmail]);

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!code) errs.code = 'Confirmation code is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    if (newPassword && newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { email, confirmationCode: code, newPassword });
      setInfo('Password reset successfully — redirecting to sign in');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      console.error('[ResetPassword] error', err);
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || '');
      if (mapped) {
        setError(mapped.message);
      } else {
        setError(parsed.message || 'Password reset failed');
      }
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
          <h2 className="login-title">Reset password</h2>
          <p className="login-subtitle">Enter the confirmation code from your email and choose a new password.</p>

          {error && <Message type="error">{error}</Message>}
          {info && <Message type="success">{info}</Message>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="reset-email">Email</label>
              <input id="reset-email" type="email" name="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors({ ...formErrors, email: null }); }} required aria-invalid={!!formErrors.email} aria-describedby={formErrors.email ? 'reset-email-error' : undefined} />
              {formErrors.email && <div id="reset-email-error" className="field-error" role="alert">{formErrors.email}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="reset-code">Confirmation code</label>
              <input id="reset-code" type="text" name="code" value={code} onChange={(e) => { setCode(e.target.value); setFormErrors({ ...formErrors, code: null }); }} required aria-invalid={!!formErrors.code} aria-describedby={formErrors.code ? 'reset-code-error' : undefined} />
              {formErrors.code && <div id="reset-code-error" className="field-error" role="alert">{formErrors.code}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" name="newPassword" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFormErrors({ ...formErrors, newPassword: null }); }} required aria-invalid={!!formErrors.newPassword} aria-describedby={formErrors.newPassword ? 'new-password-error' : undefined} />
              {formErrors.newPassword && <div id="new-password-error" className="field-error" role="alert">{formErrors.newPassword}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" name="confirmPassword" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setFormErrors({ ...formErrors, confirmPassword: null }); }} required aria-invalid={!!formErrors.confirmPassword} aria-describedby={formErrors.confirmPassword ? 'confirm-password-error' : undefined} />
              {formErrors.confirmPassword && <div id="confirm-password-error" className="field-error" role="alert">{formErrors.confirmPassword}</div>}
            </div>

            <button className="login-button" disabled={loading} type="submit">{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#05386D', textDecoration: 'none', fontWeight: 600 }}>Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
