const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");

        const email = "admin@test.com";
        const password = "AdminPass123!";

        // Delete previous 'bad' attempt to allow clean recreate
        await User.deleteOne({ email });

        await User.create({
            name: "Super Admin",
            email: email,
            password: password, // PASS PLAIN TEXT - the model hook will hash it once
            isVerified: true,
            role: "admin"
        });

        console.log("\n🚀 TEST ADMIN CREATED SUCCESSFULLY!");
        console.log("----------------------------------");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log("----------------------------------\n");
        
        process.exit();
    } catch (err) {
        console.error("Error creating admin:", err.message);
        process.exit(1);
    }
};

createAdmin();
