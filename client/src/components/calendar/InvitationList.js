// client/src/components/calendar/InvitationList.js
import React from 'react';

export default function InvitationList({ invitations = [], onRespond }) {
  if (!invitations.length) {
    return <p>No pending invitations.</p>;
  }

  return (
    <div>
      <h2>Your Invitations</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {invitations.map((invitation) => (
          <li key={invitation._id} style={{ marginBottom: '1em', borderBottom: '1px solid #ccc', paddingBottom: '0.5em' }}>
            <div>
              <strong>{invitation.title}</strong>
            </div>
            <div>
              {new Date(invitation.startTime).toLocaleString()}
            </div>
            <div>
              <button onClick={() => onRespond(invitation._id, 'accepted')} style={{ marginRight: '0.5em' }}>Accept</button>
              <button onClick={() => onRespond(invitation._id, 'declined')}>Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
