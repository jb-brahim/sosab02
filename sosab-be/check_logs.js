const mongoose = require('mongoose');
const MaterialLog = require('./models/MaterialLog');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.development' });

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        const id = '694a80aef7ba5a8708b8ead0';
        const logs = await MaterialLog.find({ notes: new RegExp(id) });
        console.log('LOGS FOUND:', logs.length);
        logs.forEach(l => {
            console.log(`Type: ${l.type} | Qty: ${l.quantity} | DeliveredBy: ${l.deliveredBy} | Date: ${l.date}`);
        });
        process.exit();
    })
    .catch(err => {
        process.exit(1);
    });
