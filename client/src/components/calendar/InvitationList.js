// client/src/components/calendar/InvitationList.js
import React from "react";
import { formatLocalRange } from "../../utils/date";

function StatusChip({ status }) {
  const map = {
    accepted: "chip success",
    invited: "chip warning",
    declined: "chip danger",
  };
  const cls = map[status] || "chip";
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return <span className={cls} style={{ marginLeft: 8 }}>{label}</span>;
}

export default function InvitationList({ invitations = [], onRespond }) {
  if (!invitations.length) {
    return (
      <div className="card">
        <h2 className="section-title">Invitations</h2>
        <p style={{ color: "#6b7280" }}>No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Invitations</h2>
      <ul>
        {invitations.map((inv) => {
          const timeRange = formatLocalRange(inv.startTime, inv.endTime);
          return (
            <li
              key={inv._id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{inv.title}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{timeRange}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {typeof inv.status === "string" && <StatusChip status={inv.status} />}
                  <button onClick={() => onRespond(inv._id, "accepted")}>Accept</button>
                  <button className="secondary" onClick={() => onRespond(inv._id, "declined")}>
                    Decline
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
