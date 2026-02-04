const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'ton', 'm', 'm²', 'm³', 'piece', 'box', 'bag', 'liter', 'pcs', 'm2', 'm3', 'sac', 'l', 'paq', 'bar', 'voy'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  size: {
    length: Number,
    width: Number,
    height: Number
  },
  logs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialLog'
  }],
  category: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Material', materialSchema);

