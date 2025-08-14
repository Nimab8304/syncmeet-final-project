// server/services/googleCalendarService.js
const { google } = require('googleapis');
const { getAuthedClientForUser } = require('../config/googleClient');

/**
 * Build a Google Calendar event resource from a Meeting document.
 * - Includes summary, description, start/end in ISO with provided timeZone.
 * - Includes location (invitationLink) if set.
 * - Optionally includes attendees if meeting.participants.user has email populated.
 */
function buildEventFromMeeting(meeting, timeZone = 'UTC') {
  const attendees =
    Array.isArray(meeting.participants)
      ? meeting.participants
          .map(p => {
            const email = p?.user?.email;
            return email ? { email } : null;
          })
          .filter(Boolean)
      : undefined;

  return {
    summary: meeting.title,
    description: meeting.description || '',
    start: {
      dateTime: new Date(meeting.startTime).toISOString(),
      timeZone,
    },
    end: {
      dateTime: new Date(meeting.endTime).toISOString(),
      timeZone,
    },
    location: meeting.invitationLink || undefined,
    attendees,
    // You can add reminders or conferenceData here if needed in future
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

  return data; // contains id, htmlLink, etc.
}

async function updateGoogleEventForMeeting(meeting, timeZone = 'UTC') {
  if (!meeting.googleEventId) {
    throw new Error('Meeting has no googleEventId to update.');
  }
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
  if (!meeting.googleEventId) return; // Nothing to delete
  const auth = await getAuthedClientForUser(meeting.createdBy);
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: meeting.googleEventId,
  });
}

module.exports = {
  createGoogleEventForMeeting,
  updateGoogleEventForMeeting,
  deleteGoogleEventForMeeting,
};
