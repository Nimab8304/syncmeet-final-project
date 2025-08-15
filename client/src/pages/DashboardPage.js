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
import useInviteResponseNotifications from "../hook/useInviteResponseNotifications";
import Toast from "../components/ui/Toast";
import {
  getMeetings,
  getInvitations,          
  createMeeting,
  updateMeeting,
  deleteMeeting,
  syncMeetingToGoogle,
  respondToInvitation,
} from "../services/meetingService";
import { useNavigate } from "react-router-dom";
import { eventColorsForOwnership } from "../utils/colors";
import { formatLocalRange } from "../utils/date";
import {
  requestNotificationPermission,
  scheduleMeetingReminder,
  clearAllReminders,
} from "../services/notificationService";
import { useToast } from "../App";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast?.() || { showToast: () => {} };
  const [events, setEvents] = useState([]);
  const [rawMeetings, setRawMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [invites, setInvites] = useState([]);

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

  const [toast, setToast] = useState({ open: false, text: "", type: "info" });

  useInviteResponseNotifications({
    intervalMs: 10000,
    onEvent: (txt) => setToast({ open: true, text: txt, type: "success" })
  });

  const loadMeetings = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setFetchError("");
    try {
      // Load accepted/owner meetings and pending invitations in parallel
      const [meetings, pendingInvites] = await Promise.all([
        getMeetings(user.token),
        getInvitations(user.token), // NEW
      ]);

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
      setInvites(Array.isArray(pendingInvites) ? pendingInvites : []); // NEW

      // Reminders only for accepted/owner meetings
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

  // Remove the old invitations useMemo. Instead:
  const invitations = invites; // NEW

  // Upcoming stays based on rawMeetings (owner + accepted)
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
      await loadMeetings();
      showToast("Meeting created successfully!", "success");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        safeLogout();
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleSubmitMeeting = async (payload) => {
    try {
      if (editInit?._id) {
        await updateMeeting(editInit._id, payload, user.token);
        showToast("Meeting updated", "success");
      } else {
        await createMeeting(payload, user.token);
        showToast("Meeting created successfully!", "success");
      }
      await loadMeetings();
      setCreateOpen(false);
      setEditInit(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        safeLogout();
      } else {
        showToast(err.message || "Failed to save meeting", "error");
      }
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await deleteMeeting(id, user.token);
      await loadMeetings();
      setDetailsOpen(false);
      showToast("Meeting deleted", "success");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        showToast(err.message || "Failed to delete meeting", "error");
      }
    }
  };

  const handleSyncGoogle = async (id) => {
    try {
      await syncMeetingToGoogle(id, user.token);
      showToast("Synced to Google Calendar", "success");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      } else {
        showToast(err.message || "Sync failed", "error");
      }
    }
  };

  const handleRespond = async (meetingId, response) => {
    console.log('[handleRespond] will POST', { meetingId, response, hasToken: !!user?.token });

    try {
      await respondToInvitation(meetingId, response, user.token);
      await loadMeetings(); // refresh and reschedule reminders
      setDetailsOpen(false);
    } catch (err) {
      // REPLACE your existing catch body with the block below
      console.warn('[DashboardPage] action failed', {
        where: 'handleRespond',
        status: err?.status,
        msg: err?.message,
      });
      if (err?.status === 401) {
        // only logout on 401 (unauthenticated)
        safeLogout();
      } else if (err?.status === 403) {
        // do NOT logout on 403 (forbidden) — show a toast so you can debug
        setToast({ open: true, text: err?.message || 'Forbidden', type: 'error' });
      } else {
        setToast({ open: true, text: err?.message || 'Error', type: 'error' });
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
    // Open create/edit modal with initial values
    setEditInit(meeting);
    setCreateOpen(true);
    setDetailsOpen(false);
  };

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
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

      <Toast
        open={toast.open}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      >
        {toast.text}
      </Toast>

      <div className="grid grid-2">
        {/* Left: Calendar */}
        <div className="dashboard-main">
          {loading ? (
            <div>Loading calendar...</div>
          ) : fetchError ? (
            <div style={{ color: "red" }}>{fetchError}</div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No meetings yet"
              description="Create your first meeting to see it on the calendar."
              hideImage
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

        {/* Right: Invitations, Upcoming, inline form */}
        <div className="dashboard-rail">
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
        onDelete={handleDeleteMeeting}
        onSyncGoogle={detailsIsOwner ? handleSyncGoogle : undefined}
      />

      {/* Create/Edit modal */}
      <MeetingFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditInit(null);
        }}
        onSubmit={handleSubmitMeeting}
        initialValues={editInit}
        title={editInit && editInit._id ? "Edit meeting" : "Create meeting"}
        defaultReminderMinutes={15}
      />
    </div>
  );
}

