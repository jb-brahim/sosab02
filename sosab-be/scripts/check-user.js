const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.development' });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'admin@sosab.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
        } else {
            console.log('User admin@sosab.com not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
