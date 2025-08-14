import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ArchivePage() {
  const { user } = useAuth();
  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchived = async () => {
      if (!user?.token) return;
      try {
        const response = await fetch('/api/meetings/archived', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();
        setArchivedMeetings(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load archived meetings:', error);
        setLoading(false);
      }
    };
    fetchArchived();
  }, [user]);

  if (loading) return <div>Loading archived meetings...</div>;

  return (
    <div>
      <h1>Archived Meetings</h1>
      {archivedMeetings.length === 0 ? (
        <p>No archived meetings found.</p>
      ) : (
        <ul>
          {archivedMeetings.map((meeting) => (
            <li key={meeting._id}>
              <strong>{meeting.title}</strong> —{' '}
              {new Date(meeting.startTime).toLocaleString()} to{' '}
              {new Date(meeting.endTime).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
