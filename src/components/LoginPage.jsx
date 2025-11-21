import React from "react";
import "./LoginPage.css";
import loginIllustration from "../assets/login-illustration.png";
import logo from "../assets/logo.png";

import { useNavigate } from "react-router-dom"; // THÊM ĐỂ CHẠY GIẢ
import { loginFake } from "../api/auth.js"; // THÊM ĐỂ CHẠY GIẢ

function LoginPage() {
  const navigate = useNavigate();

  const handleFakeLogin = () => {
    loginFake(); // Lưu trạng thái đăng nhập giả
    navigate("/dashboard"); // Chuyển trang
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
            <p>Please enter your details to sign in</p>
          </div>

          <button className="google-btn">
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google logo"
            />
            Sign in with Google
          </button>

          <div className="divider">OR</div>

          {/* ⭐ Prevent submit để không reload trang */}
          <form onSubmit={(e) => e.preventDefault()}>
            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" />

            <label>Password</label>
            <input type="password" placeholder="Enter your password" />

            <div className="options">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <a href="#">Forgot Password?</a>
            </div>

            {/* ⭐ Fake Login */}
            <button
              type="button"
              className="signin-btn"
              onClick={handleFakeLogin}
            >
              Sign In
            </button>
          </form>

          <p className="create-account">
            Don't have an account? <a href="#">Create Account</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
