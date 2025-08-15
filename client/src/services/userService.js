// client/src/services/userService.js
const API = '/api/users';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function getPreferences(token) {
  const res = await fetch(`${API}/me/preferences`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch preferences');
  return data;
}

export async function updatePreferences({ defaultReminderMinutes }, token) {
  const res = await fetch(`${API}/me/preferences`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ defaultReminderMinutes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update preferences');
  return data;
}
