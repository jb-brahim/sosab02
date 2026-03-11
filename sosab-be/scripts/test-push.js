const mongoose = require('mongoose');
const webpush = require('web-push');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.development') });

const User = require('../models/User');

const testPush = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        webpush.setVapidDetails(
            'mailto:admin@sosab.tn',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const gerants = await User.find({ role: 'Gérant' });
        console.log(`Found ${gerants.length} Gérants`);

        for (const user of gerants) {
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                console.log(`Sending to ${user.name}...`);
                const payload = JSON.stringify({
                    title: 'Test Notification',
                    body: 'This is a test push notification from SOSAB!',
                    link: '/',
                    icon: '/logo.png'
                });

                for (const sub of user.pushSubscriptions) {
                    try {
                        await webpush.sendNotification(sub, payload);
                        console.log('Sent successfully');
                    } catch (err) {
                        console.error('Failed to send for one subscription:', err.statusCode);
                    }
                }
            } else {
                console.log(`User ${user.name} has no subscriptions`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testPush();
