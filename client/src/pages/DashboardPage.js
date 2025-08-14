// client/src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback } from "react";
import MainCalendar from "../components/calendar/MainCalendar";
import MeetingForm from "../components/calendar/MeetingForm";
import { useAuth } from "../context/AuthContext";
import {
  getMeetings,
  createMeeting,
} from "../services/meetingService";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth(); // اگر logout نداری، پایین fallback داریم
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

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
      const calendarEvents = meetings.map((m) => ({
        id: m._id,
        title: m.title,
        start: m.startTime,
        end: m.endTime,
      }));
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
  }, [user, safeLogout]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleCreateMeeting = async (meetingData) => {
    try {
      await createMeeting(meetingData, user.token);
      await loadMeetings(); // refresh calendar
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        safeLogout();
      }
      throw err; // تا فرم پیام خطا را نشان بدهد
    }
  };

  const handleDateClick = (arg) => {
    alert(`Date clicked: ${arg.dateStr}`);
  };

  const handleEventClick = (info) => {
    alert(`Event: ${info.event.title}`);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Dashboard</h1>

      <MeetingForm onCreate={handleCreateMeeting} />

      {loading ? (
        <div>Loading calendar...</div>
      ) : fetchError ? (
        <div style={{ color: "red" }}>{fetchError}</div>
      ) : (
        <MainCalendar
          events={events}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}
    </div>
  );
}
