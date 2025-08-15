// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No token provided
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Missing secret configuration (server misconfig)
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded shape is { id, iat, exp } based on your generator
    req.user = decoded;
    return next();
  } catch (err) {
    // Map common JWT verification errors to clean messages
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err && (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError')) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
