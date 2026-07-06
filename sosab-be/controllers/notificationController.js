const Notification = require('../models/Notification');
const User = require('../models/User');
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

// Helper to send push to Admin (Owner)
const sendPushToAdmin = async (userId, title, message, link, type = 'system') => {
  try {
    const user = await User.findById(userId);
    if (user && user.role === 'Admin' && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      // Emoji map based on notification type
      const emojiMap = {
        'low_stock': '⚠️',
        'stock': '⚠️',
        'worker_absence': '📅',
        'attendance': '📅',
        'report_ready': '📊',
        'task_assigned': '📋',
        'salary_approved': '💰',
        'security': '🔒',
        'system': '⚙️'
      };

      let emojiTitle = title;
      const emoji = emojiMap[type] || emojiMap[type.toLowerCase()] || '';
      if (emoji && !title.startsWith(emoji)) {
        emojiTitle = `${emoji} ${title}`;
      }

      const payload = JSON.stringify({
        title: emojiTitle,
        body: message,
        link: link || '/',
        type,
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
  const title = req.body.title || 'Notification';

  // Emoji map based on notification type
  const emojiMap = {
    'low_stock': '⚠️',
    'stock': '⚠️',
    'worker_absence': '📅',
    'attendance': '📅',
    'report_ready': '📊',
    'task_assigned': '📋',
    'salary_approved': '💰',
    'security': '🔒',
    'system': '⚙️'
  };

  let emojiTitle = title;
  const emoji = emojiMap[type] || emojiMap[type?.toLowerCase()] || '';
  if (emoji && !title.startsWith(emoji)) {
    emojiTitle = `${emoji} ${title}`;
  }

  const notification = await Notification.create({
    userId,
    type,
    message,
    link,
    title: emojiTitle
  });

  // Send push
  await sendPushToAdmin(userId, emojiTitle, message, link, type);

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

    // Emoji map based on notification type
    const emojiMap = {
      'low_stock': '⚠️',
      'stock': '⚠️',
      'worker_absence': '📅',
      'attendance': '📅',
      'report_ready': '📊',
      'task_assigned': '📋',
      'salary_approved': '💰',
      'security': '🔒',
      'system': '⚙️'
    };

    let emojiTitle = title;
    const emoji = emojiMap[type] || emojiMap[type?.toLowerCase()] || '';
    if (emoji && !title.startsWith(emoji)) {
      emojiTitle = `${emoji} ${title}`;
    }

    const notifications = users.map(user => ({
      userId: user._id,
      type,
      message,
      link,
      title: emojiTitle
    }));

    await Notification.insertMany(notifications);

    // Send push to each user if they are Admin (Owner)
    for (const user of users) {
      if (user.role === 'Admin') {
        await sendPushToAdmin(user._id, emojiTitle, message, link, type);
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
