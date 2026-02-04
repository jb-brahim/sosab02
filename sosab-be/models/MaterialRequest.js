const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: false // Optional if requesting new/custom item
    },
    materialName: {
        type: String, // Snapshot of name or custom name
        required: true
    },
    unit: {
        type: String,
        default: 'pcs'
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Received'],
        default: 'Pending'
    },

    adminNotes: {
        type: String
    },
    // Reception Details
    receivedQuantity: {
        type: Number
    },
    receivedCost: {
        type: Number, // Total cost of the received amount
        default: 0
    },
    source: {
        type: String, // 'Depot', 'Supplier', 'Transfer: Project X'
        default: 'Depot'
    },
    deliveryProof: {
        type: [String], // Array of URLs/paths to images
        default: []
    },
    deliveredBy: {
        type: String
    },
    receivedAt: {
        type: Date
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

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
