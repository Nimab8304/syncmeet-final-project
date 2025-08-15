// client/src/pages/LoginPage.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";
import welcomeIllustration from "../assets/welcome-illustration.svg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password, onResult }) => {
    try {
      await login({ email, password });
      onResult?.({ ok: true });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      onResult?.({ ok: false, message: error?.message || "Login failed" });
    }
  };

  return (
    <div className="login-wrap">
      <div className="container" style={{ width: "100%", maxWidth: 1080 }}>
        {/* گرید اختصاصی لاگین */}
        <div className="login-grid">
          {/* ستون چپ: کارت فرم */}
          <section
            className="login-card"
            aria-labelledby="loginTitle"
          >
            <h1 id="loginTitle" className="login-title">Welcome back</h1>
            <p className="login-sub">
              Sign in to view your calendar, invitations, and upcoming meetings.
            </p>

            <LoginForm onLogin={handleLogin} />

            <p className="login-footer">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </section>

          {/* ستون راست: هرو + مزایا */}
          <aside className="login-hero card">
            <h2 className="section-title" style={{ marginTop: 0 }}>Why SyncMeet?</h2>
            <ul className="login-hero-list">
              <li>Fast meeting creation with invitations.</li>
              <li>Color-coded calendar (owner vs participant).</li>
              <li>Reminders before meetings.</li>
              <li>Archive past meetings in one click.</li>
              <li>Optional Google Calendar sync.</li>
            </ul>

            {welcomeIllustration && (
              <img
                src={welcomeIllustration}
                alt="Welcome to SyncMeet"
                loading="lazy"
                className="login-hero-ill"
                draggable={false}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
