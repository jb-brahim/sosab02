const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(logAction('create', 'Task'), createTask)
  .get(getTasks); // Allow fetching all tasks (or filtered by user)

router
  .route('/:projectId')
  .get(getTasks);

router
  .route('/:id')
  .patch(logAction('update', 'Task'), updateTask)
  .delete(logAction('delete', 'Task'), deleteTask);

module.exports = router;

