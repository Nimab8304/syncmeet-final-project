// client/src/components/calendar/MeetingForm.js
import React, { useState } from "react";

export default function MeetingForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !startTime || !endTime) {
      setError("Title, start time, and end time are required.");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError("Start time must be before end time.");
      return;
    }

    const meetingData = {
      title,
      description,
      startTime,
      endTime,
      invitationLink,
    };

    try {
      setSubmitting(true);
      await onCreate(meetingData);
      // Clear on success
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setInvitationLink("");
    } catch (err) {
      setError(err?.message || "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "1rem auto" }}>
      <h2>Create Meeting</h2>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 8 }}>
        <label>Title*</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Start Time*</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>End Time*</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Invitation Link</label>
        <input
          type="url"
          placeholder="https://example.com/invite"
          value={invitationLink}
          onChange={(e) => setInvitationLink(e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Meeting"}
      </button>
    </form>
  );
}
