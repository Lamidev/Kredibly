const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");
        
        const users = await User.find({});
        console.log(`Total Users found: ${users.length}`);
        
        users.forEach(u => {
            console.log(`- ${u.email} [Role: ${u.role}] [Verified: ${u.isVerified}]`);
        });
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
