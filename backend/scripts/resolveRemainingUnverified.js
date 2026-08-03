/**
 * Convert all remaining unverified signups into complete active merchants
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");

const convertAllRemaining = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for Complete Conversion...");

        const unverifiedUsers = await User.find({ role: "user", isVerified: false });
        console.log(`Found ${unverifiedUsers.length} unverified users to convert.`);

        for (const user of unverifiedUsers) {
            user.isVerified = true;
            user.onboardingCompleted = true;
            await user.save();

            let profile = await BusinessProfile.findOne({ ownerId: user._id });
            if (!profile) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 14);

                profile = new BusinessProfile({
                    ownerId: user._id,
                    displayName: user.name || "My Business",
                    whatsappNumber: user.phone || null,
                    plan: "chairman",
                    planStatus: "trialing",
                    trialExpiresAt: expiryDate,
                    onboardingStep: 4
                });
                await profile.save();
                console.log(`✨ Converted & Created Profile for: ${user.name} (${user.email})`);
            }
        }

        console.log(`\n🎉 CONVERSION COMPLETE: All ${unverifiedUsers.length} remaining users are now 100% verified & complete merchants!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

convertAllRemaining();
