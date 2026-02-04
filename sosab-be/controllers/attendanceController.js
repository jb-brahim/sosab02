const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { getWeekDates } = require('../utils/weekHelper');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Project Manager
exports.markAttendance = asyncHandler(async (req, res) => {
  const { workerId, projectId, date, present, dayValue, overtime, bonus, penalty, notes } = req.body;

  // Verify worker and project
  const worker = await Worker.findById(workerId);
  const project = await Project.findById(projectId);

  if (!worker || !project) {
    return res.status(404).json({
      success: false,
      message: 'Worker or project not found'
    });
  }

  // Check access
  if (req.user.role !== 'Admin' && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to mark attendance for this project'
    });
  }

  // Normalize date to start of day in local timezone to avoid UTC shift issues
  const normalizeDate = (dateInput) => {
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const normalizedDate = normalizeDate(date);

  // Check if attendance already exists for this date
  const existingAttendance = await Attendance.findOne({
    workerId,
    date: normalizedDate
  });

  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.present = present;
    existingAttendance.dayValue = dayValue !== undefined ? dayValue : (present ? 1 : 0);
    existingAttendance.overtime = overtime || 0;
    existingAttendance.bonus = bonus || 0;
    existingAttendance.penalty = penalty || 0;
    existingAttendance.notes = notes;
    existingAttendance.markedBy = req.user._id;
    await existingAttendance.save();

    return res.status(200).json({
      success: true,
      data: existingAttendance
    });
  }

  // Create new attendance
  const attendance = await Attendance.create({
    workerId,
    projectId,
    date: normalizedDate,
    present,
    dayValue: dayValue !== undefined ? dayValue : (present ? 1 : 0),
    overtime: overtime || 0,
    bonus: bonus || 0,
    penalty: penalty || 0,
    notes,
    markedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: attendance
  });
});

// @desc    Get weekly attendance
// @route   GET /api/attendance/:projectId/:week
// @access  Private
exports.getWeeklyAttendance = asyncHandler(async (req, res) => {
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
  if (req.user.role !== 'Admin' && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view attendance for this project'
    });
  }

  const { startDate, endDate } = getWeekDates(week);

  const attendances = await Attendance.find({
    projectId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate('workerId', 'name dailySalary')
    .populate('markedBy', 'name email')
    .sort({ date: 1 });

  res.status(200).json({
    success: true,
    week,
    startDate,
    endDate,
    count: attendances.length,
    data: attendances
  });
});

// @desc    Get worker attendance history
// @route   GET /api/attendance/worker/:workerId
// @access  Private
exports.getWorkerAttendance = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  // Verify worker exists
  const worker = await Worker.findById(workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Worker not found'
    });
  }

  // Check access (Admin only)
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const attendance = await Attendance.find({ workerId })
    .populate('projectId', 'name')
    .populate('markedBy', 'name')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Get daily attendance for project
// @route   GET /api/attendance/project/:projectId/date/:date
// @access  Private
exports.getDailyAttendance = asyncHandler(async (req, res) => {
  const { projectId, date } = req.params;

  // Simple date validation or construction
  const searchDate = new Date(date);
  const nextDay = new Date(searchDate);
  nextDay.setDate(searchDate.getDate() + 1);

  const attendances = await Attendance.find({
    projectId,
    date: {
      $gte: searchDate,
      $lt: nextDay
    }
  });

  res.status(200).json({
    success: true,
    data: attendances
  });
});
