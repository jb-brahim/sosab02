const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  permissions: [{
    type: String,
    enum: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'projects.create',
      'projects.read',
      'projects.update',
      'projects.delete',
      'workers.create',
      'workers.read',
      'workers.update',
      'workers.delete',
      'materials.create',
      'materials.read',
      'materials.update',
      'materials.delete',
      'reports.generate',
      'reports.read',
      'reports.download',
      'salary.read',
      'salary.approve',
      'analytics.read',
      'notifications.read',
      'notifications.send'
    ]
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

module.exports = mongoose.model('Role', roleSchema);

