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
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    invitationLink: {
      type: String,
    },
    participants: [participantSchema], // Embedded subdocuments with user refs and status
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    archived: {
    type: Boolean,
    default: false,
    }

    // You can add additional fields like location, recurrence, reminders etc.
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
