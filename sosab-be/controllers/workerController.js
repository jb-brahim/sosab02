const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Add worker
// @route   POST /api/workers
// @access  Private/Admin or Project Manager
exports.addWorker = asyncHandler(async (req, res) => {
  const { name, trade, projectId, dailySalary, documents, contact, assignedTasks, supervisorId } = req.body;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check strict authorization: Only Project Manager of THIS project or Admin can add worker
  if (req.user.role !== 'Admin' && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add workers to this project'
    });
  }

  const worker = await Worker.create({
    name,
    trade,
    projectId,
    dailySalary,
    documents: documents || [],
    contact: contact || {},
    assignedTasks: assignedTasks || [],
    supervisorId: supervisorId || null
  });

  // Notify Admins if added by Manager
  if (req.user.role !== 'Admin') {
    const admins = await User.find({ role: 'Admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'system',
      message: `New Worker Added: ${req.user.name} added ${worker.name} (${worker.trade}) to ${project.name}`,
      link: `/admin/projects/${project._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  res.status(201).json({
    success: true,
    data: worker
  });
});

// @desc    Get workers by project
// @route   GET /api/workers/:projectId
// @access  Private
exports.getWorkers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Verify project exists
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
      message: 'Not authorized to view workers for this project'
    });
  }

  const workers = await Worker.find({ projectId, active: true })
    .populate('assignedTasks', 'name status progress');

  res.status(200).json({
    success: true,
    count: workers.length,
    data: workers
  });
});

// @desc    Get ALL workers (Admin) or Manager's workers
// @route   GET /api/workers/admin/all or GET /api/workers
// @access  Private/Admin or Manager
exports.getAllWorkers = asyncHandler(async (req, res) => {
  let query = { active: true };

  // If Manager, filter by assigned projects
  if (req.user.role !== 'Admin') {
    // Find projects managed by this user
    const projects = await Project.find({ managerId: req.user._id });
    const projectIds = projects.map(p => p._id);

    // Filter workers belonging to these projects
    query.projectId = { $in: projectIds };
  }

  const workers = await Worker.find(query)
    .populate({
      path: 'projectId',
      select: 'name managerId',
      populate: {
        path: 'managerId',
        select: 'name email'
      }
    })
    .populate('assignedTasks', 'name status progress');

  res.status(200).json({
    success: true,
    count: workers.length,
    data: workers
  });
});

// @desc    Update worker
// @route   PATCH /api/workers/:id
// @access  Private/Admin or Project Manager
exports.updateWorker = asyncHandler(async (req, res) => {
  const { name, trade, projectId, dailySalary, documents, contact, assignedTasks, active, supervisorId } = req.body;

  const worker = await Worker.findById(req.params.id).populate('projectId');

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Worker not found'
    });
  }

  // Check authorization
  if (req.user.role !== 'Admin' && worker.projectId.managerId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this worker'
    });
  }

  if (name) worker.name = name;
  if (trade) worker.trade = trade;
  if (projectId) worker.projectId = projectId;
  if (dailySalary) worker.dailySalary = dailySalary;
  if (documents) worker.documents = documents;
  if (contact) worker.contact = contact;
  if (assignedTasks) worker.assignedTasks = assignedTasks;
  if (active !== undefined) worker.active = active;
  if (supervisorId !== undefined) worker.supervisorId = supervisorId;
  worker.updatedAt = new Date();

  await worker.save();

  res.status(200).json({
    success: true,
    data: worker
  });
});

// @desc    Delete worker
// @route   DELETE /api/workers/:id
// @access  Private/Admin or Project Manager
exports.deleteWorker = asyncHandler(async (req, res) => {
  console.log(`[DEBUG] deleteWorker called with ID: ${req.params.id}`);
  try {
    const worker = await Worker.findById(req.params.id).populate('projectId');


    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check access
    // If worker is assigned to a project, check if user is manager of that project
    if (worker.projectId) {
      if (req.user.role !== 'Admin' && worker.projectId.managerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this worker'
        });
      }
    } else {
      // If worker is not assigned to any project, only Admin can delete? 
      // Or maybe just let it slide if checks pass. 
      // Let's enforce Admin only for unassigned workers if we want strictness, 
      // but usually existing logic implies manager check is only for assigned ones.
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete unassigned worker'
        });
      }
    }

    worker.active = false;
    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker disabled successfully'
    });
  } catch (error) {
    console.error('[DEBUG] Error in deleteWorker:', error);
    throw error;
  }
});

