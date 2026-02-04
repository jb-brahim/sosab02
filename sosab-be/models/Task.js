const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Not Started'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);

