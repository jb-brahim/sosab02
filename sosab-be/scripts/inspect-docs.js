const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const sampleAttendance = await db.collection('attendances').findOne({});
    const sampleSalary = await db.collection('salaries').findOne({});
    
    console.log('Sample Attendance Doc:\n', JSON.stringify(sampleAttendance, null, 2));
    console.log('\nSample Salary Doc:\n', JSON.stringify(sampleSalary, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
