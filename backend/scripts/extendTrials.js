const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile");
require("dotenv").config();

const extendTrials = async () => {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Connected.");

        const statuses = await BusinessProfile.aggregate([{ $group: { _id: "$planStatus", count: { $sum: 1 } } }]);
        console.log("Current Status Counts:", JSON.stringify(statuses));

        const newExpiry = new Date('2026-07-01T00:00:00Z');
        
        console.log(`⏳ Updating all 'trialing' profiles to expire on ${newExpiry.toDateString()}...`);
        
        const result = await BusinessProfile.updateMany(
            { planStatus: { $in: ['trialing', 'past_due'] } },
            { $set: { planStatus: 'trialing', plan: 'chairman', trialExpiresAt: newExpiry } }
        );

        console.log(`✅ Success! Updated ${result.modifiedCount} business profiles.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error extending trials:", err.message);
        process.exit(1);
    }
};

extendTrials();
