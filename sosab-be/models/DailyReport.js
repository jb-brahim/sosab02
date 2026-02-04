const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    workCompleted: {
        type: String,
        trim: true
    },
    issues: {
        type: String,
        trim: true
    },
    photos: [{
        url: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    workersPresent: {
        type: Number,
        default: 0
    },
    materialsUsed: [{
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material'
        },
        quantity: Number
    }],
    weather: {
        type: String,
        enum: ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Other']
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
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
dailyReportSchema.index({ projectId: 1, date: -1 });
dailyReportSchema.index({ date: -1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
