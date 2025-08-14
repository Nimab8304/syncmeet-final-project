const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createMeeting,
  getMeetingsForUser,
  respondToInvitation,
  archivePastMeetings,
  getArchivedMeetings
} = require('../controllers/meetingController');

// Protect all meeting routes
router.use(authMiddleware);

// Create a new meeting
router.post('/', createMeeting);

// Get meetings for logged-in user
router.get('/', getMeetingsForUser);

// Respond to invitation
router.post('/:meetingId/respond', respondToInvitation);

// Archive past meetings (can be called by admin or scheduled job)
router.post('/archive-past', archivePastMeetings);

// Get archived meetings
router.get('/archived', getArchivedMeetings);

module.exports = router;