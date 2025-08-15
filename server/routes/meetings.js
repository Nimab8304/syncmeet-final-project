// server/routes/meetings.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  syncMeetingToGoogle,
  getMeetingsForUser,       // owner + accepted
  getInvitationsForUser,    
  respondToInvitation,
  archivePastMeetings,
  getArchivedMeetings,
} = require('../controllers/meetingController');

router.use(authMiddleware);

// Invitations feed (pending only)
router.get('/invitations', getInvitationsForUser); 

// Create a new meeting
router.post('/', createMeeting);

// Update a meeting (creator only)
router.put('/:id', updateMeeting);

// Delete a meeting (creator only)
router.delete('/:id', deleteMeeting);

// Manually sync a meeting to Google (creator only)
router.post('/:id/sync-google', syncMeetingToGoogle);

// Get meetings for logged-in user (active: owner + accepted)
router.get('/', getMeetingsForUser);

// Respond to invitation
router.post('/:meetingId/respond', respondToInvitation);

// Archive past meetings
router.post('/archive-past', archivePastMeetings);

// Get archived meetings
router.get('/archived', getArchivedMeetings);

module.exports = router;
