import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isLoggedIn } from "../api/auth.js";
import { api } from "../api/client.js";
import parseApiError from "../api/parseApiError.js";
import mapError from "../api/errorMap.js";
import Message from "./Message";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import "./RegisterPage.css";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";

function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phoneNumber: "",
    });
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [alreadyExists, setAlreadyExists] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [info, setInfo] = useState("");

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (isLoggedIn()) {
            navigate("/dashboard", { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(""); // Clear error when user types
        setFormErrors({ ...formErrors, [e.target.name]: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Field-level validation
        const errs = {};
        if (!formData.email) errs.email = 'Email is required';
        if (!formData.password) errs.password = 'Password is required';
        if (formData.password && formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }

        // Phone validation & formatting (optional)
        let formattedPhone;
        if (formData.phoneNumber && formData.phoneNumber.trim() !== "") {
            try {
                // Use 'VN' as default region for local numbers; if user enters +..., parse will detect country
                const phone = parsePhoneNumberFromString(formData.phoneNumber, 'VN');
                if (!phone || !phone.isValid()) {
                    setError('Invalid phone number');
                    return;
                }
                formattedPhone = phone.format('E.164');
            } catch (e) {
                setError('Invalid phone number');
                return;
            }
        }

        setLoading(true);
        setSuccess(false);

        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                name: formData.name || undefined,
            };
            if (formattedPhone) payload.phoneNumber = formattedPhone;

            const response = await api.post("/auth/register", payload);

            console.log("[Register] Success:", response.data);

            // show success state briefly, then navigate to verify and indicate we already sent the code
            setSuccess(true);
            setLoading(false);
            // Add sent=1 so the Verify page starts the 30s resend cooldown automatically
            setTimeout(() => navigate(`/verify?email=${encodeURIComponent(formData.email)}&sent=1`), 1200);
        } catch (err) {
            console.error("[Register] Error:", err);
            const parsed = parseApiError(err);
            // When we have domain-specific errors we still want to provide helpful UI
            const remote = parsed.message || "Registration failed";
            const mapped = mapError(remote);
            if (mapped) {
                setError(mapped.message);
                if (mapped.code === 'USER_ALREADY_EXISTS') {
                    setAlreadyExists(true);
                    setInfo('If you already signed up, try signing in or resend verification.');
                }
            } else {
                setError(remote);
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend verification code from register page if user already exists but hasn't confirmed
    const handleResendFromRegister = async () => {
        setError("");
        setInfo("");
        if (!formData.email) {
            setError('Email is missing');
            return;
        }

        setResendLoading(true);
        try {
            const resp = await api.post('/identity/resend-verification', { email: formData.email });
            console.log('[Resend-From-Register] success', resp.data);
            setInfo('Verification code resent. Check your email.');
            setAlreadyExists(false); // keep UI simpler after sending code
        } catch (e) {
            console.error('[Resend-From-Register] error', e);
            const parsed = parseApiError(e);
            const mapped = mapError(parsed.message || parsed || 'Resend failed');
            if (mapped) {
                if (mapped.code === 'ALREADY_CONFIRMED') {
                    setInfo('Account is already verified — please sign in.');
                    setAlreadyExists(false);
                    setTimeout(() => navigate('/login'), 900);
                } else {
                    setError(mapped.message);
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
            {/* Left Side - Illustration */}
            <div className="login-left">
                <img src={loginIllustration} alt="Illustration" className="illustration" />
            </div>

            {/* Right Side - Register Form */}
            <div className="login-right">
                <div className="login-box">
                    <img src={logo} alt="Logo" className="logo" />
                    <h2 className="login-title">Create Account</h2>
                    <p className="login-subtitle">Sign up to get started</p>

                    {error && (
                        <Message type="error">
                            {error}

                            {alreadyExists && (
                                <div className="error-actions">
                                    <Link to={`/login`} style={{ textDecoration: 'none' }}>
                                        <button type="button" className="signin-btn">Sign In</button>
                                    </Link>
                                    <button type="button" className="signin-btn" onClick={handleResendFromRegister} disabled={resendLoading}>
                                        {resendLoading ? 'Sending...' : 'Resend verification'}
                                    </button>
                                </div>
                            )}
                        </Message>
                    )}

                    {info && (
                        <Message type="info">{info}</Message>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="register-email">Email *</label>
                            <input
                                id="register-email"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                aria-invalid={!!formErrors.email}
                                aria-describedby={formErrors.email ? 'register-email-error' : undefined}
                            />
                            {formErrors.email && <div id="register-email-error" className="field-error" role="alert">{formErrors.email}</div>}
                        </div>

                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="Enter your phone number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="register-password">Password *</label>
                            <input
                                id="register-password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                minLength={8}
                                aria-invalid={!!formErrors.password}
                                aria-describedby={formErrors.password ? 'register-password-error' : undefined}
                            />
                            <small style={{ color: "#666", fontSize: "12px" }}>
                                Minimum 8 characters
                            </small>
                            {formErrors.password && <div id="register-password-error" className="field-error" role="alert">{formErrors.password}</div>}
                        </div>

                        <div className="input-group">
                            <label htmlFor="register-confirmPassword">Confirm Password *</label>
                            <input
                                id="register-confirmPassword"
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                aria-invalid={!!formErrors.confirmPassword}
                                aria-describedby={formErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
                            />
                            {formErrors.confirmPassword && <div id="register-confirmPassword-error" className="field-error" role="alert">{formErrors.confirmPassword}</div>}
                        </div>

                        <button
                            type="submit"
                            className={`login-button ${success ? 'success' : ''}`}
                            disabled={loading || success}
                            style={{
                                opacity: loading || success ? 0.8 : 1,
                                cursor: loading || success ? "not-allowed" : "pointer",
                            }}
                        >
                            {success ? (
                                <>
                                    <span className="check">✓</span>&nbsp;Created
                                </>
                            ) : loading ? (
                                <>
                                    <span className="spinner" /> Creating Account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: "20px",
                        textAlign: "center",
                        fontSize: "14px",
                        color: "#666"
                    }}>
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            style={{
                                color: "#05386D",
                                textDecoration: "none",
                                fontWeight: "600"
                            }}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
