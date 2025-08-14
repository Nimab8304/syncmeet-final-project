// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // فعلا کامنت باشد تا بعد

const app = express();

connectDB()

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

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});