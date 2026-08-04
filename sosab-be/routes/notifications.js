const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  createNotification,
  subscribe,
  getReminderSetting,
  updateReminderSetting,
  triggerTestReminder
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Specific routes first
router
  .route('/test-reminder')
  .post(authorize('Admin'), triggerTestReminder);

router
  .route('/reminder-setting')
  .get(authorize('Admin'), getReminderSetting)
  .post(authorize('Admin'), updateReminderSetting);

router
  .route('/subscribe')
  .post(subscribe);

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

