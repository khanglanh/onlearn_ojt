import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/client.js";
import parseApiError from "../api/parseApiError.js";
import mapError from "../api/errorMap.js";
import Message from "./Message";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";
import "./VerifyPage.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function VerifyPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const preEmail = query.get("email") || "";

  const [email, setEmail] = useState(preEmail);
  const [code, setCode] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = React.useRef(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState("");
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (preEmail) setEmail(preEmail);
  }, [preEmail]);

  // cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // If we arrived from a flow that already sent a code, start the resend cooldown immediately.
  // Use a primitive 'sentFlag' value as dependency so the effect won't run every render
  // (URLSearchParams objects are recreated on each render).
  const sentFlag = !!query.get('sent');
  useEffect(() => {
    if (!sentFlag) return;
    // If there's already a cooldown running, do not override it.
    if (resendCooldown > 0) return;

    setInfo('Verification code sent — please check your email.');
    setResendCooldown(30);

    // start interval to count down
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // run only when sentFlag changes
  }, [sentFlag]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSuccess("");
    // field validation
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!code) errs.code = 'Verification code is required';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setLoading(true);
    try {
      const resp = await api.get("/identity/verify", { params: { email, code } });
      console.log("[Verify] success", resp.data);
      setSuccess("Email verified successfully");
      // give the user a short confirmation moment, then redirect to sign in
      setTimeout(() => navigate('/login'), 1100);
    } catch (err) {
      console.error("[Verify] error", err);
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || 'Verify failed');

      if (mapped) {
        setError(mapped.message);
        if (mapped.code === 'ALREADY_CONFIRMED' || mapped.code === 'USER_NOT_CONFIRMED') {
          setAlreadyConfirmed(true);
          setInfo(mapped.message);
          setTimeout(() => navigate('/login'), 1400);
          return;
        }
        if (mapped.code === 'USER_NOT_FOUND' || mapped.code === 'USERNAME_CLIENT_NOT_FOUND') {
          setNotFound(true);
          return;
        }
      } else {
        setError(parsed.message || 'Verify failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    if (!email) {
      setFormErrors({ email: 'Email is required to resend code' });
      return;
    }
    // prevent spamming when cooldown active
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      const resp = await api.post("/identity/resend-verification", { email });
      console.log("[Resend] success", resp.data);
      setSuccess("Verification code resent — please check your email.");
      // start cooldown after successful resend
      setResendCooldown(30);
      // start interval to count down
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[Resend] error", err);
      const parsed = parseApiError(err);
      const mapped = mapError(parsed.message || parsed || 'Resend failed');

      if (mapped) {
        setError(mapped.message);
        if (mapped.code === 'ALREADY_CONFIRMED') {
          setInfo(mapped.message);
          setResendCooldown(0);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimeout(() => navigate('/login'), 1400);
          return;
        }
        if (mapped.code === 'USER_NOT_FOUND' || mapped.code === 'USERNAME_CLIENT_NOT_FOUND') {
          setNotFound(true);
          return;
        }
      } else {
        setError(parsed.message || 'Resend failed');
      }
    } finally {
      setResendLoading(false);
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
          <h2 className="login-title">Verify Email</h2>
          <p className="login-subtitle">Enter the verification code sent to your email</p>

          {error && <Message type="error">{error}</Message>}
          {info && <Message type="info">{info}</Message>}
          {success && <Message type="success">{success}</Message>}

          <form onSubmit={handleVerify}>
            <div className="input-group">
              <label htmlFor="verify-email">Email</label>
              <input id="verify-email" type="email" name="email" value={email} readOnly disabled aria-invalid={!!formErrors.email} aria-describedby={formErrors.email ? 'verify-email-error' : undefined} />
              {formErrors.email && <div id="verify-email-error" className="field-error" role="alert">{formErrors.email}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="verify-code">Verification Code *</label>
              <input id="verify-code" type="text" name="code" value={code} onChange={(e) => { setCode(e.target.value); setFormErrors({ ...formErrors, code: null }); }} required disabled={loading} aria-invalid={!!formErrors.code} aria-describedby={formErrors.code ? 'verify-code-error' : undefined} />
              {formErrors.code && <div id="verify-code-error" className="field-error" role="alert">{formErrors.code}</div>}
            </div>

            <button type="submit" className="login-button" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div style={{ marginTop: 12 }}>
            <div className="resend-card actions">
              <button
                type="button"
                className="signin-btn"
                onClick={handleResend}
                disabled={alreadyConfirmed || resendLoading || resendCooldown > 0}
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Code'}
              </button>

              {/* when notFound is true we only display the inline message (no CTAs) per UX request */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
