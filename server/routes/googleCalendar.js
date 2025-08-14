// server/routes/googleCalendar.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAuthUrl, getOAuth2Client, getAuthedClientForUser } = require('../config/googleClient');
const { google } = require('googleapis');
const User = require('../models/User');

// Require app auth (JWT) for all Google routes
router.use(auth);

// Common Calendar scope(s). Add more as needed.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  // 'https://www.googleapis.com/auth/calendar.readonly'
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

    // Persist tokens for this app user
    // req.user.id is set by auth middleware (JWT)
    const userId = req.user.id;
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'google.accessToken': tokens.access_token || null,
          'google.refreshToken': tokens.refresh_token || null, // Only returned on first consent
          'google.expiryDate': tokens.expiry_date || null,
        },
      },
      { new: true }
    );

    // Optionally redirect back to client settings page:
    // return res.redirect('http://localhost:3000/settings?google=connected');

    return res
      .status(200)
      .send('Google OAuth successful and tokens stored. You can close this tab.');
  } catch (err) {
    return next(err);
  }
});

// GET /api/google-calendar/status
router.get('/status', async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id).select('google');
    const connected = !!(me?.google?.refreshToken || me?.google?.accessToken);
    return res.json({
      connected,
      expiresAt: me?.google?.expiryDate || null,
      hasRefreshToken: !!me?.google?.refreshToken,
    });
  } catch (err) {
    return next(err);
  }
});

// Optional: quick test to list upcoming events
router.get('/events', async (req, res, next) => {
  try {
    const authClient = await getAuthedClientForUser(req.user.id);
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const now = new Date().toISOString();

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 5,
    });

    return res.json({ items: data.items || [] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
