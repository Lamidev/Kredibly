const mongoose = require('mongoose');
const User = require('./models/User');
const BusinessProfile = require('./models/BusinessProfile');
require('dotenv').config();

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const testEmail = "test_chairman@usekredibly.com";
        let user = await User.findOne({ email: testEmail });
        if (!user) {
            user = await User.create({
                name: "Ozedikus Nwanne",
                email: testEmail,
                password: "password123",
                isVerified: true
            });
            console.log("Created Test User");
        }

        let profile = await BusinessProfile.findOne({ ownerId: user._id });
        if (!profile) {
            profile = await BusinessProfile.create({
                ownerId: user._id,
                displayName: "Ozedikus Enterprises",
                whatsappNumber: "2348011223344",
                plan: "hustler",
                planStatus: "inactive",
                hasUsedTrial: false,
                walletBalance: 0
            });
            console.log("Created Inactive Hustler Profile for Ozedikus");
        } else {
            console.log("Resetting Profile to Inactive Hustler for test");
            profile.plan = "hustler";
            profile.planStatus = "inactive";
            profile.hasUsedTrial = false;
            profile.walletBalance = 0;
            await profile.save();
        }

        console.log("✅ Test environment ready for 2348011223344");
        process.exit(0);
    } catch (err) {
        console.error("Setup Error:", err);
        process.exit(1);
    }
}

createTestUser();
