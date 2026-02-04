const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
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
  week: {
    type: String,
    required: [true, 'Week is required'],
    // Format: YYYY-WW (e.g., "2024-01")
  },
  totalSalary: {
    type: Number,
    required: true,
    min: 0
  },
  breakdown: {
    baseSalary: {
      type: Number,
      default: 0
    },
    overtime: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    penalty: {
      type: Number,
      default: 0
    },
    daysWorked: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
salarySchema.index({ workerId: 1, week: 1 }, { unique: true });
salarySchema.index({ projectId: 1, week: 1 });

module.exports = mongoose.model('Salary', salarySchema);

