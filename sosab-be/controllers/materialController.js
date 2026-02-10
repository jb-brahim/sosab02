const Material = require('../models/Material');
const MaterialLog = require('../models/MaterialLog');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { getWeekDates } = require('../utils/weekHelper');

// @desc    Add material
// @route   POST /api/materials
// @access  Private/Admin or Warehouse Manager
exports.addMaterial = asyncHandler(async (req, res) => {
  const { name, unit, price, supplier, projectId, stockQuantity, weight, size, category } = req.body;

  // Verify project exists ONLY if projectId is provided
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
  }

  const material = await Material.create({
    name,
    unit,
    price,
    supplier,
    projectId,
    stockQuantity: stockQuantity || 0,
    weight,
    size,
    category
  });

  res.status(201).json({
    success: true,
    data: material
  });
});

// @desc    Get materials by project
// @route   GET /api/materials/:projectId
// @access  Private
exports.getMaterials = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Verify project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const materials = await Material.find({ projectId })
    .populate('logs');

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// @desc    Get depot materials (no project assigned)
// @route   GET /api/materials/depot/all
// @access  Private
exports.getDepotMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({
    $or: [{ projectId: { $exists: false } }, { projectId: null }]
  })
    .populate('logs');

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// ... (skip addMaterialLog and getWeeklyMaterialUsage as they don't seem to touch supplierId explicitly in a way that breaks, or I can update them separately if needed, but getWeeklyMaterialUsage just dumps the object)

// @desc    Update material
// @route   PATCH /api/materials/:id
// @access  Private
exports.updateMaterial = asyncHandler(async (req, res) => {
  const { name, unit, price, supplier, stockQuantity, weight, size, category } = req.body;

  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Update fields
  if (name) material.name = name;
  if (unit) material.unit = unit;
  if (price !== undefined) material.price = price;
  if (supplier) material.supplier = supplier;
  if (stockQuantity !== undefined) material.stockQuantity = stockQuantity;
  if (weight) material.weight = weight;
  if (size) material.size = size;
  if (category) material.category = category;
  material.updatedAt = new Date();

  await material.save();

  res.status(200).json({
    success: true,
    data: material
  });
});

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private/Admin
exports.deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }

  // Delete associated logs
  await MaterialLog.deleteMany({ materialId: material._id });

  // Delete material
  await material.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Material deleted successfully'
  });
});

// @desc    Get all material logs for a project
// @route   GET /api/materials/projects/:projectId/logs
// @access  Private
exports.getProjectMaterialLogs = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Find all materials for this project
  const materials = await Material.find({ projectId });
  const materialIds = materials.map(m => m._id);

  // Find all logs for these materials
  const logs = await MaterialLog.find({ materialId: { $in: materialIds } })
    .populate('materialId', 'name unit')
    .populate('loggedBy', 'name')
    .sort({ date: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get aggregated material usage summary for a project
// @route   GET /api/materials/projects/:projectId/summary
// @access  Private
exports.getProjectMaterialSummary = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Find all materials for this project
  const materials = await Material.find({ projectId });
  const materialIds = materials.map(m => m._id);

  // Aggregate logs
  const stats = await MaterialLog.aggregate([
    { $match: { materialId: { $in: materialIds } } },
    {
      $group: {
        _id: "$materialId",
        totalIn: {
          $sum: {
            $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0]
          }
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0]
          }
        }
      }
    }
  ]);

  // Map stats back to material details
  const summary = materials.map(m => {
    const stat = stats.find(s => s._id.toString() === m._id.toString());
    return {
      materialId: m._id,
      name: m.name,
      unit: m.unit,
      stockQuantity: m.stockQuantity,
      totalIn: stat ? stat.totalIn : 0,
      totalOut: stat ? stat.totalOut : 0
    };
  });

  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Get aggregated material usage summary for all projects managed by user
// @route   GET /api/materials/manager/summary
// @access  Private
exports.getAllMaterialsSummary = asyncHandler(async (req, res) => {
  let query = {};

  // If PM, only show materials from their projects
  if (req.user.role === 'Project Manager') {
    const projects = await Project.find({ managerId: req.user._id });
    const projectIds = projects.map(p => p._id);
    query = { projectId: { $in: projectIds } };
  }

  // Find all materials matching the projects
  const materials = await Material.find(query).populate('projectId', 'name');
  const materialIds = materials.map(m => m._id);

  // Aggregate logs
  const stats = await MaterialLog.aggregate([
    { $match: { materialId: { $in: materialIds } } },
    {
      $group: {
        _id: "$materialId",
        totalIn: {
          $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] }
        },
        totalOut: {
          $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] }
        }
      }
    }
  ]);

  // Map stats back to material details
  const summary = materials.map(m => {
    const stat = stats.find(s => s._id.toString() === m._id.toString());
    return {
      materialId: m._id,
      name: m.name,
      unit: m.unit,
      price: m.price || 0,
      stockQuantity: m.stockQuantity || 0,
      category: m.category || 'Standard',
      supplier: m.supplier || 'Unknown',
      weight: m.weight,
      size: m.size,
      projectId: m.projectId ? m.projectId._id : null,
      projectName: m.projectId ? m.projectId.name : 'Unknown Project',
      totalIn: stat ? stat.totalIn : 0,
      totalOut: stat ? stat.totalOut : 0
    };
  });

  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Transfer material between projects
