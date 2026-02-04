const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  createNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router
  .route('/:userId')
  .get(getNotifications);

router
  .route('/:id/read')
  .patch(markAsRead);

router
  .route('/')
  .post(authorize('Admin'), createNotification);

module.exports = router;

