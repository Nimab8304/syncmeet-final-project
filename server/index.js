// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// A simple test route
app.get('/', (req, res) => {
  res.send('✅ SyncMeet Server is running!');
});

const PORT = process.env.PORT || 5000;

const userRoutes = require('./routes/users');

// Add after app.use(express.json());
app.use('/api/users', userRoutes);

const meetingRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingRoutes);

const googleCalendarRoutes = require('./routes/googleCalendar');
app.use('/api/google-calendar', googleCalendarRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});