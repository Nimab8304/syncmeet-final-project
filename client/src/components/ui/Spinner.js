// src/components/ui/Spinner.js
import React from "react";

export default function Spinner({ size = 28, color = "#2563eb", label = "Loading…" }) {
  const borderSize = Math.max(2, Math.round(size / 8));

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        aria-label="Loading"
        role="status"
        style={{
          width: size,
          height: size,
          border: `${borderSize}px solid rgba(0,0,0,0.08)`,
          borderTop: `${borderSize}px solid ${color}`,
          borderRadius: "50%",
          animation: "syncmeet-spin 0.9s linear infinite",
          display: "inline-block",
        }}
      />
      {label ? <span style={{ color: "#555", fontSize: 14 }}>{label}</span> : null}
      <style>
        {`
        @keyframes syncmeet-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
      </style>
    </div>
  );
}
