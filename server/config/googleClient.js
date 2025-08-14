// server/config/googleClient.js
const { google } = require('googleapis');
const { loadGoogleCredentials } = require('./google');
const User = require('../models/User');

function createOAuth2Client() {
  const creds = loadGoogleCredentials();
  const cfg = creds.installed || creds.web;
  if (!cfg) throw new Error('Invalid Google credentials (missing "installed" or "web").');
  const { client_id, client_secret, redirect_uris } = cfg;
  if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
    throw new Error('Google credentials missing client_id/client_secret/redirect_uris.');
    }
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function getAuthUrl(scopes = []) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}

async function getAuthedClientForUser(userId) {
  const client = createOAuth2Client();
  const me = await User.findById(userId).select('google');
  if (!me || !me.google || (!me.google.accessToken && !me.google.refreshToken)) {
    throw new Error('Google not connected for this user');
  }

  client.setCredentials({
    access_token: me.google.accessToken || undefined,
    refresh_token: me.google.refreshToken || undefined,
    expiry_date: me.google.expiryDate || undefined,
  });

  // Refresh if expired and refreshToken is present
  const now = Date.now();
  if (me.google.expiryDate && me.google.expiryDate <= now && me.google.refreshToken) {
    const { credentials } = await client.refreshAccessToken();
    me.google.accessToken = credentials.access_token || me.google.accessToken;
    me.google.expiryDate = credentials.expiry_date || me.google.expiryDate;
    if (credentials.refresh_token) {
      me.google.refreshToken = credentials.refresh_token;
    }
    await me.save();
    client.setCredentials({
      access_token: me.google.accessToken,
      refresh_token: me.google.refreshToken,
      expiry_date: me.google.expiryDate,
    });
  }

  return client;
}

module.exports = { getAuthUrl, getOAuth2Client: createOAuth2Client, getAuthedClientForUser };
