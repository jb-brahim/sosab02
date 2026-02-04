const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests,
    updateRequestStatus,
    getProjectRequests,
    receiveRequest
} = require('../controllers/materialRequestController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');
const { uploadDailyReportPhotos, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router
    .route('/')
    .post(createRequest)
    .get(getRequests);

router
    .route('/project/:projectId')
    .get(getProjectRequests);


router
    .route('/:id/status')
    .patch(logAction('update', 'MaterialRequest'), updateRequestStatus);

router
    .route('/:id/receive')
    .post(uploadDailyReportPhotos, handleUploadError, logAction('update', 'MaterialRequest'), receiveRequest);

module.exports = router;
