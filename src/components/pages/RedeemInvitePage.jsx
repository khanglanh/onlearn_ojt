import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { redeemInvite } from "../../api/identityApi";
import { parseApiError } from "../../api/parseApiError";
import { FaUser, FaPhone, FaLock, FaCheckCircle } from "react-icons/fa";

export default function RedeemInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Liên kết không hợp lệ. Vui lòng kiểm tra email của bạn.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !phoneNumber || !password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);

    try {
      await redeemInvite(token, name, phoneNumber, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed) || "Có lỗi xảy ra khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #05386D 0%, #1E5A8E 100%)",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "40px",
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
          <FaCheckCircle style={{ fontSize: "64px", color: "#10B981", marginBottom: "20px" }} />
          <h2 style={{ marginBottom: "15px", color: "#05386D", fontSize: "28px" }}>
            Đăng ký thành công!
          </h2>
          <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: "1.6" }}>
            Tài khoản của bạn đã được tạo. Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #05386D 0%, #1E5A8E 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#05386D", marginBottom: "10px" }}>
            🎓 Chào mừng bạn!
          </h1>
          <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: "1.5" }}>
            Hoàn tất đăng ký để bắt đầu học tập
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#374151",
                fontSize: "14px",
              }}
            >
              <FaUser style={{ marginRight: "8px", color: "#05386D" }} />
              Họ và tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
              disabled={!token || loading}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#374151",
                fontSize: "14px",
              }}
            >
              <FaPhone style={{ marginRight: "8px", color: "#05386D" }} />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0912345678"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
              disabled={!token || loading}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#374151",
                fontSize: "14px",
              }}
            >
              <FaLock style={{ marginRight: "8px", color: "#05386D" }} />
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
              disabled={!token || loading}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#374151",
                fontSize: "14px",
              }}
            >
              <FaLock style={{ marginRight: "8px", color: "#05386D" }} />
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
              }}
              disabled={!token || loading}
            />
          </div>

          <button
            type="submit"
            disabled={!token || loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: !token || loading ? "#9CA3AF" : "#05386D",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: !token || loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
            Đã có tài khoản?{" "}
            <a
              href="/login"
              style={{
                color: "#05386D",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
