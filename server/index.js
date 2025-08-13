// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const connectDB = require('./config/db'); // فعلا کامنت باشد تا بعد

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// A simple test route
app.get('/', (req, res) => {
  res.send('✅ SyncMeet Server is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});