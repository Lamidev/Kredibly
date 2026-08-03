/**
 * Detailed Breakdown of all Users in the DB
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");

const checkAllUsers = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        
        const allUsers = await User.find({ role: "user" });
        const allProfiles = await BusinessProfile.find({});

        const verifiedCount = allUsers.filter(u => u.isVerified).length;
        const unverifiedCount = allUsers.filter(u => !u.isVerified).length;

        const usersWithProfile = allUsers.filter(u => allProfiles.some(p => p.ownerId.toString() === u._id.toString()));
        const usersWithoutProfile = allUsers.filter(u => !allProfiles.some(p => p.ownerId.toString() === u._id.toString()));

        console.log(`Total Users with role 'user': ${allUsers.length}`);
        console.log(`- Verified Users: ${verifiedCount}`);
        console.log(`- Unverified Users (Never verified email): ${unverifiedCount}`);
        console.log(`- Users WITH BusinessProfile: ${usersWithProfile.length}`);
        console.log(`- Users WITHOUT BusinessProfile: ${usersWithoutProfile.length}\n`);

        if (usersWithoutProfile.length > 0) {
            console.log("Users WITHOUT BusinessProfile:");
            usersWithoutProfile.forEach((u, i) => {
                console.log(`${i + 1}. ${u.name} (${u.email}) - Verified: ${u.isVerified}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAllUsers();
