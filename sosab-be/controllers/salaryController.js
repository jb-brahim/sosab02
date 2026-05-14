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
  const allowedRoles = ['Admin', 'Gérant', 'Project Manager', 'Accountant'];
  const isManager = project.managers && project.managers.some(m => m.toString() === req.user._id.toString());
  const isAssignedAccountant = req.user.role === 'Accountant' && (
    (req.user.assignedProjects && req.user.assignedProjects.some(p => p.toString() === projectId)) ||
    isManager
  );
  if (!allowedRoles.includes(req.user.role) && !isManager && !isAssignedAccountant) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view salary for this project'
    });
  }
  // For Accountants, additionally verify they are assigned to this specific project
  if (req.user.role === 'Accountant' && !isAssignedAccountant) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view salary for this project'
    });
  }

  // Get all active workers for the project
  const workers = await Worker.find({ projectId, active: true });

  const { startDate, endDate } = req.query;
  
  const formattedWorkers = await Promise.all(workers.map(async (worker) => {
    if (startDate && endDate) {
      const breakdown = await calculateWeeklySalary(worker._id, projectId, week, startDate, endDate);
      return {
        workerId: worker._id,
        workerName: worker.name,
        daysWorked: breakdown.daysWorked || 0,
        dailyRate: worker.dailySalary || 0,
        totalSalary: breakdown.totalSalary,
        approved: false
      };
    } else {
      // Check if salary already exists
      let salary = await Salary.findOne({ workerId: worker._id, week });

      // Recalculate if missing or still pending (to reflect new attendance)
      if (!salary || salary.status === 'Pending') {
        const breakdown = await calculateWeeklySalary(worker._id, projectId, week);
        
        if (!salary) {
          salary = await Salary.create({
            workerId: worker._id,
            projectId,
            week,
            totalSalary: breakdown.totalSalary,
            breakdown,
            status: 'Pending'
          });
        } else {
          // Update existing pending salary with latest calculation
          salary.totalSalary = breakdown.totalSalary;
          salary.breakdown = breakdown;
          await salary.save();
        }
      }

      return {
        workerId: worker._id,
        workerName: worker.name,
        daysWorked: salary.breakdown?.daysWorked || 0,
        dailyRate: worker.dailySalary || 0,
        totalSalary: salary.totalSalary,
        approved: salary.status === 'Approved'
      };
    }
  }));

  const totalSalary = formattedWorkers.reduce((sum, w) => sum + w.totalSalary, 0);

  res.status(200).json({
    success: true,
    week,
    project: {
      id: project._id,
      name: project.name
    },
    totalSalary,
    count: formattedWorkers.length,
    data: {
      workers: formattedWorkers
    }
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