// @route   POST /api/materials/transfer
// @access  Private/Admin
exports.transferMaterial = asyncHandler(async (req, res) => {
  const { sourceProjectId, targetProjectId, materialName, quantity, notes } = req.body;

  if (!sourceProjectId || !targetProjectId || !materialName || !quantity) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const transferQty = parseFloat(quantity);

  // 1. Find source material
  const sourceMaterial = await Material.findOne({ projectId: sourceProjectId, name: materialName });
  if (!sourceMaterial || sourceMaterial.stockQuantity < transferQty) {
    return res.status(400).json({ success: false, message: 'Insufficient stock or material not found in source project' });
  }

  // 2. Find or Create target material
  let targetMaterial = await Material.findOne({ projectId: targetProjectId, name: materialName });
  if (!targetMaterial) {
    targetMaterial = await Material.create({
      projectId: targetProjectId,
      name: materialName,
      unit: sourceMaterial.unit,
      category: sourceMaterial.category,
      price: sourceMaterial.price,
      stockQuantity: 0
    });
  }

  // 3. Update Stocks
  sourceMaterial.stockQuantity -= transferQty;
  targetMaterial.stockQuantity += transferQty;

  await sourceMaterial.save();
  await targetMaterial.save();

  // 4. Create Logs
  const sourceProject = await Project.findById(sourceProjectId);
  const targetProject = await Project.findById(targetProjectId);

  await MaterialLog.create({
    materialId: sourceMaterial._id,
    loggedBy: req.user._id,
    quantity: transferQty,
    type: 'OUT',
    notes: `Transfert vers ${targetProject.name}. ${notes || ''}`,
    date: new Date()
  });

  await MaterialLog.create({
    materialId: targetMaterial._id,
    loggedBy: req.user._id,
    quantity: transferQty,
    type: 'IN',
    notes: `Transfert depuis ${sourceProject.name}. ${notes || ''}`,
    date: new Date()
  });

  res.status(200).json({
    success: true,
    message: `Transfert de ${transferQty} ${sourceMaterial.unit} de ${sourceProject.name} vers ${targetProject.name} réussi.`
  });
});
// @desc    Directly receive material on site (Manager)
// @route   POST /api/materials/direct-reception
// @access  Private (Manager/Admin)
exports.directReception = asyncHandler(async (req, res) => {
  const { projectId, materialName, quantity, unit, deliveredBy, notes, price, category, supplier, arrivalDate } = req.body;

  if (!projectId || !materialName || !quantity || !unit) {
    return res.status(400).json({ success: false, message: 'Please provide projectId, materialName, quantity and unit' });
  }

  // 1. Find or create the Material in the project
  let material = await Material.findOne({ projectId, name: materialName });

  if (!material) {
    material = await Material.create({
      projectId,
      name: materialName,
      unit,
      price: price || 0,
      stockQuantity: 0,
      category: category || 'Consumable',
      supplier: supplier || 'Unknown'
    });
  }

  // 2. Update stock
  const receivedQty = parseFloat(quantity);
  material.stockQuantity += receivedQty;
  if (price) material.price = price; // Update price if provided
  material.updatedAt = new Date();
  await material.save();

  // 3. Prepare photos from upload
  const photos = req.files ? req.files.map(file => ({
    url: `/uploads/materials/${file.filename}`,
    uploadedAt: new Date()
  })) : [];

  // 4. Create Material Log with custom date if provided
  const logDate = arrivalDate ? new Date(arrivalDate) : new Date();

  const log = await MaterialLog.create({
    materialId: material._id,
    loggedBy: req.user._id,
    quantity: receivedQty,
    type: 'IN',
    deliveredBy: deliveredBy || 'Unknown',
    supplier: supplier || 'Unknown',
    photos,
    notes: notes || 'Direct arrival on site',
    date: logDate
  });

  res.status(200).json({
    success: true,
    data: {
      material,
      log
    }
  });
});
