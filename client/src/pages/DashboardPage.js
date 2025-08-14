// client/src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import MainCalendar from "../components/calendar/MainCalendar";
import MeetingForm from "../components/calendar/MeetingForm";
import MeetingFormModal from "../components/calendar/MeetingFormModal";
import MeetingDetailsModal from "../components/calendar/MeetingDetailsModal";
import EmptyState from "../components/ui/EmptyState";
import InvitationList from "../components/calendar/InvitationList";
import UpcomingList from "../components/calendar/UpcomingList";
import { useAuth } from "../context/AuthContext";
import {
  getMeetings,
  createMeeting,
  respondToInvitation,
  // TODO: add updateMeeting, deleteMeeting if backend supports
} from "../services/meetingService";
import { useNavigate } from "react-router-dom";
import { eventColorsForOwnership } from "../utils/colors";
import { formatLocalRange } from "../utils/date";
import {
  requestNotificationPermission,
  scheduleMeetingReminder,
  clearAllReminders,
} from "../services/notificationService";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [rawMeetings, setRawMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editInit, setEditInit] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMeeting, setDetailsMeeting] = useState(null);
  const [detailsIsOwner, setDetailsIsOwner] = useState(false);

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

  // Ask notification permission once (best effort; non-blocking)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const DEFAULT_REMINDER_MINUTES = 15;

  // Schedule reminders for a set of meetings (future only)
  const scheduleRemindersForMeetings = useCallback((meetings) => {
    clearAllReminders();
    const now = Date.now();
    (meetings || [])
      .filter((m) => new Date(m.startTime).getTime() > now)
      .forEach((m) => {
        const minutes =
          typeof m.reminderMinutes === "number"
            ? m.reminderMinutes
            : DEFAULT_REMINDER_MINUTES;
        if (minutes > 0) {
          scheduleMeetingReminder(m, minutes);
        }
      });
  }, []);

  const loadMeetings = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setFetchError("");
    try {
      const meetings = await getMeetings(user.token);

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

      // Schedule reminders after loading
      scheduleRemindersForMeetings(meetings);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        setFetchError(err?.message || "Failed to load meetings");
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentUserId, safeLogout, scheduleRemindersForMeetings]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Cleanup all reminders on unmount
  useEffect(() => {
    return () => clearAllReminders();
  }, []);

  // Invitations list: meetings where current user is a participant and status === 'invited'
  const invitations = useMemo(() => {
    if (!rawMeetings?.length || !currentUserId) return [];
    return rawMeetings
      .filter(
        (m) =>
          Array.isArray(m.participants) &&
          m.participants.some((p) => String(p.user) === String(currentUserId))
      )
      .map((m) => {
        const me = (m.participants || []).find(
          (p) => String(p.user) === String(currentUserId)
        );
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
    await createMeeting(meetingData, user.token);
    await loadMeetings(); // refresh and reschedule reminders
  };

  const handleRespond = async (meetingId, response) => {
    try {
      await respondToInvitation(meetingId, response, user.token);
      await loadMeetings(); // refresh and reschedule reminders
      setDetailsOpen(false);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      }
    }
  };

  const handleDateClick = (arg) => {
    // Prefill times in create modal (+1h)
    const startISO = new Date(arg.date).toISOString();
    const endISO = new Date(new Date(arg.date).getTime() + 60 * 60 * 1000).toISOString();
    setEditInit({
      title: "",
      description: "",
      startTime: startISO,
      endTime: endISO,
      invitationLink: "",
    });
    setCreateOpen(true);
  };

  const handleEventClick = (info) => {
    const m = info?.event?.extendedProps?.meeting;
    const isOwner = !!info?.event?.extendedProps?.isOwner;
    setDetailsMeeting(m);
    setDetailsIsOwner(isOwner);
    setDetailsOpen(true);
  };

  const handleEditFromDetails = (meeting) => {
    // Open create/edit modal with initial values (acts as edit UI until update API exists)
    setEditInit(meeting);
    setCreateOpen(true);
    setDetailsOpen(false);
  };

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ marginBottom: 12 }}>Dashboard</h1>
        <button
          onClick={() => {
            setEditInit(null);
            setCreateOpen(true);
          }}
        >
          + New Meeting
        </button>
      </div>

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
                  setEditInit(null);
                  setCreateOpen(true);
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

        {/* Right: Invitations, Upcoming, inline form (optional keep) */}
        <div>
          <InvitationList invitations={invitations} onRespond={handleRespond} />
          <UpcomingList meetings={upcoming} limit={5} />

          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title">New Meeting (inline)</h2>
            <div id="meeting-form">
              <MeetingForm
                onCreate={async (data) => {
                  await handleCreateMeeting(data);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      <MeetingDetailsModal
        open={detailsOpen}
        meeting={detailsMeeting}
        isOwner={detailsIsOwner}
        onClose={() => setDetailsOpen(false)}
        onAccept={(id) => handleRespond(id, "accepted")}
        onDecline={(id) => handleRespond(id, "declined")}
        onEdit={handleEditFromDetails}
        // onDelete={async (id) => { /* TODO: implement deleteMeeting then refresh */ }}
      />

      {/* Create/Edit modal */}
      <MeetingFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditInit(null);
        }}
        onSubmit={async (payload) => {
          // If you add updateMeeting API, detect editInit?._id and branch to update
          await handleCreateMeeting(payload);
        }}
        initialValues={editInit}
        title={editInit && editInit._id ? "Edit meeting" : "Create meeting"}
        defaultReminderMinutes={15}
      />
    </div>
  );
}
