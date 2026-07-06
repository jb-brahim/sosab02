const Notification = require('../models/Notification');
const Material = require('../models/Material');
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const User = require('../models/User');
const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@sosab.tn',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Create notification
exports.createNotification = async (userId, type, title, message, data = {}, link = '', priority = 'medium') => {
    try {
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

        const notification = await Notification.create({
            userId,
            type,
            title: emojiTitle,
            message,
            data,
            link,
            priority,
            read: false
        });

        // Send Push Notification only if Admin (Owner)
        const user = await User.findById(userId);
        if (user && user.role === 'Admin' && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            const payload = JSON.stringify({
                title: emojiTitle,
                body: message,
                link: link || '/',
                type: type,
                icon: '/logo.png' // Fallback handled by sw.js custom logic
            });

            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification(sub, payload);
                } catch (error) {
                    console.error('Error sending push notification:', error);
                    // Optionally remove invalid subscription
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                        await user.save();
                    }
                }
            }
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Check low stock and create notifications
exports.checkLowStock = async () => {
    try {
        const lowStockThreshold = 10;
        const materials = await Material.find({ stockQuantity: { $lt: lowStockThreshold } })
            .populate('projectId', 'name managers');

        for (const material of materials) {
            if (material.projectId && material.projectId.managers && material.projectId.managers.length > 0) {
                for (const managerId of material.projectId.managers) {
                    await exports.createNotification(
                        managerId,
                        'low_stock',
                        'Stock Faible',
                        `${material.name} est en stock faible: ${material.stockQuantity} ${material.unit}`,
                        { materialId: material._id, projectId: material.projectId._id },
                        `/materials/${material.projectId._id}`,
                        'high'
                    );
                }
            }
        }

        return { checked: materials.length };
    } catch (error) {
        console.error('Error checking low stock:', error);
        throw error;
    }
};

// Check worker absences and create notifications
exports.checkWorkerAbsences = async (date = new Date()) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const absences = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            present: false
        }).populate('workerId', 'name')
            .populate('projectId', 'name managers');

        for (const absence of absences) {
            if (absence.projectId && absence.projectId.managers && absence.projectId.managers.length > 0) {
                for (const managerId of absence.projectId.managers) {
                    await exports.createNotification(
                        managerId,
                        'worker_absence',
                        'Absence Ouvrier',
                        `${absence.workerId.name} est absent aujourd'hui`,
                        { workerId: absence.workerId._id, projectId: absence.projectId._id },
                        `/attendance/${absence.projectId._id}`,
                        'medium'
                    );
                }
            }
        }

        return { checked: absences.length };
    } catch (error) {
        console.error('Error checking absences:', error);
        throw error;
    }
};

//  Notify about report ready
exports.notifyReportReady = async (userId, reportType, projectName, reportId) => {
    await exports.createNotification(
        userId,
        'report_ready',
        'Rapport Prêt',
        `Le rapport ${reportType} pour ${projectName} est prêt à télécharger`,
        { reportId },
        `/reports/${reportId}`,
        'low'
    );
};

// Notify task assignment
exports.notifyTaskAssigned = async (userId, taskName, projectName) => {
    await exports.createNotification(
        userId,
        'task_assigned',
        'Nouvelle Tâche',
        `Vous avez été assigné à la tâche: ${taskName} dans ${projectName}`,
        {},
        '/tasks',
        'medium'
    );
};

// Notify salary approved
exports.notifySalaryApproved = async (userId, amount, week) => {
    await exports.createNotification(
        userId,
        'salary_approved',
        'Salaire Approuvé',
        `Votre salaire de ${amount} TND pour la semaine ${week} a été approuvé`,
        { week, amount },
        '/salary',
        'high'
    );
};

module.exports = exports;
