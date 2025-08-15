// client/src/pages/ArchivePage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getArchived, archivePast } from "../services/meetingService";
import { useNavigate } from "react-router-dom";

// گروه‌بندی بر اساس YYYY-MM
function groupByDate(meetings = []) {
  const groups = {};
  meetings.forEach((m) => {
    const d = new Date(m.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
  return { groups, sortedKeys };
}

const fmtRange = (start, end) =>
  `${new Date(start).toLocaleString()} — ${new Date(end).toLocaleString()}`;

export default function ArchivePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      const msg = (res && (res.message || res.msg)) || "Archive completed successfully.";
      setInfoMsg(msg);
      await loadArchived();
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        setErrMsg(err?.message || "Failed to archive past meetings");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          Loading archived meetings…
        </div>
      </div>
    );
  }

  const { groups, sortedKeys } = groupByDate(archivedMeetings);

  // ————— استایل‌های کوچک محلی —————
  const s = {
    hero: {
      marginTop: 8,
      marginBottom: 16,
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,.06)",
      background:
        "radial-gradient(900px 500px at 6% 30%, #eef2ff 0%, transparent 55%), radial-gradient(900px 500px at 90% 0%, #e0f2fe 0%, transparent 55%), #fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 8px 24px rgba(2,6,23,.05)",
    },
    heroTitle: { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" },
    heroSub: { margin: "4px 0 0 0", color: "#64748b", fontSize: 14 },
    ctaWrap: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
    cta: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid color-mix(in oklab, var(--border-color), #6366f1 22%)",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "#fff",
      fontWeight: 800,
      letterSpacing: ".2px",
      boxShadow: "0 12px 24px -10px rgba(99,102,241,.55)",
      cursor: "pointer",
      transition: "transform .06s ease, filter .2s ease, box-shadow .2s ease",
    },
    alert: (type) => ({
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      background: type === "error" ? "#fef2f2" : "#ecfdf5",
      border: `1px solid ${
        type === "error" ? "#fecaca" : "rgba(16,185,129,.25)"
      }`,
      color: type === "error" ? "#991b1b" : "#065f46",
    }),
    monthHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "8px 12px",
      borderRadius: 10,
      background: "#f8fafc",
      border: "1px solid var(--border-color)",
      fontWeight: 700,
      color: "#0f172a",
    },
    countPill: {
      padding: "2px 8px",
      borderRadius: 999,
      background: "#eef2ff",
      border: "1px solid #e0e7ff",
      color: "#3730a3",
      fontSize: 12,
      fontWeight: 700,
    },
    itemRow: {
      padding: "10px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderBottom: "1px solid var(--border-color)",
    },
    itemTitle: { fontWeight: 600, margin: 0 },
    itemMeta: { color: "#6b7280", fontSize: 13, marginTop: 2 },
    linkBtn: {
      display: "inline-flex",
      alignItems: "center",
      height: 34,
      padding: "6px 10px",
      borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "#fff",
      color: "#0f172a",
      textDecoration: "none",
      fontSize: 14,
    },
  };

  return (
    <div className="container">
      {/* Hero / Header */}
      <section style={s.hero} aria-labelledby="archTitle">
        <div>
          <h1 id="archTitle" style={s.heroTitle}>
            Archived Meetings
          </h1>
          <p style={s.heroSub}>
            Meetings that have passed their end time and were archived will
            appear below—grouped by month.
          </p>
        </div>

        <div style={s.ctaWrap}>
          <button
            onClick={handleArchivePast}
            disabled={submitting}
            style={{
              ...s.cta,
              filter: submitting ? "grayscale(.2) opacity(.7)" : "none",
              cursor: submitting ? "wait" : "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {submitting ? "Archiving…" : "Archive past meetings now"}
          </button>
        </div>
      </section>

      {/* Alerts */}
      {errMsg && <div role="alert" style={s.alert("error")}>{errMsg}</div>}
      {infoMsg && <div role="status" style={s.alert("ok")}>{infoMsg}</div>}

      {/* Content */}
      {archivedMeetings.length === 0 ? (
        <div
          className="empty"
          style={{
            marginTop: 16,
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "var(--border-color)",
          }}
        >
          <h3 style={{ marginBottom: 6 }}>No archived meetings yet</h3>
          <p style={{ color: "#6b7280" }}>
            When meetings pass their end time and you archive, they’ll appear here.
          </p>
        </div>
      ) : (
        <div
          className="card"
          style={{
            marginTop: 16,
            borderRadius: 16,
            padding: 12,
          }}
        >
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {sortedKeys.map((key) => {
              const list = groups[key].sort(
                (a, b) => new Date(b.startTime) - new Date(a.startTime)
              );
              return (
                <li key={key} style={{ marginBottom: 14 }}>
                  <div style={s.monthHeader}>
                    <span>{key}</span>
                    <span style={s.countPill}>{list.length}</span>
                  </div>

                  <ul style={{ margin: 0, padding: "4px 10px", listStyle: "none" }}>
                    {list.map((m) => (
                      <li key={m._id} style={s.itemRow}>
                        <div style={{ minWidth: 0 }}>
                          <p style={s.itemTitle}>{m.title}</p>
                          <p style={s.itemMeta}>{fmtRange(m.startTime, m.endTime)}</p>
                        </div>
                        {m.invitationLink && (
                          <a
                            href={m.invitationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary"
                            style={s.linkBtn}
                            aria-label={`Open link for ${m.title}`}
                          >
                            Open link
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
