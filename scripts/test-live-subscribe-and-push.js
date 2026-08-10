const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'sosab-be', '.env.production') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '..', 'sosab-be', '.env') });
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB');
    const db = mongoose.connection.db;

    const houcine = await db.collection('users').findOne({
        $or: [
            { name: { $regex: /houcine/i } },
            { email: { $regex: /houcine/i } }
        ]
    });

    if (!houcine) {
        console.error('❌ Houcine user not found in DB!');
        process.exit(1);
    }

    console.log(`Houcine user ID: ${houcine._id}`);
    console.log(`Push subscriptions count: ${houcine.pushSubscriptions ? houcine.pushSubscriptions.length : 0}`);

    if (houcine.pushSubscriptions && houcine.pushSubscriptions.length > 0) {
        houcine.pushSubscriptions.forEach((sub, idx) => {
            console.log(`[Sub ${idx + 1}] Endpoint: ${sub.endpoint ? sub.endpoint.substring(0, 60) : 'none'}...`);
        });
    } else {
        console.warn('⚠️ Houcine has 0 push subscriptions saved in MongoDB currently!');
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
