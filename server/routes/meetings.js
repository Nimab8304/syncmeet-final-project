// server/routes/meetings.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createMeeting,
  getMeetingsForUser,
  respondToInvitation,
  archivePastMeetings,
  getArchivedMeetings,
} = require('../controllers/meetingController');

router.use(authMiddleware);

router.post('/', createMeeting);
router.get('/', getMeetingsForUser);
router.post('/:meetingId/respond', respondToInvitation);
router.post('/archive-past', archivePastMeetings);
router.get('/archived', getArchivedMeetings);

module.exports = router;
