const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectHistory,
  getProjectTeam
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');
const {
  validateProjectCreate,
  validateProjectUpdate,
  validateGetProjectById,
  validateDeleteProject
} = require('../middleware/validators');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(
    authorize('Admin'),
    validateProjectCreate,
    logAction('create', 'Project'),
    createProject
  )
  .get(getProjects);

router
  .route('/:id')
  .get(validateGetProjectById, getProject)
  .patch(
    validateProjectUpdate,
    logAction('update', 'Project'),
    updateProject
  )
  .delete(
    deleteProject
  );

router
  .route('/:id/history')
  .get(getProjectHistory);

router
  .route('/:id/team')
  .get(getProjectTeam);

module.exports = router;

