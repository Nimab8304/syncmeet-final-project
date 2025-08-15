// client/src/components/calendar/MeetingDetailsModal.js
import React from "react";
import Modal from "../ui/Modal";
import { formatLocalRange } from "../../utils/date";

function Chip({ status }) {
  const cls = status === "accepted" ? "chip success"
    : status === "declined" ? "chip danger"
    : "chip warning";
  return <span className={cls} style={{ marginLeft: 6 }}>{status}</span>;
}

export default function MeetingDetailsModal({
  open,
  meeting,
  isOwner,
  onClose,
  onAccept,
  onDecline,
  onEdit,
  onDelete,
  onSyncGoogle, // optional
}) {
  if (!meeting) return null;

  const timeLabel = formatLocalRange(meeting.startTime, meeting.endTime);

  const ownerFooter = (
    <>
      {onSyncGoogle && (
        <button onClick={() => onSyncGoogle(meeting._id)}>
          Sync to Google
        </button>
      )}
      {onDelete && (
        <button className="secondary" onClick={() => onDelete(meeting._id)} style={{ marginLeft: 8 }}>
          Delete
        </button>
      )}
      <button onClick={() => onEdit(meeting)} style={{ marginLeft: 8 }}>
        Edit
      </button>
    </>
  );

  const guestFooter = (
    <>
      <button onClick={() => onAccept(meeting._id)}>Accept</button>
      <button className="secondary" onClick={() => onDecline(meeting._id)} style={{ marginLeft: 8 }}>
        Decline
      </button>
    </>
  );

  const footer = isOwner ? ownerFooter : guestFooter;

  return (
    <Modal open={open} title="Meeting details" onClose={onClose} footer={footer} width={640}>
      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{meeting.title}</div>
          <div style={{ color: "#6b7280", marginTop: 2 }}>{timeLabel}</div>
        </div>

        {meeting.description && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Description</div>
            <div style={{ color: "#374151", whiteSpace: "pre-wrap" }}>{meeting.description}</div>
          </div>
        )}

        {meeting.invitationLink && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Invitation link</div>
            <a
              href={meeting.invitationLink}
              target="_blank"
              rel="noreferrer"
              className="secondary"
              style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px" }}
            >
              Open link
            </a>
          </div>
        )}

        {Array.isArray(meeting.participants) && meeting.participants.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Participants</div>
            <ul>
              {meeting.participants.map((p, idx) => {
                const label =
                  typeof p.user === "object"
                    ? (p.user?.name || p.user?.email || "User")
                    : String(p.user);
                return (
                  <li key={idx} style={{ padding: "4px 0", borderBottom: "1px dashed var(--border-color)" }}>
                    <span>{label}</span>
                    {p.status && <Chip status={p.status} />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
