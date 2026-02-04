const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: ['report', 'salary', 'material', 'task', 'attendance', 'system', 'alert']
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String // URL to related resource
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

