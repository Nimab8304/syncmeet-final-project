// server/config/google.js
const fs = require('fs');
const path = require('path');

function loadGoogleCredentials() {
  // Resolve to server/credentials.json
  const file = path.resolve(__dirname, '..', 'credentials.json');

  if (!fs.existsSync(file)) {
    throw new Error('Google credentials.json not found at server/credentials.json');
  }

  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw);
}

module.exports = { loadGoogleCredentials };
