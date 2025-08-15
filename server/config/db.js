// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not set in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    // Optional: connection event listeners for better diagnostics
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (err) {
    console.error('MongoDB connection error:', err?.message || err);
    process.exit(1);
  }
};

module.exports = connectDB;
