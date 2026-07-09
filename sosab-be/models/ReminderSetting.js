const mongoose = require('mongoose');

const reminderSettingSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  time: {
    type: String,
    default: '10:00'
  },
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sound: {
    type: String,
    default: 'default'
  },
  vibration: {
    type: Boolean,
    default: true
  },
  lastSentDate: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReminderSetting', reminderSettingSchema);
