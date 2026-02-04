const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['salary', 'material', 'activity', 'attendance', 'payment']
  },
  week: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  pdfUrl: {
    type: String,
    required: true
  },
  cloudStorageUrl: {
    type: String // S3 or Cloudinary URL
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
reportSchema.index({ projectId: 1, week: 1, type: 1 });

module.exports = mongoose.model('Report', reportSchema);

