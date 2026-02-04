const Notification = require('../models/Notification');
const Material = require('../models/Material');
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');

// Create notification
exports.createNotification = async (userId, type, title, message, data = {}, link = '', priority = 'medium') => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            data,
            link,
            priority,
            read: false
        });

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
            .populate('projectId', 'name managerId');

        for (const material of materials) {
            if (material.projectId && material.projectId.managerId) {
                await exports.createNotification(
                    material.projectId.managerId,
                    'low_stock',
                    'Stock Faible',
                    `${material.name} est en stock faible: ${material.stockQuantity} ${material.unit}`,
                    { materialId: material._id, projectId: material.projectId._id },
                    `/materials/${material.projectId._id}`,
                    'high'
                );
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
            .populate('projectId', 'name managerId');

        for (const absence of absences) {
            if (absence.projectId && absence.projectId.managerId) {
                await exports.createNotification(
                    absence.projectId.managerId,
                    'worker_absence',
                    'Absence Ouvrier',
                    `${absence.workerId.name} est absent aujourd'hui`,
                    { workerId: absence.workerId._id, projectId: absence.projectId._id },
                    `/attendance/${absence.projectId._id}`,
                    'medium'
                );
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
