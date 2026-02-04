const mongoose = require('mongoose');
const MaterialRequest = require('./models/MaterialRequest');
const dotenv = require('dotenv');
dotenv.config();

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sosab';

mongoose.connect(dbUri)
    .then(async () => {
        const id = '694a80aef7ba5a8708b8ead0';
        const req = await MaterialRequest.findById(id);
        if (!req) {
            console.log('Request not found');
        } else {
            console.log('STATUS:', req.status);
            console.log('BODY:', JSON.stringify(req, null, 2));
        }
        process.exit();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
