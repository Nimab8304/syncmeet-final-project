// src/components/ui/Toast.js
import React from "react";

export default function Toast({ open, type = "info", onClose, children }) {
  if (!open) return null;

  const bg = {
    info: "#2563eb", // blue
    success: "#16a34a", // green
    error: "#dc2626", // red
    warning: "#d97706", // amber
  }[type] || "#2563eb";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: bg,
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        cursor: "pointer",
        zIndex: 9999,
        maxWidth: 360,
        lineHeight: 1.4,
      }}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}
