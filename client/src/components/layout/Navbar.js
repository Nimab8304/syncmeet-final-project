// src/components/layout/Navbar.js
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? { color: "#0d6efd", fontWeight: 600 }
      : { color: "#333" };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header style={{ borderBottom: "1px solid #eaeaea", background: "#fff" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to="/dashboard"
            style={{ textDecoration: "none", color: "#111", fontWeight: 800, letterSpacing: 0.2 }}
          >
            SyncMeet
          </Link>

          <nav style={{ display: "flex", gap: 14 }}>
            <Link to="/dashboard" style={{ textDecoration: "none", ...isActive("/dashboard") }}>
              Dashboard
            </Link>
            <Link to="/archive" style={{ textDecoration: "none", ...isActive("/archive") }}>
              Archive
            </Link>
            <Link to="/settings" style={{ textDecoration: "none", ...isActive("/settings") }}>
              Settings
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.email && (
            <span style={{ color: "#555", fontSize: 14 }} title={user.email}>
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
