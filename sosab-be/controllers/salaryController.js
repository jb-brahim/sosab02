const Salary = require('../models/Salary');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { calculateWeeklySalary } = require('../utils/salaryCalculator');

// @desc    Get calculated weekly salary
// @route   GET /api/salary/:projectId/:week
// @access  Private/Accountant or Project Manager
exports.getWeeklySalary = asyncHandler(async (req, res) => {
  const { projectId, week } = req.params;

  // Verify project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check access
  const allowedRoles = ['Admin', 'Accountant', 'Project Manager'];
  if (!allowedRoles.includes(req.user.role) && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view salary for this project'
    });
  }

  // Get all workers for the project
  const workers = await Worker.find({ projectId, active: true });

  const salaryData = [];

  for (const worker of workers) {
    // Check if salary already calculated
    let salary = await Salary.findOne({ workerId: worker._id, week });

    if (!salary) {
      // Calculate salary
      const breakdown = await calculateWeeklySalary(worker._id, projectId, week);
      
      // Create salary record
      salary = await Salary.create({
        workerId: worker._id,
        projectId,
        week,
        totalSalary: breakdown.totalSalary,
        breakdown
      });
    }

    const workerData = await Worker.findById(worker._id);
    salaryData.push({
      worker: {
        id: workerData._id,
        name: workerData.name
      },
      salary: {
        id: salary._id,
        totalSalary: salary.totalSalary,
        breakdown: salary.breakdown,
        status: salary.status
      }
    });
  }

  // Calculate total
  const totalSalary = salaryData.reduce((sum, item) => sum + item.salary.totalSalary, 0);

  res.status(200).json({
    success: true,
    week,
    project: {
      id: project._id,
      name: project.name
    },
    totalSalary,
    count: salaryData.length,
    data: salaryData
  });
});

// @desc    Approve salary
// @route   PATCH /api/salary/:id/approve
// @access  Private/Accountant
exports.approveSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);

  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  salary.status = 'Approved';
  salary.approvedBy = req.user._id;
  salary.approvedAt = new Date();

  await salary.save();

  res.status(200).json({
    success: true,
    data: salary
  });
});

