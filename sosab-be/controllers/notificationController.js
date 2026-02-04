const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get notifications for user
// @route   GET /api/notifications/:userId
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user is accessing their own notifications or is Admin
  if (req.user._id.toString() !== userId && req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these notifications'
    });
  }

  const { read, limit = 50 } = req.query;
  let query = { userId };

  if (read !== undefined) {
    query.read = read === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns this notification or is Admin
  if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this notification'
    });
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Create notification (helper function for other controllers)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res) => {
  const { userId, type, message, link } = req.body;

  const notification = await Notification.create({
    userId,
    type,
    message,
    link
  });

  res.status(201).json({
    success: true,
    data: notification
  });
});

