const mongoose = require('mongoose');
const MaterialRequest = require('./models/MaterialRequest');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.development' });

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        const requests = await MaterialRequest.find().sort({ createdAt: -1 }).limit(10);
        const out = requests.map(r => ({
            id: r._id,
            name: r.materialName,
            status: r.status,
            createdAt: r.createdAt
        }));
        process.stdout.write(JSON.stringify(out, null, 2));
        process.exit();
    })
    .catch(err => {
        process.exit(1);
    });
