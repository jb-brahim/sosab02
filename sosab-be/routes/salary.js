const express = require('express');
const router = express.Router();
const {
  getWeeklySalary,
  approveSalary
} = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/:projectId/:week')
  .get(getWeeklySalary);

router
  .route('/:id/approve')
  .patch(authorize('Accountant', 'Admin'), logAction('approve', 'Salary'), approveSalary);

module.exports = router;

