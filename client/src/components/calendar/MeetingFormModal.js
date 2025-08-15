// client/src/components/calendar/MeetingFormModal.js
import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";

const REMINDER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "5 minutes before", value: 5 },
  { label: "10 minutes before", value: 10 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
];

export default function MeetingFormModal({
  open,
  onClose,
  onSubmit,        // async function(meetingData)
  initialValues,   // optional for edit
  title = "Create meeting",
  defaultReminderMinutes = 15, // fallback when creating new
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    invitationLink: "",
    reminderMinutes: defaultReminderMinutes,
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [participantsEmails, setParticipantsEmails] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      if (initialValues) {
        const {
          title,
          description,
          startTime,
          endTime,
          invitationLink,
          reminderMinutes,
          participants,
        } = initialValues;

        // Pre-fill invited emails if present on populated participants
        const initialEmails = Array.isArray(participants)
          ? participants
              .map((p) =>
                typeof p.user === "object" ? (p.user?.email || null) : null
              )
              .filter(Boolean)
          : [];

        setForm({
          title: title || "",
          description: description || "",
          startTime: startTime ? toLocalInputValue(startTime) : "",
          endTime: endTime ? toLocalInputValue(endTime) : "",
          invitationLink: invitationLink || "",
          reminderMinutes:
            typeof reminderMinutes === "number" ? reminderMinutes : defaultReminderMinutes,
        });
        setParticipantsEmails(initialEmails);
        setInviteEmail("");
      } else {
        setForm({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          invitationLink: "",
          reminderMinutes: defaultReminderMinutes,
        });
        setParticipantsEmails([]);
        setInviteEmail("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues, defaultReminderMinutes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "reminderMinutes" ? Number(value) : value,
    }));
  };

  const addEmail = () => {
    const e = (inviteEmail || "").trim().toLowerCase();
    if (!e) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      setError("Please enter a valid email.");
      return;
    }
    if (participantsEmails.includes(e)) return;
    setParticipantsEmails((prev) => [...prev, e]);
    setInviteEmail("");
  };

  const removeEmail = (email) => {
    setParticipantsEmails((prev) => prev.filter((x) => x !== email));
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.title || !form.startTime || !form.endTime) {
      setError("Title, start time, and end time are required.");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setError("Start time must be before end time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        invitationLink: form.invitationLink,
        reminderMinutes: form.reminderMinutes,
        // Email-based invites: backend resolves to user IDs
        participants: participantsEmails.map((email) => ({ email })),
      };
      await onSubmit?.(payload);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to submit meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button className="secondary" onClick={onClose} disabled={submitting}>
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <Modal open={open} title={title} onClose={onClose} footer={footer} width={560}>
      {error && <div style={{ color: "#dc2626", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <label htmlFor="mt-title">Title*</label>
          <input id="mt-title" name="title" type="text" value={form.title} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="mt-desc">Description</label>
          <textarea id="mt-desc" name="description" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="mt-start">Start Time*</label>
          <input id="mt-start" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="mt-end">End Time*</label>
          <input id="mt-end" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="mt-link">Invitation Link</label>
          <input
            id="mt-link"
            name="invitationLink"
            type="url"
            value={form.invitationLink}
            onChange={handleChange}
            placeholder="https://example.com/invite"
          />
        </div>
        <div>
          <label htmlFor="mt-rem">Reminder</label>
          <select id="mt-rem" name="reminderMinutes" value={form.reminderMinutes} onChange={handleChange}>
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
            Notifications use the browser’s permission and work while the app is open.
          </div>
        </div>

        {/* Invite by email */}
        <div>
          <label htmlFor="mt-invite">Invite participants (by email)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="mt-invite"
              type="email"
              placeholder="name@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
            />
            <button type="button" className="secondary" onClick={addEmail}>
              Add
            </button>
          </div>

          {participantsEmails.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {participantsEmails.map((em) => (
                <span
                  key={em}
                  className="chip"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {em}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => removeEmail(em)}
                    style={{ padding: "2px 6px", marginLeft: 6 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
            Only registered users can be invited by email.
          </div>
        </div>
      </div>
    </Modal>
  );
}

function toLocalInputValue(dt) {
  try {
    const d = new Date(dt);
    const pad = (n) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  } catch {
    return "";
  }
}
