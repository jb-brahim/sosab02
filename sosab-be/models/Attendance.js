const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Worker is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  present: {
    type: Boolean,
    default: false
  },
  dayValue: {
    type: Number,
    default: 1,
    min: 0,
    max: 3 // Allow up to 3x for extreme overtime
  },
  overtime: {
    type: Number,
    default: 0,
    min: 0 // hours
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  penalty: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ projectId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

