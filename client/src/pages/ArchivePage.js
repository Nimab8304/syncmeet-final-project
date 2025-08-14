// client/src/pages/ArchivePage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getArchived, archivePast } from "../services/meetingService";
import { useNavigate } from "react-router-dom";

export default function ArchivePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

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
      setArchivedMeetings(data);
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
    try {
      await archivePast(user.token);
      await loadArchived();
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        alert(err?.message || "Failed to archive past meetings");
      }
    }
  };

  if (loading) return <div>Loading archived meetings...</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Archived Meetings</h1>
      <button onClick={handleArchivePast} style={{ marginBottom: 12 }}>
        Archive past meetings now
      </button>

      {errMsg && <div style={{ color: "red", marginBottom: 8 }}>{errMsg}</div>}

      {archivedMeetings.length === 0 ? (
        <p>No archived meetings found.</p>
      ) : (
        <ul>
          {archivedMeetings.map((m) => (
            <li key={m._id}>
              <strong>{m.title}</strong> —{" "}
              {new Date(m.startTime).toLocaleString()} to{" "}
              {new Date(m.endTime).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
