const express = require('express');
const router = express.Router();
const {
  addSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(authorize('Admin', 'Warehouse Manager'), logAction('create', 'Supplier'), addSupplier)
  .get(getSuppliers);

router
  .route('/:id')
  .get(getSupplier)
  .patch(authorize('Admin', 'Warehouse Manager'), logAction('update', 'Supplier'), updateSupplier)
  .delete(authorize('Admin'), logAction('delete', 'Supplier'), deleteSupplier);

module.exports = router;

