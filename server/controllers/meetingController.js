// server/controllers/meetingController.js
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const {
  createGoogleEventForMeeting,
  updateGoogleEventForMeeting,
  deleteGoogleEventForMeeting,
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
    }));
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

    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      invitationLink,
      participants: sanitizeParticipants(participants),
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

    // sanitize participants if provided
    if (updates.participants) {
      updates.participants = sanitizeParticipants(updates.participants);
    }

    Object.assign(meeting, updates);
    let updated = await meeting.save();

    // Try Google update
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

    // Try delete on Google first (non-blocking)
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
      $or: [{ createdBy: userId }, { 'participants.user': userId }],
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

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Prevent responding to archived or past meetings
    const now = new Date();
    if (meeting.archived || new Date(meeting.endTime) < now) {
      return res.status(400).json({ message: 'Cannot respond to an archived or past meeting' });
    }

    const participant = (meeting.participants || []).find(
      (p) => p.user && p.user.toString() === userId
    );
    if (!participant) {
      return res.status(403).json({ message: 'You are not invited to this meeting' });
    }

    participant.status = response;
    await meeting.save();

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

    // Optional: scope to current user only — uncomment to enable scoped archiving
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

module.exports = {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  syncMeetingToGoogle,
  getMeetingsForUser,
  respondToInvitation,
  archivePastMeetings,
  getArchivedMeetings,
};
