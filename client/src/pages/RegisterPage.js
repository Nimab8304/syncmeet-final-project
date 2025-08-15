// client/src/pages/RegisterPage.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async ({ name, email, password, onResult }) => {
    try {
      await register({ name, email, password });
      onResult?.({ ok: true, message: "Registration successful! Please login." });
      navigate("/login", { replace: true });
    } catch (error) {
      onResult?.({ ok: false, message: error?.message || "Registration failed" });
    }
  };

  return (
    <div className="register-wrap">
      <div className="container" style={{ width: "100%", maxWidth: 1080 }}>
        <div className="register-grid">
          {/* کارت شیشه‌ای فرم */}
          <section className="register-card" aria-labelledby="registerTitle">
            <h1 id="registerTitle" className="register-title">Create your account</h1>
            <p className="register-sub">It takes less than a minute to get started.</p>

            <RegisterForm onRegister={handleRegister} />

            <p className="register-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </section>

          {/* ستون مزایا */}
          <aside className="register-hero card">
            <h2 className="section-title" style={{ marginTop: 0 }}>What you’ll get</h2>
            <ul className="register-hero-list">
              <li>Monthly/weekly calendar with status colors.</li>
              <li>Invitations with one-click Accept/Decline.</li>
              <li>Reminders and easy archiving.</li>
              <li>Optional Google Calendar integration.</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
