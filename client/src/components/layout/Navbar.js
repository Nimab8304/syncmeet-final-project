// src/components/layout/Navbar.js
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ===== Inline styles (glass + gradient + soft shadows) =====
  const s = {
    header: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: `
        radial-gradient(1200px 600px at 8% 8%, #eef2ff 0%, transparent 50%),
        radial-gradient(900px 500px at 88% 4%, #e0f2fe 0%, transparent 55%)
      `,
      backdropFilter: "saturate(160%) blur(8px)",
      WebkitBackdropFilter: "saturate(160%) blur(8px)",
      borderBottom: "1px solid rgba(15,23,42,.06)",
      boxShadow: "0 6px 18px rgba(2,6,23,.06)",
      
    },
    inner: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    left: { display: "flex", alignItems: "center", gap: 16 },
    brand: {
      textDecoration: "none",
      color: "#0f172a",
      fontWeight: 900,
      letterSpacing: "-.02em",
      fontSize: 18,
    },
    nav: { display: "flex", gap: 8 },
    link: (active) => ({
      textDecoration: "none",
      padding: "8px 10px",
      borderRadius: 10,
      color: active ? "#111827" : "#334155",
      fontWeight: active ? 700 : 500,
      background: active ? "#e0e7ff" : "transparent",
      transition: "background-color .15s ease, color .15s ease",
    }),
    right: { display: "flex", alignItems: "center", gap: 8 },
    chip: {
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#fff",
      color: "#111827",
      fontSize: 13,
      maxWidth: 220,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    logout: {
      padding: "8px 12px",
      borderRadius: 10,
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      cursor: "pointer",
      fontWeight: 700,
      transition: "transform .05s ease, filter .15s ease",
      boxShadow: "0 8px 18px rgba(185,28,28,.08)",
    },
  };

  return (
    <header style={s.header}>
      <div style={s.inner}>
        <div style={s.left}>
          <Link to="/dashboard" style={s.brand}>SyncMeet</Link>

          <nav style={s.nav}>
            <Link to="/dashboard" style={s.link(isActive("/dashboard"))}>
              Dashboard
            </Link>
            <Link to="/archive" style={s.link(isActive("/archive"))}>
              Archive
            </Link>
            <Link to="/settings" style={s.link(isActive("/settings"))}>
              Settings
            </Link>
          </nav>
        </div>

        <div style={s.right}>
          {user?.email && (
            <span style={s.chip} title={user.email}>{user.email}</span>
          )}
          <button
            onClick={handleLogout}
            style={s.logout}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.03)")}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.transform = "translateY(0)";
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
