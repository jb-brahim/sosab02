const Notification = require('../models/Notification');
const User = require('../models/User');
const ReminderSetting = require('../models/ReminderSetting');
const asyncHandler = require('../middleware/asyncHandler');
const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@sosab.tn',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Helper to send push to Gérant
const sendPushToGerant = async (userId, title, message, link) => {
  try {
    const user = await User.findById(userId);
    if (user && user.role === 'Gérant' && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title,
        body: message,
        link: link || '/',
        icon: '/logo.png'
      });

      for (const sub of user.pushSubscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
            await user.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('Push error:', err);
  }
};

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
    link,
    title: req.body.title || 'Notification'
  });

  // Send push
  await sendPushToGerant(userId, req.body.title || 'Notification', message, link);

  res.status(201).json({
    success: true,
    data: notification
  });
});

// @desc    Send notification to users with specific roles
// @access  Internal
exports.sendNotificationToRoles = async (roles, type, message, link, title = 'Alerte Système') => {
  try {
    const users = await User.find({ role: { $in: roles }, active: true });
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      userId: user._id,
      type,
      message,
      link,
      title
    }));

    await Notification.insertMany(notifications);

    // Send push to each user if they are Gérant
    for (const user of users) {
      if (user.role === 'Gérant') {
        await sendPushToGerant(user._id, title, message, link);
      }
    }
  } catch (error) {
    console.error('Error sending role-based notifications:', error);
  }
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
exports.subscribe = asyncHandler(async (req, res) => {
  const subscription = req.body;

  // Find user and update subscriptions
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check if subscription already exists
  const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);

  if (!exists) {
    user.pushSubscriptions.push(subscription);
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Push subscription registered'
  });
});

// @desc    Get attendance reminder settings
// @route   GET /api/notifications/reminder-setting
// @access  Private/Admin
exports.getReminderSetting = asyncHandler(async (req, res) => {
  let setting = await ReminderSetting.findOne();
  
  if (!setting) {
    setting = await ReminderSetting.create({
      enabled: true,
      time: '10:00',
      managers: [],
      sound: 'default',
      vibration: true
    });
  }

  res.status(200).json({
    success: true,
    data: setting
  });
});

// @desc    Update attendance reminder settings
// @route   POST /api/notifications/reminder-setting
// @access  Private/Admin
exports.updateReminderSetting = asyncHandler(async (req, res) => {
  const { enabled, time, managers, sound, vibration } = req.body;

  let setting = await ReminderSetting.findOne();

  if (!setting) {
    setting = new ReminderSetting({});
  }

  if (enabled !== undefined) setting.enabled = enabled;
  if (time !== undefined) setting.time = time;
  if (managers !== undefined) setting.managers = managers;
  if (sound !== undefined) setting.sound = sound;
  if (vibration !== undefined) setting.vibration = vibration;
  setting.updatedAt = Date.now();

  await setting.save();

  res.status(200).json({
    success: true,
    data: setting,
    message: 'Paramètres mis à jour avec succès'
  });
});
