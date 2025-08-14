// server/config/googleClient.js
const { google } = require('googleapis');
const { loadGoogleCredentials } = require('./google');

function createOAuth2Client() {
  const creds = loadGoogleCredentials();
  // Works with either "installed" or "web" type credentials
  const cfg = creds.installed || creds.web;
  if (!cfg) {
    throw new Error('Invalid Google credentials format: expected "installed" or "web".');
  }
  const { client_id, client_secret, redirect_uris } = cfg;
  if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
    throw new Error('Google credentials missing client_id/client_secret/redirect_uris.');
  }

  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function getAuthUrl(scopes = []) {
  const oauth2Client = createOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
  return url;
}

function getOAuth2Client() {
  return createOAuth2Client();
}

module.exports = { getAuthUrl, getOAuth2Client };
