// client/src/components/calendar/UpcomingList.js
import React from "react";
import { formatLocalRange } from "../../utils/date";

export default function UpcomingList({ meetings = [], limit = 5 }) {
  if (!meetings.length) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">Upcoming</h2>
        <p style={{ color: "#6b7280" }}>No upcoming meetings.</p>
      </div>
    );
  }

  const items = meetings.slice(0, limit);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="section-title">Upcoming</h2>
      <ul>
        {items.map((m) => {
          const timeRange = formatLocalRange(m.startTime, m.endTime);
          return (
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
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{timeRange}</div>
                </div>
                {m.invitationLink && (
                  <a
                    href={m.invitationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary"
                    style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px" }}
                  >
                    Join
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
