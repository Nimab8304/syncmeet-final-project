// client/src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import MainCalendar from "../components/calendar/MainCalendar";
import MeetingForm from "../components/calendar/MeetingForm";
import EmptyState from "../components/ui/EmptyState";
import InvitationList from "../components/calendar/InvitationList";
import UpcomingList from "../components/calendar/UpcomingList";
import { useAuth } from "../context/AuthContext";
import {
  getMeetings,
  createMeeting,
  respondToInvitation,
} from "../services/meetingService";
import { useNavigate } from "react-router-dom";
import { eventColorsForOwnership } from "../utils/colors";
import { formatLocalRange } from "../utils/date";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [rawMeetings, setRawMeetings] = useState([]); // keep original meetings for lists
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const currentUserId = useMemo(
    () => user?.id || user?._id || user?.userId || user?.user?.id,
    [user]
  );

  const safeLogout = useCallback(() => {
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("syncmeetUser");
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  const loadMeetings = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setFetchError("");
    try {
      const meetings = await getMeetings(user.token);

      // Prepare calendar events
      const calendarEvents = meetings.map((m) => {
        const createdById =
          typeof m.createdBy === "string" ? m.createdBy : m.createdBy?._id;
        const isOwner =
          createdById && currentUserId && String(createdById) === String(currentUserId);

        const colors = eventColorsForOwnership(isOwner);
        return {
          id: m._id,
          title: m.title,
          start: m.startTime,
          end: m.endTime,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: colors.textColor,
          extendedProps: {
            meeting: m,
            isOwner,
            timeLabel: formatLocalRange(m.startTime, m.endTime),
          },
        };
      });

      setRawMeetings(meetings);
      setEvents(calendarEvents);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        setFetchError(err?.message || "Failed to load meetings");
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentUserId, safeLogout]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Invitations list: meetings where current user is a participant and status === 'invited'
  const invitations = useMemo(() => {
    if (!rawMeetings?.length || !currentUserId) return [];
    return rawMeetings
      .filter((m) =>
        Array.isArray(m.participants) &&
        m.participants.some((p) => String(p.user) === String(currentUserId))
      )
      .map((m) => {
        const me = (m.participants || []).find((p) => String(p.user) === String(currentUserId));
        return { ...m, status: me?.status || "invited" };
      })
      .filter((m) => m.status === "invited");
  }, [rawMeetings, currentUserId]);

  // Upcoming: next meetings (owner or participant) with startTime in the future
  const upcoming = useMemo(() => {
    if (!rawMeetings?.length) return [];
    const now = Date.now();
    return rawMeetings
      .filter((m) => new Date(m.startTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [rawMeetings]);

  const handleCreateMeeting = async (meetingData) => {
    try {
      await createMeeting(meetingData, user.token);
      await loadMeetings(); // refresh calendar and side lists
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      }
      throw err; // let form show error
    }
  };

  const handleRespond = async (meetingId, response) => {
    try {
      await respondToInvitation(meetingId, response, user.token);
      // Optimistic update: refresh all
      await loadMeetings();
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      }
      // Optionally show toast/error UI here
      console.error("Failed to respond to invitation:", err);
    }
  };

  const handleDateClick = (arg) => {
    // Placeholder; will open create modal in next steps
    alert(`Date clicked: ${arg.dateStr}`);
  };

  const handleEventClick = (info) => {
    const m = info?.event?.extendedProps?.meeting;
    const timeLabel = info?.event?.extendedProps?.timeLabel;
    alert(`${m?.title || info.event.title}\n${timeLabel || ""}`);
    // Next steps: open details modal with actions
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 12 }}>Dashboard</h1>

      <div className="grid grid-2">
        {/* Left: Calendar */}
        <div>
          {loading ? (
            <div>Loading calendar...</div>
          ) : fetchError ? (
            <div style={{ color: "red" }}>{fetchError}</div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No meetings yet"
              description="Create your first meeting to see it on the calendar."
              action={{
                label: "Create meeting",
                onClick: () => {
                  const el = document.getElementById("meeting-form");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                },
              }}
            />
          ) : (
            <MainCalendar
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Right: Invitations, Upcoming, New Meeting */}
        <div>
          <InvitationList invitations={invitations} onRespond={handleRespond} />
          <UpcomingList meetings={upcoming} limit={5} />

          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title">New Meeting</h2>
            <div id="meeting-form">
              <MeetingForm onCreate={handleCreateMeeting} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Tips</h2>
            <ul style={{ color: "#374151", lineHeight: 1.7 }}>
              <li>• Accept or decline invitations from the right panel.</li>
              <li>• Owner events are highlighted with a primary color.</li>
              <li>• Use Archive to move past meetings out of the main calendar.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
