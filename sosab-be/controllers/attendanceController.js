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
  const isManager = project.managers && project.managers.some(m => m.toString() === req.user._id.toString());
  if (req.user.role !== 'Admin' && !isManager) {
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

  // Check access: Admin and Gérant can see any project; PM must be manager; Accountant must have assignedProjects or be a manager
  const isManager = project.managers && project.managers.some(m => m.toString() === req.user._id.toString());
  const isAssignedAccountant = req.user.role === 'Accountant' && (
    (req.user.assignedProjects && req.user.assignedProjects.some(p => p.toString() === projectId)) ||
    isManager
  );
  if (req.user.role !== 'Admin' && req.user.role !== 'Gérant' && !isManager && !isAssignedAccountant) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view attendance for this project'
    });
  }

  const { startDate, endDate } = getWeekDates(week);

  // Get all active workers for the project
  const workers = await Worker.find({ projectId, active: true });

  // Get attendance records for the week
  const attendances = await Attendance.find({
    projectId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });

  // Group attendance by worker
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const groupedData = workers.map(worker => {
    const workerRecords = attendances.filter(a => a.workerId.toString() === worker._id.toString());
    
    const record = {
      workerId: worker._id,
      workerName: worker.name,
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0
    };

    workerRecords.forEach(a => {
      const dayIndex = new Date(a.date).getDay();
      const dayName = dayNames[dayIndex];
      if (record.hasOwnProperty(dayName)) {
        // Store actual dayValue (0.5, 1, 1.5, 2...) — 0 means absent
        record[dayName] = a.present ? (a.dayValue || 1) : 0;
      }
    });

    return record;
  });

  res.status(200).json({
    success: true,
    week,
    startDate,
    endDate,
    count: groupedData.length,
    data: groupedData
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

// @desc    Check if logged-in manager needs to mark attendance today
// @route   GET /api/attendance/status/today
// @access  Private
exports.checkDailyAttendanceStatus = asyncHandler(async (req, res) => {
  const isManager = req.user.role === 'Project Manager' || req.user.role === 'Gérant' || req.user.role === 'Admin';
  if (!isManager) {
    return res.status(200).json({ success: true, attendanceRequired: false, projects: [] });
  }

  // Find active projects where this user is manager (if not Admin)
  const query = { status: 'Active' };
  if (req.user.role !== 'Admin') {
    query.managers = req.user._id;
  }

  const projects = await Project.find(query);
  if (!projects.length) {
    return res.status(200).json({ success: true, attendanceRequired: false, projects: [] });
  }

  // Calculate start and end of today in local time
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const projectsPendingAttendance = [];

  for (const project of projects) {
    // Check if the project has workers
    const workerCount = await Worker.countDocuments({ projectId: project._id, active: true });
    if (workerCount === 0) {
      continue;
    }

    // Check if there is at least one attendance record for today
    const attendanceCount = await Attendance.countDocuments({
      projectId: project._id,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    if (attendanceCount === 0) {
      projectsPendingAttendance.push({
        id: project._id,
        name: project.name,
        location: project.location
      });
    }
  }

  res.status(200).json({
    success: true,
    attendanceRequired: projectsPendingAttendance.length > 0,
    projects: projectsPendingAttendance
  });
});
