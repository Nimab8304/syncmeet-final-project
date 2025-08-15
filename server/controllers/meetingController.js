// server/controllers/meetingController.js

const Meeting = require('../models/Meeting');
const User = require('../models/User');
const {
  createGoogleEventForMeeting,
  updateGoogleEventForMeeting,
  deleteGoogleEventForMeeting,
  updateAttendeeStatuses,         // NEW
  upsertInviteePersonalEvent,     // NEW
  deleteInviteePersonalEvent,     // NEW
} = require('../services/googleCalendarService');

// Helper: sanitize participants array to { user, status: invited|accepted|declined }
function sanitizeParticipants(participants) {
  if (!Array.isArray(participants)) return [];
  const allowed = new Set(['invited', 'accepted', 'declined']);
  return participants
    .filter((p) => p && p.user)
    .map((p) => ({
      user: p.user,
      status: allowed.has(p.status) ? p.status : 'invited',
      // Keep any existing per-invitee googleEventId if present
      googleEventId: p.googleEventId || null,
    }));
}

// Helper: resolve any participants with { email } to { user: ObjectId }
// - Policy: if any email does not correspond to a registered user, return 400 error.
async function resolveParticipantsFromEmails(rawParticipants = []) {
  if (!Array.isArray(rawParticipants) || rawParticipants.length === 0) return [];

  // Split into email-based and id-based entries
  const emails = [];
  const idEntries = [];

  for (const p of rawParticipants) {
    if (!p) continue;
    const email = (p.email || '').trim().toLowerCase();
    if (email) {
      emails.push(email);
    } else if (p.user) {
      idEntries.push({ user: p.user, status: p.status, googleEventId: p.googleEventId });
    }
  }

  let resolved = [...idEntries];

  if (emails.length > 0) {
    const users = await User.find({ email: { $in: emails } }).select('_id email').lean();
    const foundEmailSet = new Set((users || []).map(u => u.email));
    const unknown = emails.filter(e => !foundEmailSet.has(e));

    if (unknown.length > 0) {
      const list = unknown.join(', ');
      const err = new Error(`Some emails are not registered: ${list}`);
      err.statusCode = 400;
      throw err;
    }

    const emailToId = new Map((users || []).map(u => [u.email, u._id]));
    for (const p of rawParticipants) {
      const email = (p?.email || '').trim().toLowerCase();
      if (email) {
        const uid = emailToId.get(email);
        if (uid) {
          resolved.push({ user: uid, status: p.status, googleEventId: p.googleEventId });
        }
      }
    }
  }

  return resolved;
}

// Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, startTime, endTime, invitationLink, participants } = req.body;
    const createdBy = req.user.id;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, startTime and endTime are required' });
    }
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    let normalizedParticipants = [];
    try {
      normalizedParticipants = await resolveParticipantsFromEmails(participants);
    } catch (e) {
      const status = e.statusCode || e.status || 400;
      return res.status(status).json({ message: e.message || 'Invalid participants' });
    }

    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      invitationLink,
      participants: sanitizeParticipants(normalizedParticipants),
      createdBy,
    });

    let savedMeeting = await meeting.save();

    // Attempt Google sync if creator connected
    try {
      const me = await User.findById(createdBy).select('google');
      const hasGoogle = !!(me?.google?.refreshToken || me?.google?.accessToken);
      if (hasGoogle) {
        // populate participants' emails for attendees mapping
        savedMeeting = await Meeting.findById(savedMeeting._id)
          .populate('participants.user', 'email')
          .exec();

        const timeZone = req.get('X-Timezone') || 'UTC';
        const googleEvent = await createGoogleEventForMeeting(savedMeeting, timeZone);
        if (googleEvent?.id) {
          savedMeeting.googleEventId = googleEvent.id;
          await savedMeeting.save();
        }
      }
    } catch (gErr) {
      console.error('Google Calendar sync (create) failed:', gErr?.message || gErr);
    }

    return res.status(201).json(savedMeeting);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Update an existing meeting (creator only)
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const userId = req.user.id;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    if (meeting.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to update this meeting' });
    }
    if (updates.startTime && updates.endTime) {
      if (new Date(updates.startTime) >= new Date(updates.endTime)) {
        return res.status(400).json({ message: 'startTime must be before endTime' });
      }
    }

    // Handle participants if provided: can be [{ email }] or [{ user }]
    if (Array.isArray(updates.participants)) {
      try {
        const normalizedParticipants = await resolveParticipantsFromEmails(updates.participants);
        updates.participants = sanitizeParticipants(normalizedParticipants);
      } catch (e) {
        const status = e.statusCode || e.status || 400;
        return res.status(status).json({ message: e.message || 'Invalid participants' });
      }
    }

    Object.assign(meeting, updates);
    let updated = await meeting.save();

    // Try Google update (owner calendar)
    try {
      const me = await User.findById(updated.createdBy).select('google');
      const hasGoogle = !!(me?.google?.refreshToken || me?.google?.accessToken);
      if (hasGoogle) {
        updated = await Meeting.findById(updated._id)
          .populate('participants.user', 'email')
          .exec();

        const timeZone = req.get('X-Timezone') || 'UTC';
        if (updated.googleEventId) {
          await updateGoogleEventForMeeting(updated, timeZone);
        } else {
          const googleEvent = await createGoogleEventForMeeting(updated, timeZone);
          if (googleEvent?.id) {
            updated.googleEventId = googleEvent.id;
            await updated.save();
          }
        }
      }
    } catch (gErr) {
      console.error('Google Calendar sync (update) failed:', gErr?.message || gErr);
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Delete a meeting (creator only)
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    if (meeting.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to delete this meeting' });
    }

    // Try delete on Google first (non-blocking owner event)
    try {
      await deleteGoogleEventForMeeting(meeting);
    } catch (gErr) {
      console.error('Google Calendar sync (delete) failed:', gErr?.message || gErr);
    }

    await meeting.deleteOne();
    return res.json({ message: 'Meeting deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Manual sync endpoint (creator only)
const syncMeetingToGoogle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let meeting = await Meeting.findById(id)
      .populate('participants.user', 'email')
      .exec();

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    if (meeting.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const timeZone = req.get('X-Timezone') || 'UTC';
    let event;
    if (meeting.googleEventId) {
      event = await updateGoogleEventForMeeting(meeting, timeZone);
    } else {
      event = await createGoogleEventForMeeting(meeting, timeZone);
      if (event?.id) {
        meeting.googleEventId = event.id;
        await meeting.save();
      }
    }

    return res.json({
      message: 'Synced to Google Calendar',
      eventId: event?.id || meeting.googleEventId,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Sync failed' });
  }
};

// Get all active (non-archived) meetings for the logged-in user (as participant or creator)
const getMeetingsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      archived: false,
      $or: [
        { createdBy: userId },
        { 'participants.user': userId, 'participants.status': 'accepted' },
      ],
    })
      .populate('participants.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ startTime: 1 });

    return res.json(meetings);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Respond to a meeting invitation (accept/decline)
const respondToInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { meetingId } = req.params;
    const { response } = req.body;

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response value' });
    }

    // Load meeting with participants populated for emails (needed for owner attendee sync)
    let meeting = await Meeting.findById(meetingId)
      .populate('participants.user', 'name email google')
      .exec();

    console.log('[respondToInvitation] fetched', {
      meetingId,
      userId,
      participantIds: (meeting.participants || []).map(p => String(p.user)),
      participantStatuses: (meeting.participants || []).map(p => p.status),
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Prevent responding to archived or past meetings
    // Prevent responding to archived or past meetings
    const now = new Date();
    if (meeting.archived || new Date(meeting.endTime) < now) {
      return res.status(400).json({ message: 'Cannot respond to an archived or past meeting' });
    }

    // Find the current user in participants (handles populated or unpopulated user field)
    const participant = (meeting.participants || []).find((p) => {
      if (!p?.user) return false;
      const pid = typeof p.user === 'object' ? String(p.user._id) : String(p.user);
      return pid === String(userId);
    });

    if (!participant) {
      console.warn('[respondToInvitation] not invited', {
        meetingId,
        userId,
        participants: (meeting.participants || []).map(p => ({
          user: typeof p.user === 'object' ? String(p.user._id) : String(p.user),
          status: p.status,
        })),
      });
      return res.status(403).json({ message: 'You are not invited to this meeting' });
    }

    // Update status in DB
    participant.status = response;
    await meeting.save();

    // Per-invitee personal calendar sync (if invitee connected)
    try {
      const invitee = await User.findById(userId).select('google');
      const inviteeHasGoogle = !!(invitee?.google?.refreshToken || invitee?.google?.accessToken);
      const timeZone = req.get('X-Timezone') || 'UTC';

      if (inviteeHasGoogle) {
        console.log('[respondToInvitation] invitee sync check', {
          inviteeHasGoogle,
          response,
          existingPersonalEventId: participant.googleEventId || null,
          timeZone,
        });

        if (response === 'accepted') {
          const newId = await upsertInviteePersonalEvent(
            userId,
            participant.googleEventId,
            meeting,
            timeZone
          );
          console.log('[respondToInvitation] upsert personal event done', {
            newId,
            previousId: participant.googleEventId || null,
          });
          if (newId && newId !== participant.googleEventId) {
            participant.googleEventId = newId;
            await meeting.save();
          }
        } else if (response === 'declined' && participant.googleEventId) {
          await deleteInviteePersonalEvent(userId, participant.googleEventId);
          console.log('[respondToInvitation] deleted personal event', {
            previousId: participant.googleEventId,
          });
          participant.googleEventId = null;
          await meeting.save();
        }
      }
    } catch (e) {
      console.error('Invitee personal Google sync failed:', e?.message || e);
    }

    // Keep the owner’s Google event attendee statuses aligned (best-effort)
    try {
      if (meeting.googleEventId) {
        const owner = await User.findById(meeting.createdBy).select('google');
        const ownerHasGoogle = !!(owner?.google?.refreshToken || owner?.google?.accessToken);
        if (ownerHasGoogle) {
          console.log('[respondToInvitation] updating owner attendees', {
            hasOwnerGoogle: ownerHasGoogle,
            hasOwnerEventId: !!meeting.googleEventId,
          });

          // Ensure we have participant emails
          if (!meeting.participants?.[0]?.user?.email) {
            meeting = await Meeting.findById(meetingId)
              .populate('participants.user', 'email')
              .exec();
          }
          await updateAttendeeStatuses(meeting);
        }
      }
    } catch (e) {
      console.error('Owner attendee status update failed:', e?.message || e);
    }
    return res.json({ message: `Invitation ${response}` });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Archive past meetings
const archivePastMeetings = async (req, res) => {
  try {
    const now = new Date();

    // Global archive (original behavior):
    let filter = { endTime: { $lt: now }, archived: false };

    // Optional: scope to current user only
    // const userId = req.user.id;
    // filter = {
    //   ...filter,
    //   $or: [{ createdBy: userId }, { 'participants.user': userId }],
    // };

    const result = await Meeting.updateMany(filter, { $set: { archived: true } });
    return res.json({ message: `${result.modifiedCount} meetings archived.` });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get archived meetings for the logged-in user
const getArchivedMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await Meeting.find({
      archived: true,
      $or: [{ createdBy: userId }, { 'participants.user': userId }],
    })
      .populate('participants.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });

    return res.json(meetings);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getInvitationsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      archived: false,
      'participants.user': userId,
      'participants.status': 'invited',
    })
      .populate('participants.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ startTime: 1 });

    return res.json(meetings);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  syncMeetingToGoogle,
  getMeetingsForUser,
  getInvitationsForUser,
  respondToInvitation,      // updated
  archivePastMeetings,
  getArchivedMeetings,
};
