const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createMeeting,
  getMeetingsForUser,
  respondToInvitation
} = require('../controllers/meetingController');

// Apply authMiddleware to all meeting routes
router.use(authMiddleware);

// POST /api/meetings - Create a new meeting
router.post('/', createMeeting);

// GET /api/meetings - Get meetings for logged-in user
router.get('/', getMeetingsForUser);

// POST /api/meetings/:meetingId/respond - Respond to invitation
router.post('/:meetingId/respond', respondToInvitation);

// Archive past meetings (e.g., admin or scheduled task)
router.post('/archive-past', archivePastMeetings);

// Get archived meetings for user
router.get('/archived', getArchivedMeetings);

module.exports = router;
