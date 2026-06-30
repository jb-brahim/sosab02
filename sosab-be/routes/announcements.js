const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  dismissAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(authorize('Admin'), logAction('create', 'Announcement'), createAnnouncement)
  .get(getAnnouncements);

router
  .route('/:id')
  .delete(authorize('Admin'), logAction('delete', 'Announcement'), deleteAnnouncement);

router
  .route('/:id/dismiss')
  .post(dismissAnnouncement);

module.exports = router;
