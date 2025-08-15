// client/src/pages/ArchivePage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getArchived, archivePast } from "../services/meetingService";
import { useNavigate } from "react-router-dom";
// Optional: if you want global toast feedback, uncomment the next line and use showToast below
// import { useToast } from "../App";

function groupByDate(meetings = []) {
  // Group by YYYY-MM (month) for readability
  const groups = {};
  meetings.forEach((m) => {
    const d = new Date(m.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  // Sort groups descending by key (most recent first)
  const sortedKeys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
  return { groups, sortedKeys };
}

export default function ArchivePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // const { showToast } = useToast?.() || { showToast: () => {} };

  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const safeLogout = useCallback(() => {
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("syncmeetUser");
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  const loadArchived = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setErrMsg("");
    try {
      const data = await getArchived(user.token);
      setArchivedMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        setErrMsg(err?.message || "Failed to load archived meetings");
      }
    } finally {
      setLoading(false);
    }
  }, [user, safeLogout]);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  const handleArchivePast = async () => {
    setErrMsg("");
    setInfoMsg("");
    try {
      setSubmitting(true);
      const res = await archivePast(user.token);
      const msg =
        (res && (res.message || res.msg)) || "Archive completed successfully.";
      setInfoMsg(msg);
      // showToast?.(msg, "success"); // if using global toasts
      await loadArchived();
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        const em = err?.message || "Failed to archive past meetings";
        setErrMsg(em);
        // showToast?.(em, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><div>Loading archived meetings...</div></div>;

  const { groups, sortedKeys } = groupByDate(archivedMeetings);

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginBottom: 12 }}>Archived Meetings</h1>
        <button onClick={handleArchivePast} disabled={submitting}>
          {submitting ? "Archiving…" : "Archive past meetings now"}
        </button>
      </div>

      {errMsg && (
        <div className="card" style={{ borderLeft: "4px solid #dc2626", marginBottom: 12 }}>
          <div style={{ color: "#991b1b" }}>{errMsg}</div>
        </div>
      )}
      {infoMsg && (
        <div className="card" style={{ borderLeft: "4px solid #16a34a", marginBottom: 12 }}>
          <div style={{ color: "#065f46" }}>{infoMsg}</div>
        </div>
      )}

      {archivedMeetings.length === 0 ? (
        <div className="empty">
          <h3 style={{ marginBottom: 6 }}>No archived meetings yet</h3>
          <p style={{ color: "#6b7280" }}>
            When meetings pass their end time and you archive, they’ll appear here.
          </p>
        </div>
      ) : (
        <div className="card">
          <ul style={{ margin: 0, padding: 0 }}>
            {sortedKeys.map((key) => (
              <li key={key} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {key} {/* YYYY-MM */}
                </div>
                <ul>
                  {groups[key]
                    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                    .map((m) => (
                      <li
                        key={m._id}
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.title}</div>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>
                              {new Date(m.startTime).toLocaleString()} — {new Date(m.endTime).toLocaleString()}
                            </div>
                          </div>
                          {m.invitationLink && (
                            <a
                              href={m.invitationLink}
                              target="_blank"
                              rel="noreferrer"
                              className="secondary"
                              style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px", height: 34 }}
                            >
                              Open link
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
