// client/src/components/calendar/MeetingForm.js
import React, { useState } from 'react';

export default function MeetingForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title || !startTime || !endTime) {
      setError('Title, start time, and end time are required.');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.');
      return;
    }

    // Prepare meeting object for submission
    const meetingData = {
      title,
      description,
      startTime,
      endTime,
      invitationLink,
    };

    // Call parent or context callback
    onCreate(meetingData);

    // Clear form fields after submission
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setInvitationLink('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '1em auto' }}>
      <h2>Create Meeting</h2>
      {error && <div style={{ color: 'red', marginBottom: '0.5em' }}>{error}</div>}

      <div>
        <label>Title*</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label>Start Time*</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div>
        <label>End Time*</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Invitation Link</label>
        <input
          type="url"
          placeholder="https://example.com/invite"
          value={invitationLink}
          onChange={(e) => setInvitationLink(e.target.value)}
        />
      </div>

      <button type="submit">Create Meeting</button>
    </form>
  );
}
