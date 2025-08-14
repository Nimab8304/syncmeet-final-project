// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

connectDB();

const app = express();

// Core middlewares
app.use(cors()); // For dev allow all; restrict origin in prod with { origin: 'https://your-app' }
app.use(helmet()); // Sensible security headers
app.use(express.json({ limit: '1mb' })); // Prevent overly large JSON payloads

// Health check / root
app.get('/', (req, res) => {
  res.send('✅ SyncMeet Server is running!');
});

// Rate limiter for auth routes (basic brute-force protection)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
const userRoutes = require('./routes/users');
app.use('/api/users', authLimiter, userRoutes);

const googleCalendarRoutes = require('./routes/googleCalendar');
app.use('/api/google-calendar', googleCalendarRoutes);

const meetingRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingRoutes);

// Not found handler (before error handler)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
