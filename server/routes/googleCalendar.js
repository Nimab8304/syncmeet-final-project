const express = require('express');
const router = express.Router();
const { getAuthUrl, getToken, addEvent } = require('../utils/googleCalendar');

// Get Google OAuth URL
router.get('/auth-url', async (req, res) => {
  try {
    const url = await getAuthUrl();
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OAuth2 callback endpoint that your Google project redirect URI points to
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    await getToken(code);
    res.send('Google Calendar connected successfully! You can now return to the app.');
  } catch (error) {
    res.status(500).send('Error during token exchange: ' + error.message);
  }
});

// Example route to create a calendar event
router.post('/add-event', async (req, res) => {
  try {
    const event = req.body; // event details sent from frontend
    const createdEvent = await addEvent(event);
    res.json(createdEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
