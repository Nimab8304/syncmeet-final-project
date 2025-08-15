// client/src/services/meetingService.js
import { normalizeError } from "../utils/error";
import { getLocalTimeZone } from "../utils/tz";

const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const API = `${BASE_URL}/api/meetings`;

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

function extractMessage(data, fallback) {
  if (!data) return fallback;
  return data.message || data.msg || fallback;
}

async function request(path = "", { token, ...options } = {}) {
  try {
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
      console.error('[meetingService.request] HTTP error', {
        path,
        status: res.status,
        url: res.url,
        body: data,
      });
      const err = new Error(extractMessage(data, `Request failed: ${res.status}`));
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    throw normalizeError(err);
  }
}

const tzHeader = (tz) => ({ "X-Timezone": tz || getLocalTimeZone() });

export const getMeetings = (token) => request("", { token });

export const createMeeting = (meeting, token, timeZone = getLocalTimeZone()) =>
  request("", {
    method: "POST",
    body: JSON.stringify(meeting),
    token,
    headers: tzHeader(timeZone),
  });

export const updateMeeting = (id, updates, token, timeZone = getLocalTimeZone()) =>
  request(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
    token,
    headers: tzHeader(timeZone),
  });

export const deleteMeeting = (id, token) =>
  request(`/${id}`, { method: "DELETE", token });

export const syncMeetingToGoogle = (id, token, timeZone = getLocalTimeZone()) =>
  request(`/${id}/sync-google`, {
    method: "POST",
    token,
    headers: tzHeader(timeZone),
  });

export const respondToInvitation = (meetingId, response, token) =>
  request(`/${meetingId}/respond`, {
    method: "POST",
    body: JSON.stringify({ response }),
    token,
  });

export const getArchived = (token) => request("/archived", { token });

export const archivePast = (token) =>
  request("/archive-past", { method: "POST", token });

export const getInvitations = (token) => request("/invitations", { token });
