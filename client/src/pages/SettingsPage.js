// client/src/pages/SettingsPage.js
import React from "react";

export default function SettingsPage() {
  return (
    <div className="container">
      <h1 style={{ marginBottom: 12 }}>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">Default reminder</h2>
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          Choose the default reminder for new meetings. This can be overridden per meeting.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <select disabled style={{ maxWidth: 220 }}>
            <option>15 minutes (default)</option>
            <option>5 minutes</option>
            <option>10 minutes</option>
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>None</option>
          </select>
          <button disabled>Save (soon)</button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Google Calendar</h2>
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          Connect Google Calendar to sync meetings across devices.
        </p>
        <button disabled>Connect Google (soon)</button>
      </div>
    </div>
  );
}
