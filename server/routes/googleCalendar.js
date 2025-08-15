// server/routes/googleCalendar.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getAuthUrl, getOAuth2Client, getAuthedClientForUser } = require('../config/googleClient');

const router = express.Router();

// Scopes for Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  // 'https://www.googleapis.com/auth/calendar.readonly'
];

// Helpers to create/verify short-lived state tokens
function createStateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: JWT_SECRET is missing');
  }
  // Short-lived (10m) token carrying the app user id
  return jwt.sign({ uid: userId }, secret, { expiresIn: '10m' });
}

function verifyStateToken(state) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: JWT_SECRET is missing');
  }
  return jwt.verify(state, secret);
}

/**
 * PUBLIC segment: oauth2callback must remain public because Google redirects here
 * and will not include our app's Authorization header.
 */

// GET /api/google-calendar/oauth2callback
router.get('/oauth2callback', async (req, res, next) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.status(400).send(`Google OAuth error: ${String(error)}`);
    }
    if (!code) {
      return res.status(400).send('Missing code parameter.');
    }
    if (!state) {
      return res.status(400).send('Missing state parameter.');
    }

    // Verify state and extract mapped app user id
    let decoded;
    try {
      decoded = verifyStateToken(state);
    } catch (e) {
      return res.status(400).send('Invalid or expired state parameter.');
    }
    const userId = decoded?.uid;
    if (!userId) {
      return res.status(400).send('Invalid state payload.');
    }

    // Exchange code for tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Persist tokens for the mapped app user
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'google.accessToken': tokens.access_token || null,
          'google.refreshToken': tokens.refresh_token || null, // Only present on first consent
          'google.expiryDate': tokens.expiry_date || null,
        },
      },
      { new: true }
    );

    // Redirect back to client Settings for a clean UX
    // Adjust URL if your frontend origin differs
    return res.redirect('http://localhost:3000/settings?google=connected');
  } catch (err) {
    return next(err);
  }
});

/**
 * PRIVATE segment: requires app auth (JWT)
 */
router.use(auth);

// GET /api/google-calendar/auth-url
router.get('/auth-url', (req, res, next) => {
  try {
    // Create signed state for this user id
    const state = createStateToken(req.user.id);
    const url = getAuthUrl(SCOPES, state);
    return res.json({ url });
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

// Optional: quick test to list upcoming events (verifies tokens)
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
