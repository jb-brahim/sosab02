const express = require('express');
const router = express.Router();
const {
    createDailyReport,
    getDailyReports,
    getDailyReport,
    updateDailyReport,
    deleteDailyReport
} = require('../controllers/dailyReportController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');
const { uploadDailyReportPhotos, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router
    .route('/')
    .post(uploadDailyReportPhotos, handleUploadError, logAction('create', 'DailyReport'), createDailyReport);

router
    .route('/:projectId')
    .get(getDailyReports);

router
    .route('/report/:id')
    .get(getDailyReport)
    .patch(logAction('update', 'DailyReport'), updateDailyReport)
    .delete(logAction('delete', 'DailyReport'), deleteDailyReport);

module.exports = router;
