import React from 'react';

export default function SettingsPage() {
  const connectGoogle = async () => {
    try {
      // Call backend to get auth URL
      const response = await fetch('/api/google-calendar/auth-url');
      const { url } = await response.json();

      // Redirect user to Google's OAuth consent page
      window.location.href = url;
    } catch (error) {
      alert('Failed to redirect to Google authentication');
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      <button onClick={connectGoogle}>
        Connect Google Calendar
      </button>
    </div>
  );
}
