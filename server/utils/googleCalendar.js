const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json'); // Your Google API credentials file
const TOKEN_PATH = path.join(__dirname, '../../token.json'); // To store user's token after OAuth2 consent

// Load OAuth2 client with credentials
async function loadOAuth2Client() {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    // Token not found, need user authorization
  }

  return oAuth2Client;
}

// Generate Auth URL for user consent
async function getAuthUrl() {
  const oAuth2Client = await loadOAuth2Client();
  const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens and save
async function getToken(code) {
  const oAuth2Client = await loadOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  oAuth2Client.setCredentials(tokens);
  return tokens;
}

// Create an event in Google Calendar
async function addEvent(event) {
  const oAuth2Client = await loadOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  return response.data;
}

module.exports = {
  getAuthUrl,
  getToken,
  addEvent,
};
