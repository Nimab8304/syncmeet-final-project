// server/services/googleCalendarService.js
const { google } = require('googleapis');
const { getAuthedClientForUser } = require('../config/googleClient');

function mapStatusToGoogle(status) {
  switch ((status || '').toLowerCase()) {
    case 'accepted': return 'accepted';
    case 'declined': return 'declined';
    default: return 'needsAction';
  }
}

function buildEventFromMeeting(meeting, timeZone = 'UTC') {
  const attendees = Array.isArray(meeting.participants)
    ? meeting.participants
        .map(p => {
          const email = p?.user?.email;
          if (!email) return null;
          return {
            email,
            // keep Google in sync with SyncMeet RSVP state
            responseStatus: mapStatusToGoogle(p.status),
          };
        })
        .filter(Boolean)
    : undefined;

  return {
    summary: meeting.title,
    description: meeting.description || '',
    start: { dateTime: new Date(meeting.startTime).toISOString(), timeZone },
    end: { dateTime: new Date(meeting.endTime).toISOString(), timeZone },
    location: meeting.invitationLink || undefined,
    attendees,
  };
}

// Build a personal event for an invitee's own calendar (no attendees)
function buildPersonalEvent(meeting, timeZone = 'UTC') {
  return {
    summary: meeting.title,
    description: meeting.description || '',
    start: { dateTime: new Date(meeting.startTime).toISOString(), timeZone },
    end: { dateTime: new Date(meeting.endTime).toISOString(), timeZone },
    location: meeting.invitationLink || undefined,
  };
}

async function createGoogleEventForMeeting(meeting, timeZone = 'UTC') {
  const auth = await getAuthedClientForUser(meeting.createdBy);
  const calendar = google.calendar({ version: 'v3', auth });
  const eventResource = buildEventFromMeeting(meeting, timeZone);
  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventResource,
  });
  return data;
}

async function updateGoogleEventForMeeting(meeting, timeZone = 'UTC') {
  if (!meeting.googleEventId) throw new Error('Meeting has no googleEventId to update.');
  const auth = await getAuthedClientForUser(meeting.createdBy);
  const calendar = google.calendar({ version: 'v3', auth });
  const eventResource = buildEventFromMeeting(meeting, timeZone);
  const { data } = await calendar.events.patch({
    calendarId: 'primary',
    eventId: meeting.googleEventId,
    requestBody: eventResource,
  });
  return data;
}

async function deleteGoogleEventForMeeting(meeting) {
  if (!meeting.googleEventId) return;
  const auth = await getAuthedClientForUser(meeting.createdBy);
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: meeting.googleEventId,
  });
}

// NEW: reflect attendee statuses in the owner's Google event
async function updateAttendeeStatuses(meeting, timeZone = 'UTC') {
  if (!meeting.googleEventId) return;
  const auth = await getAuthedClientForUser(meeting.createdBy);
  const calendar = google.calendar({ version: 'v3', auth });

  const attendees = Array.isArray(meeting.participants)
    ? meeting.participants
        .map(p => {
          const email = p?.user?.email;
          if (!email) return null;
          return { email, responseStatus: mapStatusToGoogle(p.status) };
        })
        .filter(Boolean)
    : [];

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: meeting.googleEventId,
    requestBody: { attendees },
  });
}

// NEW: per-invitee create/update personal event in their own Google Calendar
async function upsertInviteePersonalEvent(inviteeId, participantGoogleEventId, meeting, timeZone = 'UTC') {
  const auth = await getAuthedClientForUser(inviteeId);
  const calendar = google.calendar({ version: 'v3', auth });
  const requestBody = buildPersonalEvent(meeting, timeZone);

  if (participantGoogleEventId) {
    // patch existing
    const { data } = await calendar.events.patch({
      calendarId: 'primary',
      eventId: participantGoogleEventId,
      requestBody,
    });
    return data.id;
  } else {
    // insert new
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody,
    });
    return data.id;
  }
}

// NEW: delete personal event from invitee's calendar
async function deleteInviteePersonalEvent(inviteeId, participantGoogleEventId) {
  if (!participantGoogleEventId) return;
  const auth = await getAuthedClientForUser(inviteeId);
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: participantGoogleEventId,
    });
  } catch (_) {
    // ignore if already gone
  }
}

module.exports = {
  createGoogleEventForMeeting,
  updateGoogleEventForMeeting,
  deleteGoogleEventForMeeting,
  updateAttendeeStatuses,          // NEW
  upsertInviteePersonalEvent,      // NEW
  deleteInviteePersonalEvent,      // NEW
  mapStatusToGoogle,               // optional export
};
