const express = require('express');
const router = express.Router();
const {
  generateReport,
  getReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/generate')
  .post(logAction('create', 'Report'), generateReport);

router
  .route('/')
  .get(getReport);

router
  .route('/:id')
  .delete(require('../controllers/reportController').deleteReport);

module.exports = router;

