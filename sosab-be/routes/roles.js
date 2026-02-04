const express = require('express');
const router = express.Router();
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication and Admin role
router.use(protect);
router.use(authorize('Admin'));

router
  .route('/')
  .post(logAction('create', 'Role'), createRole)
  .get(getRoles);

router
  .route('/:id')
  .get(getRole)
  .patch(logAction('update', 'Role'), updateRole)
  .delete(logAction('delete', 'Role'), deleteRole);

module.exports = router;

