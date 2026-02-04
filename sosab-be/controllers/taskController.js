const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Project Manager
exports.createTask = asyncHandler(async (req, res) => {
  const { projectId, name, description, assignedWorkers, startDate, endDate, priority, dependencies } = req.body;

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
      message: 'Not authorized to create tasks for this project'
    });
  }

  const task = await Task.create({
    projectId,
    name,
    description,
    assignedWorkers: assignedWorkers || [],
    startDate,
    endDate,
    priority: priority || 'Medium',
    dependencies: dependencies || []
  });

  // Add task to project
  project.tasks.push(task._id);
  await project.save();

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Get tasks by project
// @route   GET /api/tasks/:projectId
// @access  Private
exports.getTasks = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId || req.query.projectId;

  if (projectId) {
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
      // Also allow if user is assigned to the project? 
      // Current logic was strict for manager/admin. 
      // If we want workers to see tasks, we might need to relax this or check if they are 'assigned'.
      // For now, keeping existing strict check for specific project view as per original code, 
      // but maybe original code was too strict if workers need to see tasks.
      // Let's stick to original logic for specific project to minimize regression risk unique to this change.
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tasks for this project'
      });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedWorkers', 'name')
      .populate('dependencies', 'name status')
      .sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  }

  // If no projectId provided, fetch all tasks accessible to user
  let query = {};

  if (req.user.role !== 'Admin') {
    // Find projects where user is manager
    const managedProjects = await Project.find({ managerId: req.user._id }).select('_id');
    const managedProjectIds = managedProjects.map(p => p._id);

    query = {
      $or: [
        { projectId: { $in: managedProjectIds } }, // Tasks in projects they manage
        { assignedWorkers: req.user._id } // Tasks assigned to them
      ]
    };
  }

  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .populate('assignedWorkers', 'name')
    .populate('dependencies', 'name status')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private/Project Manager
exports.updateTask = asyncHandler(async (req, res) => {
  const { name, description, assignedWorkers, startDate, endDate, progress, status, priority, dependencies } = req.body;

  const task = await Task.findById(req.params.id).populate('projectId');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check access
  const project = await Project.findById(task.projectId);
  if (req.user.role !== 'Admin' && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this task'
    });
  }

  if (name) task.name = name;
  if (description) task.description = description;
  if (assignedWorkers) task.assignedWorkers = assignedWorkers;
  if (startDate) task.startDate = startDate;
  if (endDate) task.endDate = endDate;
  if (progress !== undefined) task.progress = progress;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dependencies) task.dependencies = dependencies;
  task.updatedAt = new Date();

  await task.save();

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin or Project Manager
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('projectId');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check access
  const project = await Project.findById(task.projectId);
  if (req.user.role !== 'Admin' && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this task'
    });
  }

  // Remove from project
  project.tasks = project.tasks.filter(t => t.toString() !== task._id.toString());
  await project.save();

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

