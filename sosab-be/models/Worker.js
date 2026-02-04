const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Worker name is required'],
    trim: true,
    minlength: [2, 'Worker name must be at least 2 characters'],
    maxlength: [100, 'Worker name cannot exceed 100 characters']
  },
  trade: {
    type: String,
    required: [true, 'Trade/Specialty is required'],
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required'],
    index: true
  },
  dailySalary: {
    type: Number,
    required: [true, 'Daily salary is required'],
    min: [0, 'Daily salary cannot be negative']
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  documents: [{
    name: String,
    url: String,
    type: String, // ID, Contract, Certificate, etc.
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  contact: {
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Allow empty string or valid phone format
          return !v || /^[\d\s\-\+\(\)]+$/.test(v);
        },
        message: 'Invalid phone number format. Use only digits, spaces, hyphens, plus signs, and parentheses'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    }
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for status (derived from active)
workerSchema.virtual('status').get(function () {
  return this.active ? 'active' : 'inactive';
});

// Ensure virtuals are included when converting to JSON
workerSchema.set('toJSON', { virtuals: true });
workerSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update updatedAt
workerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to ensure contact is always an object
workerSchema.pre('save', function (next) {
  if (this.contact === null || this.contact === undefined) {
    this.contact = { phone: '', address: '' };
  } else if (typeof this.contact === 'string') {
    // Convert string to object (legacy data migration)
    this.contact = {
      phone: this.contact,
      address: ''
    };
  }
  next();
});

// Index for faster queries
workerSchema.index({ projectId: 1, active: 1 });

module.exports = mongoose.model('Worker', workerSchema);

