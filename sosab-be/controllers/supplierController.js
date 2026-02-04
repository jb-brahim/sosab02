const Supplier = require('../models/Supplier');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Add supplier
// @route   POST /api/suppliers
// @access  Private/Admin or Warehouse Manager
exports.addSupplier = asyncHandler(async (req, res) => {
  const { name, contact, rating, notes } = req.body;

  const supplier = await Supplier.create({
    name,
    contact: contact || {},
    rating: rating || 0,
    notes
  });

  res.status(201).json({
    success: true,
    data: supplier
  });
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ active: true })
    .populate('materialsSupplied', 'name unit price');

  res.status(200).json({
    success: true,
    count: suppliers.length,
    data: suppliers
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('materialsSupplied');

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  res.status(200).json({
    success: true,
    data: supplier
  });
});

// @desc    Update supplier
// @route   PATCH /api/suppliers/:id
// @access  Private/Admin or Warehouse Manager
exports.updateSupplier = asyncHandler(async (req, res) => {
  const { name, contact, rating, notes, active } = req.body;

  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  if (name) supplier.name = name;
  if (contact) supplier.contact = contact;
  if (rating !== undefined) supplier.rating = rating;
  if (notes) supplier.notes = notes;
  if (active !== undefined) supplier.active = active;
  supplier.updatedAt = new Date();

  await supplier.save();

  res.status(200).json({
    success: true,
    data: supplier
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
exports.deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  supplier.active = false;
  await supplier.save();

  res.status(200).json({
    success: true,
    message: 'Supplier disabled successfully'
  });
});

