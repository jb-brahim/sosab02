const Notification = require('../models/Notification');
const User = require('../models/User');
const ReminderSetting = require('../models/ReminderSetting');
const asyncHandler = require('../middleware/asyncHandler');
const webpush = require('web-push');
const mongoose = require('mongoose');

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

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res) => {
  const { userId, type, message, link } = req.body;
  const title = req.body.title || 'Notification';

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
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Subscription payload is required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!user.pushSubscriptions) {
    user.pushSubscriptions = [];
  }

  user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
  user.pushSubscriptions.push(subscription);

  if (user.pushSubscriptions.length > 3) {
    user.pushSubscriptions = user.pushSubscriptions.slice(-3);
  }

  await user.save();
  console.log(`[PushSubscribe] Registered fresh push token for ${user.name} (${user.pushSubscriptions.length} active device tokens)`);

  res.status(200).json({
    success: true,
    message: 'Push subscription registered',
    activeCount: user.pushSubscriptions.length
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
      projects: [],
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
  const { enabled, time, managers, projects, sound, vibration, requireGps, gpsTargetType, gpsManagers } = req.body;

  let setting = await ReminderSetting.findOne();

  if (!setting) {
    setting = new ReminderSetting({});
  }

  if (enabled !== undefined) setting.enabled = enabled;
  if (time !== undefined) setting.time = time;
  if (managers !== undefined) setting.managers = managers;
  if (projects !== undefined) setting.projects = projects;
  if (sound !== undefined) setting.sound = sound;
  if (vibration !== undefined) setting.vibration = vibration;
  if (requireGps !== undefined) setting.requireGps = requireGps;
  if (gpsTargetType !== undefined) setting.gpsTargetType = gpsTargetType;
  if (gpsManagers !== undefined) setting.gpsManagers = gpsManagers;
  setting.updatedAt = Date.now();

  await setting.save();

  res.status(200).json({
    success: true,
    data: setting,
    message: 'Paramètres mis à jour avec succès'
  });
});

// @desc    Trigger instant test attendance reminder to selected managers
// @route   POST /api/notifications/test-reminder
// @access  Private/Admin
exports.triggerTestReminder = asyncHandler(async (req, res) => {
  const setting = await ReminderSetting.findOne();

  let targetManagers = [];
  if (setting && setting.managers && setting.managers.length > 0) {
    const objectIds = setting.managers.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id;
      }
    });
    targetManagers = await User.find({
      $or: [
        { _id: { $in: objectIds } },
        { _id: { $in: setting.managers } }
      ]
    });
  }

  if (!targetManagers || targetManagers.length === 0) {
    targetManagers = await User.find({ role: { $in: ['Project Manager', 'Gérant'] } });
  }

  if (targetManagers.length === 0) {
    return res.status(400).json({ success: false, message: 'Aucun gestionnaire actif ciblé' });
  }

  let pushSentCount = 0;
  const notifiedNames = [];

  for (const manager of targetManagers) {
    try {
      notifiedNames.push(manager.name);

      // In-app notification
      await Notification.create({
        user: manager._id,
        type: 'attendance',
        title: '🚨 Rappel Présence (TEST INSTANTANÉ)',
        message: `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
        data: { customSound: setting ? setting.sound : 'default', customVibration: setting ? setting.vibration : true },
        link: manager.role === 'Gérant' ? '/gerant' : '/app',
        priority: 'high'
      });

      // Web Push notification
      if (manager.pushSubscriptions && manager.pushSubscriptions.length > 0) {
        const payload = JSON.stringify({
          title: '🚨 Rappel Présence (TEST INSTANTANÉ)',
          body: `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
          link: manager.role === 'Gérant' ? '/gerant' : '/app',
          type: 'attendance',
          icon: '/logo.png',
          badge: '/badge.png',
          sound: `/sounds/${setting ? setting.sound : 'default'}.wav`,
          vibrate: setting && setting.vibration ? [500, 200, 500, 200, 500, 200, 1000] : [200],
          color: '#FF0000',
          renotify: true,
          requireInteraction: true
        });

        const options = {
          TTL: 86400,
          headers: {
            Urgency: 'high'
          }
        };

        for (const sub of manager.pushSubscriptions) {
          try {
            await webpush.sendNotification(sub, payload, options);
            pushSentCount++;
          } catch (pushErr) {
            console.error(`Push failed for ${manager.name}:`, pushErr.statusCode || pushErr.message);
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              manager.pushSubscriptions = manager.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
              await manager.save();
            }
          }
        }
      }
    } catch (mErr) {
      console.error(`Error sending test reminder to ${manager.name}:`, mErr);
    }
  }

  if (setting) {
    setting.lastSentDate = '';
    await setting.save();
  }

  res.status(200).json({
    success: true,
    message: `Rappel de test envoyé à ${notifiedNames.join(', ')} (${pushSentCount} push envoyée(s))!`,
    sentCount: pushSentCount,
    managers: notifiedNames
  });
});
