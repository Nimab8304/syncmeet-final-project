import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getMeetings } from "../services/meetingService";
import { requestNotificationPermission } from "../services/notificationService";

/**
 * Owner-only invite response watcher.
 * - Polls meetings every intervalMs
 * - Compares participant statuses vs previous snapshot
 * - On change, fires a browser Notification and calls onEvent(text) for Toast
 */
export default function useInviteResponseNotifications({ intervalMs = 10000, onEvent } = {}) {
  const { user } = useAuth();
  const prevMap = useRef(new Map());
  const firstLoadDone = useRef(false);

  const notify = useCallback((text) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(text);
    }
    onEvent?.(text); // e.g., show Toast too
  }, [onEvent]);

  useEffect(() => {
    if (!user?.token) return;

    // Ask once for permission (best-effort)
    try { requestNotificationPermission?.(); } catch {}

    let timer;
    const tick = async () => {
      try {
        const meetings = await getMeetings(user.token);
        const myId = String(user._id || user.id);

        // فقط جلساتی که خودم owner هستم و آرشیو نیستند
        meetings
          .filter(m => !m.archived && String(m.createdBy?._id || m.createdBy) === myId)
          .forEach(m => {
            (m.participants || []).forEach(p => {
              const pid = String(p.user?._id || p.user);
              const key = `${m._id}:${pid}`;
              const prev = prevMap.current.get(key);
              const curr = p.status;

              // در اولین بار نوتیف نده؛ فقط اسنپ‌شات بساز
              if (firstLoadDone.current && prev && prev !== curr) {
                const name =
                  typeof p.user === "object"
                    ? (p.user.name || p.user.email || "User")
                    : "User";
                notify(`${name} ${curr} your invitation: "${m.title}"`);
              }
              if (curr) prevMap.current.set(key, curr);
            });
          });

        firstLoadDone.current = true;
      } catch (e) {
        // silent; می‌تونی console.warn(e) بذاری
      } finally {
        timer = setTimeout(tick, intervalMs);
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, [user, intervalMs, notify]);
}
