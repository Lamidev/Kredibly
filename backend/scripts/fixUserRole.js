const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const fixUserRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");
        
        const email = "akinyemioluwaseunjunior@gmail.com";
        const user = await User.findOne({ email });
        
        if (user) {
            console.log(`Found user: ${user.name} (${user.email})`);
            console.log(`Current Role: ${user.role}`);
            
            user.role = "user";
            await user.save();
            
            console.log(`✅ Updated Role to: ${user.role}`);
        } else {
            console.log("❌ User not found");
        }
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixUserRole();
