const Meeting = require('../models/Meeting');

// Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, startTime, endTime, invitationLink, participants } = req.body;
    const createdBy = req.user.id;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, startTime and endTime are required' });
    }

    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      invitationLink,
      participants,
      createdBy,
    });

    const savedMeeting = await meeting.save();
    res.status(201).json(savedMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all meetings for the logged-in user (as participant or creator)
const getMeetingsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await Meeting.find({
      $or: [
        { createdBy: userId },
        { 'participants.user': userId },
      ],
    })
    .populate('participants.user', 'name email') // Get participant user details
    .populate('createdBy', 'name email') // Get creator info
    .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Respond to a meeting invitation (accept/decline)
const respondToInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { meetingId } = req.params;
    const { response } = req.body; // Expected: 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response value' });
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Find the participant and update the status
    const participant = meeting.participants.find(p => p.user.toString() === userId);
    if (!participant) {
      return res.status(403).json({ message: 'You are not invited to this meeting' });
    }

    participant.status = response;
    await meeting.save();

    res.json({ message: `Invitation ${response}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetingsForUser,
  respondToInvitation
};
