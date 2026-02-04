const mongoose = require('mongoose');
const MaterialRequest = require('./models/MaterialRequest');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.development' });

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        const id = '694a80aef7ba5a8708b8ead0';
        const req = await MaterialRequest.findById(id);
        console.log('ID:', req._id);
        console.log('STATUS:', req.status);
        console.log('DELIVERY PROOF:', req.deliveryProof);
        process.exit();
    })
    .catch(err => {
        process.exit(1);
    });
