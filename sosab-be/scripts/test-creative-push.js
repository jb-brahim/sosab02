const mongoose = require('mongoose');
const webpush = require('web-push');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.development') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const User = require('../models/User');

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

const testPush = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('Error: MONGODB_URI is not set in environment.');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.error('Error: VAPID keys not configured in environment.');
            await mongoose.disconnect();
            process.exit(1);
        }

        webpush.setVapidDetails(
            'mailto:admin@sosab.tn',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        // Find users (Admins or Gérants) who have push subscriptions
        const users = await User.find({
            $or: [{ role: 'Gérant' }, { role: 'Admin' }],
            pushSubscriptions: { $exists: true, $not: { $size: 0 } }
        });

        console.log(`Found ${users.length} users with push subscriptions`);

        if (users.length === 0) {
            console.log('No users with push subscriptions found. Displaying mock payloads:');
            const sampleTypes = ['low_stock', 'worker_absence', 'report_ready', 'task_assigned', 'salary_approved', 'security'];
            sampleTypes.forEach(type => {
                const title = 'Alerte Test';
                const emoji = emojiMap[type] || '';
                const emojiTitle = emoji ? `${emoji} ${title}` : title;
                console.log(`\n--- Type: ${type} ---`);
                console.log(JSON.stringify({
                    title: emojiTitle,
                    body: `Ceci est un message de test pour le type ${type}`,
                    link: `/test-${type}`,
                    type: type,
                    icon: '/logo.png'
                }, null, 2));
            });
            await mongoose.disconnect();
            return;
        }

        // Send a test notification of type 'security' to the first user
        const targetUser = users[0];
        console.log(`Sending test creative notification to ${targetUser.name} (${targetUser.role})...`);

        const type = 'security';
        const rawTitle = 'Mise à jour de sécurité';
        const emoji = emojiMap[type] || '';
        const title = emoji ? `${emoji} ${rawTitle}` : rawTitle;

        const payload = JSON.stringify({
            title,
            body: `Propriétaire SOSAB a réinitialisé le mot de passe de ${targetUser.name}.`,
            link: '/owner/logs',
            type,
            icon: '/logo.png'
        });

        for (const sub of targetUser.pushSubscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
                console.log('Sent creative test notification successfully!');
            } catch (err) {
                console.error('Failed to send for subscription:', err.statusCode);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error in test push:', err);
    }
};

testPush();
