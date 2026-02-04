const Material = require('../models/Material');
const MaterialLog = require('../models/MaterialLog');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { getWeekDates } = require('../utils/weekHelper');

// ... existing functions (addMaterial, getMaterials, updateMaterial, deleteMaterial) ...

// @desc    Add material log (IN/OUT)
// @route   POST /api/materials/log
// @access  Private
exports.addMaterialLog = asyncHandler(async (req, res) => {
    const { materialId, type, quantity, supplier, notes, taskId, workerId } = req.body;

    // Verify material exists
    const material = await Material.findById(materialId);
    if (!material) {
        return res.status(404).json({
            success: false,
            message: 'Material not found'
        });
    }

    // Check permissions: If not Admin, must be manager of the project
    if (req.user.role !== 'Admin') {
        const project = await Project.findById(material.projectId);
        if (!project || project.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to log materials for this project'
            });
        }
    }

    // Prepare log data
    const logData = {
        materialId,
        type,
        quantity: parseFloat(quantity),
        notes,
        loggedBy: req.user._id,
        deliveryDate: new Date()
    };

    // Add photo if uploaded
    if (req.file) {
        logData.photo = {
            url: `/uploads/materials/${req.file.filename}`,
            uploadedAt: new Date()
        };
    }

    // Add supplier for IN logs
    if (type === 'IN' && supplier) {
        logData.supplier = supplier;
    }

    // Add task/worker for OUT logs
    if (type === 'OUT') {
        if (taskId) logData.taskId = taskId;
        if (workerId) logData.workerId = workerId;
    }

    // Create log
    const log = await MaterialLog.create(logData);

    // Update material stock quantity
    if (type === 'IN') {
        material.stockQuantity += parseFloat(quantity);
    } else if (type === 'OUT') {
        material.stockQuantity -= parseFloat(quantity);
        // Prevent negative stock
        if (material.stockQuantity < 0) {
            material.stockQuantity = 0;
        }
    }
    material.updatedAt = new Date();
    await material.save();

    // Populate the log before sending response
    const populatedLog = await MaterialLog.findById(log._id)
        .populate('materialId', 'name unit')
        .populate('workerId', 'name')
        .populate('loggedBy', 'name email');

    res.status(201).json({
        success: true,
        data: populatedLog,
        material: {
            id: material._id,
            stockQuantity: material.stockQuantity
        }
    });
});

// @desc    Get material logs
// @route   GET /api/materials/logs/:materialId
// @access  Private
exports.getMaterialLogs = asyncHandler(async (req, res) => {
    const { materialId } = req.params;
    const { type, startDate, endDate } = req.query;

    // Build query
    let query = { materialId };

    if (type) {
        query.type = type;
    }

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const logs = await MaterialLog.find(query)
        .populate('materialId', 'name unit price')
        .populate('workerId', 'name')
        .populate('taskId', 'name')
        .populate('loggedBy', 'name email')
        .sort({ createdAt: -1 });

    // Calculate totals
    const inTotal = logs.filter(l => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0);
    const outTotal = logs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0);

    res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
        summary: {
            totalIn: inTotal,
            totalOut: outTotal,
            balance: inTotal - outTotal
        }
    });
});

// @desc    Update material log
// @route   PATCH /api/materials/log/:id
// @access  Private
exports.updateMaterialLog = asyncHandler(async (req, res) => {
    const { quantity, notes, supplier } = req.body;

    const log = await MaterialLog.findById(req.params.id);

    if (!log) {
        return res.status(404).json({
            success: false,
            message: 'Material log not found'
        });
    }

    // Only allow updating your own logs or if admin
    if (log.loggedBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this log'
        });
    }

    // Calculate stock adjustment if quantity changed
    if (quantity && quantity !== log.quantity) {
        const material = await Material.findById(log.materialId);
        const quantityDiff = parseFloat(quantity) - log.quantity;

        if (log.type === 'IN') {
            material.stockQuantity += quantityDiff;
        } else {
            material.stockQuantity -= quantityDiff;
            if (material.stockQuantity < 0) material.stockQuantity = 0;
        }

        await material.save();
        log.quantity = parseFloat(quantity);
    }

    if (notes !== undefined) log.notes = notes;
    if (supplier) log.supplier = supplier;

    await log.save();

    const updatedLog = await MaterialLog.findById(log._id)
        .populate('materialId', 'name unit')
        .populate('workerId', 'name')
        .populate('loggedBy', 'name email');

    res.status(200).json({
        success: true,
        data: updatedLog
    });
});

// @desc    Delete material log
// @route   DELETE /api/materials/log/:id
// @access  Private
exports.deleteMaterialLog = asyncHandler(async (req, res) => {
    const log = await MaterialLog.findById(req.params.id);

    if (!log) {
        return res.status(404).json({
            success: false,
            message: 'Material log not found'
        });
    }

    // Only allow deleting your own logs or if admin
    if (log.loggedBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this log'
        });
    }

    // Adjust material stock before deleting
    const material = await Material.findById(log.materialId);
    if (material) {
        if (log.type === 'IN') {
            material.stockQuantity -= log.quantity;
        } else {
            material.stockQuantity += log.quantity;
        }
        if (material.stockQuantity < 0) material.stockQuantity = 0;
        await material.save();
    }

    await log.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Material log deleted successfully'
    });
});

module.exports = {
    addMaterial: exports.addMaterial,
    getMaterials: exports.getMaterials,
    updateMaterial: exports.updateMaterial,
    deleteMaterial: exports.deleteMaterial,
    addMaterialLog: exports.addMaterialLog,
    getMaterialLogs: exports.getMaterialLogs,
    updateMaterialLog: exports.updateMaterialLog,
    deleteMaterialLog: exports.deleteMaterialLog
};
