import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaExpand } from "react-icons/fa";
import avatar from "../../assets/khanhly.png";
import flagVN from "../../assets/vn-flag.png";
import { logout } from "../../api/auth.js";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Đóng dropdown nếu click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        height: "70px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 24px",
        gap: "18px",
        position: "relative",
      }}
    >
      {/* Flag */}
      <img
        src={flagVN}
        alt="Vietnam"
        style={{
          width: "40px",
          height: "30px",
          borderRadius: "4px",
          backgroundColor: "#f8f9fc",
          padding: "6px",
          cursor: "pointer",
        }}
      />

      {/* Notification */}
      <div
        style={{
          backgroundColor: "#f8f9fc",
          padding: "10px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        <FaBell size={22} style={{ color: "#05386D" }} />
      </div>

      {/* Fullscreen */}
      <div
        style={{
          backgroundColor: "#f8f9fc",
          padding: "10px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        <FaExpand size={20} style={{ color: "#05386D" }} />
      </div>

      {/* Avatar + Dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <img
          src={avatar}
          alt="avatar"
          onClick={() => setOpen(!open)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
          }}
        />

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              marginTop: "10px",
              width: "140px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: "10px 0",
              zIndex: 100,
            }}
          >
            <button
              onClick={() => navigate("/settings/profile")}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "none",
                textAlign: "left",
                paddingLeft: "16px",
                color: "#05386D",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Hồ sơ
            </button>

            <button
              onClick={() => navigate("/settings/change-password")}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "none",
                textAlign: "left",
                paddingLeft: "16px",
                color: "#05386D",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Đổi mật khẩu
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "none",
                textAlign: "left",
                paddingLeft: "16px",
                color: "#05386D",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
