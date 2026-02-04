const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication and Admin role
router.use(protect);
router.use(authorize('Admin'));

router
  .route('/')
  .post(logAction('create', 'User'), createUser)
  .get(getUsers);

router
  .route('/:id')
  .get(getUser)
  .patch(logAction('update', 'User'), updateUser)
  .delete(logAction('delete', 'User'), deleteUser);

module.exports = router;

