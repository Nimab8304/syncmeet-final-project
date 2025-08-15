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

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token || ""}`,
  }), [user]);

  const safeStatusError = useCallback((err) => {
    const msg = err?.message || "Failed to fetch Google status";
    setStatus((s) => ({ ...s, loading: false, error: msg }));
    showToast(msg, "error");
  }, [showToast]);

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

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);

      setStatus({
        loading: false,
        connected: !!data.connected,
        hasRefreshToken: !!data.hasRefreshToken,
        expiresAt: data.expiresAt || null,
        error: "",
      });
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        logout?.();
      } else {
        safeStatusError(err);
      }
    }
  }, [user, authHeaders, logout, safeStatusError]);

  useEffect(() => {
    fetchStatus();
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

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
      if (!data?.url) throw new Error("No authorization URL received.");

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

  const connectedBadge = status.connected
    ? <span className="chip success">Connected</span>
    : <span className="chip">Not connected</span>;

  const expiryLabel = status.expiresAt
    ? `Token expires: ${new Date(status.expiresAt).toLocaleString()}`
    : null;

  return (
    <div className="settings-container container">
      <h1 className="settings-title">Settings</h1>

      {/* Default reminder section */}
      <div className="card settings-card">
        <h2 className="section-title">Default reminder</h2>
        <p className="section-desc">
          Choose the default reminder for new meetings. This can be overridden per meeting.
        </p>
        <div className="settings-control">
          <select disabled>
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

      {/* Google Calendar section */}
      <div className="card settings-card">
        <h2 className="section-title">Google Calendar</h2>
        <p className="section-desc">
          Connect Google Calendar to sync meetings across devices.
        </p>

        <div className="google-status">
          {connectedBadge}
          {status.loading && <span className="loading-text">Checking status…</span>}
          {!status.loading && expiryLabel && (
            <span className="expiry-text">{expiryLabel}</span>
          )}
          {!status.loading && status.connected && status.hasRefreshToken && (
            <span className="chip" title="A refresh token is stored for auto-renewal">
              Refresh enabled
            </span>
          )}
        </div>

        <div className="settings-control">
          <button onClick={handleConnectGoogle} disabled={connecting}>
            {connecting ? "Connecting…" : status.connected ? "Reconnect Google" : "Connect Google"}
          </button>
          <button className="secondary" disabled title="Coming soon">
            Disconnect (soon)
          </button>
        </div>

        {status.error && (
          <div className="error-text">{status.error}</div>
        )}
      </div>
    </div>
  );
}
