// client/src/services/meetingService.js
const BASE_URL = process.env.REACT_APP_API_URL || ""; // خالی در صورت داشتن proxy
const API = `${BASE_URL}/api/meetings`;

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

async function request(path = "", { token, ...options } = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? authHeaders(token) : {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getMeetings = (token) =>
  request("", { token });

export const createMeeting = (meeting, token) =>
  request("", { method: "POST", body: JSON.stringify(meeting), token });

export const respondToInvitation = (meetingId, response, token) =>
  request(`/${meetingId}/respond`, {
    method: "POST",
    body: JSON.stringify({ response }),
    token,
  });

export const getArchived = (token) =>
  request("/archived", { token });

export const archivePast = (token) =>
  request("/archive-past", { method: "POST", token });

export const getInvitations = (token) => request("/invitations", { token });
