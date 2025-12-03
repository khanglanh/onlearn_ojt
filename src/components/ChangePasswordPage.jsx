import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import parseApiError from '../api/parseApiError.js';
import mapError from '../api/errorMap.js';
import Message from './Message';
import { logout, isTokenExpired } from '../api/auth.js';
import { getUserRole } from '../utils/authUtils';
import './AuthShared.css';
import StudentLayout from './layout/StudentLayout';
import AdminLayout from './layout/AdminLayout';
import TeacherLayout from './layout/TeacherLayout';

function pwdStrengthScore(pwd = '') {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return score; // 0..4
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [formErrors, setFormErrors] = useState({});
  // detect auth provider (set on login flows). If not present, try to decode id_token and infer provider.
  const provider = (() => {
    try {
      const flag = typeof window !== 'undefined' ? localStorage.getItem('auth_provider') : null;
      if (flag) return flag;

      const idToken = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
      if (!idToken) return null;

      // decode payload
      const parts = idToken.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(decodeURIComponent(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')));

      // Cognito federated users sometimes have `cognito:username` like "Google_12345" or an `identities` claim
      const username = payload['cognito:username'] || payload['username'] || '';
      if (typeof username === 'string' && username.toLowerCase().startsWith('google')) return 'google';

      const identities = payload['identities'] || payload['identity'] || null;
      try {
        const ids = typeof identities === 'string' ? JSON.parse(identities) : identities;
        if (Array.isArray(ids) && ids.some(i => (i.providerName || '').toLowerCase().includes('google'))) return 'google';
      } catch (e) { /* ignore parse error */ }

      // last resort: no provider detected
      return null;
    } catch (e) {
      return null;
    }
  })();

  const validate = () => {
    const errs = {};
    if (!oldPassword) errs.oldPassword = 'Current password is required';
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

    // Ensure we have a token before calling protected API (prefer id_token)
    const accessToken = localStorage.getItem('access_token');
    const idToken = localStorage.getItem('id_token');
    const tokenToUse = idToken && idToken.trim() !== '' ? idToken : accessToken;
    if (!accessToken) {
      setError('Your session is missing or expired. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      // call protected endpoint - interceptor will auto-refresh token if expired
      // masked debug for dev: only show token prefix to confirm it's present (do NOT log full token in production)
      try { console.debug('[ChangePassword] sending request with Authorization Bearer', localStorage.getItem('access_token') ? localStorage.getItem('access_token').slice(0, 10) + '...' : 'no-token'); } catch (e) {}
      // Explicitly use the user's access token for the non-admin ChangePassword flow
      // (Cognito ChangePassword requires a valid access token and the current password).
      await api.post(
        '/identity/change-password',
        { oldPassword, newPassword }
        // No need for headers here, interceptor adds it
      );
      setInfo('Password changed successfully — you will be signed out.');
      // allow user to read message then log out and go to login
      setTimeout(() => {
        logout();
        // logout redirects already; keep fallback
        try { navigate('/login'); } catch {}
      }, 2000);
    } catch (err) {
      console.error('[ChangePassword] error', err);
      // If the request was unauthorized, tell the user and force a logout
      if (err?.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
        setLoading(false);
        return;
      }
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || '');
      if (mapped) setError(mapped.message);
      else setError(parsed.message || 'Unable to change password');
    } finally { setLoading(false); }
  };

  const score = pwdStrengthScore(newPassword);
  const userRole = getUserRole();
  const Layout = userRole === 'ADMIN' || userRole === 'MANAGER' 
    ? AdminLayout 
    : userRole === 'TEACHER' 
    ? TeacherLayout 
    : StudentLayout;

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f9ff' }}>
        <div className="login-box" style={{ maxWidth: 500, width: '100%' }}>
          <h2 style={{ color: '#05386D', textAlign: 'center', marginBottom: 8 }}>Đổi mật khẩu</h2>
          <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>Thay đổi mật khẩu hiện tại của bạn. Sau khi đổi mật khẩu, bạn sẽ được đăng xuất và cần đăng nhập lại.</p>

          {error && <Message type="error">{error}</Message>}
          {info && <Message type="success">{info}</Message>}

              {/* If user logged in via Google, disable password change form (visible but not clickable) */}
              {provider === 'google' && (
                <div style={{ marginBottom: 12 }}>
                  <Message type="info">Bạn đang đăng nhập bằng Google — đổi mật khẩu không khả dụng ở đây. Vui lòng thay đổi mật khẩu trực tiếp trong tài khoản Google nếu cần.</Message>
                </div>
              )}

          <form onSubmit={handleSubmit}>
            <label>Current password</label>
            <input type="password" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setFormErrors({ ...formErrors, oldPassword: null }); setError(''); }} aria-invalid={!!formErrors.oldPassword} aria-describedby={formErrors.oldPassword ? 'oldPassword-error' : undefined} disabled={provider === 'google'} />
            {formErrors.oldPassword && <div id="oldPassword-error" className="field-error" role="alert">{formErrors.oldPassword}</div>}

            <label style={{ marginTop: 10 }}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFormErrors({ ...formErrors, newPassword: null }); setError(''); }} aria-invalid={!!formErrors.newPassword} aria-describedby={formErrors.newPassword ? 'newPassword-error' : undefined} disabled={provider === 'google'} />
            {formErrors.newPassword && <div id="newPassword-error" className="field-error" role="alert">{formErrors.newPassword}</div>}

            {/* simple strength meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: '#eee', borderRadius: 6 }}>
                  <div style={{ height: 8, width: `${(score / 4) * 100}%`, background: score >= 3 ? '#16a34a' : score >= 2 ? '#f59e0b' : '#ef4444', borderRadius: 6 }} />
                </div>
              </div>
              <small style={{ color: '#666' }}>{['Very weak', 'Weak', 'Okay', 'Strong', 'Very strong'][score]}</small>
            </div>

            <label style={{ marginTop: 10 }}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setFormErrors({ ...formErrors, confirmPassword: null }); setError(''); }} aria-invalid={!!formErrors.confirmPassword} aria-describedby={formErrors.confirmPassword ? 'confirmPassword-error' : undefined} disabled={provider === 'google'} />
            {formErrors.confirmPassword && <div id="confirmPassword-error" className="field-error" role="alert">{formErrors.confirmPassword}</div>}

            <button className="signin-btn" style={{ marginTop: 14 }} disabled={loading || provider === 'google'}>{loading ? 'Changing...' : 'Change password'}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
