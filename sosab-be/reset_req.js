const mongoose = require('mongoose');
const MaterialRequest = require('./models/MaterialRequest');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.development' });

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        const id = '694a80aef7ba5a8708b8ead0';
        await MaterialRequest.findByIdAndUpdate(id, { status: 'Approved', deliveryProof: [] });
        console.log('RESET SUCCESS for', id);
        process.exit();
    })
    .catch(err => {
        process.exit(1);
    });
