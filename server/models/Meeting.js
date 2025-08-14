// server/models/Meeting.js
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['invited', 'accepted', 'declined'],
    default: 'invited',
  },
});

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    invitationLink: { type: String },
    participants: [participantSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
    // Add future fields like location, recurrence, reminders here
  },
  { timestamps: true }
);

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;
