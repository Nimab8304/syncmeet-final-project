// server/routes/googleCalendar.js
const express = require('express');
const router = express.Router();
const { getAuthUrl, getOAuth2Client } = require('../config/googleClient');

// Common Calendar scope(s). Add more as needed.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  // or read-only: 'https://www.googleapis.com/auth/calendar.readonly'
];

// GET /api/google-calendar/auth-url
router.get('/auth-url', (req, res, next) => {
  try {
    const url = getAuthUrl(SCOPES);
    return res.json({ url });
  } catch (err) {
    return next(err);
  }
});

// GET /api/google-calendar/oauth2callback
// Google redirects here with ?code=...
router.get('/oauth2callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.status(400).send(`Google OAuth error: ${String(error)}`);
    }
    if (!code) {
      return res.status(400).send('Missing code parameter.');
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // For now, just show success; later you’ll store tokens per user.
    // tokens contains access_token, refresh_token (first consent), expiry_date, etc.
    return res
      .status(200)
      .send('Google OAuth successful. Tokens received (not stored yet). You can close this tab.');
  } catch (err) {
    return next(err);
  }
});

// Optional: status endpoint
router.get('/status', (req, res) => {
  return res.json({
    connected: false,
    message: 'Google Calendar not connected yet (no tokens stored).',
  });
});

module.exports = router;
