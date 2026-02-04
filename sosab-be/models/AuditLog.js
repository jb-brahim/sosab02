const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'read', 'login', 'logout', 'approve', 'reject']
  },
  resource: {
    type: String,
    required: true // e.g., 'User', 'Project', 'Material'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // Store before/after values
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

