const Worker = require('../models/Worker');
const Project = require('../models/Project');
const { sendNotificationToRoles } = require('./notificationController');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Add worker
// @route   POST /api/workers
// @access  Private/Admin or Project Manager
exports.addWorker = asyncHandler(async (req, res) => {
  const { name, trade, projectId, dailySalary, documents, contact, assignedTasks, supervisorId, isSubcontractor } = req.body;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check strict authorization: Only Project Manager of THIS project, Admin or Gérant can add worker
  const isManager = project.managers && project.managers.some(id => id.toString() === req.user._id.toString());
  if (req.user.role !== 'Admin' && req.user.role !== 'Gérant' && !isManager) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add workers to this project'
    });
  }

  // Check if an inactive worker with the same name exists in this project
  let worker = await Worker.findOne({
    name: name,
    projectId: projectId,
    active: false
  });

  let isReactivated = false;

  if (worker) {
    // Reactivate and update existing worker
    worker.active = true;
    worker.trade = trade;
    worker.dailySalary = dailySalary;
    if (documents) worker.documents = documents;
    if (contact) worker.contact = Object.keys(contact).length > 0 ? contact : worker.contact;
    if (assignedTasks) worker.assignedTasks = assignedTasks;
    if (supervisorId !== undefined) worker.supervisorId = supervisorId;
    if (isSubcontractor !== undefined) worker.isSubcontractor = isSubcontractor;
    worker.updatedAt = new Date();
    await worker.save();
    isReactivated = true;
  } else {
    // Create new worker
    worker = await Worker.create({
      name,
      trade,
      projectId,
      dailySalary,
      documents: documents || [],
      contact: contact || {},
      assignedTasks: assignedTasks || [],
      supervisorId: supervisorId || null,
      isSubcontractor: isSubcontractor || (trade === 'Sous Traitant')
    });
  }

  // Notify Admins and Gérants
  const notificationMessage = isReactivated
    ? `Travailleur réactivé : ${req.user.name} a réactivé ${worker.name} (${worker.trade}) sur le projet ${project.name}`
    : `Nouveau travailleur ajouté : ${req.user.name} a ajouté ${worker.name} (${worker.trade}) au projet ${project.name}`;

  await sendNotificationToRoles(
    ['Admin', 'Gérant'],
    'system',
    notificationMessage,
    `/admin/projects/${project._id}`,
    isReactivated ? 'Travailleur Réactivé' : 'Nouveau Travailleur'
  );

  res.status(isReactivated ? 200 : 201).json({
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
  const isManager = project.managers && project.managers.some(id => id.toString() === req.user._id.toString());
  if (req.user.role !== 'Admin' && req.user.role !== 'Gérant' && !isManager) {
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
  // Gérant sees all projects' workers too (read-only)
  if (req.user.role !== 'Admin' && req.user.role !== 'Gérant') {
    // Find projects managed by this user
    const projects = await Project.find({ managers: req.user._id });
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
  const { name, trade, projectId, dailySalary, documents, contact, assignedTasks, active, masked, supervisorId, isSubcontractor } = req.body;

  const worker = await Worker.findById(req.params.id).populate('projectId');

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Worker not found'
    });
  }

  // Check authorization: Admin and Gérant can update any worker; PM must be a manager
  const isManager = worker.projectId.managers && worker.projectId.managers.some(id => id.toString() === req.user._id.toString());
  if (req.user.role !== 'Admin' && req.user.role !== 'Gérant' && !isManager) {
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
  if (masked !== undefined) worker.masked = masked;
  if (supervisorId !== undefined) worker.supervisorId = supervisorId;
  if (isSubcontractor !== undefined) worker.isSubcontractor = isSubcontractor;
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
    // Gérant and Admin can delete any worker
    if (req.user.role !== 'Admin' && req.user.role !== 'Gérant') {
      // If worker is assigned to a project, check if user is manager of that project
      if (worker.projectId) {
        const isManager = worker.projectId.managers && worker.projectId.managers.some(id => id.toString() === req.user._id.toString());
        if (!isManager) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this worker'
          });
        }
      } else {
        // If worker is not assigned to any project, only Admin/Gérant can delete
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete unassigned worker'
        });
      }
    }

    worker.active = false;
    await worker.save();

    // Notify Admins and Gérants
    await sendNotificationToRoles(
      ['Admin', 'Gérant'],
      'system',
      `Travailleur retiré : ${req.user.name} a désactivé le travailleur ${worker.name} du projet ${worker.projectId ? worker.projectId.name : 'Non assigné'}`,
      '/admin/workers',
      'Travailleur Désactivé'
    );

    res.status(200).json({
      success: true,
      message: 'Worker disabled successfully'
    });
  } catch (error) {
    console.error('[DEBUG] Error in deleteWorker:', error);
    throw error;
  }
});

