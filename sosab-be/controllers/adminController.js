const asyncHandler = require('../middleware/asyncHandler');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
    // Parallel execution for performance
    const [
        totalProjects,
        activeProjects,
        delayedProjects,
        onHoldProjects,
        completedProjects,
        totalBudgetResult,
        activeWorkers
    ] = await Promise.all([
        Project.countDocuments(),
        Project.countDocuments({ status: { $regex: /^active$/i } }), // Case insensitive 'Active'
        Project.countDocuments({ status: { $regex: /^delayed|on hold$/i } }), // Include On Hold as needing attention? Or just delayed. Let's stick to status 'Delayed' if exists or just anything not active/completed
        // Checking Project model enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
        // User requested "Delayed Projects" in UI stats. Mapping 'On Hold' to Delayed for now, or just 'On Hold'.
        // Let's count 'On Hold' as Delayed for the KPI card "Delayed Projects"
        Project.countDocuments({ status: 'On Hold' }),
        Project.countDocuments({ status: 'Completed' }),
        Project.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$budget" }
                }
            }
        ]),
        Worker.countDocuments({ active: true })
    ]);

    const totalBudget = totalBudgetResult.length > 0 ? totalBudgetResult[0].total : 0;

    res.status(200).json({
        success: true,
        data: {
            projects: {
                total: totalProjects,
                active: activeProjects,
                delayed: delayedProjects, // Mapping 'On Hold' to Delayed for UI
                completed: completedProjects
            },
            budget: {
                total: totalBudget,
                currency: 'TND'
            },
            workers: {
                active: activeWorkers
            }
        }
    });
});
