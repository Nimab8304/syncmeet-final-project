// server/controllers/meetingController.js
const Meeting = require('../models/Meeting');

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

    const savedMeeting = await meeting.save();
    return res.status(201).json(savedMeeting);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
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

    // Prevent responding to archived or past meetings (optional hardening)
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
  getMeetingsForUser,
  respondToInvitation,
  archivePastMeetings,
  getArchivedMeetings,
};
