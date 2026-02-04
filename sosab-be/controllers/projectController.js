const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Worker = require('../models/Worker');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = asyncHandler(async (req, res) => {
  const { name, location, budget, startDate, endDate, managerId } = req.body;

  const project = await Project.create({
    name,
    location,
    budget,
    startDate,
    endDate,
    managerId
  });

  res.status(201).json({
    success: true,
    data: project
  });
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res) => {
  let query = {};

  // If user is not Admin, only show assigned projects
  if (req.user.role !== 'Admin') {
    query.managerId = req.user._id;
  }

  // Filter by archived status
  if (req.query.archived === 'true') {
    query.isArchived = true;
  } else {
    query.isArchived = { $ne: true };
  }

  const projects = await Project.find(query)
    .populate('managerId', 'name email')
    .populate('tasks');

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('managerId', 'name email')
    .populate('tasks');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check access
  if (req.user.role !== 'Admin' && project.managerId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this project'
    });
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Update project
// @route   PATCH /api/projects/:id
// @access  Private/Admin or Project Manager
exports.updateProject = asyncHandler(async (req, res) => {
  const { name, location, coordinates, budget, startDate, endDate, managerId, progress, status, documents } = req.body;

  const project = await Project.findById(req.params.id);

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
      message: 'Not authorized to update this project'
    });
  }

  if (name) project.name = name;
  if (location) project.location = location;
  if (coordinates) project.coordinates = coordinates;
  if (budget) project.budget = budget;
  if (startDate) project.startDate = startDate;
  if (endDate) project.endDate = endDate;
  if (managerId) project.managerId = managerId;
  if (progress !== undefined) project.progress = progress;
  if (status) project.status = status;
  if (documents) project.documents = documents;
  project.updatedAt = new Date();

  await project.save();

  // Notify Admins of Status Change if triggered by Manager
  if (status && req.user.role !== 'Admin') {
    const admins = await User.find({ role: 'Admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'alert',
      message: `Project Status Update: ${project.name} is now ${status}`,
      link: `/admin/projects/${project._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Soft delete
  project.isArchived = true;
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Project archived successfully'
  });
});

// @desc    Get project history (audit logs)
// @route   GET /api/projects/:id/history
// @access  Private/Admin or Project Manager
exports.getProjectHistory = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check access
  if (req.user.role !== 'Admin' && project.managerId?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this project history'
    });
  }

  const logs = await AuditLog.find({ resourceId: req.params.id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email role');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get project team (assigned active workers)
// @route   GET /api/projects/:id/team
// @access  Private
exports.getProjectTeam = asyncHandler(async (req, res) => {
  const workers = await Worker.find({
    projectId: req.params.id,
    active: true
  }).select('name trade contact dailySalary supervisorId');

  res.status(200).json({
    success: true,
    count: workers.length,
    data: workers
  });
});

