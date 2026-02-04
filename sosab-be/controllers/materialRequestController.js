const MaterialRequest = require('../models/MaterialRequest');
const Material = require('../models/Material');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create a material request
// @route   POST /api/material-requests
// @access  Private (Manager/Admin)
// @desc    Create a material request
// @route   POST /api/material-requests
// @access  Private (Manager/Admin)
exports.createRequest = asyncHandler(async (req, res) => {
    const { projectId, materialId, quantity, customName, unit } = req.body;
    const requesterId = req.user._id;

    let finalMaterialId = materialId;
    let finalMaterialName = customName;
    let finalUnit = unit || 'pcs';

    // If selecting from Depot
    if (materialId) {
        const depotMaterial = await Material.findById(materialId);
        if (!depotMaterial) {
            return res.status(404).json({ success: false, message: 'Depot material not found' });
        }
        finalMaterialName = depotMaterial.name;
        finalUnit = depotMaterial.unit;

        // Optional: Check stock, but allow requesting even if low?
        // User might want to request *restock*. 
        // For now, let's just log it. 
    } else {
        // Custom Request
        if (!customName) {
            return res.status(400).json({ success: false, message: 'Please provide material name' });
        }
    }

    const request = await MaterialRequest.create({
        requesterId,
        projectId,
        materialId: finalMaterialId || undefined,
        materialName: finalMaterialName,
        unit: finalUnit,
        quantity
    });

    // Notify Admins
    const admins = await User.find({ role: 'Admin' });

    const notifications = admins.map(admin => ({
        userId: admin._id,
        type: 'material',
        message: `New Request: ${req.user.name} requested ${quantity} ${finalUnit} of ${finalMaterialName}.`,
        link: '/admin/requests'
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, data: request });
});


// @desc    Get all material requests
// @route   GET /api/material-requests
// @access  Private
exports.getRequests = asyncHandler(async (req, res) => {
    let query = {};

    // If not admin, maybe only see own requests or project requests?
    //req.user.role === 'Admin'
    if (req.user.role !== 'Admin') {
        query = { requesterId: req.user._id };
    }

    const requests = await MaterialRequest.find(query)
        .populate('requesterId', 'name')
        .populate('projectId', 'name')
        .populate('materialId', 'name unit')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
});

// @desc    Update request status (Approve/Reject)
// @route   PATCH /api/material-requests/:id/status
// @access  Private (Admin)
exports.updateRequestStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;
    const { id } = req.params;

    const request = await MaterialRequest.findById(id).populate('materialId');
    if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    if (status === 'Rejected') {
        request.status = 'Rejected';
        request.adminNotes = adminNotes;
        await request.save();

        // Notify Requester
        await Notification.create({
            userId: request.requesterId,
            type: 'material',
            message: `Your request for ${request.materialId.name} was rejected.`,
        });

        return res.status(200).json({ success: true, data: request });
    }

    if (status === 'Approved') {
        if (request.materialId) {
            const depotMaterial = await Material.findById(request.materialId._id);
            if (depotMaterial) {
                if (depotMaterial.stockQuantity < request.quantity) {
                    return res.status(400).json({ success: false, message: 'Insufficient stock in Depot to approve.' });
                }
                // Decrement Depot ONLY if linked
                depotMaterial.stockQuantity -= request.quantity;
                await depotMaterial.save();
            }
        }
        // If no materialId (custom request), we just approve it (Admin explicitly approves procurement)

        request.status = 'Approved';
        request.adminNotes = adminNotes;
        await request.save();

        // Notify Requester
        await Notification.create({
            userId: request.requesterId,
            type: 'material',
            message: `Your request for ${request.materialName} was approved. Please confirm receipt upon arrival.`,
        });

        return res.status(200).json({ success: true, data: request });
    }


    return res.status(400).json({ success: false, message: 'Invalid status' });
});

