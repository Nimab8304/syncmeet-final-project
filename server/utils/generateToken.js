// server/utils/generateToken.js
const jwt = require('jsonwebtoken');

module.exports = function generateToken(id) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail fast if not configured; helps catch env issues early
    throw new Error('JWT secret is not set (JWT_SECRET).');
  }
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};
