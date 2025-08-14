import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react'; // React wrapper
import dayGridPlugin from '@fullcalendar/daygrid'; // month view plugin
import interactionPlugin from '@fullcalendar/interaction'; // optional for click, drag, etc.
import { getMeetings } from '../../services/meetingService';
import { useAuth } from '../../context/AuthContext';

export default function MainCalendar() {
  const [events, setEvents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (!user || !user.token) return;
        const meetings = await getMeetings(user.token);

        // Map meetings to FullCalendar event format
        const calendarEvents = meetings.map((meeting) => ({
          id: meeting._id,
          title: meeting.title,
          start: meeting.startTime,
          end: meeting.endTime,
          // You can add more properties such as color, url, etc.
        }));

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      }
    };

    fetchMeetings();
  }, [user]);

  const handleDateClick = (arg) => {
    alert(`Date clicked: ${arg.dateStr}`);
    // You can implement meeting creation modal on date click if you want
  };

  const handleEventClick = (clickInfo) => {
    alert(`Event: ${clickInfo.event.title}`);
    // You can implement showing meeting details or edit options here
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek,dayGridDay',
      }}
      height="auto"
    />
  );
}
