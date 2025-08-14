// client/src/components/calendar/MainCalendar.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
// import "@fullcalendar/core/index.css";
// import "@fullcalendar/daygrid/index.css";

export default function MainCalendar({
  events = [],
  onDateClick,
  onEventClick,
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      dateClick={onDateClick}
      eventClick={onEventClick}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek,dayGridDay",
      }}
      height="auto"
      fixedWeekCount={false}
      eventDisplay="block"
    />
  );
}
