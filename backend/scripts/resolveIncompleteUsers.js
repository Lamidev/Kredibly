/**
 * ⚡ INSTANT RESOLUTION SCRIPT FOR INCOMPLETE PROFILES (Option 1)
 * Auto-provisions BusinessProfiles for all verified users using their User.name,
 * pre-fills phone numbers, and sets onboardingCompleted = true.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");

const resolveIncompleteUsers = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for Incomplete Profiles Resolution...");

        const verifiedUsers = await User.find({ isVerified: true, role: "user" });
        console.log(`Found ${verifiedUsers.length} verified users in total.`);

        let resolvedCount = 0;

        for (const user of verifiedUsers) {
            let profile = await BusinessProfile.findOne({ ownerId: user._id });

            if (!profile) {
                // Auto-create BusinessProfile using User's registered name & phone
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 14); // 14-day trial

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
                console.log(`✨ Created BusinessProfile for: ${user.name} (${user.email})`);
            } else {
                let updated = false;
                if (!profile.displayName) {
                    profile.displayName = user.name || "My Business";
                    updated = true;
                }
                if (!profile.whatsappNumber && user.phone) {
                    profile.whatsappNumber = user.phone;
                    updated = true;
                }
                if ((profile.onboardingStep || 0) < 4) {
                    profile.onboardingStep = 4;
                    updated = true;
                }
                if (updated) {
                    await profile.save();
                    console.log(`🔄 Updated BusinessProfile for: ${user.name} (${user.email})`);
                }
            }

            if (!user.onboardingCompleted) {
                user.onboardingCompleted = true;
                await user.save();
            }

            resolvedCount++;
        }

        console.log(`\n✅ RESOLUTION COMPLETE: ${resolvedCount} verified users are now active Account-Ready Merchants!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Resolution Error:", err.message);
        process.exit(1);
    }
};

resolveIncompleteUsers();