// @desc    Receive material (Manager confirms)
// @route   POST /api/material-requests/:id/receive
// @access  Private (Manager)
exports.receiveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fs = require('fs');
    const logData = `[${new Date().toISOString()}] Receive Request ID: ${id}\nBody: ${JSON.stringify(req.body)}\nFiles: ${req.files ? req.files.length : 0}\n\n`;
    fs.appendFileSync('debug.log', logData);

    console.log(`[MaterialRequest] Receiving request ${id}`);
    console.log(`[MaterialRequest] Body:`, req.body);

    // Check for uploaded files (photos)
    const files = req.files || [];
    console.log(`[MaterialRequest] Files received: ${files.length}`);
    const deliveryProof = files.map(file => `/uploads/daily-reports/${file.filename}`);

    const request = await MaterialRequest.findById(id).populate('materialId');
    if (!request) {
        fs.appendFileSync('debug.log', `[${id}] Request NOT FOUND\n`);
        return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === 'Received') {
        return res.status(200).json({
            success: true,
            message: 'Request already received',
            data: request
        });
    }

    if (request.status !== 'Approved') {
        const errorMsg = `Le statut de la requête est '${request.status}' au lieu de 'Approved'. (ID: ${id})`;
        fs.appendFileSync('debug.log', `[${id}] Status Mismatch! returning 400. Current: ${request.status}\n`);
        console.log(`[MaterialRequest] ${errorMsg}`);
        return res.status(400).json({
            success: false,
            message: errorMsg
        });
    }

    const { receivedQuantity, source, receivedCost, deliveredBy } = req.body;
    const finalQuantity = receivedQuantity ? Number(receivedQuantity) : request.quantity;
    const finalSource = source || 'Depot';
    const finalCost = receivedCost ? Number(receivedCost) : 0;
    const finalDeliveredBy = deliveredBy || 'Unknown';
    const receptionDate = new Date();

    // 2. Add to Project Stock
    const matName = request.materialId ? request.materialId.name : request.materialName;
    const matUnit = request.materialId ? request.materialId.unit : (request.unit || 'pcs');
    const matPrice = request.materialId ? request.materialId.price : 0;
    const matCategory = request.materialId ? request.materialId.category : 'Consumable';
    const matSupplier = request.materialId ? request.materialId.supplier : 'Unknown';

    // Check if material already exists in project
    let projectMaterial = await Material.findOne({
        projectId: request.projectId,
        name: matName,
        unit: matUnit
    });

    if (projectMaterial) {
        projectMaterial.stockQuantity += finalQuantity;
        // Optionally update average price? For now just log history.
        await projectMaterial.save();
    } else {
        // Create new
        const newMat = await Material.create({
            projectId: request.projectId,
            name: matName,
            unit: matUnit,
            price: finalCost > 0 ? (finalCost / finalQuantity) : matPrice, // Estimate unit price if cost provided
            stockQuantity: finalQuantity,
            category: matCategory,
            supplier: matSupplier
        });
        projectMaterial = newMat;
    }

    // Update Request
    request.status = 'Received';
    request.deliveryProof = deliveryProof;
    request.receivedQuantity = finalQuantity;
    request.receivedCost = finalCost;
    request.source = finalSource;
    request.deliveredBy = finalDeliveredBy;
    request.receivedAt = receptionDate;
    await request.save();

    // Create Log
    const MaterialLog = require('../models/MaterialLog');
    await MaterialLog.create({
        materialId: projectMaterial._id,
        loggedBy: req.user._id,
        quantity: finalQuantity,
        cost: finalCost,
        type: 'IN',
        deliveredBy: finalDeliveredBy,
        date: receptionDate,
        notes: `Received from ${finalSource} (Req ID: ${id})`
    });

    fs.appendFileSync('debug.log', `[${id}] Success! Response sent.\n`);
    res.status(200).json({ success: true, data: request });
});

// @desc    Get requests by project
// @route   GET /api/material-requests/project/:projectId
// @access  Private
exports.getProjectRequests = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const requests = await MaterialRequest.find({ projectId })
        .populate('requesterId', 'name')
        .populate('materialId', 'name unit')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
});
