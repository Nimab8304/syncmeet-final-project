// client/src/services/notificationService.js

// In-memory registry of timers: { [meetingId]: timeoutId }
const reminderTimers = new Map();

// Helper: safe Notification check
function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

// Request permission if needed; resolves to "granted"|"denied"|"default"
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return "denied";
  }
}

// Show a notification (title + body). Falls back to alert if notifications unsupported/denied.
export function showNotification({ title, body }) {
  if (isNotificationSupported() && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body,
        // icon: optional icon path like "/logo192.png"
        // tag: title, // optional dedupe
      });
      return n;
    } catch {
      // ignore
    }
  }
  // Basic fallback for demo/testing
  try {
    alert(`${title}\n\n${body}`);
  } catch {
    // ignore
  }
}

// Schedule a reminder for a meeting
// meeting: { _id, title, startTime }, minutesBefore: integer (e.g., 15)
export function scheduleMeetingReminder(meeting, minutesBefore = 15) {
  if (!meeting?._id || !meeting?.startTime) return;

  // Cancel existing if already scheduled
  cancelMeetingReminder(meeting._id);

  const startMs = new Date(meeting.startTime).getTime();
  const fireAt = startMs - minutesBefore * 60 * 1000;
  const now = Date.now();

  // If reminder time already passed, do nothing
  if (isNaN(startMs) || fireAt <= now) return;

  const delay = fireAt - now;
  const tid = setTimeout(() => {
    showNotification({
      title: "Upcoming meeting",
      body: `${meeting.title || "Meeting"} starts in ${minutesBefore} minutes.`,
    });
    reminderTimers.delete(meeting._id);
  }, delay);

  reminderTimers.set(meeting._id, tid);
}

// Cancel a single meeting reminder by meetingId
export function cancelMeetingReminder(meetingId) {
  if (!meetingId) return;
  const tid = reminderTimers.get(meetingId);
  if (tid) {
    clearTimeout(tid);
    reminderTimers.delete(meetingId);
  }
}

// Cancel all scheduled reminders (e.g., on logout/unmount)
export function clearAllReminders() {
  for (const [, tid] of reminderTimers.entries()) {
    clearTimeout(tid);
  }
  reminderTimers.clear();
}
