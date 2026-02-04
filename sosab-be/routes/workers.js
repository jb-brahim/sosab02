const express = require('express');
const router = express.Router();
const {
  addWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
  getAllWorkers
} = require('../controllers/workerController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');
const {
  validateWorkerCreate,
  validateWorkerUpdate,
  validateGetWorkersByProject,
  sanitizeWorkerData
} = require('../middleware/validators');

// All routes require authentication
router.use(protect);

// DEBUG LOGGING
router.use((req, res, next) => {
  console.log(`[WORKER ROUTE] Method: ${req.method}, Path: ${req.path}`);
  next();
});

router.get('/admin/all', getAllWorkers);

// Specific resource routes first
router
  .route('/')
  .get(getAllWorkers)
  .post(
    validateWorkerCreate,
    sanitizeWorkerData,
    logAction('create', 'Worker'),
    addWorker
  );

router
  .route('/:id')
  .patch(
    validateWorkerUpdate,
    sanitizeWorkerData,
    logAction('update', 'Worker'),
    updateWorker
  )
  .delete(deleteWorker);

router
  .route('/:projectId')
  .get(validateGetWorkersByProject, getWorkers);

module.exports = router;

