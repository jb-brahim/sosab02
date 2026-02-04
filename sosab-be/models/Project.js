const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager is required']
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  isArchived: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Project', projectSchema);

