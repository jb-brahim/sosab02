const DailyReport = require('../models/DailyReport');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create daily report
// @route   POST /api/daily-reports
// @access  Private
exports.createDailyReport = asyncHandler(async (req, res) => {
    const { projectId, date, progress, workCompleted, issues, workersPresent, materialsUsed, weather, notes } = req.body;

    // Verify project
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }

    // Handle photos from multer
    const photos = req.files ? req.files.map(file => ({
        url: `/uploads/daily-reports/${file.filename}`,
        caption: '',
        uploadedAt: new Date()
    })) : [];

    const report = await DailyReport.create({
        projectId,
        date: date || new Date(),
        progress: parseInt(progress) || 0,
        workCompleted,
        issues,
        photos,
        workersPresent: parseInt(workersPresent) || 0,
        materialsUsed: materialsUsed ? JSON.parse(materialsUsed) : [],
        weather,
        notes,
        loggedBy: req.user._id
    });

    // Update project progress
    if (progress) {
        project.progress = parseInt(progress);
        await project.save();
    }

    const populatedReport = await DailyReport.findById(report._id)
        .populate('projectId', 'name location')
        .populate('loggedBy', 'name email');

    res.status(201).json({
        success: true,
        data: populatedReport
    });
});

// @desc    Get daily reports for a project
// @route   GET /api/daily-reports/:projectId
// @access  Private
exports.getDailyReports = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    let query = {};
    if (projectId && projectId !== 'all') {
        query.projectId = projectId;
    }

    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const reports = await DailyReport.find(query)
        .populate('projectId', 'name location')
        .populate('loggedBy', 'name email')
        .sort({ date: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Get single daily report
// @route   GET /api/daily-reports/report/:id
// @access  Private
exports.getDailyReport = asyncHandler(async (req, res) => {
    const report = await DailyReport.findById(req.params.id)
        .populate('projectId', 'name location')
        .populate('loggedBy', 'name email')
        .populate('materialsUsed.materialId', 'name unit');

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'Daily report not found'
        });
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Update daily report
// @route   PATCH /api/daily-reports/:id
// @access  Private
exports.updateDailyReport = asyncHandler(async (req, res) => {
    let report = await DailyReport.findById(req.params.id);

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'Daily report not found'
        });
    }

    // Check if user is the one who created it or admin
    if (report.loggedBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this report'
        });
    }

    const { progress, workCompleted, issues, workersPresent, weather, notes } = req.body;

    if (progress !== undefined) report.progress = parseInt(progress);
    if (workCompleted) report.workCompleted = workCompleted;
    if (issues) report.issues = issues;
    if (workersPresent !== undefined) report.workersPresent = parseInt(workersPresent);
    if (weather) report.weather = weather;
    if (notes) report.notes = notes;

    report.updatedAt = new Date();

    await report.save();

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Delete daily report
// @route   DELETE /api/daily-reports/:id
// @access  Private/Admin
exports.deleteDailyReport = asyncHandler(async (req, res) => {
    const report = await DailyReport.findById(req.params.id);

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'Daily report not found'
        });
    }

    await report.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Daily report deleted successfully'
    });
});

module.exports = {
    createDailyReport: exports.createDailyReport,
    getDailyReports: exports.getDailyReports,
    getDailyReport: exports.getDailyReport,
    updateDailyReport: exports.updateDailyReport,
    deleteDailyReport: exports.deleteDailyReport
};
