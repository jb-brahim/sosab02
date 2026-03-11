const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  createNotification,
  subscribe
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

router
  .route('/subscribe')
  .post(subscribe);

module.exports = router;

