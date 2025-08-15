// client/src/pages/SettingsPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast?.() || { showToast: () => {} };

  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    hasRefreshToken: false,
    expiresAt: null,
    error: "",
  });
  const [connecting, setConnecting] = useState(false);

  const authHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.token || ""}`,
    };
  }, [user]);

  const safeStatusError = useCallback(
    (err) => {
      const msg = err?.message || "Failed to fetch Google status";
      setStatus((s) => ({ ...s, loading: false, error: msg }));
      showToast(msg, "error");
    },
    [showToast]
  );

  const fetchStatus = useCallback(async () => {
    if (!user?.token) {
      setStatus((s) => ({ ...s, loading: false, error: "Not authenticated" }));
      return;
    }
    try {
      setStatus((s) => ({ ...s, loading: true, error: "" }));
      const res = await fetch(`/api/google-calendar/status`, {
        method: "GET",
        headers: authHeaders(),
      });

      // Ensure JSON before parsing to avoid "<!DOCTYPE ..." errors
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || `Request failed: ${res.status}`;
        throw new Error(msg);
      }
      setStatus({
        loading: false,
        connected: !!data.connected,
        hasRefreshToken: !!data.hasRefreshToken,
        expiresAt: data.expiresAt || null,
        error: "",
      });
    } catch (err) {
      // 401/403 → logout
      if (err?.status === 401 || err?.status === 403) {
        logout?.();
      } else {
        safeStatusError(err);
      }
    }
  }, [user, authHeaders, logout, safeStatusError]);

  useEffect(() => {
    fetchStatus();
    // Re-check on focus to reflect changes after returning from OAuth flow
    const onFocus = () => setTimeout(fetchStatus, 100);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchStatus]);

  const handleConnectGoogle = async () => {
    if (!user?.token) {
      showToast("Please login first.", "warning");
      return;
    }
    try {
      setConnecting(true);
      const res = await fetch(`/api/google-calendar/auth-url`, {
        method: "GET",
        headers: authHeaders(),
      });

      // Ensure JSON before parsing
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || `Request failed: ${res.status}`;
        throw new Error(msg);
      }
      if (!data?.url) {
        throw new Error("No authorization URL received.");
      }
      // Redirect user to Google consent page
      window.location.href = data.url;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        logout?.();
      } else {
        showToast(err?.message || "Failed to start Google connect", "error");
      }
    } finally {
      setConnecting(false);
    }
  };

  const connectedBadge = status.connected ? (
    <span className="chip success">Connected</span>
  ) : (
    <span className="chip">Not connected</span>
  );

  const expiryLabel =
    status.expiresAt ? `Token expires: ${new Date(status.expiresAt).toLocaleString()}` : null;

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

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {connectedBadge}
          {status.loading && <span style={{ color: "#6b7280" }}>Checking status…</span>}
          {!status.loading && expiryLabel && (
            <span style={{ color: "#6b7280" }}>{expiryLabel}</span>
          )}
          {!status.loading && status.connected && status.hasRefreshToken && (
            <span className="chip" title="A refresh token is stored for auto-renewal">
              Refresh enabled
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleConnectGoogle} disabled={connecting}>
            {connecting ? "Connecting…" : status.connected ? "Reconnect Google" : "Connect Google"}
          </button>
          {/* Optional: Add a Disconnect button in the future to revoke tokens server-side */}
          <button className="secondary" disabled title="Coming soon">
            Disconnect (soon)
          </button>
        </div>

        {status.error && (
          <div style={{ color: "#dc2626", marginTop: 12 }}>{status.error}</div>
        )}
      </div>
    </div>
  );
}
