const User = require('./models/User');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

// Fix for DNS resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('MongoDB Connected for Atlas Admin Creation');

        await User.deleteMany(); // Clear existing users

        const user = await User.create({
            username: 'admin',
            password: 'admin123'
        });

        console.log('Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin123');

        process.exit();
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
