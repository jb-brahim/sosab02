const mongoose = require('mongoose');

const materialLogSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material is required']
  },
  type: {
    type: String,
    required: [true, 'Log type is required'],
    enum: ['IN', 'OUT']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  cost: {
    type: Number, // Total cost of the transaction
    default: 0
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  photos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredBy: {
    type: String
  },
  supplier: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
materialLogSchema.index({ materialId: 1, date: 1 });

module.exports = mongoose.model('MaterialLog', materialLogSchema);

