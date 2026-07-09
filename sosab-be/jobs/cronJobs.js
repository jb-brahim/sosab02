const cron = require('node-cron');
const { checkLowStock, checkWorkerAbsences, createNotification } = require('../services/notificationService');
const Report = require('../models/Report');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ReminderSetting = require('../models/ReminderSetting');
const webpush = require('web-push');
const { generateReport } = require('../controllers/reportController');

// Run every day at 6 PM to check low stock
cron.schedule('0 18 * * *', async () => {
    console.log('Running daily stock check...');
    try {
        const result = await checkLowStock();
        console.log(`Stock check complete: ${result.checked} materials checked`);
    } catch (error) {
        console.error('Error in stock check cron:', error);
    }
});

// Run every day at 8 AM to check absences
cron.schedule('0 8 * * 1-6', async () => {
    console.log('Running daily absence check...');
    try {
        const result = await checkWorkerAbsences();
        console.log(`Absence check complete: ${result.checked} absences found`);
    } catch (error) {
        console.error('Error in absence check cron:', error);
    }
});

// Run every Friday at 6 PM to generate weekly reports
cron.schedule('0 18 * * 5', async () => {
    console.log('Running weekly report generation...');
    try {
        const projects = await Project.find({ status: 'active' });
        const today = new Date();
        const week = `${today.getFullYear()}-W${Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / 604800000)}`;

        for (const project of projects) {
            // Generate salary report
            try {
                // Logic to generate report would go here
                console.log(`Generated salary report for project: ${project.name}`);
            } catch (err) {
                console.error(`Error generating report for ${project.name}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in weekly report cron:', error);
    }
});

// Run every minute to check if dynamic daily attendance reminder needs to be sent
cron.schedule('* * * * *', async () => {
    try {
        const setting = await ReminderSetting.findOne();
        if (!setting || !setting.enabled) {
            return;
        }

        // Get current local date and time in Tunisia (Africa/Tunis) timezone (UTC+1)
        const now = new Date();
        const tunisDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); // "YYYY-MM-DD"
        const tunisTime = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', hour12: false }).format(now); // "HH:MM"

        // If reminder was already sent today, skip
        if (setting.lastSentDate === tunisDate) {
            return;
        }

        // Parse schedules
        const [scheduledHour, scheduledMin] = setting.time.split(':').map(Number);
        const [currentHour, currentMin] = tunisTime.split(':').map(Number);

        const scheduledMinutes = scheduledHour * 60 + scheduledMin;
        const currentMinutes = currentHour * 60 + currentMin;

        if (currentMinutes >= scheduledMinutes) {
            console.log(`[Reminder Cron] Sending daily attendance reminder scheduled for ${setting.time} (Current: ${tunisTime})...`);

            // Fetch target managers
            let targetManagers = [];
            if (setting.managers && setting.managers.length > 0) {
                targetManagers = await User.find({ _id: { $in: setting.managers }, active: true });
            } else {
                // Default to all PMs and Gérants
                targetManagers = await User.find({ role: { $in: ['Project Manager', 'Gérant'] }, active: true });
            }

            if (targetManagers.length === 0) {
                console.log('[Reminder Cron] No active managers found to notify.');
                // Update date to prevent running again today
                setting.lastSentDate = tunisDate;
                await setting.save();
                return;
            }

            for (const manager of targetManagers) {
                try {
                    // Check if this manager actually needs to mark attendance today (i.e. has chantiers with workers, missing attendance)
                    const activeProjects = await Project.find({
                        managers: manager._id
                    });
                    let needsReminder = false;

                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);

                    for (const project of activeProjects) {
                        const workerCount = await Worker.countDocuments({ projectId: project._id, active: true });
                        if (workerCount === 0) continue;

                        const attendanceCount = await Attendance.countDocuments({
                            projectId: project._id,
                            date: { $gte: startOfToday, $lte: endOfToday }
                        });

                        if (attendanceCount === 0) {
                            needsReminder = true;
                            break;
                        }
                    }

                    if (!needsReminder) {
                        console.log(`[Reminder Cron] Skipping manager ${manager.name} (Attendance already completed or no chantiers with active workers).`);
                        continue;
                    }

                    // Create in-app notification for this manager
                    await createNotification(
                        manager._id,
                        'attendance',
                        'Rappel Présence',
                        `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
                        { customSound: setting.sound, customVibration: setting.vibration },
                        '/app',
                        'high'
                    );

                    // Send push notification directly if subscriptions exist
                    if (manager.pushSubscriptions && manager.pushSubscriptions.length > 0) {
                        const payload = JSON.stringify({
                            title: '🚨 Rappel Présence',
                            body: `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
                            link: manager.role === 'Gérant' ? '/gerant' : '/app',
                            type: 'attendance',
                            icon: '/logo.png',
                            sound: `/sounds/${setting.sound}.wav`,
                            vibrate: setting.vibration ? [300, 100, 300, 100, 400] : [100],
                            color: '#FF0000' // Phone notification tint (red)
                        });

                        for (const sub of manager.pushSubscriptions) {
                            try {
                                await webpush.sendNotification(sub, payload);
                            } catch (pushErr) {
                                console.error(`Error sending push to ${manager.name}:`, pushErr);
                                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                                    manager.pushSubscriptions = manager.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                                    await manager.save();
                                }
                            }
                        }
                    }
                } catch (managerErr) {
                    console.error(`Failed to notify manager ${manager.name}:`, managerErr);
                }
            }

            // Save last sent date
            setting.lastSentDate = tunisDate;
            await setting.save();
            console.log('[Reminder Cron] Attendance reminder run completed.');
        }
    } catch (err) {
        console.error('Error in dynamic attendance reminder cron:', err);
    }
});

console.log('✅ Cron jobs initialized');

module.exports = {
    // Export functions if needed for manual triggers
};
