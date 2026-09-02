const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { LAUNCH_PROMO_END_DATE } = require("../config/pricing");

const extendTrials = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://localhost:27017/kredibly";
        await mongoose.connect(dbUri);

        const statuses = await BusinessProfile.aggregate([{ $group: { _id: "$planStatus", count: { $sum: 1 } } }]);
        console.log("Current Status Counts:", JSON.stringify(statuses));

        const newExpiry = new Date(LAUNCH_PROMO_END_DATE);
        
        console.log(`⏳ Updating all profiles to Chairman Plan with free access until ${newExpiry.toDateString()} (Launch Month Promo)...`);
        
        const result = await BusinessProfile.updateMany(
            {},
            { $set: { planStatus: 'trialing', plan: 'chairman', trialExpiresAt: newExpiry } }
        );

        const Notification = require("../models/Notification");
        const deletedNotifs = await Notification.deleteMany({ title: "Plan Ended 🔒" });
        console.log(`🧹 Cleaned up ${deletedNotifs.deletedCount} premature lockout notifications.`);

        console.log(`✅ Success! Updated ${result.modifiedCount} business profiles to Chairman Plan (Free through October 1st).`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error extending trials:", err.message);
        process.exit(1);
    }
};

extendTrials();

